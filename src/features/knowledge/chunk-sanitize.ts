/**
 * 测评解读库切片常混入：问卷题干、OCR 噪声、页码、内部链接与提示词模板。
 * 展示与组稿前做清洗，并用于检索后过滤「不像解读正文」的块。
 */

const URL_RE = /https?:\/\/[^\s\u3000-\u303f\uff00-\uffef）】〉]+/gi;

/** 去掉链接、页码标记、常见 OCR/版式噪声 */
export function sanitizeKnowledgeChunkBody(text: string): string {
  let s = text.replace(/\r/g, "\n");

  s = s.replace(URL_RE, "");
  s = s.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "");
  s = s.replace(/―\s*\d+\s+of\s+\d+\s*―/gi, "");
  s = s.replace(/-\s*\d+\s*\/\s*\d+\s*-?/g, "");
  s = s.replace(/---\s*PDF[^\n]*/gi, "");
  s = s.replace(/【第\s*\d+\s*页\s*OCR】/g, "");
  s = s.replace(/\s*agent\.minimaxi\.com[^\s]*/gi, "");

  const lines = s.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const L = line.trim();
    if (!L) continue;
    if (/https?:\/\//i.test(L)) continue;
    if (/minimaxi\.com|preview_expert_id/i.test(L)) continue;
    if (/得分逻辑|本题参考理论|参考理论[:：]/.test(L)) continue;
    if (/维度解读SOP|销售培训.*测评解读/.test(L) && L.length < 80) continue;
    if (/提示词\s*\d|复制基本信息替换|学员的测评基本信息如下/.test(L)) continue;
    if (/注意[,，].{0,40}顾问补充/.test(L)) continue;
    if (/^题\s*\d+\s*[、：.]/.test(L)) continue;
    if (/^[（(]\s*题\s*\d+/.test(L)) continue;
    if (/^[A-DＡ-Ｄ][．、.)\s]\s*.{0,120}\(\s*\d+\s*分\s*\)/.test(L)) continue;
    if (/五、销售培训|六、AI专家|智慧父母咨询专家/.test(L) && L.length < 100) continue;
    kept.push(L);
  }

  s = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

/** 0～1，越高越像「问卷/后台说明」而非解读正文 */
export function chunkInterpretationNoiseScore(text: string): number {
  const t = text.slice(0, 6000);
  let noise = 0;
  if (/https?:\/\//i.test(t)) noise += 0.45;
  if (/(题\s*\d+|第\s*\d+\s*题)[、：.]/.test(t)) noise += 0.28;
  if (/得分逻辑|本题参考理论/.test(t)) noise += 0.32;
  if (/--\s*\d+\s+of\s+\d+\s*--/i.test(t)) noise += 0.22;
  if (/【第\s*\d+\s*页\s*OCR】/.test(t)) noise += 0.28;
  if ((t.match(/\(\s*\d+\s*分\s*\)/g) ?? []).length > 6) noise += 0.38;
  if (/提示词|复制基本信息|学员的测评基本信息/.test(t)) noise += 0.32;
  if (/^[A-D][．、.)]\s*.+\(\s*\d+\s*分\s*\)/m.test(t)) noise += 0.25;
  if (/\d+%\d+|[a-zA-Z]%[a-zA-Z0-9]/.test(t)) noise += 0.15;
  return Math.min(1, noise);
}

/** 展示用：教研版问卷类文档标题弱化为通用标签，避免家长误以为整卷问卷 */
export function shortDocTitleForInterpretation(title: string): string {
  const t = title.replace(/\.pdf$/i, "").trim();
  if (/前端测评|教研版|4\.0/.test(t) && /测评|智慧父母/.test(t)) {
    return "测评解读资料";
  }
  return t.length > 32 ? `${t.slice(0, 30)}…` : t;
}
