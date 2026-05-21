"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { requireActionSession, requireManagerOrAdminAction } from "@/server/action-auth";
import {
  buildDealKitScriptFallback,
  buildDealKitSemanticText,
  embedDealKitText,
  suggestDealKitTags,
  type DealKitEntryInput,
} from "@/features/deal-kit/entry";
import { parseDealKitStructuredText, recognizeDealKitImage } from "@/features/deal-kit/ocr";
import { generateDoubaoJson } from "@/lib/ai/doubao";

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

async function persistDealKitEntry(params: {
  input: DealKitEntryInput;
  contributorName: string;
  recorderId: string;
  sourceType: string;
  metadata?: Record<string, unknown>;
}) {
  const contributor = await resolveContributor(params.contributorName);
  const semanticText = buildDealKitSemanticText(params.input);
  const [embedding, tags] = await Promise.all([
    embedDealKitText(semanticText),
    suggestDealKitTags(params.input),
  ]);

  await prisma.dealKitEntry.create({
    data: {
      contributorId: contributor?.id ?? null,
      contributorName: contributor?.name ?? params.contributorName.trim(),
      recorderId: params.recorderId,
      profileText: params.input.profileText.trim(),
      judgmentText: params.input.judgmentText.trim(),
      experienceText: params.input.experienceText.trim(),
      sourceType: params.sourceType,
      status: "published",
      tagsJson: JSON.stringify(tags),
      metadataJson: JSON.stringify(params.metadata ?? {}),
      semanticText,
      embeddingJson: embedding.embeddingJson,
      embeddingModel: embedding.embeddingModel,
    },
  });
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

  await persistDealKitEntry({
    input: { profileText, judgmentText, experienceText },
    contributorName,
    recorderId: session.user.id,
    sourceType,
    metadata: rawText ? { rawText } : undefined,
  });

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
    const parsed = buffer.length ? await recognizeDealKitImage(buffer) : parseDealKitStructuredText("");
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
  const session = await requireActionSession();
  const query = String(formData.get("query") || "").trim();
  const entryIds = formData
    .getAll("entryIds")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!query) {
    return { status: "error", message: "请先输入当前客户的问题。" };
  }
  if (!entryIds.length) {
    return { status: "error", message: "请先勾选 1 到 3 条成交锦囊。" };
  }

  const entries = await prisma.dealKitEntry.findMany({
    where: {
      id: { in: entryIds },
      status: "published",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!entries.length) {
    return { status: "error", message: "选中的成交锦囊不存在或已下线。" };
  }

  const fallback = buildDealKitScriptFallback(entries);
  const result = await generateDoubaoJson<{ script?: string }>({
    system: `你是家庭教育课程销售助手。你会根据若干条已经验证过的成交经验，为销售生成一段临场可说的话术。
只输出 JSON：
{"script":"..."}
要求：
1. 语气自然，像销售顾问和家长电话沟通时能直接说出来的话
2. 先共情，再判断，再推进，不要硬推
3. 保留经验中的关键成交逻辑，但不要逐条照抄
4. 不要写标题，不要分段太多，控制在 220 字以内`,
    user: `客户当前问题：${query}\n\n参考经验：\n${entries
      .map(
        (entry, index) =>
          `【经验${index + 1}】\n用户判断：${entry.judgmentText}\n成交经验：${entry.experienceText}`,
      )
      .join("\n\n")}`,
    temperature: 0.45,
    timeoutMs: 25_000,
    fallback: { script: fallback },
  });

  const generatedScript =
    typeof result.script === "string" && result.script.trim() ? result.script.trim() : fallback;

  const generation = await prisma.$transaction(async (tx) => {
    const created = await tx.dealKitScriptGeneration.create({
      data: {
        userId: session.user.id,
        query,
        generatedScript,
        entryIdsJson: JSON.stringify(entries.map((entry) => entry.id)),
      },
    });

    for (const entry of entries) {
      await tx.dealKitEntry.update({
        where: { id: entry.id },
        data: { citationCount: { increment: 1 } },
      });
    }

    return created;
  });

  revalidatePath("/dashboard/deal-kits");
  return {
    status: "success",
    generatedScript,
    generationId: generation.id,
    message: "成交话术已生成。",
  };
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
