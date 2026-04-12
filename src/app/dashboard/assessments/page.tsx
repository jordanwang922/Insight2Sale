import { redirect } from "next/navigation";
import { createAssessmentTemplate, updateAssessmentTemplate } from "@/server/actions/assessments";
import { getAssessmentManagementData, requireManagerSession } from "@/features/crm/queries";

export default async function AssessmentsPage() {
  const session = await requireManagerSession();
  if (!session) {
    redirect("/dashboard");
  }

  const data = await getAssessmentManagementData();
  if (!data) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Assessments</p>
        <h1 className="mt-4 text-3xl font-semibold">主管测评表管理</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
          可以手工新建测评，也可以上传 PDF / Word 资料让 AI 先生成测评模板草案。被标记为“主推测评”的模板，会直接出现在销售的“打开/复制测评链接”入口中。
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">新增测评表</p>
          <form action={createAssessmentTemplate} className="mt-5 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="title" placeholder="测评名称，例如：智慧父母养育测评" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="shortName" placeholder="短名称，用于销售入口按钮" />
            <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" name="description" placeholder="测评简介和适用场景" />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="sourceType" defaultValue="manual">
              <option value="manual">手工创建</option>
              <option value="ai-upload">AI 生成（上传资料）</option>
              <option value="ai-paste">AI 生成（粘贴资料）</option>
            </select>
            <textarea
              className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="sourceText"
              placeholder="可直接粘贴测评文档原文、评分说明或报告结构；如果留空，也可以只上传文件。"
            />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="file" type="file" accept=".pdf,.docx,.txt,.md" />
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input name="isPrimary" type="checkbox" />
              标记为主推测评
            </label>
            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              保存测评模板
            </button>
          </form>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">已有测评表</p>
          <div className="mt-5 space-y-4">
            {data.templates.map((template) => (
              <form key={template.id} action={updateAssessmentTemplate} className="rounded-[1.5rem] bg-slate-50 p-5">
                <input name="id" type="hidden" value={template.id} />
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-950">{template.title}</p>
                    {template.isPrimary ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        主推测评
                      </span>
                    ) : null}
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                      {template.slug}
                    </span>
                  </div>
                  <input className="rounded-2xl border border-slate-200 px-4 py-3" name="title" defaultValue={template.title} />
                  <input className="rounded-2xl border border-slate-200 px-4 py-3" name="shortName" defaultValue={template.shortName} />
                  <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3" name="description" defaultValue={template.description} />
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <label className="inline-flex items-center gap-2">
                      <input defaultChecked={template.enabled} name="enabled" type="checkbox" />
                      启用
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input defaultChecked={template.isPrimary} name="isPrimary" type="checkbox" />
                      设为主推测评
                    </label>
                    <span>提交数：{template._count.submissions}</span>
                    <span>知识库条目：{template._count.knowledgeDocuments}</span>
                  </div>
                  <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                    保存测评配置
                  </button>
                </div>
              </form>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
