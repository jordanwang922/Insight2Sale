import type { AssessmentReport } from "@/features/assessment/types";

export function AssessmentReportParentTypeBlock({
  report,
  variant = "light",
  forSharePng = false,
}: {
  report: AssessmentReport;
  variant?: "light" | "dark";
  /** 保存分享长图：按手机可读性放大字号 */
  forSharePng?: boolean;
}) {
  const isDark = variant === "dark";
  const wrap = isDark
    ? forSharePng
      ? "mt-0 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
      : "mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"
    : "rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6";

  return (
    <section className={wrap}>
      <p
        className={
          isDark
            ? forSharePng
              ? "text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90"
              : "text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-amber-200/90"
            : "text-sm font-semibold uppercase tracking-[0.3em] text-amber-700"
        }
      >
        家长养育类型（Word 9 型矩阵）
      </p>
      <h2
        className={
          isDark
            ? forSharePng
              ? "mt-3 text-xl font-bold leading-snug text-white"
              : "mt-2 text-base font-bold text-white"
            : "mt-3 text-xl font-semibold text-slate-950"
        }
      >
        {report.parentType.name}
      </h2>
      <p
        className={
          isDark
            ? forSharePng
              ? "mt-3 text-sm leading-relaxed text-white/90"
              : "mt-2 text-[11px] leading-relaxed text-white/85"
            : "mt-2 text-sm leading-7 text-slate-600"
        }
      >
        {report.parentType.description}
      </p>
      <ul
        className={
          isDark
            ? forSharePng
              ? "mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/85"
              : "mt-2 list-disc space-y-1 pl-4 text-[11px] text-white/80"
            : "mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700"
        }
      >
        {report.parentType.characteristics.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div
        className={
          isDark
            ? forSharePng
              ? "mt-4 grid grid-cols-1 gap-2 text-xs leading-snug text-white/80 sm:grid-cols-2"
              : "mt-3 grid grid-cols-2 gap-2 text-[10px] text-white/75"
            : "mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2"
        }
      >
        <p>
          情感支持度（维度1+2+3）原始分 {report.emotionalSupportRaw}/45，档：{report.emotionalSupportWordBand}
        </p>
        <p>
          规则引导度（维度4+5+6）原始分 {report.ruleGuidanceRaw}/45，档：{report.ruleGuidanceWordBand}
        </p>
      </div>
    </section>
  );
}
