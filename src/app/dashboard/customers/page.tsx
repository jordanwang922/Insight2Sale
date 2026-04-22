import Link from "next/link";
import { getDashboardSummary } from "@/features/crm/queries";
import { parseJson } from "@/lib/utils";
import { isAdminRole, isManagerOrAdmin } from "@/lib/role-access";
import { assignCustomerOwner } from "@/server/actions/customer";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const data = await getDashboardSummary();
  if (!data) return null;
  const filters = (await searchParams) ?? {};
  const keyword = filters.q?.trim() ?? "";
  const status = filters.status?.trim() ?? "";

  const customers = data.customers.filter((customer) => {
    const matchKeyword = !keyword
      ? true
      : [customer.wechatNickname, customer.phone ?? "", customer.coreProblem ?? "", customer.owner.name]
          .join(" ")
          .includes(keyword);
    const matchStatus = !status ? true : customer.currentStatus?.code === status;

    return matchKeyword && matchStatus;
  });

  const now = new Date();

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            客户管理
          </p>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            defaultValue={keyword}
            name="q"
            placeholder="搜索昵称、手机号、问题、销售"
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            defaultValue={status}
            name="status"
          >
            <option value="">全部状态</option>
            {data.statusCounts.map((item) => (
              <option key={item.id} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" type="submit">
            筛选
          </button>
        </form>
      </div>

      <div className="mt-8 md:hidden">
        <div className="space-y-4">
          {customers.map((customer) => {
            const latestReport = customer.reports[0]
              ? parseJson<{ parentType?: { name?: string } } | null>(customer.reports[0].reportData, null)
              : null;

            return (
              <div
                key={customer.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">客户</p>
                    <p className="mt-1 font-semibold text-slate-950">{customer.wechatNickname}</p>
                    <p className="mt-1 text-xs text-slate-500">{customer.phone ?? "未填写手机号"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">所属销售</p>
                    <p className="mt-1 text-slate-700">{customer.owner.name}</p>
                    {isManagerOrAdmin(data.session.user.role) ? (
                      <form action={assignCustomerOwner} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input type="hidden" name="customerId" value={customer.id} />
                        <select
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                          defaultValue={customer.ownerId}
                          name="ownerId"
                        >
                          {!isAdminRole(data.session.user.role) ? (
                            <option value={data.session.user.id}>主管自己跟进</option>
                          ) : null}
                          {data.assignableSales.map((sales) => (
                            <option key={sales.id} value={sales.id}>
                              {sales.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="w-full shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 sm:w-auto"
                          type="submit"
                        >
                          分配
                        </button>
                      </form>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">当前状态</p>
                      <p className="mt-1 text-slate-700">{customer.currentStatus?.name ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">家长类型</p>
                      <p className="mt-1 text-slate-700">{latestReport?.parentType?.name ?? "-"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">核心问题</p>
                    <p className="mt-1 break-words text-slate-700">{customer.coreProblem ?? "-"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">下次预约</p>
                      <p className="mt-1 text-slate-700">
                        {customer.nextAppointment ? (
                          <>
                            {customer.nextAppointment.startAt.toLocaleString("zh-CN", {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {customer.nextAppointment.startAt < now ? (
                              <span className="ml-1 text-xs text-amber-700">（已过期）</span>
                            ) : null}
                          </>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">提交时间</p>
                      <p className="mt-1 text-slate-700">
                        {customer.submittedAt
                          ? customer.submittedAt.toLocaleString("zh-CN", {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-950"
                  >
                    进入解读台
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 hidden overflow-hidden rounded-[1.5rem] border border-slate-200 md:block">
        <div className="grid grid-cols-[1.2fr_1fr_0.95fr_0.95fr_1.8fr_1fr_0.9fr_150px] bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-500">
          <div>客户</div>
          <div>所属销售</div>
          <div>当前状态</div>
          <div>家长类型</div>
          <div>核心问题</div>
          <div>下次预约</div>
          <div>提交时间</div>
          <div className="text-right">操作</div>
        </div>
        <div className="divide-y divide-slate-100">
          {customers.map((customer) => {
            const latestReport = customer.reports[0]
              ? parseJson<{ parentType?: { name?: string } } | null>(customer.reports[0].reportData, null)
              : null;

            return (
              <div
                key={customer.id}
                className="grid grid-cols-[1.2fr_1fr_0.95fr_0.95fr_1.8fr_1fr_0.9fr_150px] items-center gap-4 px-4 py-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950">{customer.wechatNickname}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{customer.phone ?? "未填写手机号"}</p>
                </div>
                <div className="min-w-0 text-slate-600">
                  <p className="truncate whitespace-nowrap">{customer.owner.name}</p>
                  {isManagerOrAdmin(data.session.user.role) ? (
                    <form action={assignCustomerOwner} className="mt-2 flex items-center gap-2">
                      <input type="hidden" name="customerId" value={customer.id} />
                      <select
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
                        defaultValue={customer.ownerId}
                        name="ownerId"
                      >
                        {!isAdminRole(data.session.user.role) ? (
                          <option value={data.session.user.id}>主管自己跟进</option>
                        ) : null}
                        {data.assignableSales.map((sales) => (
                          <option key={sales.id} value={sales.id}>
                            {sales.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="whitespace-nowrap rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                        type="submit"
                      >
                        分配
                      </button>
                    </form>
                  ) : null}
                </div>
                <div className="whitespace-nowrap text-slate-600">{customer.currentStatus?.name ?? "-"}</div>
                <div className="whitespace-nowrap text-slate-600">{latestReport?.parentType?.name ?? "-"}</div>
                <div className="truncate text-slate-600">{customer.coreProblem}</div>
                <div className="text-slate-600">
                  <div className="whitespace-nowrap">
                    {customer.nextAppointment ? (
                      <>
                        {customer.nextAppointment.startAt.toLocaleDateString("zh-CN")}
                        {customer.nextAppointment.startAt < now ? (
                          <span className="ml-1 text-xs text-amber-700">（已过期）</span>
                        ) : null}
                      </>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className="whitespace-nowrap text-xs text-slate-500">
                    {customer.nextAppointment
                      ? customer.nextAppointment.startAt.toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
                <div className="text-slate-600">
                  <div className="whitespace-nowrap">
                    {customer.submittedAt?.toLocaleDateString("zh-CN") ?? "-"}
                  </div>
                  <div className="whitespace-nowrap text-xs text-slate-500">
                    {customer.submittedAt
                      ? customer.submittedAt.toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
                <div className="text-right">
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="inline-flex whitespace-nowrap rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-950"
                  >
                    进入解读台
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
