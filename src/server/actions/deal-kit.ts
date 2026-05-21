"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { requireActionSession, requireManagerOrAdminAction } from "@/server/action-auth";
import {
  buildDealKitSemanticText,
  embedDealKitText,
  suggestDealKitTags,
  type DealKitEntryInput,
} from "@/features/deal-kit/entry";
import { parseDealKitStructuredText, recognizeDealKitImage } from "@/features/deal-kit/ocr";
import { generateDealKitScriptResult } from "@/features/deal-kit/script";

export interface DealKitOcrState {
  status: "idle" | "success" | "error";
  message?: string;
  contributorName?: string;
  profileText?: string;
  judgmentText?: string;
  experienceText?: string;
  rawText?: string;
}

export interface DealKitScriptState {
  status: "idle" | "success" | "error";
  message?: string;
  generatedScript?: string;
  generationId?: string;
}

async function resolveContributor(inputName: string) {
  const normalized = inputName.trim();
  if (!normalized) return null;

  return prisma.user.findFirst({
    where: {
      OR: [{ name: normalized }, { username: normalized.toLowerCase() }],
    },
    select: { id: true, name: true },
  });
}

function trimDealKitInput(input: DealKitEntryInput) {
  return {
    profileText: input.profileText.trim(),
    judgmentText: input.judgmentText.trim(),
    experienceText: input.experienceText.trim(),
  };
}

async function persistDealKitEntry(params: {
  input: DealKitEntryInput;
  contributorName: string;
  recorderId: string;
  sourceType: string;
  existingId?: string;
  metadata?: Record<string, unknown>;
}) {
  const contributor = await resolveContributor(params.contributorName);
  const cleanInput = trimDealKitInput(params.input);
  const semanticText = buildDealKitSemanticText(cleanInput);
  const [embedding, tags] = await Promise.all([
    embedDealKitText(semanticText),
    suggestDealKitTags(cleanInput),
  ]);

  const data = {
    contributorId: contributor?.id ?? null,
    contributorName: contributor?.name ?? params.contributorName.trim(),
    recorderId: params.recorderId,
    profileText: cleanInput.profileText,
    judgmentText: cleanInput.judgmentText,
    experienceText: cleanInput.experienceText,
    sourceType: params.sourceType,
    status: "published",
    tagsJson: JSON.stringify(tags),
    metadataJson: JSON.stringify(params.metadata ?? {}),
    semanticText,
    embeddingJson: embedding.embeddingJson,
    embeddingModel: embedding.embeddingModel,
  };

  if (params.existingId) {
    await prisma.dealKitEntry.update({
      where: { id: params.existingId },
      data,
    });
    return;
  }

  await prisma.dealKitEntry.create({ data });
}

async function getManageableDealKitEntry(session: { user: { id: string; role: "ADMIN" | "MANAGER" | "SALES" } }, id: string) {
  const entry = await prisma.dealKitEntry.findUnique({ where: { id } });
  if (!entry) {
    throw new Error("成交锦囊不存在。");
  }
  const canManage =
    session.user.role === "ADMIN" ||
    session.user.role === "MANAGER" ||
    entry.recorderId === session.user.id ||
    entry.contributorId === session.user.id;

  if (!canManage) {
    throw new Error("你没有权限修改这条成交锦囊。");
  }
  return entry;
}

export async function createDealKitEntry(formData: FormData) {
  const session = await requireActionSession();
  const contributorName = String(formData.get("contributorName") || session.user.name || "").trim();
  const profileText = String(formData.get("profileText") || "").trim();
  const judgmentText = String(formData.get("judgmentText") || "").trim();
  const experienceText = String(formData.get("experienceText") || "").trim();
  const sourceType = String(formData.get("sourceType") || "manual").trim() || "manual";
  const rawText = String(formData.get("rawText") || "").trim();

  if (!contributorName || !profileText || !judgmentText || !experienceText) {
    throw new Error("请把贡献人、用户画像、用户判断和成交经验都填写完整。");
  }

  try {
    const duplicate = await prisma.dealKitEntry.findFirst({
      where: {
        recorderId: session.user.id,
        contributorName,
        profileText,
        judgmentText,
        experienceText,
        createdAt: {
          gte: new Date(Date.now() - 30_000),
        },
      },
      select: { id: true },
    });
    if (duplicate) {
      revalidatePath("/dashboard/deal-kits");
      return;
    }

    await persistDealKitEntry({
      input: { profileText, judgmentText, experienceText },
      contributorName,
      recorderId: session.user.id,
      sourceType,
      metadata: rawText ? { rawText } : undefined,
    });

    revalidatePath("/dashboard/deal-kits");
  } catch (error) {
    if (error instanceof Error && /请把贡献人|权限|登录/u.test(error.message)) {
      throw error;
    }
    throw new Error("成交锦囊保存失败，请稍后再试。");
  }
}

