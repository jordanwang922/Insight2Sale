import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { KnowledgeCategory } from "@/features/knowledge/categories";
import {
  chunkInterpretationNoiseScore,
  sanitizeKnowledgeChunkBody,
} from "@/features/knowledge/chunk-sanitize";
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

  const limitN = params.limit ?? 6;
  const wantsInterpretation = params.categories?.includes("测评解读库") ?? false;
  const poolDepth = wantsInterpretation ? Math.min(ranked.length, 120) : limitN;
  const pool = ranked.slice(0, poolDepth);
  const chunkById = new Map(chunks.map((c) => [c.id, c]));

  const rows = pool
    .map((r) => {
      const ch = chunkById.get(r.id);
      if (!ch) return null;
      const raw = ch.content;
      const content = sanitizeKnowledgeChunkBody(raw);
      const noise = chunkInterpretationNoiseScore(raw);
      return {
        id: ch.id,
        documentId: ch.documentId,
        title: ch.document.title,
        category: ch.document.category,
        content,
        score: r.score,
        noise,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  let picked = rows;
  if (wantsInterpretation) {
    const good = rows.filter((r) => r.content.length >= 32 && r.noise < 0.46);
    picked = good.length >= limitN ? good : rows.filter((r) => r.content.length >= 18 && r.noise < 0.62);
    if (picked.length < limitN) {
      picked = rows.filter((r) => r.content.trim().length >= 12);
    }
    picked = picked
      .sort((a, b) => b.score * (1 - b.noise) - a.score * (1 - a.noise))
      .slice(0, limitN);
  } else {
    picked = rows.sort((a, b) => b.score - a.score).slice(0, limitN);
  }

  return picked.map<RetrievedKnowledge>(({ noise: _n, ...rest }) => rest);
}

/**
 * 按分类 + 标题条件取「整份文档」的全部切片（按 chunkIndex）。
 * 可用 `titleContainsAll` 同时匹配多段（AND），以区分「测评解读SOP（模版）」与旧版仅「测评解读SOP」。
 */
export async function retrieveKnowledgeChunksForDocument(params: {
  category: KnowledgeCategory;
  /** 标题包含该子串（单条件，与 titleContainsAll 二选一） */
  titleContains?: string;
  /** 标题需同时包含每一段（AND），例如 ["测评解读SOP","模版"] */
  titleContainsAll?: string[];
  assessmentTemplateId?: string;
}): Promise<RetrievedKnowledge[]> {
  const titleWhere =
    params.titleContainsAll && params.titleContainsAll.length > 0
      ? {
          AND: params.titleContainsAll.map((segment) => ({
            title: { contains: segment, mode: "insensitive" as const },
          })),
        }
      : {
          title: { contains: params.titleContains ?? "", mode: "insensitive" as const },
        };

  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      enabled: true,
      category: params.category,
      ...titleWhere,
      ...(params.assessmentTemplateId
        ? {
            OR: [
              { assessmentTemplateId: params.assessmentTemplateId },
              { assessmentTemplateId: null },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 1,
    include: {
      chunks: { orderBy: { chunkIndex: "asc" } },
    },
  });

  const doc = docs[0];
  if (!doc) return [];

  return doc.chunks.map((chunk, index) => ({
    id: chunk.id,
    documentId: doc.id,
    title: doc.title,
    category: doc.category,
    content: chunk.content,
    score: 1 - index * 0.0001,
  }));
}
