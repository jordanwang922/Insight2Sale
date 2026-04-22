import type { AssessmentReport } from "@/features/assessment/types";

export function AssessmentReportIndexCards({
  report,
  variant = "light",
}: {
  report: AssessmentReport;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  const card =
    isDark
      ? "rounded-xl bg-white/10 px-2 py-3 ring-1 ring-white/10"
      : "rounded-[1.5rem] border border-slate-200 bg-white p-6";
  const labelCls = isDark ? "text-[10px] font-medium uppercase tracking-wide text-white/60" : "text-sm text-slate-500";
  const pctCls = isDark ? "mt-1 text-lg font-bold text-amber-200" : "mt-3 text-4xl font-semibold text-slate-950";
  const subCls = isDark ? "mt-1 text-[10px] leading-snug text-white/70" : "mt-2 text-xs leading-relaxed text-slate-500";

  const rows: [string, keyof Pick<AssessmentReport, "anxiety" | "burnout" | "competence">][] = [
    ["教育焦虑指数", "anxiety"],
    ["养育倦怠指数", "burnout"],
    ["教养能力感", "competence"],
  ];

  return (
    <section className={isDark ? "grid grid-cols-3 gap-2 text-center" : "grid gap-4 lg:grid-cols-3"}>
      {rows.map(([title, key]) => {
        const idx = report[key];
        return (
          <article key={title} className={card}>
            <p className={labelCls}>{title}</p>
            <p className={pctCls}>{idx.percent}%</p>
            <p className={subCls}>
              {idx.verbalBand}（{idx.score}/{idx.maxScore} 分）
            </p>
          </article>
        );
      })}
    </section>
  );
}
