import fs from "fs";
import path from "path";
import type { InterpretationSopStep } from "@/features/sales/interpretation-sop";

/**
 * 知识库《解读台模版.pdf》正文：优先使用已入库切片；缺失时用仓库内从 PDF 导出的纯文本。
 */

export function loadInterpretationDeskFallbackText(): string {
  const filePath = path.join(
    process.cwd(),
    "src/features/sales/assets/interpretation-desk-template.txt",
  );
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export function stripPageMarkers(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n\s*--\s*\d+\s+of\s+\d+\s*--\s*\n/g, "\n");
}

/**
 * 拼接知识库切片时，相邻块常在分页处重复同一段（如「二、解读7步法」）。去掉后一块与前一块末尾的最长重叠后缀，避免标题与段落出现两遍。
 */
export function mergeChunksRemovingOverlap(chunkContents: string[], minOverlap = 48): string {
  const parts = chunkContents.map((c) => c.replace(/\r\n/g, "\n").trim()).filter(Boolean);
  if (!parts.length) return "";
  let out = parts[0]!;
  for (let i = 1; i < parts.length; i++) {
    const next = parts[i]!;
    const maxLen = Math.min(out.length, next.length, 8000);
    let cut = 0;
    for (let len = maxLen; len >= minOverlap; len--) {
      if (out.endsWith(next.slice(0, len))) {
        cut = len;
        break;
      }
    }
    if (cut > 0) {
      out += next.slice(cut);
    } else {
      out += "\n\n" + next;
    }
  }
  return out;
}

/**
 * 去掉第 2 次及以后出现的「二、解读7步法」+「第1步：…」标题行（分页拼接或切片重叠时常见）。
 */
export function dedupeDuplicateStepOneAfterSevenWays(text: string): string {
  const block = /\n二、解读\s*7\s*步法\s*\n\s*第\s*1\s*步[：:][^\n]+/g;
  let n = 0;
  return text.replace(/\r\n/g, "\n").replace(block, (m) => {
    n += 1;
    return n === 1 ? m : "";
  });
}

/** PDF 里插图说明性括号，展示时去掉 */
export function stripFigureUiNotes(text: string): string {
  return text.replace(/\s*（图片比较大，要做成可以横向拉动的格式，\s*\n下方有滚动条）/g, "");
}

/**
 * 将 PDF/纯文本导出中的「行宽换行」合并为连续段落，并在序号、章节、要点等处保留段间空行，
 * 使网页展示接近 PDF 版式（避免整段粘成一行，也避免随意按容器宽度重排）。
 */
export function normalizeInterpretationDeskPlainText(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const paragraphs: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length === 0) return;
    paragraphs.push(mergePdfSoftWrappedLines(buf));
    buf = [];
  };

  for (const rawLine of lines) {
    const t = rawLine.trim();
    if (t === "") {
      flush();
      continue;
    }
    if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(t)) {
      flush();
      continue;
    }

    if (isInterpretationDeskStructuralLine(t)) {
      flush();
      buf = [rawLine.trimEnd()];
    } else {
      if (buf.length === 0) buf = [rawLine.trimEnd()];
      else buf.push(rawLine.trimEnd());
    }
  }
  flush();
  return paragraphs.filter(Boolean).join("\n\n");
}

