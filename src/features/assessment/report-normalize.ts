import type { AssessmentReport, DimensionScore, DimensionWordBand, IndexScore } from "./types";
import { WORD_COMPETENCE_CLARIFICATION, WORD_PERCENT_CONVERSION_NOTE } from "./report-word-copy";

function approxRawFromIndexPercent(percent: number): number {
  return Math.min(15, Math.max(0, Math.round((percent / 100) * 15)));
}

function anxietyVerbalFromRaw(raw: number): string {
  if (raw >= 9) return "很焦虑";
  if (raw >= 4) return "比较焦虑";
  return "从容";
}

function burnoutVerbalFromRaw(raw: number): string {
  if (raw >= 9) return "很疲惫";
  if (raw >= 4) return "比较疲惫";
  return "轻松";
}

function competenceVerbalFromRaw(raw: number): string {
  if (raw >= 9) return "自我评估-教养能力强";
  if (raw >= 4) return "自我评估-教养能力待提升";
  return "自我评估-教养能力弱";
}

function bandFromRaw15(raw: number): DimensionWordBand {
  if (raw >= 13) return "优势";
  if (raw >= 9) return "潜力";
  return "卡点";
}

/** 历史快照缺 Word 分档字段时补齐，避免结果页报错 */
export function normalizeAssessmentReport(
  report: Partial<AssessmentReport> | null,
): AssessmentReport | null {
  if (!report) return null;

  const sourceDims = report.dimensionScores ?? [];
  const dimensionScores: DimensionScore[] = sourceDims.map((d) => {
    const childWordBand = d.childWordBand ?? bandFromRaw15(d.childScore);
    const parentWordBand = d.parentWordBand ?? bandFromRaw15(d.parentScore);
    const order = (b: DimensionWordBand) => (b === "卡点" ? 0 : b === "潜力" ? 1 : 2);
    const worst = order(childWordBand) <= order(parentWordBand) ? childWordBand : parentWordBand;
    const level =
      d.level ??
      (worst === "卡点" ? "低" : worst === "潜力" ? "中" : "高");
    return { ...d, childWordBand, parentWordBand, level };
  });

  const fillIndex = (idx: IndexScore | undefined, verbal: (r: number) => string): IndexScore => {
    const base = idx ?? { score: 0, maxScore: 15, percent: 0, verbalBand: "" };
    const verbalBand =
      base.verbalBand && base.verbalBand.length > 0
        ? base.verbalBand
        : verbal(approxRawFromIndexPercent(base.percent));
    return { ...base, verbalBand };
  };

  const emotionalSupportRaw =
    report.emotionalSupportRaw ??
    (() => {
      const names = ["需求", "接纳情绪", "沟通"] as const;
      let t = 0;
      for (const dim of dimensionScores) {
        if ((names as readonly string[]).includes(dim.name)) {
          t += dim.parentScore;
        }
      }
      return t;
    })();

  const ruleGuidanceRaw =
    report.ruleGuidanceRaw ??
    (() => {
      const names = ["家庭系统", "自律", "自主"] as const;
      let t = 0;
      for (const dim of dimensionScores) {
        if ((names as readonly string[]).includes(dim.name)) {
          t += dim.parentScore;
        }
      }
      return t;
    })();

  const band045 = (raw: number): DimensionWordBand => {
    if (raw >= 37) return "优势";
    if (raw >= 27) return "潜力";
    return "卡点";
  };

  return {
    ...report,
    dimensionScores,
    anxiety: fillIndex(report.anxiety, anxietyVerbalFromRaw),
    burnout: fillIndex(report.burnout, burnoutVerbalFromRaw),
    competence: fillIndex(report.competence, competenceVerbalFromRaw),
    emotionalSupportRaw,
    ruleGuidanceRaw,
    emotionalSupportWordBand: report.emotionalSupportWordBand ?? band045(emotionalSupportRaw),
    ruleGuidanceWordBand: report.ruleGuidanceWordBand ?? band045(ruleGuidanceRaw),
    competenceClarification: report.competenceClarification ?? WORD_COMPETENCE_CLARIFICATION,
    percentConversionNote: report.percentConversionNote ?? WORD_PERCENT_CONVERSION_NOTE,
  } as AssessmentReport;
}
