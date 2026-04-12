"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerAction } from "@/server/action-auth";
import { buildKnowledgeChunks, extractKnowledgeText, persistKnowledgeFile, summarizeKnowledge } from "@/features/knowledge/ingestion";
import { knowledgeCategories } from "@/features/knowledge/categories";

export async function ingestKnowledgeDocument(formData: FormData) {
  const session = await requireManagerAction();

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const assessmentTemplateId = String(formData.get("assessmentTemplateId") || "").trim();
  const tags = String(formData.get("tags") || "")
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const pastedText = String(formData.get("content") || "").trim();
  const file = formData.get("file");

  if (!title || !knowledgeCategories.includes(category as (typeof knowledgeCategories)[number])) {
    throw new Error("请填写标题并选择正确的知识库分类。");
  }

  let rawText = pastedText;
  let fileName: string | null = null;
  let filePath: string | null = null;
  let sourceType = "text";

  if (!rawText && file instanceof File && file.size > 0) {
    const persisted = await persistKnowledgeFile(file);
    rawText = await extractKnowledgeText(file, persisted.buffer);
    fileName = persisted.fileName;
    filePath = persisted.filePath;
    sourceType = file.name.toLowerCase().endsWith(".pdf")
      ? "pdf"
      : file.name.toLowerCase().endsWith(".docx")
        ? "docx"
        : "text";
  }

  if (!rawText) {
    throw new Error("请上传 PDF/Word 文件或直接粘贴知识内容。");
  }

  const summary = summarizeKnowledge(rawText);
  const chunks = buildKnowledgeChunks(rawText);

  await prisma.knowledgeDocument.create({
    data: {
      title,
      assessmentTemplateId: assessmentTemplateId || null,
      category,
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
      createdById: session.user.id,
      chunks: {
        create: chunks,
      },
    },
  });

  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/customers");
}

export async function updateKnowledgeDocumentState(formData: FormData) {
  await requireManagerAction();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.knowledgeDocument.update({
    where: { id },
    data: {
      enabled: formData.get("enabled") === "on",
    },
  });

  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/customers");
}
