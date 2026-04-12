import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { KnowledgeCategory } from "@/features/knowledge/categories";
import { embedText, rankKnowledgeChunks } from "@/features/knowledge/rag";

export interface RetrievedKnowledge {
  id: string;
  documentId: string;
  title: string;
  category: string;
  content: string;
  score: number;
}

export async function retrieveKnowledge(params: {
  query: string;
  categories?: KnowledgeCategory[];
  limit?: number;
  assessmentTemplateId?: string;
}) {
  const queryEmbedding = embedText(params.query);
  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      document: {
        enabled: true,
        ...(params.assessmentTemplateId
          ? {
              OR: [
                { assessmentTemplateId: params.assessmentTemplateId },
                { assessmentTemplateId: null },
              ],
            }
          : {}),
        ...(params.categories?.length ? { category: { in: params.categories } } : {}),
      },
    },
    include: {
      document: true,
    },
    take: 300,
  });

  const ranked = rankKnowledgeChunks(
    queryEmbedding,
    chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      embedding: parseJson<number[]>(chunk.embeddingJson, []),
    })),
  );

  const topIds = new Map(ranked.slice(0, params.limit ?? 6).map((item) => [item.id, item]));

  return chunks
    .filter((chunk) => topIds.has(chunk.id))
    .map<RetrievedKnowledge>((chunk) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      title: chunk.document.title,
      category: chunk.document.category,
      content: chunk.content,
      score: topIds.get(chunk.id)?.score ?? 0,
    }))
    .sort((left, right) => right.score - left.score);
}
