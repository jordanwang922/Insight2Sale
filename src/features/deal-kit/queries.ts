import { format } from "date-fns";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { embedText, rankKnowledgeChunks } from "@/features/knowledge/rag";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { embedQueryForKnowledge, getActiveEmbeddingModelLabel, LOCAL_EMBEDDING_MODEL_LABEL } from "@/lib/ai/ark-embedding";

export interface DealKitSearchResult {
  id: string;
  contributorName: string;
  recorderName: string;
  profileText: string;
  judgmentText: string;
  experienceText: string;
  tags: string[];
  searchExposureCount: number;
  citationCount: number;
  conversionAssistCount: number;
  createdAt: Date;
  semanticScore: number;
}

function topEntriesOrderBy(field: "searchExposureCount" | "citationCount" | "conversionAssistCount") {
  return [{ [field]: "desc" }, { createdAt: "desc" }] as Prisma.DealKitEntryOrderByWithRelationInput[];
}

export async function searchDealKitEntries(query: string, viewerId: string, limit = 8): Promise<DealKitSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const entries = await prisma.dealKitEntry.findMany({
    where: {
      status: "published",
      embeddingModel: {
        in: Array.from(new Set([getActiveEmbeddingModelLabel(), LOCAL_EMBEDDING_MODEL_LABEL])),
      },
    },
    include: {
      recorder: true,
    },
    take: 300,
  });

  if (!entries.length) return [];

  const entriesWithEmbedding = entries.map((entry) => ({
    ...entry,
    embedding: parseJson<number[]>(entry.embeddingJson, []),
  }));
  const models = Array.from(new Set(entriesWithEmbedding.map((entry) => entry.embeddingModel)));
  const queryEmbeddings = await Promise.all(
    models.map(async (model) => [
      model,
      model === LOCAL_EMBEDDING_MODEL_LABEL ? embedText(trimmed) : await embedQueryForKnowledge(trimmed),
    ] as const),
  );
  const queryEmbeddingByModel = new Map(queryEmbeddings);
  const normalizedQuery = trimmed.toLowerCase();

  const ranked = entriesWithEmbedding
    .flatMap((entry) => {
      const queryEmbedding = queryEmbeddingByModel.get(entry.embeddingModel);
      if (!queryEmbedding?.length || !entry.embedding.length) {
        return [];
      }

      const semanticScore = rankKnowledgeChunks(queryEmbedding, [
        { id: entry.id, content: entry.semanticText, embedding: entry.embedding },
      ])[0]?.score;
      if (typeof semanticScore !== "number") {
        return [];
      }

      const keywordBonus = normalizedQuery && entry.semanticText.toLowerCase().includes(normalizedQuery) ? 0.06 : 0;
      const rankingScore =
        semanticScore +
        Math.log1p(entry.conversionAssistCount) * 0.08 +
        Math.log1p(entry.citationCount) * 0.04 +
        Math.log1p(entry.searchExposureCount) * 0.02 +
        keywordBonus;

      return [{ entry, semanticScore, rankingScore }];
    })
    .sort((left, right) => right.rankingScore - left.rankingScore)
    .slice(0, limit);

  if (ranked.length) {
    await prisma.$transaction([
      prisma.dealKitSearchHit.createMany({
        data: ranked.map((item) => ({
          entryId: item.entry.id,
          viewerId,
          query: trimmed,
          score: item.semanticScore,
        })),
      }),
      ...ranked.map((item) =>
        prisma.dealKitEntry.update({
          where: { id: item.entry.id },
          data: { searchExposureCount: { increment: 1 } },
        }),
      ),
    ]);
  }

  return ranked.map((item) => ({
    id: item.entry.id,
    contributorName: item.entry.contributorName,
    recorderName: item.entry.recorder.name,
    profileText: item.entry.profileText,
    judgmentText: item.entry.judgmentText,
    experienceText: item.entry.experienceText,
    tags: parseJson<string[]>(item.entry.tagsJson, []).filter(Boolean),
    searchExposureCount: item.entry.searchExposureCount + 1,
    citationCount: item.entry.citationCount,
    conversionAssistCount: item.entry.conversionAssistCount,
    createdAt: item.entry.createdAt,
    semanticScore: item.semanticScore,
  }));
}

export async function getDealKitPageData(query?: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [contributors, topSearches, topCitations, topConversions, recentEntries, results] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, username: true, role: true },
    }),
    prisma.dealKitEntry.findMany({
      where: { status: "published" },
      orderBy: topEntriesOrderBy("searchExposureCount"),
      take: 5,
      select: { id: true, contributorName: true, searchExposureCount: true, citationCount: true, conversionAssistCount: true },
    }),
    prisma.dealKitEntry.findMany({
      where: { status: "published" },
      orderBy: topEntriesOrderBy("citationCount"),
      take: 5,
      select: { id: true, contributorName: true, searchExposureCount: true, citationCount: true, conversionAssistCount: true },
    }),
    prisma.dealKitEntry.findMany({
      where: { status: "published" },
      orderBy: topEntriesOrderBy("conversionAssistCount"),
      take: 5,
      select: { id: true, contributorName: true, searchExposureCount: true, citationCount: true, conversionAssistCount: true },
    }),
    prisma.dealKitEntry.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        contributorName: true,
        profileText: true,
        judgmentText: true,
        experienceText: true,
        tagsJson: true,
        createdAt: true,
      },
    }),
    query?.trim() ? searchDealKitEntries(query, session.user.id) : Promise.resolve([]),
  ]);

  return {
    session,
    query: query?.trim() ?? "",
    results,
    contributors,
    rankings: {
      exposures: topSearches,
      citations: topCitations,
      conversions: topConversions,
    },
    recentEntries: recentEntries.map((entry) => ({
      ...entry,
      createdAtLabel: format(entry.createdAt, "yyyy-MM-dd"),
      tags: parseJson<string[]>(entry.tagsJson, []),
    })),
  };
}
