import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryDescriptions } from "@/features/knowledge/categories";
import { KNOWLEDGE_LIST_ACTION_TEXT_STYLE } from "@/features/knowledge/list-action-button-classes";
import { knowledgeSourceTypeLabel } from "@/features/knowledge/source-type-label";
import { getKnowledgeCategoryPageData, requireManagerSession } from "@/features/crm/queries";
import { ingestKnowledgeDocument } from "@/server/actions/knowledge";
import { cn, parseJson } from "@/lib/utils";
import { DeleteKnowledgeButton } from "@/components/knowledge/delete-knowledge-button";

export default async function KnowledgeCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireManagerSession();
  if (!session) {
    notFound();
  }

  const { slug } = await params;
  const data = await getKnowledgeCategoryPageData(slug);
  if (!data) {
    notFound();
  }

  const { category, documents, templates } = data;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link className="text-amber-700 hover:underline" href="/dashboard/knowledge">
          知识库管理
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-800">{category}</span>
      </nav>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">模块说明</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">{categoryDescriptions[category]}</p>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">在本模块新增知识</p>
        <p className="mt-2 text-sm text-slate-500">支持 PDF、Word 上传或直接粘贴正文；保存后会自动切片并向量化。</p>
        <form action={ingestKnowledgeDocument} className="mt-5 space-y-3">
          <input type="hidden" name="category" value={category} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="title" placeholder="知识标题" required />
          <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="assessmentTemplateId" defaultValue="">
            <option value="">通用于所有测评</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            name="tags"
            placeholder="标签，多个用逗号分隔"
          />
          <textarea
            className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3"
            name="content"
            placeholder="可直接粘贴正文；若只上传文件可留空。"
          />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="file" type="file" accept=".pdf,.docx,.txt,.md" />
          <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" type="submit">
            上传并向量化
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">本模块条目</p>
          <p className="text-sm text-slate-500">共 {documents.length} 条</p>
        </div>

        {documents.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">该模块下还没有知识，请使用上方表单添加。</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {documents.map((doc) => {
              const tags = parseJson<string[]>(doc.tagsJson, []);
              return (
                <li
                  key={doc.id}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">{doc.title}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {knowledgeSourceTypeLabel(doc.sourceType)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          doc.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {doc.enabled ? "已启用" : "已停用"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      上传时间：{doc.createdAt.toLocaleString("zh-CN")} · 最近更新：
                      {doc.updatedAt.toLocaleString("zh-CN")}
                    </p>
                    {doc.fileName ? (
                      <p className="mt-1 text-xs text-slate-500">原始文件：{doc.fileName}</p>
                    ) : null}
                    {doc.assessmentTemplate ? (
                      <p className="mt-2 text-xs text-amber-700">关联测评：{doc.assessmentTemplate.title}</p>
                    ) : null}
                    {tags.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600">{doc.summary ?? doc.rawText.slice(0, 200)}</p>
                  </div>
                  <div className="flex w-full min-w-[7rem] shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:min-w-[7rem]">
                    <Link
                      style={KNOWLEDGE_LIST_ACTION_TEXT_STYLE}
                      className={cn(
                        "box-border inline-flex h-9 w-full min-w-0 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-sans text-slate-800 antialiased hover:bg-slate-50",
                      )}
                      href={`/dashboard/knowledge/document/${doc.id}/edit`}
                    >
                      编辑
                    </Link>
                    <DeleteKnowledgeButton id={doc.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="pb-4">
        <Link className="text-sm font-medium text-amber-700 hover:underline" href="/dashboard/knowledge">
          ← 返回知识库总览
        </Link>
      </div>
    </div>
  );
}
