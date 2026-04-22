import Link from "next/link";
import { getDashboardSummary } from "@/features/crm/queries";
import { isManagerOrAdmin } from "@/lib/role-access";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default async function DashboardPage() {
  const data = await getDashboardSummary();

  if (!data) return null;
  const siteUrl = await getPublicSiteUrl();
  const assessmentHref = data.primaryAssessment
    ? `/assessment/${data.primaryAssessment.slug}`
    : "/assessment";
  const assessmentAbsoluteUrl = siteUrl ? `${siteUrl}${assessmentHref}` : "";
  const assessmentLabel = data.primaryAssessment?.shortName ?? "智慧父母养育测评";

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            今日工作总览
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            今天共有 {data.customers.length} 位客户在你的工作视野内。优先处理已完成测评但待预约、
            或已预约但还没开始 1V1 解读的客户。
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-7">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            今日预约
          </p>
          <div className="mt-4 space-y-4">
            {data.appointments.length ? (
              data.appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: appointment.ownerColor }}
                    />
                    <p className="text-sm font-medium text-slate-900">
                    {appointment.customer?.wechatNickname ?? appointment.participantName ?? appointment.title}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {appointment.title} · {appointment.startAt.toLocaleString("zh-CN")}
                  </p>
                  {isManagerOrAdmin(data.session.user.role) ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {data.session.user.role === "ADMIN"
                        ? `预约人：${appointment.owner?.name ?? ""}`
                        : appointment.owner?.id === data.session.user.id
                          ? "主管本人"
                          : `下属销售：${appointment.owner?.name ?? ""}`}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                今日暂无预约，可从待完成测评的客户里安排新的解读时段。
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.statusCounts
          .filter((status) => status.count > 0)
          .slice(0, 4)
          .map((status) => (
            <article
              key={status.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{status.name}</p>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
              </div>
              <p className="mt-4 text-4xl font-semibold text-slate-950">{status.count}</p>
            </article>
          ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
                我的客户
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">优先查看最近完成测评的客户</h2>
            </div>
            <Link
              href="/dashboard/customers"
              className="shrink-0 whitespace-nowrap rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950"
            >
              查看全部
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {data.customers.slice(0, 6).map((customer) => (
              <Link
                key={customer.id}
                href={`/dashboard/customers/${customer.id}`}
                className="grid items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 transition hover:bg-slate-100 lg:grid-cols-[minmax(0,1fr)_320px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-slate-950">{customer.wechatNickname}</p>
                    <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {customer.currentStatus?.name ?? "未设置状态"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">{customer.coreProblem}</p>
                </div>
                <span className="whitespace-nowrap text-sm font-medium text-slate-500">
                  {customer.parentingRole}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            快捷入口
          </p>
          <QuickActions
            role={data.session.user.role}
            assessmentHref={assessmentHref}
            assessmentLabel={assessmentLabel}
            assessmentAbsoluteUrl={assessmentAbsoluteUrl}
          />
        </div>
      </section>
    </div>
  );
}
