import { redirect } from "next/navigation";
import { requireManagerSession } from "@/features/crm/queries";
import { prisma } from "@/lib/prisma";
import { approveSupplementalScript, updateTemplateMetadata } from "@/server/actions/templates";

export default async function TemplatesPage() {
  const session = await requireManagerSession();
  if (!session) {
    redirect("/dashboard");
  }

  const [templates, pendingScripts] = await Promise.all([
    prisma.scriptTemplate.findMany({
      include: {
        author: true,
      },
      orderBy: [{ approvalState: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
    }),
    prisma.supplementalScript.findMany({
      where: {
        author: {
          managerId: session.user.id,
        },
      },
      include: {
        author: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">模板管理</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">共享模板与高价值话术沉淀</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          销售自己的补充话术会先沉淀在客户解读台。只有主管审核勾选后，才会进入共享模板库，供其他销售调用。
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">待审核补充话术</p>
          <div className="mt-5 space-y-4">
            {pendingScripts.length ? (
              pendingScripts.map((script) => (
                <form
                  key={script.id}
                  action={approveSupplementalScript}
                  className="rounded-[1.5rem] bg-slate-50 p-5"
                >
                  <input type="hidden" name="id" value={script.id} />
                  <input type="hidden" name="title" value={`${script.sectionTitle} · ${script.author.name}`} />
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950">{script.sectionTitle}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                        {script.author.name}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                        {script.customer.wechatNickname}
                      </span>
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{script.content}</p>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      name="applicableDimension"
                      placeholder="适用维度，例如：接纳情绪"
                    />
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      name="applicableParentType"
                      placeholder="适用家长类型"
                    />
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      name="applicableStage"
                      placeholder="适用阶段，例如：待预约解读"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <input
                        defaultChecked={script.approvedToTemplate}
                        name="approvedToTemplate"
                        type="checkbox"
                      />
                      勾选后进入高价值模板池
                    </label>
                    <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                      保存审核结果
                    </button>
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                当前没有待审核的销售补充话术。
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">共享模板库</p>
          <div className="mt-5 space-y-4">
            {templates.map((template) => (
              <form
                key={template.id}
                action={updateTemplateMetadata}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
              >
                <input name="id" type="hidden" value={template.id} />
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-slate-950">{template.title}</p>
                    <p className="text-sm text-slate-500">
                      {template.author?.name ?? "系统模板"} · {template.category}
                      {template.applicableDimension ? ` · ${template.applicableDimension}` : ""}
                      {template.applicableStage ? ` · ${template.applicableStage}` : ""}
                    </p>
                    <p className="text-sm leading-7 text-slate-700">{template.content}</p>
                  </div>
                  <div className="grid min-w-[260px] gap-3">
                    <select
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      defaultValue={template.approvalState}
                      name="approvalState"
                    >
                      <option value="approved">已启用</option>
                      <option value="pending">待审核</option>
                      <option value="disabled">已停用</option>
                    </select>
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      defaultValue={template.priority}
                      name="priority"
                      type="number"
                    />
                    <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                      保存模板配置
                    </button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
