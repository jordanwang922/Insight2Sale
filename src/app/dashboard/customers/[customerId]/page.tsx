import { addFollowUpNote } from "@/server/actions/customer";
import { createAppointment } from "@/server/actions/appointments";
import { updateCustomerStatus } from "@/server/actions/statuses";
import {
  importPersonaLibraryToOpeningStyle,
  savePersonaProfile,
  submitTemplateSnippet,
} from "@/server/actions/templates";
import { getCustomerWorkspace } from "@/features/crm/queries";
import { RadarChartCard } from "@/components/charts/radar-chart-card";
import { DimensionAnalysisGrid } from "@/components/assessment/dimension-analysis-grid";
import { generateWorkspaceAiOutput } from "@/features/crm/ai";
import { parseJson } from "@/lib/utils";

function formatMaybeList(value?: string | null) {
  if (!value) return "未填写";
  const parsed = parseJson<string[] | string>(value, value);
  return Array.isArray(parsed) ? parsed.join(" / ") : parsed;
}

export default async function CustomerWorkspacePage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const data = await getCustomerWorkspace(customerId);
  if (!data) return null;

  const report = data.reportData;
  const aiOutput = report
    ? await generateWorkspaceAiOutput({
        customerName: data.customer.wechatNickname,
        coreProblem: data.customer.coreProblem ?? "",
        parentingRole: data.customer.parentingRole ?? "",
        parentType: report.parentType.name,
        report,
        knowledge: data.knowledge,
        sharedTemplates: data.templates.map((item) => ({
          title: item.title,
          content: item.content,
          applicableDimension: item.applicableDimension,
          applicableStage: item.applicableStage,
        })),
      })
    : null;

  const latestAppointments = data.customer.appointments.slice(0, 6);
  const latestTransitions = data.customer.statusTransitions.slice(0, 6);
  const supplementalBySection = new Map<string, typeof data.customer.supplementalScripts>();
  for (const item of data.customer.supplementalScripts) {
    const bucket = supplementalBySection.get(item.sectionKey) ?? [];
    bucket.push(item);
    supplementalBySection.set(item.sectionKey, bucket);
  }

  const sopSections = aiOutput?.sopSteps?.length
    ? aiOutput.sopSteps.map((step, index) => ({
        key: `sop-${index + 1}`,
        title: step.title,
        content: step.content,
      }))
    : [
        {
          key: "open",
          title: "1. 开场建立信任",
          content:
            "先说明今天是一起看报告，不做评判，重点是帮家长看清楚孩子当下卡点、家庭支持方式，以及下一步更稳的方向。",
        },
      ];
  const openingPersonaText =
    data.persona?.openingStyle ||
    `${data.persona?.displayTitle ?? "帆书家庭教育顾问"}您好，今天我们一起看这份测评结果。重点不是评判谁做得好不好，而是帮您看清楚孩子现在卡在哪里，以及接下来怎么走会更稳。`;

  const customerFacts = [
    ["微信昵称", data.customer.wechatNickname],
    ["手机号", data.customer.phone ?? "未填写"],
    ["会员情况", data.customer.memberStatus ?? "未填写"],
    ["性别", data.customer.gender ?? "未填写"],
    ["年龄段", data.customer.ageRange ?? "未填写"],
    ["学历", data.customer.education ?? "未填写"],
    ["孩子数量", data.customer.childrenCount ?? "未填写"],
    ["孩子年龄段", formatMaybeList(data.customer.childAgeRanges)],
    ["育儿决策人数", data.customer.decisionMakerCount ?? "未填写"],
    ["日常照顾者", data.customer.primaryCaretaker ?? "未填写"],
    ["养育角色", data.customer.parentingRole ?? "未填写"],
    ["职业类别", data.customer.occupationCategory ?? "未填写"],
    ["职业描述", data.customer.occupationDetail ?? "未填写"],
    ["所在城市", data.customer.ipLocation ?? "未填写"],
    ["来源", data.customer.source ?? "未填写"],
    ["当前状态", data.customer.currentStatus?.name ?? "未填写"],
    ["核心难题", data.customer.coreProblem ?? "未填写"],
    ["核心担心", data.customer.coreConcern ?? "未填写"],
    ["尝试做法", data.customer.attemptedActions ?? "未填写"],
    ["尝试效果", data.customer.attemptedOutcome ?? "未填写"],
    ["希望支持", formatMaybeList(data.customer.desiredSupport)],
  ];

  const knowledgeSections: Array<{
    title: string;
    items: Array<{ id: string; title: string; content: string; score: number }>;
  }> = [
    { title: "测评解读库", items: data.knowledge.interpretation },
    { title: "课程体系库", items: data.knowledge.courses },
    { title: "专家话术库", items: data.knowledge.scripts },
    { title: "案例库", items: data.knowledge.cases },
    { title: "禁用表达库", items: data.knowledge.forbidden },
    { title: "关键词与风格库", items: data.knowledge.style },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">通话模式</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">一边通话，一边按步骤推进</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              当前建议先从
              <span className="mx-1 font-semibold text-slate-950">
                {aiOutput?.callMode.focusDimension ?? report?.salesSummary?.weakestDimension ?? "关键维度"}
              </span>
              切入。风险提示是：
              <span className="mx-1 font-semibold text-slate-950">
                {aiOutput?.callMode.riskSignal ?? report?.salesSummary?.riskSignal ?? "待系统计算"}
              </span>
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {aiOutput?.callMode.summary ?? report?.matchAnalysis ?? "待生成客户解读摘要。"}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
            <p className="text-lg font-semibold text-slate-950">快速记录建议</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              通话时优先记客户原话、当前阻力、下一步动作，不要只记你的总结。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.4fr_1.05fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">客户完整信息</p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">{data.customer.wechatNickname}</h1>
          <div className="mt-5 grid gap-3">
            {customerFacts.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{value}</p>
              </div>
            ))}
          </div>

          <form action={updateCustomerStatus} className="mt-6 space-y-3">
            <input type="hidden" name="customerId" value={data.customer.id} />
            <label className="block text-sm font-medium text-slate-900">
              更新客户状态
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                name="toStatusId"
                defaultValue={data.customer.currentStatusId ?? ""}
              >
                {data.statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="notes"
              placeholder="补充这次状态变更说明"
            />
            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              保存状态
            </button>
          </form>
        </article>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <RadarChartCard title="孩子 6 维度雷达图" color="#10b981" data={data.childRadar} />
            <RadarChartCard title="家长 6 维度雷达图" color="#6366f1" data={data.parentRadar} />
          </div>

          {report ? <DimensionAnalysisGrid dimensions={report.dimensionScores} /> : null}

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                {report?.parentType?.name ?? "待生成"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                总分 {report?.overallScore ?? 0}
              </span>
              {data.customer.assessments[0]?.template ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {data.customer.assessments[0].template.title}
                </span>
              ) : null}
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">
              {report?.salesSummary?.headline ?? "等待测评报告"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {report?.matchAnalysis ?? "当前客户还没有生成完整测评报告，请先完成家长测评或补齐报告数据。"}
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">教育焦虑</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{report?.anxiety?.percent ?? 0}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">养育倦怠</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{report?.burnout?.percent ?? 0}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">教养能力感</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{report?.competence?.percent ?? 0}%</p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">维度解读</p>
            <div className="mt-5 grid gap-4">
              {(aiOutput?.dimensionInterpretations ?? []).length
                ? aiOutput?.dimensionInterpretations.map((dimension) => (
                    <div key={dimension.name} className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-base font-semibold text-slate-950">{dimension.name}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{dimension.childInterpretation}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{dimension.parentInterpretation}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{dimension.gapInterpretation}</p>
                    </div>
                  ))
                : report?.dimensionScores.map((dimension) => (
                    <div key={dimension.name} className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-base font-semibold text-slate-950">{dimension.name}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        孩子得分 {dimension.childPercent}%，家长得分 {dimension.parentPercent}%，差值 {dimension.gap}。
                      </p>
                    </div>
                  ))}
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">SOP 解读台</p>
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-base font-semibold text-slate-950">开场人设</p>
                <textarea
                  form="save-opening-style"
                  className="mt-3 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700"
                  name="openingStyle"
                  defaultValue={openingPersonaText}
                />
                <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                  <form id="save-opening-style" action={savePersonaProfile}>
                    <input type="hidden" name="userId" value={data.customer.ownerId} />
                    <input type="hidden" name="customerId" value={data.customer.id} />
                    <button
                      type="submit"
                      className="w-full whitespace-nowrap rounded-2xl border border-slate-300 px-1.5 py-2.5 text-[11px] font-medium leading-tight text-slate-700 sm:px-2 sm:text-xs"
                    >
                      保存开场人设
                    </button>
                  </form>
                  <form action={importPersonaLibraryToOpeningStyle}>
                    <input type="hidden" name="userId" value={data.customer.ownerId} />
                    <input type="hidden" name="customerId" value={data.customer.id} />
                    <button
                      type="submit"
                      className="w-full whitespace-nowrap rounded-2xl border border-slate-300 px-1.5 py-2.5 text-[11px] font-medium leading-tight text-slate-700 sm:px-2 sm:text-xs"
                    >
                      导入个人文案库
                    </button>
                  </form>
                </div>
              </div>

              {sopSections.map((section) => (
                <div key={section.key} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-base font-semibold text-slate-950">{section.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.content}</p>

                  {supplementalBySection.get(section.key)?.length ? (
                    <div className="mt-4 space-y-3">
                      {(supplementalBySection.get(section.key) ?? []).map((item) => (
                        <div key={item.id} className="rounded-2xl bg-white px-4 py-4">
                          <p className="text-sm font-semibold text-slate-950">
                            {item.author.name} 的补充话术
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{item.content}</p>
                          <p className="mt-2 text-xs text-slate-400">
                            {item.createdAt.toLocaleString("zh-CN")}
                            {item.approvedToTemplate ? " · 已进入高价值模板池" : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <form action={submitTemplateSnippet} className="mt-4 space-y-3">
                    <input type="hidden" name="customerId" value={data.customer.id} />
                    <input type="hidden" name="title" value={`${section.title}补充话术`} />
                    <input type="hidden" name="sectionKey" value={section.key} />
                    <input type="hidden" name="sectionTitle" value={section.title} />
                    <input
                      type="hidden"
                      name="applicableDimension"
                      value={aiOutput?.callMode.focusDimension ?? report?.salesSummary?.weakestDimension ?? ""}
                    />
                    <input
                      type="hidden"
                      name="applicableParentType"
                      value={report?.parentType?.name ?? ""}
                    />
                    <input
                      type="hidden"
                      name="applicableStage"
                      value={data.customer.currentStatus?.name ?? ""}
                    />
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
                      name="content"
                      placeholder="补充你自己更顺手、转化更高的话术。提交后先保存在你自己的补充话术里，主管审核后才会进入共享模板库。"
                    />
                    <button className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
                      补充话术
                    </button>
                  </form>
                </div>
              ))}

              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-base font-semibold text-slate-950">课程挂钩</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  当前推荐由 AI 结合测评结果、RAG 知识库和课程模块逻辑生成，不同家长结果会不同。
                </p>
                <div className="mt-3 space-y-3">
                  {(aiOutput?.courseRecommendations?.length
                    ? aiOutput.courseRecommendations
                    : report?.courseRecommendations ?? []
                  ).map(
                    (item: { module: string; reason: string; talkingPoint: string }) => (
                      <div key={item.module} className="rounded-2xl bg-white px-4 py-4">
                        <p className="font-medium text-slate-950">{item.module}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.reason}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-500">{item.talkingPoint}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">添加跟进记录</p>
          <form action={addFollowUpNote} className="mt-5 space-y-3">
            <input type="hidden" name="customerId" value={data.customer.id} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="channel" defaultValue="电话" />
            <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" name="summary" placeholder="记录这次解读的重点、客户反馈和下一步判断" />
            <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" name="customerQuotes" placeholder="可记录客户原话，便于后续沉淀与分析" />
            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              保存跟进记录
            </button>
          </form>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">安排预约</p>
          <form action={createAppointment} className="mt-5 space-y-3">
            <input type="hidden" name="customerId" value={data.customer.id} />
            <input type="hidden" name="ownerId" value={data.customer.ownerId} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="title" placeholder="例如：1V1 解读 / 直播 / 试听" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="participantName" placeholder="跟谁一起做，例如：快乐女孩" defaultValue={data.customer.wechatNickname} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="kind" placeholder="事项类型，例如：1V1解读 / 直播 / 试听" />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="startAt" type="datetime-local" />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="endAt" type="datetime-local" />
            </div>
            <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" name="notes" placeholder="补充本次预约目的" />
            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              保存预约
            </button>
          </form>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">销售个人文案</p>
          <form action={savePersonaProfile} className="mt-5 space-y-3">
            <input type="hidden" name="userId" value={data.customer.ownerId} />
            <input type="hidden" name="customerId" value={data.customer.id} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="displayTitle" defaultValue={data.persona?.displayTitle ?? ""} placeholder="你的对外身份头衔" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="introHeadline" defaultValue={data.persona?.introHeadline ?? ""} placeholder="你最常用的自我介绍主句" />
            <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" name="expertiseSummary" defaultValue={data.persona?.expertiseSummary ?? ""} placeholder="你擅长解决的问题类型" />
            <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" name="trustSignal" defaultValue={data.persona?.trustSignal ?? ""} placeholder="你的可信背书表达" />
            <textarea className="min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-3" name="openingStyle" defaultValue={data.persona?.openingStyle ?? ""} placeholder="开场语气风格" />
            <textarea className="min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-3" name="inviteStyle" defaultValue={data.persona?.inviteStyle ?? ""} placeholder="邀约风格" />
            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              保存个人文案库
            </button>
          </form>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">最近跟进记录</p>
          <div className="mt-5 space-y-4">
            {data.customer.followUps.length ? (
              data.customer.followUps.map((note) => (
                <div key={note.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium text-slate-950">{note.summary}</p>
                  {note.customerQuotes ? <p className="mt-2 text-sm text-slate-500">客户原话：{note.customerQuotes}</p> : null}
                  <p className="mt-2 text-xs text-slate-400">
                    {note.author.name} · {note.createdAt.toLocaleString("zh-CN")}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                还没有跟进记录，可在左侧立即补充。
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">知识库召回</p>
        <h2 className="mt-4 whitespace-nowrap text-2xl font-semibold text-slate-950">
          基于当前测评结果召回最相关内容
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          系统会根据当前客户的薄弱维度、教养类型、阶段状态和核心问题，从知识库里自动召回最相关的课程、话术与风险提示，辅助销售解读和衔接课程。
        </p>
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {knowledgeSections.map(({ title, items }) => (
            <article key={title} className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">{title}</p>
              <div className="mt-4 space-y-3">
                {items.length ? (
                  items.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                        <span className="whitespace-nowrap text-xs text-slate-400">
                          相关度 {Math.round(item.score * 100)}%
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-500">
                    当前分类下还没有可用知识，建议主管先补充资料。
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">预约历史</p>
          <div className="mt-5 space-y-3">
            {latestAppointments.length ? (
              latestAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-950">{appointment.title}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {appointment.startAt.toLocaleString("zh-CN")} - {appointment.endAt.toLocaleString("zh-CN")}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{appointment.notes ?? "暂无备注"}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有预约记录。</p>
            )}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">状态流转历史</p>
          <div className="mt-5 space-y-3">
            {latestTransitions.length ? (
              latestTransitions.map((transition) => (
                <div key={transition.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {(transition.fromStatus?.name ?? "初始状态")} → {transition.toStatus.name}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{transition.notes ?? "未补充说明"}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {transition.operatorName ?? "系统"} · {transition.createdAt.toLocaleString("zh-CN")}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">当前客户还没有状态流转记录。</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
