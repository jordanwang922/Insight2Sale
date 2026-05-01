import type { AssessmentReport, DimensionWordBand } from "@/features/assessment/types";

function countBands(
  report: AssessmentReport,
  side: "parent" | "child",
): Record<DimensionWordBand, number> {
  return report.dimensionScores.reduce(
    (acc, dimension) => {
      const band = side === "parent" ? dimension.parentWordBand : dimension.childWordBand;
      acc[band] += 1;
      return acc;
    },
    { 优势: 0, 潜力: 0, 卡点: 0 } satisfies Record<DimensionWordBand, number>,
  );
}

function averageScore(report: AssessmentReport, side: "parent" | "child") {
  const scores = report.dimensionScores.map((dimension) =>
    side === "parent" ? dimension.parentPercent : dimension.childPercent,
  );
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function AssessmentReportDimensionSummary({
  report,
  compact = false,
}: {
  report: AssessmentReport;
  compact?: boolean;
}) {
  const parent = countBands(report, "parent");
  const child = countBands(report, "child");
  const rows = [
    {
      label: "家长各维度综合得分",
      score: averageScore(report, "parent"),
      counts: parent,
      color: "text-violet-600",
      border: "border-violet-100",
    },
    {
      label: "孩子各维度综合得分",
      score: averageScore(report, "child"),
      counts: child,
      color: "text-emerald-600",
      border: "border-emerald-100",
    },
  ];

  if (compact) {
    return (
      <section className="grid gap-3">
        {rows.map((row) => (
          <article
            key={row.label}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border ${row.border} bg-white px-4 py-3`}
          >
            <p className="text-sm text-slate-500">
              {row.label}：<span className={`text-2xl font-semibold ${row.color}`}>{row.score}分</span>
            </p>
            <p className="text-sm font-medium text-slate-700">
              {row.counts.优势} 项优势 · {row.counts.潜力} 项潜力 · {row.counts.卡点} 项卡点
            </p>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {rows.map((row) => (
        <article key={row.label} className={`rounded-[1.5rem] border ${row.border} bg-white px-5 py-4`}>
          <p className="text-sm text-slate-500">
            {row.label}：<span className={`text-2xl font-semibold ${row.color}`}>{row.score}分</span>
          </p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {row.counts.优势} 项优势 · {row.counts.潜力} 项潜力 · {row.counts.卡点} 项卡点
          </p>
        </article>
      ))}
    </section>
  );
}
