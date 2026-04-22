import { redirect } from "next/navigation";
import { DEFAULT_NEW_USER_PASSWORD } from "@/config/default-credentials";
import { getManagerOverview, requireManagerSession } from "@/features/crm/queries";
import { createManagerUser, createSalesUser } from "@/server/actions/users";

export default async function ManagerPage() {
  const session = await requireManagerSession();
  if (!session) {
    redirect("/dashboard");
  }

  const data = await getManagerOverview();

  if (!data) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-500">
        当前账号无权查看团队总览。
      </div>
    );
  }

  const isAdminView = data.view === "admin";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
          {isAdminView ? "Admin View" : "Manager View"}
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          {isAdminView ? "组织总览与转化节点分布" : "团队总览与转化节点分布"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          {isAdminView
            ? `全组织共有 ${data.totalCustomers} 位客户纳入系统视野，可按状态与成员数据查看各主管团队表现。`
            : `当前团队共有 ${data.totalCustomers} 位客户纳入系统视野，可从状态分布和成员数据快速看出谁需要支持。`}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["今日预约", data.metrics.todayAppointments],
          ["已预约解读", data.metrics.bookedConsult],
          ["已完成解读", data.metrics.consultDone],
          ["已预约直播", data.metrics.liveBooked],
          ["已到课", data.metrics.liveAttended],
          ["未到课", data.metrics.liveMissed],
          ["已试听", data.metrics.trialDone],
          ["已付款", data.metrics.paid],
          ["已退款", data.metrics.refunded],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.funnel.slice(0, 5).map((item) => (
          <article key={item.code} className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{item.name}</p>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            </div>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{item.count}</p>
          </article>
        ))}
      </section>

      {isAdminView ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">主管账号</p>
          <p className="mt-2 text-sm text-slate-500">管理员仅可创建主管；销售账号由各主管在其团队页创建。</p>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">登录用户名</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.managers.length ? (
                  data.managers.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-4 font-medium text-slate-950">{m.name}</td>
                      <td className="px-4 py-4 text-slate-600">{m.username}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={2}>
                      暂无主管账号，请使用下方表单创建。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">状态漏斗</p>
          <div className="mt-6 space-y-3">
            {data.funnel.map((item) => (
              <div key={item.code}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="text-slate-500">{item.count}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${Math.max(6, Math.min(100, item.count * 12))}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            {isAdminView ? "销售成员表现（全组织）" : "销售成员表现"}
          </p>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {isAdminView ? <th className="px-4 py-3">所属主管</th> : null}
                  <th className="px-4 py-3">成员</th>
                  <th className="px-4 py-3">客户数</th>
                  <th className="px-4 py-3">已预约解读</th>
                  <th className="px-4 py-3">已到课</th>
                  <th className="px-4 py-3">已付款</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.salesUsers.map((item) => (
                  <tr key={item.user.id}>
                    {isAdminView ? (
                      <td className="px-4 py-4 text-slate-600">{item.managerName ?? "—"}</td>
                    ) : null}
                    <td className="px-4 py-4 font-medium text-slate-950">{item.user.name}</td>
                    <td className="px-4 py-4">{item.total}</td>
                    <td className="px-4 py-4">{item.bookedConsult}</td>
                    <td className="px-4 py-4">{item.liveAttended}</td>
                    <td className="px-4 py-4">{item.paid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          {isAdminView ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">新增主管账号</p>
              <form action={createManagerUser} className="mt-5 space-y-3">
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="name" placeholder="主管姓名" />
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  name="username"
                  placeholder="登录用户名，例如：zhangmanager"
                />
                <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                  <p className="font-semibold text-amber-900">重要：默认登录密码</p>
                  <p className="mt-2">
                    新主管账号的默认密码为{" "}
                    <code className="rounded-md bg-white px-2 py-0.5 font-mono font-semibold ring-1 ring-amber-200/80">
                      {DEFAULT_NEW_USER_PASSWORD}
                    </code>
                    。对方<strong>首次登录后必须先修改密码</strong>
                    ，否则无法进入工作台。请通过安全渠道当面或单独告知，勿在群内公开发送。
                  </p>
                </div>
                <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" type="submit">
                  创建主管账号
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">新增销售账号</p>
              <form action={createSalesUser} className="mt-5 space-y-3">
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="name" placeholder="销售姓名" />
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  name="username"
                  placeholder="登录用户名，例如：wangli / zhoulan"
                />
                <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                  <p className="font-semibold text-amber-900">重要：默认登录密码</p>
                  <p className="mt-2">
                    新销售账号的默认密码为{" "}
                    <code className="rounded-md bg-white px-2 py-0.5 font-mono font-semibold ring-1 ring-amber-200/80">
                      {DEFAULT_NEW_USER_PASSWORD}
                    </code>
                    。对方<strong>首次登录后必须先修改密码</strong>
                    ，否则无法进入工作台。请通过安全渠道当面或单独告知，勿在群内公开发送。
                  </p>
                </div>
                <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" type="submit">
                  创建销售账号
                </button>
              </form>
            </>
          )}
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">待关注的销售补充话术</p>
          <div className="mt-5 space-y-4">
            {data.pendingScripts.length ? (
              data.pendingScripts.map((script) => (
                <div key={script.id} className="rounded-[1.5rem] bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{script.sectionTitle}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{script.author.name}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{script.customer.wechatNickname}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{script.content}</p>
                  <p className="mt-3 text-xs text-slate-400">到模板管理页审核后，才能进入共享模板库。</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">当前没有待关注的补充话术。</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
