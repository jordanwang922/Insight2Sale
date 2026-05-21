import { createWorker } from "tesseract.js";
import { generateDoubaoJson } from "@/lib/ai/doubao";

export interface DealKitOcrExtraction {
  contributorName: string;
  profileText: string;
  judgmentText: string;
  experienceText: string;
  rawText: string;
}

function cleanOcrText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]*([：:])[ \t]*/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildLabelPattern(label: string) {
  return label
    .split("")
    .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s*");
}

function extractSection(rawText: string, labels: string[], nextLabels: string[]) {
  const labelPattern = labels.map(buildLabelPattern).join("|");
  const nextPattern = nextLabels.map(buildLabelPattern).join("|");
  const regexp = new RegExp(
    `(?:${labelPattern})\\s*[：:]\\s*([\\s\\S]*?)(?=\\n?\\s*(?:${nextPattern})\\s*[：:]|$)`,
    "i",
  );
  const matched = rawText.match(regexp);
  return matched?.[1]?.trim() ?? "";
}

const PROFILE_LABELS = ["用户画像", "用户画象", "家长画像", "客户画像"];
const JUDGMENT_LABELS = ["用户判断", "家长判断", "客户判断", "需求判断"];
const EXPERIENCE_LABELS = ["成交经验", "成单经验", "成交过程", "推进经验"];
const CONTRIBUTOR_LABELS = ["贡献人", "整理人", "销售", "顾问"];

function hasStructuredContent(extraction: DealKitOcrExtraction) {
  return Boolean(extraction.profileText || extraction.judgmentText || extraction.experienceText);
}

function hasAllStructuredSections(extraction: DealKitOcrExtraction) {
  return Boolean(extraction.profileText && extraction.judgmentText && extraction.experienceText);
}

function inferContributorName(rawText: string) {
  const firstMeaningfulLine = rawText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !/^用户画像/u.test(line) && line.length <= 32);

  if (!firstMeaningfulLine) return "";
  return firstMeaningfulLine.replace(/^学习顾问[-：: ]*/u, "").trim();
}

export function parseDealKitStructuredText(rawText: string): DealKitOcrExtraction {
  const clean = cleanOcrText(rawText);
  const profileText = extractSection(clean, PROFILE_LABELS, [...JUDGMENT_LABELS, ...EXPERIENCE_LABELS, ...CONTRIBUTOR_LABELS]);
  const judgmentText = extractSection(clean, JUDGMENT_LABELS, [...EXPERIENCE_LABELS, ...CONTRIBUTOR_LABELS]);
  const experienceText = extractSection(clean, EXPERIENCE_LABELS, CONTRIBUTOR_LABELS);
  const contributorName =
    extractSection(clean, CONTRIBUTOR_LABELS, [...PROFILE_LABELS, ...JUDGMENT_LABELS, ...EXPERIENCE_LABELS]) ||
    inferContributorName(clean);

  return {
    contributorName,
    profileText,
    judgmentText,
    experienceText,
    rawText: clean,
  };
}

async function refineDealKitStructuredText(rawText: string, fallback: DealKitOcrExtraction) {
  if (!rawText.trim()) return fallback;

  const result = await generateDoubaoJson<Partial<DealKitOcrExtraction>>({
    system: `你是成交锦囊 OCR 整理助手。请从截图识别出的原始文本里提取 4 个字段，只输出 JSON：
{"contributorName":"...","profileText":"...","judgmentText":"...","experienceText":"..."}
要求：
1. 只整理已有内容，不要编造
2. 用户画像、用户判断、成交经验尽量按原文保留
3. 如果某个字段没有，就返回空字符串
4. 贡献人优先提取老师/顾问/主管名字`,
    user: rawText,
    temperature: 0.1,
    timeoutMs: 20_000,
    fallback,
  });

  return {
    contributorName: typeof result.contributorName === "string" ? result.contributorName.trim() : fallback.contributorName,
    profileText: typeof result.profileText === "string" ? result.profileText.trim() : fallback.profileText,
    judgmentText: typeof result.judgmentText === "string" ? result.judgmentText.trim() : fallback.judgmentText,
    experienceText: typeof result.experienceText === "string" ? result.experienceText.trim() : fallback.experienceText,
    rawText: fallback.rawText,
  };
}

export async function recognizeDealKitImage(buffer: Buffer): Promise<DealKitOcrExtraction> {
  const worker = await createWorker("chi_sim+eng");
  try {
    const result = await worker.recognize(buffer);
    const rawText = result.data.text ?? "";
    const parsed = parseDealKitStructuredText(rawText);
    if (hasAllStructuredSections(parsed)) {
      return parsed;
    }
    const refined = await refineDealKitStructuredText(parsed.rawText, parsed);
    return hasStructuredContent(refined) ? refined : parsed;
  } finally {
    await worker.terminate();
  }
}
