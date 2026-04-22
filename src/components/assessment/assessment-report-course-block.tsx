import type { AssessmentReport } from "@/features/assessment/types";

export function AssessmentReportCourseBlock({
  report,
  variant = "light",
}: {
  report: AssessmentReport;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <section
      className={
        isDark
          ? "rounded-2xl border border-white/10 bg-transparent p-0"
          : "rounded-[2rem] border border-slate-200 bg-white p-6"
      }
    >
      <h2 className={isDark ? "text-sm font-semibold text-amber-200" : "text-2xl font-semibold text-slate-950"}>
        课程学习建议
      </h2>
      <p
        className={
          isDark ? "mt-2 text-[10px] leading-relaxed text-white/70" : "mt-2 text-sm leading-7 text-slate-500"
        }
      >
        结合您当前各维度得分，系统优先推荐需要加强的模块（与测评工具说明一致）。
      </p>
      <div className={isDark ? "mt-3 space-y-2" : "mt-4 space-y-3"}>
        {report.courseRecommendations.map((item) => (
          <div
            key={item.module}
            className={
              isDark
                ? "rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"
                : "rounded-2xl bg-slate-50 px-4 py-4"
            }
          >
            <p className={isDark ? "text-xs font-semibold text-white" : "font-medium text-slate-950"}>{item.module}</p>
            <p className={isDark ? "mt-1 text-[10px] leading-relaxed text-white/80" : "mt-2 text-sm leading-7 text-slate-600"}>
              {item.reason}
            </p>
            <p className={isDark ? "mt-1 text-[10px] leading-relaxed text-white/60" : "mt-2 text-sm leading-7 text-slate-500"}>
              {item.talkingPoint}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
