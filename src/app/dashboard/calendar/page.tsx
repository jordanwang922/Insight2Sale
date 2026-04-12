import Link from "next/link";
import { format } from "date-fns";
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
} from "@/server/actions/appointments";
import { getCalendarView } from "@/features/crm/queries";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; appointmentId?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const data = await getCalendarView(new Date(), resolved?.date, resolved?.appointmentId);
  if (!data) return null;
  const selectedAppointment = data.selectedAppointment;
  const defaultStart = `${data.selectedDate}T15:00`;
  const defaultEnd = `${data.selectedDate}T16:00`;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">预约日历</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">
          {format(data.activeMonth, "yyyy年M月")}预约安排
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          主管可以同时看自己和下属的日历，不同销售用不同颜色区分；销售只看自己的安排。点某一天右上角的“+”即可直接新增预约。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {data.owners.map((owner) => (
            <span
              key={owner.id}
              className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs text-slate-600"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: owner.color }} />
              {owner.name}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-sm font-medium text-slate-500">
            {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((label) => (
              <div key={label} className="px-2 py-3">
                {label}
              </div>
            ))}
          </div>
          <div className="grid">
            {data.weeks.map((week, index) => (
              <div key={index} className="grid grid-cols-7">
                {week.map((day) => (
                  <div
                    key={day.isoDate}
                    className={`min-h-44 border-b border-r border-slate-200 p-3 ${
                      day.isCurrentMonth ? "bg-white" : "bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          day.isCurrentMonth ? "text-slate-950" : "text-slate-400"
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      <Link
                        href={`/dashboard/calendar?date=${day.isoDate}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
                      >
                        +
                      </Link>
                    </div>

                    <div className="mt-3 space-y-2">
                      {day.appointments.map((appointment) => (
                        <Link
                          key={appointment.id}
                          href={`/dashboard/calendar?date=${day.isoDate}&appointmentId=${appointment.id}`}
                          className="block rounded-xl px-2 py-2 text-xs text-slate-700"
                          style={{ backgroundColor: `${appointment.ownerColor}18` }}
                        >
                          <p className="font-semibold text-slate-900">
                            {format(appointment.startAt, "HH:mm")} {appointment.customerName}
                          </p>
                          <p className="mt-1">{appointment.title}</p>
                          <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: appointment.ownerColor }} />
                            {appointment.ownerName}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </article>

        <article
          key={`${data.selectedDate}-${selectedAppointment?.id ?? "new"}`}
          className="rounded-[2rem] border border-slate-200 bg-white p-6"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">新增预约</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">{data.selectedDate} 日程安排</h2>
          <form action={selectedAppointment ? updateAppointment : createAppointment} className="mt-5 space-y-3">
            {selectedAppointment ? <input type="hidden" name="id" value={selectedAppointment.id} /> : null}
            <label className="block space-y-2 text-sm font-medium text-slate-900">
              指派给谁
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                name="ownerId"
                defaultValue={selectedAppointment?.ownerId ?? data.owners[0]?.id}
              >
                {data.owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="title"
              placeholder="例如：1V1 解读、直播跟进、内部复盘"
              defaultValue={selectedAppointment?.title ?? ""}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="participantName"
              placeholder="跟谁一起做，例如：快乐女孩 / 团队主管 / 内部会议"
              defaultValue={selectedAppointment?.participantName ?? selectedAppointment?.customer?.wechatNickname ?? ""}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="kind"
              placeholder="事项类型，例如：1V1解读"
              defaultValue={selectedAppointment?.kind ?? ""}
            />
            <div className="grid gap-3">
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                defaultValue={
                  selectedAppointment
                    ? new Date(selectedAppointment.startAt.getTime() - selectedAppointment.startAt.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16)
                    : defaultStart
                }
                name="startAt"
                type="datetime-local"
              />
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                defaultValue={
                  selectedAppointment
                    ? new Date(selectedAppointment.endAt.getTime() - selectedAppointment.endAt.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16)
                    : defaultEnd
                }
                name="endAt"
                type="datetime-local"
              />
            </div>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="notes"
              placeholder="补充这次安排的目标、准备事项和备注"
              defaultValue={selectedAppointment?.notes ?? ""}
            />
            <div className={`grid gap-3 ${selectedAppointment ? "md:grid-cols-2" : ""}`}>
              <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                {selectedAppointment ? "保存修改" : "保存预约"}
              </button>
            </div>
          </form>
          {selectedAppointment ? (
            <form action={deleteAppointment} className="mt-3">
              <input type="hidden" name="id" value={selectedAppointment.id} />
              <button className="w-full rounded-2xl border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-700">
                删除预约
              </button>
            </form>
          ) : null}
        </article>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">本月预约清单</p>
        <div className="mt-6 space-y-4">
          {data.appointments.length ? (
            data.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-[1.5rem] bg-slate-50 px-5 py-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{appointment.customerName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {appointment.title} · {appointment.startAt.toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    <span
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: appointment.ownerColor }}
                    />
                    {appointment.ownerName} · {appointment.notes ?? "暂无备注"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">本月还没有预约。</p>
          )}
        </div>
      </section>
    </div>
  );
}
