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

export interface DealKitManageEntry {
  id: string;
  contributorName: string;
  recorderName: string;
  profileText: string;
  judgmentText: string;
  experienceText: string;
  searchExposureCount: number;
  citationCount: number;
  conversionAssistCount: number;
  createdAtLabel: string;
  canManage: boolean;
}

export function normalizeDealKitSearchText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{Script=Han}\p{Letter}\p{Number}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchText(text: string) {
  const normalized = normalizeDealKitSearchText(text);
  const tokens = new Set<string>();

  const latinTokens = normalized.match(/[a-z0-9]+/g) ?? [];
  for (const token of latinTokens) {
    if (token.length > 1) tokens.add(token);
  }

  const hanSegments = normalized.match(/[\p{Script=Han}]+/gu) ?? [];
  for (const segment of hanSegments) {
    if (segment.length === 1) {
      tokens.add(segment);
      continue;
    }
    for (let index = 0; index < segment.length - 1; index += 1) {
      tokens.add(segment.slice(index, index + 2));
    }
  }

  return [...tokens];
}

function computeTokenOverlapRatio(query: string, semanticText: string) {
  const queryTokens = tokenizeSearchText(query);
  if (!queryTokens.length) return 0;
  const semanticTokens = new Set(tokenizeSearchText(semanticText));
  const matched = queryTokens.filter((token) => semanticTokens.has(token)).length;
  return matched / queryTokens.length;
}

export function isDealKitSearchMatch(query: string, semanticText: string, semanticScore: number, overlapRatio: number) {
  const normalizedQuery = normalizeDealKitSearchText(query);
  const normalizedSemantic = normalizeDealKitSearchText(semanticText);
  const exactContains = normalizedQuery.length > 0 && normalizedSemantic.includes(normalizedQuery);

  if (normalizedQuery.length <= 2) {
    return exactContains;
  }

  if (normalizedQuery.length <= 4) {
    return exactContains || overlapRatio >= 0.5 || semanticScore >= 0.5;
  }

  return exactContains || overlapRatio >= 0.34 || semanticScore >= 0.42;
}

function topEntriesOrderBy(field: "searchExposureCount" | "citationCount" | "conversionAssistCount") {
  return [{ [field]: "desc" }, { createdAt: "desc" }] as Prisma.DealKitEntryOrderByWithRelationInput[];
}

export async function searchDealKitEntries(query: string, viewerId: string, limit = 8): Promise<DealKitSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
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

        const overlapRatio = computeTokenOverlapRatio(trimmed, entry.semanticText);
        if (!isDealKitSearchMatch(trimmed, entry.semanticText, semanticScore, overlapRatio)) {
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
  } catch {
    return [];
  }
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
      where: { status: "published", searchExposureCount: { gt: 0 } },
      orderBy: topEntriesOrderBy("searchExposureCount"),
      take: 5,
      select: { id: true, contributorName: true, searchExposureCount: true, citationCount: true, conversionAssistCount: true },
    }),
    prisma.dealKitEntry.findMany({
      where: { status: "published", citationCount: { gt: 0 } },
      orderBy: topEntriesOrderBy("citationCount"),
      take: 5,
      select: { id: true, contributorName: true, searchExposureCount: true, citationCount: true, conversionAssistCount: true },
    }),
    prisma.dealKitEntry.findMany({
      where: { status: "published", conversionAssistCount: { gt: 0 } },
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
        contributorId: true,
        contributorName: true,
        recorderId: true,
        recorder: { select: { name: true } },
        profileText: true,
        judgmentText: true,
        experienceText: true,
        createdAt: true,
        searchExposureCount: true,
        citationCount: true,
        conversionAssistCount: true,
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
    recentEntries: recentEntries.map<DealKitManageEntry>((entry) => ({
      id: entry.id,
      contributorName: entry.contributorName,
      recorderName: entry.recorder.name,
      profileText: entry.profileText,
      judgmentText: entry.judgmentText,
      experienceText: entry.experienceText,
      searchExposureCount: entry.searchExposureCount,
      citationCount: entry.citationCount,
      conversionAssistCount: entry.conversionAssistCount,
      createdAtLabel: format(entry.createdAt, "yyyy-MM-dd"),
      canManage:
        session.user.role === "ADMIN" ||
        session.user.role === "MANAGER" ||
        entry.recorderId === session.user.id ||
        entry.contributorId === session.user.id,
    })),
  };
}
