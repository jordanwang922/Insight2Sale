import type { AssessmentReport } from "@/features/assessment/types";

export function AssessmentReportFootnotes({
  report,
  variant = "light",
}: {
  report: AssessmentReport;
  variant?: "light" | "dark";
}) {
  const box =
    variant === "dark"
      ? "mt-4 rounded-2xl bg-black/25 p-3 text-[10px] leading-relaxed text-white/70 ring-1 ring-white/10"
      : "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600";

  return (
    <div className={box}>
      <p>{report.competenceClarification}</p>
      <p className={variant === "dark" ? "mt-2" : "mt-3"}>{report.percentConversionNote}</p>
    </div>
  );
}
