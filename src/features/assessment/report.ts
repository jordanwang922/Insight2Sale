import { AssessmentReport } from "./types";

export function toRadarData(report: AssessmentReport, side: "child" | "parent") {
  return report.dimensionScores.map((item) => ({
    dimension: item.name,
    score: side === "child" ? item.childPercent : item.parentPercent,
    fullMark: 100,
  }));
}

export function buildSalesSummary(report: AssessmentReport, customerName: string) {
  const strongest = [...report.dimensionScores].sort((a, b) => b.childPercent - a.childPercent)[0];
  const weakest = [...report.dimensionScores].sort((a, b) => a.childPercent - b.childPercent)[0];

  return {
    headline: `${customerName} 当前更适合从“${weakest.name}”切入，建立信任后再过渡到课程模块推荐。`,
    strongestDimension: strongest.name,
    weakestDimension: weakest.name,
    parentType: report.parentType.name,
    riskSignal:
      report.burnout.percent > 60
        ? "家长养育倦怠偏高，解读时要先共情，再谈方法。"
        : "家长还有行动意愿，适合从具体问题和未来画面入手。",
  };
}
