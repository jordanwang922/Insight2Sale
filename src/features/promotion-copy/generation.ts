import { generateDoubaoJson } from "@/lib/ai/doubao";

export interface PromotionVariant {
  title: string;
  content: string;
}

const SENTENCE_REPLACERS: Array<[RegExp, string]> = [
  [/今天/u, "此刻"],
  [/大家/u, "你也"],
  [/真的/u, "确实"],
  [/一定要/u, "可以试着"],
  [/我们/u, "咱们"],
];

function softlyRewriteSentence(text: string) {
  let output = text.trim();
  for (const [pattern, replacement] of SENTENCE_REPLACERS) {
    if (pattern.test(output)) {
      output = output.replace(pattern, replacement);
      break;
    }
  }
  return output;
}

export function buildPromotionVariantFallback(original: PromotionVariant): PromotionVariant {
  const title = softlyRewriteSentence(original.title) || original.title.trim();
  const lines = original.content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const rewritten =
    lines.length === 0
      ? softlyRewriteSentence(original.content)
      : lines
          .map((line, index) => (index === 0 ? softlyRewriteSentence(line) : line))
          .join("\n");

  return {
    title,
    content: rewritten || original.content.trim(),
  };
}

export async function generatePromotionVariant(original: PromotionVariant) {
  const fallback = buildPromotionVariantFallback(original);
  const result = await generateDoubaoJson<PromotionVariant>({
    system: `你是销售推广文案润色助手。请把原文轻微改写成一个新版本，只输出 JSON：
{"title":"...","content":"..."}
规则：
1. 只做轻度改写，不能改变核心意思
2. 保留节日氛围、语气和 emoji 风格
3. 不要扩写太多，不要重写成另一条内容
4. 标题和正文都要返回`,
    user: `标题：${original.title}\n\n正文：${original.content}`,
    temperature: 0.45,
    timeoutMs: 20_000,
    fallback,
  });

  return {
    title: typeof result.title === "string" && result.title.trim() ? result.title.trim() : fallback.title,
    content:
      typeof result.content === "string" && result.content.trim() ? result.content.trim() : fallback.content,
  };
}
