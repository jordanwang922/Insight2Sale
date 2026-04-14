import { knowledgeCategories } from "@/features/knowledge/categories";
import { retrieveKnowledge } from "@/features/knowledge/retrieval";

export type SopRenderPiece =
  | { kind: "text"; value: string }
  /** 模版中的【】占位，仅原文展示（不触发知识库检索） */
  | { kind: "literalBracket"; inner: string }
  | { kind: "rag"; query: string; body: string }
  | { kind: "image"; alt: string; src: string };

export type BuildSopDisplayPiecesOptions = {
  assessmentTemplateId?: string;
  ragQueryCache?: Map<string, string>;
  /**
   * `literal`：与纸质模版一致，【】仅作红色占位展示；
   * `rag`：对每个【关键词】做知识库召回（解读台以外场景可用）。
   */
  brackets?: "literal" | "rag";
};

function safeImgSrc(src: string): string {
  const s = src.trim();
  if (s.startsWith("https://") || s.startsWith("http://") || s.startsWith("/")) return s;
  return "";
}

/**
 * 将测评解读 SOP 模版正文拆成可渲染片段：Markdown 图片、`【检索关键词】` RAG 占位。
 * 同一页内对相同【】只检索一次（cache）。
 */
export async function buildSopDisplayPieces(
  raw: string,
  opts: BuildSopDisplayPiecesOptions = {},
): Promise<SopRenderPiece[]> {
  const cache = opts.ragQueryCache ?? new Map<string, string>();
  const assessmentTemplateId = opts.assessmentTemplateId;
  const bracketMode = opts.brackets ?? "literal";

  const pieces: SopRenderPiece[] = [];
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const text = raw.replace(/\r\n/g, "\n");

  while ((m = imgRe.exec(text)) !== null) {
    if (m.index > last) {
      pieces.push(
        ...(await splitBracketPlaceholders(text.slice(last, m.index), cache, assessmentTemplateId, bracketMode)),
      );
    }
    const src = safeImgSrc(m[2]);
    if (src) {
      pieces.push({ kind: "image", alt: (m[1] || "").trim(), src });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    pieces.push(...(await splitBracketPlaceholders(text.slice(last), cache, assessmentTemplateId, bracketMode)));
  }
  if (pieces.length === 0) {
    pieces.push(...(await splitBracketPlaceholders(text, cache, assessmentTemplateId, bracketMode)));
  }
  return pieces;
}

/**
 * 解读台专用：只按 Markdown 图片拆分，【】留在正文里由 InterpretationDeskMarkdownBlocks 行内渲染，
 * 避免每个【】单独成段导致按钮与话术断行。
 */
export async function buildInterpretationDeskDisplayPieces(raw: string): Promise<SopRenderPiece[]> {
  const text = raw.replace(/\r\n/g, "\n");
  const pieces: SopRenderPiece[] = [];
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(text)) !== null) {
    if (m.index > last) {
      const chunk = text.slice(last, m.index);
      if (chunk) pieces.push({ kind: "text", value: chunk });
    }
    const src = safeImgSrc(m[2] ?? "");
    if (src) {
      pieces.push({ kind: "image", alt: (m[1] || "").trim(), src });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    const chunk = text.slice(last);
    if (chunk) pieces.push({ kind: "text", value: chunk });
  }
  if (pieces.length === 0 && text) {
    pieces.push({ kind: "text", value: text });
  }
  return pieces;
}

async function splitBracketPlaceholders(
  fragment: string,
  cache: Map<string, string>,
  assessmentTemplateId: string | undefined,
  bracketMode: "literal" | "rag",
): Promise<SopRenderPiece[]> {
  const pieces: SopRenderPiece[] = [];
  const re = /【([^】]+)】/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(fragment)) !== null) {
    if (m.index > last) {
      const t = fragment.slice(last, m.index);
      if (t) pieces.push({ kind: "text", value: t });
    }
    const q = m[1].trim();
    if (bracketMode === "literal") {
      pieces.push({ kind: "literalBracket", inner: q });
    } else {
      let hit = cache.get(q);
      if (hit === undefined) {
        const rows = await retrieveKnowledge({
          query: q,
          categories: [...knowledgeCategories],
          limit: 4,
          assessmentTemplateId,
        });
        hit = rows.length
          ? rows.map((r) => `【${r.title}】\n${r.content}`).join("\n\n")
          : `（知识库未检索到与「${q}」直接匹配的内容，可在知识库中补充该关键词条目。）`;
        cache.set(q, hit);
      }
      pieces.push({ kind: "rag", query: q, body: hit });
    }
    last = m.index + m[0].length;
  }
  if (last < fragment.length) {
    const t = fragment.slice(last);
    if (t) pieces.push({ kind: "text", value: t });
  }
  if (pieces.length === 0 && fragment) {
    pieces.push({ kind: "text", value: fragment });
  }
  return pieces;
}