/** 单独成行、应对齐 PDF 的标题/列表起点（与「上一行写满后的折行」区分） */
function isInterpretationDeskStructuralLine(t: string): boolean {
  if (/^\d{1,2}[、.．]\s*\S/.test(t)) return true;
  if (/^\d+[）)]\s*\S/.test(t)) return true;
  if (/^[一二三四五六七八九十百千]+[、．]\s*\S/.test(t)) return true;
  if (/^第\s*\d+\s*步[:：]/.test(t)) return true;
  if (/^第\s*\d+\s*层[:：]/.test(t)) return true;
  if (/^[•·]\s/.test(t)) return true;
  if (/^\d+\.\s+\S/.test(t)) return true;
  if (/^（第[一二三四五六七八九十\d\s]*步[:：]?/.test(t)) return true;
  if (/^（用户确认）/.test(t)) return true;
  if (/^（家长回应）/.test(t)) return true;
  if (/^（注意[,，]?/.test(t)) return true;
  if (/^【这里放图/.test(t)) return true;
  if (/^【[^】]{1,200}】\s*$/.test(t)) return true;
  if (/^🌹|^📕|^❤|^📌/.test(t)) return true;
  if (/^(?:测评的定位|真正成交发生在|当家长意识到)[:：]?/.test(t)) return true;
  if (/^(?:一、|二、|三、|四、|五、|六、|七、|八、|九、|十、)/.test(t)) return true;
  if (/^(?:相关话术|解读前)[:：]?/.test(t)) return true;
  if (/^(?:核心目标|话术参考|要点|目标|模板结构|挑选标准|销售回应|家长可能回答)[:：]/.test(t)) return true;
  if (/^如果(?:测评|还没|填写|这位)/.test(t)) return true;
  if (/^情况\s*\d+[:：]/.test(t)) return true;
  if (/^……+$/.test(t)) return true;
  if (/^(?:需求表达|情绪管理|沟通能力|规则意识|自律自控|自主自驱)[—–\-]/.test(t)) return true;
  if (/^【互动钩子】/.test(t)) return true;
  if (/^[“「]/.test(t)) return true;
  if (/^\s*🚫/.test(t)) return true;
  if (/^我们解读的任务不是教育/.test(t)) return true;
  return false;
}

function mergePdfSoftWrappedLines(parts: string[]): string {
  if (parts.length === 0) return "";
  let out = parts[0]!.replace(/\s+$/u, "");
  for (let i = 1; i < parts.length; i++) {
    const next = parts[i]!.replace(/^\s+|\s+$/gu, "");
    if (!next) continue;
    out = joinPdfLineContinuation(out, next);
  }
  return out;
}

function joinPdfLineContinuation(a: string, b: string): string {
  if (/[、，：；。！？…．「“『《（【]$/.test(a)) return a + b;
  if (/^[」』》）】、。！？，．％%）]/.test(b)) return a + b;
  if (/[\u4e00-\u9fff]$/.test(a) && /^[\u4e00-\u9fff]/.test(b)) return a + b;
  if (/[A-Za-z0-9%]$/.test(a) && /^[A-Za-z0-9]/.test(b)) return `${a} ${b}`;
  return `${a}${b}`;
}

/**
 * 与 `public/knowledge/sop/` 下实际文件名一致（含扩展名）。
 */
export const SOP_DESK_FIGURE_FILENAMES = [
  "figure-1.jpg",
  "figure-2.jpg",
  "figure-3.png",
  "figure-4.png",
  "figure-5.png",
  "figure-6.png",
  "figure-7.png",
  "figure-8.jpeg",
] as const;

/** @param index1to8 第 1～8 张图（含） */
export function sopDeskFigurePublicPath(index1to8: number): string {
  const i = Math.max(1, Math.min(8, Math.floor(index1to8))) - 1;
  return `/knowledge/sop/${SOP_DESK_FIGURE_FILENAMES[i]}`;
}

/**
 * 将「【这里放图 …】」替换为 `public/knowledge/sop/` 下对应文件（见 SOP_DESK_FIGURE_FILENAMES）。
 * 优先从占位内解析图号（如 `【这里放图 8.jpeg】`→图8），与 PDF 模版顺序一致；无数字时按出现顺序回退为 1、2、…。
 */
export function injectOrderedFiguresFromTemplate(text: string): string {
  let fallbackOrder = 0;
  return text.replace(/【这里放图[^】]+】/g, (full) => {
    const m = /【这里放图\s*(\d+)/.exec(full);
    const idx = m
      ? Math.max(1, Math.min(8, parseInt(m[1]!, 10)))
      : Math.min(++fallbackOrder, 8);
    return `\n\n![](${sopDeskFigurePublicPath(idx)})\n\n`;
  });
}

