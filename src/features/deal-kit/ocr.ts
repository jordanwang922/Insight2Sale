import { createWorker } from "tesseract.js";

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
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractSection(rawText: string, label: string, nextLabels: string[]) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nextPattern = nextLabels.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regexp = new RegExp(
    `${escapedLabel}\\s*[：:]\\s*([\\s\\S]*?)(?=\\n?\\s*(?:${nextPattern})\\s*[：:]|$)`,
    "i",
  );
  const matched = rawText.match(regexp);
  return matched?.[1]?.trim() ?? "";
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
  const profileText = extractSection(clean, "用户画像", ["用户判断", "成交经验", "贡献人"]);
  const judgmentText = extractSection(clean, "用户判断", ["成交经验", "贡献人"]);
  const experienceText = extractSection(clean, "成交经验", ["贡献人"]);
  const contributorName =
    extractSection(clean, "贡献人", ["用户画像", "用户判断", "成交经验"]) || inferContributorName(clean);

  return {
    contributorName,
    profileText,
    judgmentText,
    experienceText,
    rawText: clean,
  };
}

export async function recognizeDealKitImage(buffer: Buffer): Promise<DealKitOcrExtraction> {
  const worker = await createWorker("chi_sim+eng");
  try {
    const result = await worker.recognize(buffer);
    return parseDealKitStructuredText(result.data.text ?? "");
  } finally {
    await worker.terminate();
  }
}
