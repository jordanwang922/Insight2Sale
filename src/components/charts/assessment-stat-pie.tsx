import type { AssessmentStatisticGroup } from "@/features/crm/assessment-statistics";

const palette = [
  "#f59e0b",
  "#0f766e",
  "#2563eb",
  "#dc2626",
  "#7c3aed",
  "#16a34a",
  "#ea580c",
  "#0891b2",
  "#be123c",
  "#4f46e5",
];

function toGradient(slices: AssessmentStatisticGroup["slices"]) {
  const total = slices.reduce((sum, item) => sum + item.count, 0);
  if (!total) return "#e2e8f0";

  let current = 0;
  return `conic-gradient(${slices
    .map((slice, index) => {
      const start = current;
      const end = current + (slice.count / total) * 360;
      current = end;
      return `${palette[index % palette.length]} ${start}deg ${end}deg`;
    })
    .join(", ")})`;
}

export function AssessmentStatPie({ group }: { group: AssessmentStatisticGroup }) {
  const total = group.total;
  const topSlices = group.slices.slice(0, 8);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{group.title}</h2>
          <p className="mt-1 text-sm text-slate-500">统计项数 {total}</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          {group.slices.length} 类
        </span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[10rem_1fr] sm:items-center">
        <div
          className="relative mx-auto aspect-square w-40 rounded-full shadow-inner ring-1 ring-slate-200"
          style={{ background: toGradient(group.slices) }}
          aria-label={`${group.title}饼图`}
        >
          <div className="absolute inset-[28%] rounded-full bg-white shadow-sm" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-slate-950">{total}</span>
          </div>
        </div>

        <div className="space-y-2">
          {topSlices.length ? (
            topSlices.map((slice, index) => {
              const percent = total ? Math.round((slice.count / total) * 100) : 0;
              return (
                <div key={slice.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: palette[index % palette.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-700" title={slice.label}>
                    {slice.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {slice.count} / {percent}%
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">当前时间范围内暂无数据。</p>
          )}
          {group.slices.length > topSlices.length ? (
            <p className="pt-1 text-xs text-slate-400">仅展示前 8 类，其余类别已计入饼图。</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
