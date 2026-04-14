"use server";

import { unlink } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerAction } from "@/server/action-auth";
import { buildKnowledgeChunks, extractKnowledgeText, persistKnowledgeFile, summarizeKnowledge } from "@/features/knowledge/ingestion";
import { knowledgeCategories } from "@/features/knowledge/categories";
import { revalidateKnowledgePaths, ingestKnowledgeFromFormData } from "@/features/knowledge/ingest-document";

async function safeUnlink(filePath: string | null) {
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {
    // 文件已不存在或无权删除时忽略
  }
}

export async function ingestKnowledgeDocument(formData: FormData) {
  const session = await requireManagerAction();
  await ingestKnowledgeFromFormData(formData, session.user.id);
}

export async function updateKnowledgeDocumentState(formData: FormData) {
  await requireManagerAction();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const doc = await prisma.knowledgeDocument.findUnique({
    where: { id },
    select: { category: true },
  });

  await prisma.knowledgeDocument.update({
    where: { id },
    data: {
      enabled: formData.get("enabled") === "on",
    },
  });

  revalidateKnowledgePaths(doc?.category);
}

export async function deleteKnowledgeDocument(formData: FormData) {
  await requireManagerAction();
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    throw new Error("缺少条目 ID。");
  }

  const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("知识条目不存在。");
  }

  const category = existing.category;
  await safeUnlink(existing.filePath);

  await prisma.knowledgeDocument.delete({ where: { id } });

  revalidateKnowledgePaths(category);
}

export async function updateKnowledgeDocument(formData: FormData) {
  await requireManagerAction();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    throw new Error("缺少条目 ID。");
  }

  const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("知识条目不存在。");
  }

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const assessmentTemplateId = String(formData.get("assessmentTemplateId") || "").trim();
  const tags = String(formData.get("tags") || "")
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const pastedText = String(formData.get("content") || "").trim();
  const file = formData.get("file");
  const enabled = formData.get("enabled") === "on";

  if (!title || !knowledgeCategories.includes(category as (typeof knowledgeCategories)[number])) {
    throw new Error("请填写标题并选择正确的知识库分类。");
  }

  const oldCategory = existing.category;
  let rawText = pastedText;
  let sourceType = existing.sourceType;
  let fileName = existing.fileName;
  let filePath = existing.filePath;

  if (file instanceof File && file.size > 0) {
    await safeUnlink(existing.filePath);
    const persisted = await persistKnowledgeFile(file);
    rawText = await extractKnowledgeText(file, persisted.buffer);
    fileName = persisted.fileName;
    filePath = persisted.filePath;
    const lower = file.name.toLowerCase();
    sourceType = lower.endsWith(".pdf")
      ? "pdf"
      : lower.endsWith(".docx")
        ? "docx"
        : lower.endsWith(".xlsx") || lower.endsWith(".xls")
          ? "xlsx"
          : "text";
  }

  if (!rawText) {
    throw new Error("请上传 PDF / Word / Excel 文件，或在正文中填写知识内容。");
  }

  const summary = summarizeKnowledge(rawText);
  const chunks = buildKnowledgeChunks(rawText);

  await prisma.$transaction(async (tx) => {
    await tx.knowledgeChunk.deleteMany({ where: { documentId: id } });
    await tx.knowledgeDocument.update({
      where: { id },
      data: {
        title,
        category,
        assessmentTemplateId: assessmentTemplateId || null,
        sourceType,
        fileName,
        filePath,
        rawText,
        summary,
        tagsJson: JSON.stringify(tags),
        metadataJson: JSON.stringify({
          chunkCount: chunks.length,
          embeddingModel: "local-hash-v1",
        }),
        enabled,
      },
    });
    await tx.knowledgeChunk.createMany({
      data: chunks.map((chunk) => ({
        documentId: id,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embeddingJson: chunk.embeddingJson,
        embeddingModel: chunk.embeddingModel,
        tokensJson: chunk.tokensJson,
      })),
    });
  });

  revalidateKnowledgePaths(oldCategory);
  if (oldCategory !== category) {
    revalidateKnowledgePaths(category);
  }
  revalidatePath(`/dashboard/knowledge/document/${id}/edit`);
}
