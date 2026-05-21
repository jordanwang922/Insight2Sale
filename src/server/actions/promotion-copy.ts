"use server";

import { startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { requireActionSession, requireManagerOrAdminAction } from "@/server/action-auth";
import { generatePromotionVariant } from "@/features/promotion-copy/generation";
import { getPromotionCopyVisibilityContext, type PromotionCopyImageAsset } from "@/features/promotion-copy/queries";
import { canManagePromotionCopy, canViewPromotionCopy } from "@/features/promotion-copy/access";
import { persistPromotionCopyImages, safeUnlinkPromotionCopyImages } from "@/features/promotion-copy/storage";

export interface PromotionVariantState {
  status: "idle" | "success" | "error";
  message?: string;
  generatedTitle?: string;
  generatedContent?: string;
}

function parseEventDate(value: string) {
  const text = value.trim();
  if (!text) return null;
  try {
    return new Date(`${text}T12:00:00`);
  } catch {
    return null;
  }
}

export async function createPromotionCopy(formData: FormData) {
  const session = await requireManagerOrAdminAction();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const eventDate = parseEventDate(String(formData.get("eventDate") || ""));
  const images = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!title || !content || !eventDate) {
    throw new Error("请把日期、标题和正文填写完整。");
  }

  const assets = images.length ? await persistPromotionCopyImages(images) : [];

  await prisma.promotionCopy.create({
    data: {
      title,
      content,
      eventDate,
      scope: session.user.role === "ADMIN" ? "global" : "team",
      createdById: session.user.id,
      teamScopeManagerId: session.user.role === "MANAGER" ? session.user.id : null,
      imageAssetsJson: JSON.stringify(assets),
      imageStorageProvider: assets.length ? "local" : null,
      metadataJson: JSON.stringify({
        imageReserved: true,
      }),
    },
  });

  revalidatePath("/dashboard/promotion-copies");
}

async function getManageablePromotionCopy(session: { user: { id: string; role: "ADMIN" | "MANAGER" | "SALES" } }, id: string) {
  const row = await prisma.promotionCopy.findUnique({ where: { id } });
  if (!row) {
    throw new Error("文案不存在。");
  }
  if (
    !canManagePromotionCopy({
      role: session.user.role,
      userId: session.user.id,
      scope: row.scope,
      teamScopeManagerId: row.teamScopeManagerId,
      createdById: row.createdById,
    })
  ) {
    throw new Error("你没有权限修改这条文案。");
  }
  return row;
}

export async function updatePromotionCopy(formData: FormData) {
  const session = await requireManagerOrAdminAction();
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const eventDate = parseEventDate(String(formData.get("eventDate") || ""));
  const clearImages = formData.get("clearImages") === "on";
  const images = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!id || !title || !content || !eventDate) {
    throw new Error("请把日期、标题和正文填写完整。");
  }

  const existing = await getManageablePromotionCopy(session, id);
  const oldAssets = parseJson<PromotionCopyImageAsset[]>(existing.imageAssetsJson, []);
  let nextAssets = oldAssets;
  let storageProvider = existing.imageStorageProvider;

  if (images.length) {
    nextAssets = await persistPromotionCopyImages(images);
    storageProvider = nextAssets.length ? "local" : null;
    await safeUnlinkPromotionCopyImages(oldAssets);
  } else if (clearImages) {
    nextAssets = [];
    storageProvider = null;
    await safeUnlinkPromotionCopyImages(oldAssets);
  }

  await prisma.promotionCopy.update({
    where: { id },
    data: {
      title,
      content,
      eventDate,
      imageAssetsJson: JSON.stringify(nextAssets),
      imageStorageProvider: storageProvider,
    },
  });

  revalidatePath("/dashboard/promotion-copies");
}

export async function deletePromotionCopy(formData: FormData) {
  const session = await requireManagerOrAdminAction();
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    throw new Error("缺少文案 ID。");
  }

  const existing = await getManageablePromotionCopy(session, id);
  const oldAssets = parseJson<PromotionCopyImageAsset[]>(existing.imageAssetsJson, []);

  await prisma.promotionCopy.delete({
    where: { id },
  });
  await safeUnlinkPromotionCopyImages(oldAssets);

  revalidatePath("/dashboard/promotion-copies");
}

export async function generatePromotionCopyVariantAction(
  _previous: PromotionVariantState,
  formData: FormData,
): Promise<PromotionVariantState> {
  const session = await requireActionSession();
  const promotionCopyId = String(formData.get("promotionCopyId") || "").trim();
  if (!promotionCopyId) {
    return { status: "error", message: "缺少文案记录。" };
  }

  const [viewer, source] = await Promise.all([
    getPromotionCopyVisibilityContext(session.user.id),
    prisma.promotionCopy.findUnique({
      where: { id: promotionCopyId },
    }),
  ]);

  if (!viewer || !source || !source.enabled) {
    return { status: "error", message: "文案不存在或已下线。" };
  }

  if (
    !canViewPromotionCopy({
      role: viewer.role,
      userId: viewer.id,
      managerId: viewer.managerId,
      scope: source.scope,
      teamScopeManagerId: source.teamScopeManagerId,
    })
  ) {
    return { status: "error", message: "你没有权限使用这条文案。" };
  }

  const dayStart = startOfDay(new Date());
  const generatedCount = await prisma.promotionCopyGeneration.count({
    where: {
      promotionCopyId,
      userId: session.user.id,
      createdAt: { gte: dayStart },
    },
  });

  if (generatedCount >= 5) {
    return { status: "error", message: "同一条文案今天最多生成 5 次，请直接复制已生成版本。" };
  }

  const variant = await generatePromotionVariant({
    title: source.title,
    content: source.content,
  });

  await prisma.promotionCopyGeneration.create({
    data: {
      promotionCopyId,
      userId: session.user.id,
      generatedTitle: variant.title,
      generatedContent: variant.content,
    },
  });

  return {
    status: "success",
    generatedTitle: variant.title,
    generatedContent: variant.content,
    message: "新版本已生成，可直接复制。",
  };
}
