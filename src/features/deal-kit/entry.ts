import { embedText, rankKnowledgeChunks } from "@/features/knowledge/rag";
import {
  embedTextsWithArk,
  getActiveEmbeddingModelLabel,
  isArkSemanticEmbeddingConfigured,
} from "@/lib/ai/ark-embedding";
import { generateDoubaoJson } from "@/lib/ai/doubao";

export interface DealKitEntryInput {
  profileText: string;
  judgmentText: string;
  experienceText: string;
}

export interface DealKitTagSuggestion {
  tags: string[];
}

export function buildDealKitSemanticText(input: DealKitEntryInput) {
  return [
    `用户画像：${input.profileText.trim()}`,
    `用户判断：${input.judgmentText.trim()}`,
    `成交经验：${input.experienceText.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function embedDealKitText(semanticText: string) {
  const clean = semanticText.trim() || "成交锦囊";
  if (isArkSemanticEmbeddingConfigured()) {
    const vectors = await embedTextsWithArk([clean]);
    return {
      embeddingJson: JSON.stringify(vectors[0] ?? []),
      embeddingModel: getActiveEmbeddingModelLabel(),
    };
  }

  return {
    embeddingJson: JSON.stringify(embedText(clean)),
    embeddingModel: getActiveEmbeddingModelLabel(),
  };
}

function fallbackTagSuggestion(input: DealKitEntryInput) {
  const corpus = `${input.profileText}\n${input.judgmentText}\n${input.experienceText}`;
  const rules: Array<[RegExp, string]> = [
    [/太贵|价格|预算|经济压力|没钱/u, "价格异议"],
    [/学不会|跟不上|听不懂|怕坚持不住/u, "担心学不会"],
    [/沉迷手机|游戏|刷视频/u, "沉迷手机"],
    [/单亲|离异|一个人带/u, "单亲家庭"],
    [/奶奶|姥姥|隔代|老人带/u, "隔代养育"],
    [/妈妈焦虑|焦虑|担忧/u, "家长焦虑"],
    [/试听|体验|先试一试/u, "试学推进"],
    [/报名|成交|下单|付款/u, "成交推进"],
  ];

  const tags = rules.filter(([pattern]) => pattern.test(corpus)).map(([, tag]) => tag);
  return Array.from(new Set(tags)).slice(0, 6);
}

export async function suggestDealKitTags(input: DealKitEntryInput): Promise<string[]> {
  const fallback = fallbackTagSuggestion(input);
  const result = await generateDoubaoJson<DealKitTagSuggestion>({
    system: `你是销售经验标签助手。请根据一条成交经验，只输出 JSON：
{"tags":["标签1","标签2",...]}
要求：
1. 标签数量 2-6 个
2. 标签必须短，适合筛选，例如：价格异议、担心学不会、隔代养育、沉迷手机
3. 不要输出空话，不要输出句子`,
    user: buildDealKitSemanticText(input),
    temperature: 0.2,
    fallback: { tags: fallback },
    timeoutMs: 20_000,
  });

  const raw = Array.isArray(result.tags) ? result.tags : fallback;
  return Array.from(
    new Set(raw.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)),
  ).slice(0, 6);
}

export function buildDealKitScriptFallback(entries: Array<{ experienceText: string; judgmentText: string }>) {
  const keyPoints = entries
    .flatMap((entry) => [entry.judgmentText.trim(), entry.experienceText.trim()])
    .filter(Boolean)
    .slice(0, 6);

  if (!keyPoints.length) {
    return "先共情家长当下的顾虑，再把问题拆小，告诉她可以先试一小步，不必一次性把决定做得很重。";
  }

  const intro = "我特别理解您现在最担心的点，不是简单想拖，而是想确认这件事到底值不值得、孩子能不能真正跟上。";
  const body = keyPoints.map((point) => `- ${point}`).join("\n");
  const close =
    "如果您愿意，我们先不要把它想成一次很重的决定，而是先按最适合孩子的节奏试起来，让您先看到变化，再决定后面的安排。";

  return `${intro}\n${body}\n${close}`;
}

export function buildDealKitRankedResults<T extends {
  id: string;
  semanticText: string;
  embedding: number[];
  citationCount: number;
  conversionAssistCount: number;
  searchExposureCount: number;
}>(queryEmbedding: number[], query: string, entries: T[]) {
  const ranked = rankKnowledgeChunks(
    queryEmbedding,
    entries.map((entry) => ({
      id: entry.id,
      content: entry.semanticText,
      embedding: entry.embedding,
    })),
  );

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const normalizedQuery = query.trim().toLowerCase();

  return ranked
    .map((row) => {
      const entry = byId.get(row.id);
      if (!entry) return null;
      const keywordBonus = normalizedQuery && entry.semanticText.toLowerCase().includes(normalizedQuery) ? 0.06 : 0;
      const rankingScore =
        row.score +
        Math.log1p(entry.conversionAssistCount) * 0.08 +
        Math.log1p(entry.citationCount) * 0.04 +
        Math.log1p(entry.searchExposureCount) * 0.02 +
        keywordBonus;

      return {
        entry,
        semanticScore: row.score,
        rankingScore,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((left, right) => right.rankingScore - left.rankingScore);
}
