import { notFound } from "next/navigation";
import { getCustomerAssessmentReview } from "@/features/crm/queries";

function formatDateTime(date: Date) {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CustomerAssessmentReviewPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const data = await getCustomerAssessmentReview(customerId);

  if (!data) {
    notFound();
  }

  if (!data.submission) {
    return (
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Assessment Review</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            {data.customer.wechatNickname} 暂无可查看的测评表
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            当前客户还没有完成测评提交，解读台里也不会显示“打开用户测评表”的入口。
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Assessment Review</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{data.customer.wechatNickname} 的用户测评表</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          这里展示该客户最近一次提交的完整测评内容，包括基础信息和 45 道题的实际选择结果，便于顾问在解读时逐题核对。
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">
            提交时间：{formatDateTime(data.submission.submittedAt)}
          </span>
          {data.submission.template ? (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">
              测评模板：{data.submission.template.title}
            </span>
          ) : null}
          <span className="rounded-full bg-amber-100 px-4 py-2 text-amber-700">
            总分：{data.submission.totalScore}
          </span>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">基础信息</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.intakeItems.map(({ field, value }) => (
            <article key={field.key} className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{field.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">45 道题作答明细</h2>
        <div className="mt-4 space-y-4">
          {data.reviewQuestions.map((item) => (
            <article key={item.question.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-slate-950 px-3 py-1 font-semibold text-white">第 {item.order} 题</span>
                <span className="rounded-full bg-white px-3 py-1 text-slate-600">{item.question.dimension}</span>
                <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                  {item.question.type === "child"
                    ? "孩子侧"
                    : item.question.type === "parent"
                      ? "家长侧"
                      : "指数题"}
                </span>
                {item.selectedScore != null ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                    选中分值：{item.selectedScore}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-8 text-slate-950">{item.question.text}</h3>
              <div className="mt-4 grid gap-3">
                {item.question.options.map((option) => {
                  const selected = option.label === item.selectedOption;
                  return (
                    <div
                      key={`${item.question.id}-${option.label}`}
                      className={`rounded-2xl border px-4 py-3 text-sm leading-7 ${
                        selected
                          ? "border-violet-300 bg-violet-50 text-slate-950 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 flex-1">{option.label}</p>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {selected ? "用户选择" : `${option.score} 分`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