/**
 * 移除「9 型矩阵」预告块：解读前发图 + 图 8 +「相关话术」示例（与模版/旧版知识库一致）。
 * 在插图已注入为 `![](/knowledge/sop/figure-8.jpeg)` 之后调用亦可匹配。
 */
export function stripDeskNineTypePreviewBlock(text: string): string {
  const t = text.replace(/\r\n/g, "\n");
  return t
    .replace(
      /(?:^|\n)解读前，把这张图片发给用户\s*\n[\s\S]*?(?=\n二、解读\s*7\s*步法)/,
      "\n",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 为 true 时解读台 SOP 始终用仓库内 `interpretation-desk-template.txt`，忽略知识库《解读台模版》切片（便于本地改模版立即生效；线上更新话术请改知识库或临时开此开关验证）。 */
function useRepoInterpretationDeskTemplateOnly(): boolean {
  const v = process.env.INTERPRETATION_DESK_USE_REPO_TEMPLATE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * 解读台「解读SOP」正文来源：优先知识库里《解读台模版》切片，否则用仓库内 `interpretation-desk-template.txt`。
 * 设置环境变量 `INTERPRETATION_DESK_USE_REPO_TEMPLATE=true` 可强制使用仓库模版（知识库有切片时默认仍优先知识库，故本地改 txt 刷新不见时多为此因）。
 * 不做整篇 AI 生成；仅做分页去重、插图路径注入等。后续若只对【】内做动态填充，可在此处或上游只替换占位而不重写固定话术。
 */
export function buildInterpretationDeskMarkdownForDisplay(
  kbChunks: Array<{ content: string }>,
): string {
  const raw =
    useRepoInterpretationDeskTemplateOnly() || kbChunks.length === 0
      ? loadInterpretationDeskFallbackText()
      : mergeChunksRemovingOverlap(kbChunks.map((c) => c.content));
  let t = stripPageMarkers(raw);
  t = dedupeDuplicateStepOneAfterSevenWays(t);
  t = stripFigureUiNotes(t);
  t = normalizeInterpretationDeskPlainText(t);
  t = injectOrderedFiguresFromTemplate(t);
  t = stripDeskNineTypePreviewBlock(t);
  return t.trim();
}

/** 供 AI 对齐口播步骤：从「二、解读 7 步法」中按「第 N 步」切分（使用未注入插图的原文）。 */
export function getInterpretationDeskRawForAi(kbChunks: Array<{ content: string }>): string {
  const raw =
    useRepoInterpretationDeskTemplateOnly() || kbChunks.length === 0
      ? loadInterpretationDeskFallbackText()
      : mergeChunksRemovingOverlap(kbChunks.map((c) => c.content));
  let t = stripPageMarkers(raw);
  t = dedupeDuplicateStepOneAfterSevenWays(t);
  t = stripDeskNineTypePreviewBlock(t);
  return t.trim();
}

/** 解析「二、解读 7 步法」内第 1～7 步，供 AI sopSteps 条数与标题对齐 */
export function parseInterpretationDeskSevenSteps(fullText: string): InterpretationSopStep[] {
  const t = fullText.replace(/\r\n/g, "\n");
  const after = t.split(/二、解读\s*7\s*步法\s*/)[1];
  if (!after) return [];
  const block = after.split(/三、[^\n]*禁忌清单/)[0] ?? after;

  const parts = block.split(/(?=第\s*[1-7]\s*步[：:])/);
  const out: InterpretationSopStep[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!/^第\s*[1-7]\s*步[：:]/.test(trimmed)) continue;
    const nl = trimmed.indexOf("\n");
    const title = (nl === -1 ? trimmed : trimmed.slice(0, nl)).trim();
    const content = (nl === -1 ? "" : trimmed.slice(nl + 1)).trim();
    out.push({ title, content });
  }
  return out;
}
