import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildKnowledgeChunks, extractKnowledgeText, persistKnowledgeFile, summarizeKnowledge } from "@/features/knowledge/ingestion";
import { getActiveEmbeddingModelLabel } from "@/lib/ai/ark-embedding";
import { knowledgeCategories } from "@/features/knowledge/categories";
import { slugFromCategory } from "@/features/knowledge/category-slugs";

export function revalidateKnowledgePaths(category?: string) {
  revalidatePath("/dashboard/knowledge");
  if (category) {
    const slug = slugFromCategory(category);
    if (slug) {
      revalidatePath(`/dashboard/knowledge/category/${slug}`);
    }
  }
  revalidatePath("/dashboard/customers");
}

/**
 * 知识库新增入库（Server Action 与 /api/knowledge/ingest 共用）。
 * @returns 文档所属分类（用于重定向）
 */
export async function ingestKnowledgeFromFormData(formData: FormData, createdById: string): Promise<string> {
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
    throw new Error("请上传 PDF / Word / Excel 文件或直接粘贴知识内容。");
  }

  const summary = summarizeKnowledge(rawText);
  const chunks = await buildKnowledgeChunks(rawText);

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
        embeddingModel: getActiveEmbeddingModelLabel(),
      }),
      createdById,
      chunks: {
        create: chunks,
      },
    },
  });

  revalidateKnowledgePaths(category);
  return category;
}
