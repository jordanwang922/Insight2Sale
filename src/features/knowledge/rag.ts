const VECTOR_DIMENSION = 192;

export interface KnowledgeChunkSeed {
  index: number;
  content: string;
}

export interface RankedChunk<T = string> {
  id: T;
  score: number;
  content: string;
}

function tokenize(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{Script=Han}\p{Letter}\p{Number}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

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

function hashToken(token: string) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function embedText(text: string) {
  const vector = Array.from({ length: VECTOR_DIMENSION }, () => 0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    const hash = hashToken(token);
    const position = hash % VECTOR_DIMENSION;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vector[position] += sign;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

export function chunkKnowledgeText(text: string, maxLength = 900, overlap = 160) {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) return [] as KnowledgeChunkSeed[];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: KnowledgeChunkSeed[] = [];
  let current = "";
  let index = 0;

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) {
      chunks.push({ index, content: current });
      index += 1;
      current = current.slice(Math.max(0, current.length - overlap));
    }

    if (paragraph.length <= maxLength) {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
      continue;
    }

    for (let cursor = 0; cursor < paragraph.length; cursor += maxLength - overlap) {
      const slice = paragraph.slice(cursor, cursor + maxLength).trim();
      if (slice) {
        chunks.push({ index, content: slice });
        index += 1;
      }
    }
    current = "";
  }

  if (current) {
    chunks.push({ index, content: current });
  }

  return chunks;
}

export function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  let score = 0;
  for (let index = 0; index < length; index += 1) {
    score += left[index] * right[index];
  }
  return score;
}

export function rankKnowledgeChunks<T extends { id: string; content: string; embedding: number[] }>(
  queryEmbedding: number[],
  chunks: T[],
) {
  return chunks
    .map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((left, right) => right.score - left.score);
}
