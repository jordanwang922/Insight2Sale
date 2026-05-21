import Link from "next/link";
import { ActionFeedbackForm } from "@/components/forms/action-feedback-form";
import { PromotionCopyCard } from "@/components/promotion-copy/promotion-copy-card";
import { createPromotionCopy } from "@/server/actions/promotion-copy";
import { canManagePromotionCopies, getPromotionCopyPageData } from "@/features/promotion-copy/queries";

export default async function PromotionCopiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const data = await getPromotionCopyPageData(resolved?.date);
  if (!data) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">推广文案</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">按日期准备，按人轻改，随手就能发出去</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
          主管负责提前准备，销售负责当天领取和轻改生成。系统会给每个人生成略有区别的新版本，减少朋友圈或社交平台完全重复文案的折叠风险。
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">月历</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">{data.activeMonthLabel}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600" href={data.monthPrevHref}>
                上月
              </Link>
              <Link className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600" href={data.monthNextHref}>
                下月
              </Link>
            </div>
          </div>

          <div className="mt-5 space-y-4 md:hidden">
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">手机端快捷选日期</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                先点日期，再直接往下看当天文案；有内容的日期会显示条数。
              </p>
            </div>
            <div className="grid gap-3">
              {data.mobileDateOptions.length ? (
                data.mobileDateOptions.map((item) => (
                  <Link
                    key={item.isoDate}
                    className={`flex items-center justify-between rounded-[1.25rem] border px-4 py-4 text-sm ${
                      item.active ? "border-amber-300 bg-amber-50 text-slate-950" : "border-slate-200 bg-white text-slate-700"
                    }`}
                    href={item.href}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                      {item.count} 条
                    </span>
                  </Link>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">本月还没有推广文案。</p>
              )}
            </div>
          </div>

          <div className="mt-5 hidden overflow-x-auto md:block">
            <div className="min-w-[34rem] lg:min-w-[42rem]">
              <div className="grid grid-cols-7 rounded-t-[1.25rem] bg-slate-50 text-center text-sm font-medium text-slate-500">
                {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((label) => (
                  <div key={label} className="px-2 py-3">
                    {label}
                  </div>
                ))}
              </div>
              {data.calendarWeeks.map((week, index) => (
                <div key={index} className="grid grid-cols-7">
                  {week.map((day) => {
                    const active = day.isoDate === data.selectedDateLabel;
                    return (
                      <Link
                        key={day.isoDate}
                        className={`min-h-24 border-b border-r border-slate-200 px-2 py-3 lg:px-3 ${
                          active ? "bg-amber-50" : day.isCurrentMonth ? "bg-white" : "bg-slate-50/70"
                        }`}
                        href={`/dashboard/promotion-copies?date=${day.isoDate}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${day.isCurrentMonth ? "text-slate-950" : "text-slate-400"}`}>
                            {day.dayNumber}
                          </span>
                          {day.count > 0 ? (
                            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
                              {day.count}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </article>

        {canManagePromotionCopies(data.session.user.role) ? (
          <ActionFeedbackForm action={createPromotionCopy} successMessage="推广文案已加入日历。">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">新增文案</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                {data.session.user.role === "ADMIN" ? "管理员发布全员文案" : "主管发布团队文案"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                现在已经支持多图上传，文件直接保存到服务器本地；上线时只要保证 `storage/` 目录持久化即可。
              </p>
              <div className="mt-5 space-y-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  defaultValue={data.selectedDateLabel}
                  name="eventDate"
                  type="date"
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  name="title"
                  placeholder="标题，例如：520，今天也要好好爱自己"
                />
                <textarea
                  className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  name="content"
                  placeholder="正文内容，支持 emoji，例如：今天是 520，希望你也别忘了先照顾好自己 ❤️"
                />
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-4">
                  <p className="text-sm font-medium text-slate-800">配图（可选，直接存本地）</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    支持一次上传多张图片；文件会保存到服务器本地 `storage/promotion-copy-images/`。
                  </p>
                  <input
                    accept="image/*"
                    className="mt-3 block w-full text-sm text-slate-600"
                    multiple
                    name="images"
                    type="file"
                  />
                </div>
              </div>
              <button className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                保存到日历
              </button>
            </div>
          </ActionFeedbackForm>
        ) : (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">使用说明</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">销售只需要挑一条，然后生成自己的版本</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              打开某一天后，挑你想发的内容，点“生成我的版本”，系统会做轻微润色；生成后再点复制，就可以直接发朋友圈或别的平台。
            </p>
          </div>
        )}
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">当天文案</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">{data.selectedDateLabel}</h2>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {data.dayCopies.length ? (
            data.dayCopies.map((item) => (
              <PromotionCopyCard
                key={item.id}
                authorName={item.createdBy.name}
                canManage={item.canManage}
                content={item.content}
                defaultDate={item.eventDate.toISOString().slice(0, 10)}
                imageAssets={item.imageAssets}
                promotionCopyId={item.id}
                title={item.title}
                visibilityLabel={item.scope === "global" ? "全员可见" : "团队文案"}
              />
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
              这一天还没有文案。你可以换个日期看看，或者由主管 / 管理员先补进去。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
