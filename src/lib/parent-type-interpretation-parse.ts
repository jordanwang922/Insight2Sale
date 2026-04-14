/**
 * 解析「【标题】\n正文」重复出现的家长类型解读文本（可多段，如 9 个维度）。
 * 不依赖段与段之间是否有空行，避免只有第一段标题被当成标题。
 */
export function parseParentTypeInterpretationSections(text: string): Array<{ title: string; body: string }> {
  const trimmed = text.trim();
  if (!trimmed.includes("【")) return [];

  const re = /【([^】]+)】\r?\n/g;
  const blocks: { title: string; titleStart: number; bodyStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) !== null) {
    blocks.push({
      title: m[1],
      titleStart: m.index,
      bodyStart: m.index + m[0].length,
    });
  }

  if (!blocks.length) return [];

  return blocks.map((b, i) => {
    const bodyEnd = i + 1 < blocks.length ? blocks[i + 1]!.titleStart : trimmed.length;
    const body = trimmed.slice(b.bodyStart, bodyEnd).trim();
    return { title: b.title, body };
  });
}
