import { embedText } from "@/features/knowledge/rag";

const baseUrl = process.env.ARK_BASE_URL;
const apiKey = process.env.ARK_API_KEY;
const embeddingModelEnv = process.env.ARK_EMBEDDING_MODEL;
const requestTimeoutMs = Number(process.env.ARK_TIMEOUT_MS || 8000);
const embeddingTimeoutMs = Number(
  process.env.ARK_EMBEDDING_TIMEOUT_MS ?? Math.max(requestTimeoutMs * 4, 60_000),
);

/** Doubao-embedding-vision 等需走 `.../embeddings/multimodal`，标准 `/embeddings` 会报「不支持此 API」 */
function useMultimodalEmbeddingsApi(): boolean {
  const raw = process.env.ARK_EMBEDDING_USE_MULTIMODAL;
  return raw === "1" || raw?.toLowerCase() === "true";
}

/** 与入库切片上 `embeddingModel` 字段一致：未配置方舟向量时为本地哈希 */
export const LOCAL_EMBEDDING_MODEL_LABEL = "local-hash-v1";

export function isArkSemanticEmbeddingConfigured(): boolean {
  return Boolean(baseUrl?.trim() && apiKey?.trim() && embeddingModelEnv?.trim());
}

/** 当前生效的向量模型标识（用于 Prisma 过滤，避免不同维度混算） */
export function getActiveEmbeddingModelLabel(): string {
  return isArkSemanticEmbeddingConfigured() ? embeddingModelEnv!.trim() : LOCAL_EMBEDDING_MODEL_LABEL;
}

function getEmbeddingsUrl(kind: "standard" | "multimodal"): string {
  if (!baseUrl) return "";
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (kind === "multimodal") {
    if (trimmed.endsWith("/embeddings/multimodal")) return trimmed;
    return `${trimmed}/embeddings/multimodal`;
  }
  if (trimmed.endsWith("/embeddings")) return trimmed;
  return `${trimmed}/embeddings`;
}

/** 单条文本最大字符数（避免超出模型上下文；中英混排保守截断） */
const MAX_EMBED_CHARS = 12_000;

export function truncateForEmbedding(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_EMBED_CHARS) return t;
  return t.slice(0, MAX_EMBED_CHARS);
}

const BATCH_SIZE = 32;
/** 多模态接口按条请求，适当并发以免过慢 */
const MULTIMODAL_CONCURRENCY = 8;

type EmbeddingsResponseStandard = {
  data?: Array<{ index?: number; embedding?: number[] }>;
  error?: { message?: string };
};

type EmbeddingsResponseMultimodal = {
  data?: { embedding?: number[] };
  error?: { message?: string };
};

async function postEmbeddingJson(url: string, body: unknown, signal: AbortSignal): Promise<{ ok: boolean; status: number; raw: string }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });
  const raw = await response.text();
  return { ok: response.ok, status: response.status, raw };
}

async function embedOneMultimodal(text: string, model: string): Promise<number[]> {
  const url = getEmbeddingsUrl("multimodal");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), embeddingTimeoutMs);
  try {
    const { ok, status, raw } = await postEmbeddingJson(
      url,
      {
        model,
        input: [{ type: "text", text }],
      },
      controller.signal,
    );
    let payload: EmbeddingsResponseMultimodal;
    try {
      payload = JSON.parse(raw) as EmbeddingsResponseMultimodal;
    } catch {
      throw new Error(`方舟多模态 embedding 非 JSON 响应 HTTP ${status}: ${raw.slice(0, 500)}`);
    }
    if (!ok) {
      const msg = payload.error?.message ?? raw.slice(0, 800);
      throw new Error(`方舟多模态 embedding 失败 HTTP ${status}: ${msg}`);
    }
    const emb = payload.data?.embedding;
    if (!emb?.length) {
      throw new Error("方舟多模态 embedding 返回空向量");
    }
    return emb;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 批量调用方舟向量接口。
 * - 标准文本模型：`POST .../embeddings`（OpenAI 兼容，`input` 为字符串数组）。
 * - Vision / 多模态：`POST .../embeddings/multimodal`，需设置 `ARK_EMBEDDING_USE_MULTIMODAL=1`。
 */
export async function embedTextsWithArk(texts: string[]): Promise<number[][]> {
  if (!isArkSemanticEmbeddingConfigured()) {
    throw new Error("未配置 ARK_EMBEDDING_MODEL（或 ARK_BASE_URL / ARK_API_KEY），无法调用方舟向量接口。");
  }
  const model = embeddingModelEnv!.trim();

  if (useMultimodalEmbeddingsApi()) {
    const out: number[][] = new Array(texts.length);
    const truncated = texts.map(truncateForEmbedding);
    for (let offset = 0; offset < truncated.length; offset += MULTIMODAL_CONCURRENCY) {
      const slice = truncated.slice(offset, offset + MULTIMODAL_CONCURRENCY);
      const indices = slice.map((_, j) => offset + j);
      const batchVecs = await Promise.all(slice.map((t) => embedOneMultimodal(t, model)));
      for (let j = 0; j < batchVecs.length; j += 1) {
        out[indices[j]!] = batchVecs[j]!;
      }
    }
    return out;
  }

  const url = getEmbeddingsUrl("standard");
  const out: number[][] = [];

  for (let offset = 0; offset < texts.length; offset += BATCH_SIZE) {
    const batchRaw = texts.slice(offset, offset + BATCH_SIZE);
    const batch = batchRaw.map(truncateForEmbedding);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), embeddingTimeoutMs);
    try {
      const { ok, status, raw } = await postEmbeddingJson(
        url,
        {
          model,
          input: batch,
        },
        controller.signal,
      );

      let payload: EmbeddingsResponseStandard;
      try {
        payload = JSON.parse(raw) as EmbeddingsResponseStandard;
      } catch {
        throw new Error(`方舟 embedding 非 JSON 响应 HTTP ${status}: ${raw.slice(0, 500)}`);
      }
      if (!ok) {
        const msg = payload.error?.message ?? raw.slice(0, 800);
        throw new Error(`方舟 embedding 失败 HTTP ${status}: ${msg}`);
      }

      const data = payload.data;
      if (!data || data.length !== batch.length) {
        throw new Error(
          `方舟 embedding 返回条数与请求不一致（请求 ${batch.length}，返回 ${data?.length ?? 0}）`,
        );
      }

      const sorted = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      for (const item of sorted) {
        const emb = item.embedding;
        if (!emb?.length) {
          throw new Error("方舟 embedding 返回空向量");
        }
        out.push(emb);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return out;
}

/** 检索用查询向量（与入库同一套模型） */
export async function embedQueryForKnowledge(query: string): Promise<number[]> {
  const q = query.trim();
  if (!q) {
    return embedText(" ");
  }
  if (isArkSemanticEmbeddingConfigured()) {
    const vecs = await embedTextsWithArk([q]);
    const v = vecs[0];
    if (!v?.length) {
      throw new Error("方舟 embedding 查询向量为空");
    }
    return v;
  }
  return embedText(q);
}