export async function updateDealKitEntry(formData: FormData) {
  const session = await requireActionSession();
  const id = String(formData.get("id") || "").trim();
  const contributorName = String(formData.get("contributorName") || "").trim();
  const profileText = String(formData.get("profileText") || "").trim();
  const judgmentText = String(formData.get("judgmentText") || "").trim();
  const experienceText = String(formData.get("experienceText") || "").trim();

  if (!id || !contributorName || !profileText || !judgmentText || !experienceText) {
    throw new Error("请把贡献人、用户画像、用户判断和成交经验都填写完整。");
  }

  const existing = await getManageableDealKitEntry(session, id);
  if (
    existing.contributorName === contributorName &&
    existing.profileText === profileText &&
    existing.judgmentText === judgmentText &&
    existing.experienceText === experienceText
  ) {
    revalidatePath("/dashboard/deal-kits");
    return;
  }

  try {
    await persistDealKitEntry({
      existingId: id,
      input: { profileText, judgmentText, experienceText },
      contributorName,
      recorderId: existing.recorderId,
      sourceType: existing.sourceType,
      metadata: parseJson<Record<string, unknown>>(existing.metadataJson, {}),
    });
    revalidatePath("/dashboard/deal-kits");
  } catch (error) {
    if (error instanceof Error && /填写完整|权限|登录/u.test(error.message)) {
      throw error;
    }
    throw new Error("成交锦囊更新失败，请稍后再试。");
  }
}

export async function deleteDealKitEntry(formData: FormData) {
  const session = await requireActionSession();
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    throw new Error("缺少成交锦囊 ID。");
  }

  await getManageableDealKitEntry(session, id);
  await prisma.dealKitEntry.delete({ where: { id } });
  revalidatePath("/dashboard/deal-kits");
}

export async function parseDealKitOcr(
  _previous: DealKitOcrState,
  formData: FormData,
): Promise<DealKitOcrState> {
  await requireManagerOrAdminAction();
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "请先上传一张截图。"};
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = buffer.length
      ? await recognizeDealKitImage(buffer, file.type || "image/png")
      : parseDealKitStructuredText("");
    if (!parsed.profileText && !parsed.judgmentText && !parsed.experienceText) {
      return {
        status: "error",
        message: "这张截图里没有识别出用户画像、用户判断或成交经验，请换一张更清晰的截图再试。",
        rawText: parsed.rawText,
      };
    }
    return {
      status: "success",
      contributorName: parsed.contributorName,
      profileText: parsed.profileText,
      judgmentText: parsed.judgmentText,
      experienceText: parsed.experienceText,
      rawText: parsed.rawText,
      message: "OCR 已完成，请检查并确认后保存。",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "OCR 识别失败，请重试。",
    };
  }
}

export async function generateDealKitScript(
  _previous: DealKitScriptState,
  formData: FormData,
): Promise<DealKitScriptState> {
  try {
    const session = await requireActionSession();
    return await generateDealKitScriptResult({
      userId: session.user.id,
      query: String(formData.get("query") || "").trim(),
      entryIds: formData
      .getAll("entryIds")
      .map((value) => String(value).trim())
      .filter(Boolean),
    });
  } catch (error) {
    if (error instanceof Error && /登录|权限/u.test(error.message)) {
      return { status: "error", message: error.message };
    }
    return {
      status: "error",
      message: "生成成交话术失败，请稍后再试。如果连续失败，请把当前搜索词发给开发处理。",
    };
  }
}

export async function markDealKitScriptSuccessful(formData: FormData) {
  const session = await requireActionSession();
  const generationId = String(formData.get("generationId") || "").trim();
  if (!generationId) {
    throw new Error("缺少话术记录，无法标记成交。");
  }

  const generation = await prisma.dealKitScriptGeneration.findUnique({
    where: { id: generationId },
  });
  if (!generation || generation.userId !== session.user.id) {
    throw new Error("你没有权限标记这条话术。");
  }
  if (generation.successMarkedAt) {
    return;
  }

  const entryIds = parseJson<string[]>(generation.entryIdsJson, []).filter(Boolean);
  await prisma.$transaction(async (tx) => {
    await tx.dealKitScriptGeneration.update({
      where: { id: generationId },
      data: { successMarkedAt: new Date() },
    });

    for (const entryId of entryIds) {
      await tx.dealKitEntry.update({
        where: { id: entryId },
        data: { conversionAssistCount: { increment: 1 } },
      });
    }
  });

  revalidatePath("/dashboard/deal-kits");
}
