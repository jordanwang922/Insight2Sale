import { DimensionScore } from "@/features/assessment/types";
import { cn } from "@/lib/utils";

export function DimensionAnalysisGrid({
  dimensions,
  className,
}: {
  dimensions: DimensionScore[];
  className?: string;
}) {
  return (
    <section className={cn("rounded-[2rem] border border-slate-200 bg-white p-6", className)}>
      <h2 className="text-2xl font-semibold text-slate-950">各维度详细分析</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {dimensions.map((dimension) => (
          <article key={dimension.name} className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 text-sm font-semibold leading-tight text-slate-950 md:text-base break-keep">
                {dimension.name}
              </p>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-500">
                {dimension.level}
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                  <span>孩子表现</span>
                  <span className="font-semibold text-emerald-600">{dimension.childPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${dimension.childPercent}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                  <span>家长能力</span>
                  <span className="font-semibold text-indigo-500">{dimension.parentPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${dimension.parentPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
