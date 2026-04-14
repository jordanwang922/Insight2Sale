/**
 * 将「测评解读库」中《测评解读SOP》文档的切片还原为有序步骤，供解读台右侧按流程渲染。
 * 支持：Markdown 标题、中文「第 N 步」、数字编号行首。
 */

export type InterpretationSopStep = {
  title: string;
  content: string;
};

function splitByMarkdownHeadings(text: string): InterpretationSopStep[] {
  const lines = text.split(/\r?\n/);
  const blocks: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[2].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);

  if (blocks.length < 2) return [];

  return blocks.map((b) => ({
    title: b.title,
    content: b.lines.join("\n").trim(),
  }));
}

/** 在行首匹配「第N步」「步骤N」「1. 」等 */
function splitByNumberedSteps(text: string): InterpretationSopStep[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const parts = normalized.split(
    /\n(?=\s*(?:第[一二三四五六七八九十0-9]+步|步骤\s*[0-9]+|[0-9]+[\.\、]\s+))/,
  );
  const trimmed = parts.map((p) => p.trim()).filter(Boolean);
  if (trimmed.length < 2) return [];

  return trimmed.map((part, index) => {
    const lineBreak = part.indexOf("\n");
    const firstLine = lineBreak === -1 ? part : part.slice(0, lineBreak);
    const rest = lineBreak === -1 ? "" : part.slice(lineBreak + 1).trim();

    const stripped = firstLine.replace(
      /^\s*(?:第[一二三四五六七八九十0-9]+步|步骤\s*[0-9]+|[0-9]+[\.\、]\s*)/,
      "",
    );
    const title = stripped.trim() || `第 ${index + 1} 步`;
    return {
      title: title.length > 120 ? `${title.slice(0, 117)}…` : title,
      content: rest || firstLine,
    };
  });
}

/**
 * @param chunks 来自 retrieveKnowledgeChunksForDocument（已按 chunkIndex 排序）
 */
export function parseInterpretationSopBlueprint(chunks: Array<{ content: string }>): InterpretationSopStep[] {
  const full = chunks.map((c) => c.content.trim()).join("\n\n");
  if (!full.trim()) return [];

  const byMd = splitByMarkdownHeadings(full);
  if (byMd.length >= 2) return byMd;

  const byNum = splitByNumberedSteps(full);
  if (byNum.length >= 2) return byNum;

  if (chunks.length >= 2) {
    return chunks.map((c, i) => ({
      title: `第 ${i + 1} 部分`,
      content: c.content.trim(),
    }));
  }

  return [{ title: "测评解读 SOP", content: full }];
}

function splitMarkdownHeadingsAllowSingle(text: string): InterpretationSopStep[] {
  const lines = text.split(/\r?\n/);
  const blocks: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[2].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);

  if (blocks.length < 1) return [];

  return blocks.map((b) => ({
    title: b.title,
    content: b.lines.join("\n").trim(),
  }));
}

/** 将完整 Markdown（建议以 ## 分步）解析为步骤，供内置「测评解读SOP（模版）」使用 */
export function parseMarkdownToSopSteps(markdown: string): InterpretationSopStep[] {
  const full = markdown.replace(/\r\n/g, "\n").trim();
  if (!full) return [];
  const byMd = splitMarkdownHeadingsAllowSingle(full);
  if (byMd.length >= 1) return byMd;
  return [{ title: "测评解读SOP（模版）", content: full }];
}
