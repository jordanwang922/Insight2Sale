import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { AssessmentStatPie } from "@/components/charts/assessment-stat-pie";
import { getAssessmentStatisticsData, requireManagerSession } from "@/features/crm/queries";

type SearchParams = Record<string, string | string[] | undefined>;

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseDateRange(params: SearchParams) {
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const startInput = readParam(params, "startDate") || formatDateInput(defaultStart);
  const endInput = readParam(params, "endDate") || formatDateInput(today);

  const startDate = new Date(`${startInput}T00:00:00`);
  const endDate = new Date(`${endInput}T23:59:59.999`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return {
      startInput: formatDateInput(defaultStart),
      endInput: formatDateInput(today),
      startDate: defaultStart,
      endDate: new Date(`${formatDateInput(today)}T23:59:59.999`),
    };
  }

  if (startDate > endDate) {
    return {
      startInput: endInput,
      endInput: startInput,
      startDate: new Date(`${endInput}T00:00:00`),
      endDate: new Date(`${startInput}T23:59:59.999`),
    };
  }

  return { startInput, endInput, startDate, endDate };
}

export default async function AssessmentStatisticsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await requireManagerSession();
  if (!session) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const range = parseDateRange(params);
  const data = await getAssessmentStatisticsData({
    startDate: range.startDate,
    endDate: range.endDate,
  });

  if (!data) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-500">
        当前账号无权查看测评表统计。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
          Assessment Statistics
        </p>
        <h1 className="mt-4 text-3xl font-semibold">测评表统计</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          按测评提交时间筛选，统计时间范围内所有已填写测评表的基础画像字段。孩子年龄段为多选项，会按每个年龄段分别计入。
        </p>
      </section>

      <form className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm" action="/dashboard/assessment-statistics">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">开始时间</span>
            <input
              type="date"
              name="startDate"
              defaultValue={range.startInput}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">结束时间</span>
            <input
              type="date"
              name="endDate"
              defaultValue={range.endInput}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <BarChart3 className="h-4 w-4" />
            统计
          </button>
        </div>
      </form>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-sm text-slate-500">测评表数量</p>
          <p className="mt-3 text-4xl font-semibold text-slate-950">{data.totalSubmissions}</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-sm text-slate-500">开始时间</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{range.startInput}</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-sm text-slate-500">结束时间</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{range.endInput}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {data.groups.map((group) => (
          <AssessmentStatPie key={group.key} group={group} />
        ))}
      </section>
    </div>
  );
}
