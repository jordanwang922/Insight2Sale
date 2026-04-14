import { addFollowUpNote } from "@/server/actions/customer";
import { createAppointment } from "@/server/actions/appointments";
import { updateCustomerStatus } from "@/server/actions/statuses";
import { savePersonaProfile } from "@/server/actions/templates";
import { getCustomerWorkspace } from "@/features/crm/queries";
import { CustomerWorkspaceRadars } from "@/components/dashboard/customer-workspace-radars";
import { DimensionAnalysisGrid } from "@/components/assessment/dimension-analysis-grid";
import { generateWorkspaceAiOutput } from "@/features/crm/ai";
import { SopDocRichText } from "@/components/sales/sop-doc-rich-text";
import { ParentTypeInterpretationText } from "@/components/sales/parent-type-interpretation-text";
import { CallModeBriefText } from "@/components/sales/call-mode-brief-text";
import { buildWorkspaceCallModeBrief } from "@/features/crm/call-mode-brief";
import { buildInterpretationDeskDisplayPieces } from "@/features/sales/sop-doc-pieces";
import {
  applyInterpretationDeskLiveData,
  buildChildDescriptorForHeartLine,
  formatChildAgeForDesk,
  inferSchoolStageFromChildAgeRanges,
  pickWeakestDimensionNameForDesk,
} from "@/features/sales/interpretation-desk-live-data";
import { buildInterpretationDeskMarkdownForDisplay } from "@/features/sales/interpretation-desk-template";
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

  const kb = data.kbWorkspaceInterpretation;
  const report = data.reportData;
  /** 知识库《解读台模版.pdf》切片；缺省用仓库内从该 PDF 导出的纯文本 */
  const deskChunks = data.knowledge.interpretationDeskTemplate;
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

  const weakestChildDimension =
    report?.dimensionScores?.length
      ? [...report.dimensionScores].sort((a, b) => a.childPercent - b.childPercent)[0]!.name
      : report?.salesSummary?.weakestDimension ?? "关键维度";

  const callModeBrief =
    report != null
      ? await buildWorkspaceCallModeBrief({
          parentTypeName: report.parentType.name,
          assessmentTemplateId: data.customer.assessments[0]?.templateId ?? undefined,
          weakestDimension: weakestChildDimension,
          burnoutPercent: report.burnout.percent,
          coreProblem: data.customer.coreProblem ?? "",
        })
      : null;

  const latestAppointments = data.customer.appointments.slice(0, 6);
  const latestTransitions = data.customer.statusTransitions.slice(0, 6);

  const deskDisplayMarkdown = buildInterpretationDeskMarkdownForDisplay(deskChunks);
  const deskWithLive = applyInterpretationDeskLiveData(deskDisplayMarkdown, {
    consultantName: data.session.user.name ?? data.session.user.email ?? "顾问",
    childAgeDisplay: formatChildAgeForDesk(data.customer.childAgeRanges),
    gradeStageDisplay: inferSchoolStageFromChildAgeRanges(data.customer.childAgeRanges),
    coreConcernDisplay: data.customer.coreProblem ?? "",
    childDescriptorForHeartLine: buildChildDescriptorForHeartLine(data.customer.childAgeRanges),
    weakestDimensionName: pickWeakestDimensionNameForDesk(report),
  });
  const interpretationDeskPieces = await buildInterpretationDeskDisplayPieces(deskWithLive);
  const assessmentHref =
    data.customer.assessments[0]?.template?.slug != null
      ? `/assessment/${data.customer.assessments[0].template.slug}`
      : "/assessment";

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

  /** 窄栏内两列栅格：长文案通栏；职业描述与职业类别并排 */
  function customerFactCellClass(label: string): string {
    if (
      label === "核心难题" ||
      label === "核心担心" ||
      label === "尝试做法" ||
      label === "尝试效果" ||
      label === "希望支持"
    ) {
      return "sm:col-span-2";
    }
    return "";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">通话模式</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">一边通话，一边按步骤推进</h2>
            {report && callModeBrief ? (
              <div className="mt-3">
                <CallModeBriefText segments={callModeBrief.segments} />
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-slate-600">
                完成测评并上传 9 型矩阵解读 Excel 后，此处将结合最弱维与当前类型给出短通话建议。
              </p>
            )}
          </div>
          <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
            <p className="text-lg font-semibold text-slate-950">快速记录建议</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              通话时优先记客户原话、当前阻力、下一步动作，不要只记你的总结。
            </p>
          </div>
        </div>
      </section>

      {/* 左：客户信息吃满剩余宽度；右：双雷达 + 各维度分析整体靠右贴齐，不留右侧空白 */}
      <section className="min-w-0 space-y-4">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch">
          <article className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">客户完整信息</p>
            <h1 className="mt-2 text-lg font-semibold text-slate-950 sm:text-xl">{data.customer.wechatNickname}</h1>
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {customerFacts.map(([label, value]) => (
                <div
                  key={label}
                  className={`min-w-0 rounded-lg bg-slate-50 px-2 py-1.5 ${customerFactCellClass(label)}`}
                >
                  <p className="text-[0.58rem] uppercase tracking-[0.1em] text-slate-400">{label}</p>
                  <p className="mt-0.5 text-xs leading-[1.35] text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            <form action={updateCustomerStatus} className="mt-4 space-y-3">
              <input type="hidden" name="customerId" value={data.customer.id} />
              <label className="block text-sm font-medium text-slate-900">
                更新客户状态
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
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
                className="min-h-20 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                name="notes"
                placeholder="补充这次状态变更说明"
              />
              <button className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                保存状态
              </button>
            </form>
          </article>

          <div className="flex min-h-0 w-full min-w-0 flex-col gap-3 lg:h-full lg:w-[33.8rem] lg:max-w-full lg:shrink-0 lg:justify-self-end">
            <CustomerWorkspaceRadars
              childRadar={data.childRadar}
              parentRadar={data.parentRadar}
              inlineGridClassName="grid min-h-0 flex-1 grid-cols-2 gap-3"
            />
            {report ? (
              <div className="max-h-[min(32rem,50vh)] w-full shrink-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] lg:max-h-none lg:overflow-visible">
                <DimensionAnalysisGrid
                  dimensions={report.dimensionScores}
                  className="p-4 sm:p-5 [&_h2]:text-lg"
                />
              </div>
            ) : null}
          </div>
        </div>

        <article className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">解读SOP</p>
          <div className="mt-4 min-w-0 rounded-2xl border border-slate-200 bg-white px-2 py-3 shadow-sm sm:px-4">
            <SopDocRichText
              interpretationDesk
              assessmentHref={assessmentHref}
              pieces={interpretationDeskPieces}
            />
          </div>
        </article>

        <div className="min-w-0 space-y-4">
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
              {report?.salesSummary?.headline?.trim() ||
                (kb?.parentTypeSnippet
                  ? `${report?.parentType?.name ?? "家长类型"} · 类型解读`
                  : null) ||
                aiOutput?.callMode.headline?.trim() ||
                "等待测评报告"}
            </h2>
            <div className="mt-4 text-sm leading-7 text-slate-600">
              {kb?.parentTypeSnippet?.trim() ? (
                <ParentTypeInterpretationText text={kb.parentTypeSnippet} />
              ) : report?.matchAnalysis?.trim() ? (
                <p className="whitespace-pre-line">{report.matchAnalysis}</p>
              ) : aiOutput?.callMode.extendedBrief?.trim() ? (
                <p className="whitespace-pre-line">{aiOutput.callMode.extendedBrief}</p>
              ) : (
                <p>当前客户还没有生成完整测评报告，请先完成家长测评或补齐报告数据。</p>
              )}
            </div>
            {aiOutput?.callMode.salesHooks?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                {aiOutput.callMode.salesHooks.map((hook, index) => (
                  <li key={index}>{hook}</li>
                ))}
              </ul>
            ) : null}
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

          {report ? (
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-base font-semibold text-slate-950">课程挂钩</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                当前推荐由 AI 结合测评结果、RAG 知识库和课程模块逻辑生成，不同家长结果会不同。
              </p>
              <div className="mt-3 space-y-3">
                {(aiOutput?.courseRecommendations?.length
                  ? aiOutput.courseRecommendations
                  : report?.courseRecommendations ?? []
                ).map((item: { module: string; reason: string; talkingPoint: string }) => (
                  <div key={item.module} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="font-medium text-slate-950">{item.module}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.reason}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{item.talkingPoint}</p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
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
