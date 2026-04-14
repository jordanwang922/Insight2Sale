import Link from "next/link";
import { redirect } from "next/navigation";
import { categoryDescriptions, knowledgeCategories } from "@/features/knowledge/categories";
import { slugFromCategory } from "@/features/knowledge/category-slugs";
import { getKnowledgeOverview, requireManagerSession } from "@/features/crm/queries";
import { updateKnowledgeDocumentState } from "@/server/actions/knowledge";
import { KnowledgeIngestForm } from "@/components/knowledge/knowledge-ingest-form";
import { parseJson } from "@/lib/utils";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string; error?: string; uploaded?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) {
    redirect("/dashboard");
  }

  const resolved = searchParams ? await searchParams : undefined;
  const data = await getKnowledgeOverview(resolved);
  if (!data) return null;

  let uploadError: string | undefined;
  if (resolved?.error?.trim()) {
    try {
      uploadError = decodeURIComponent(resolved.error);
    } catch {
      uploadError = resolved.error;
    }
  }

  const countMap = new Map(data.categoryCounts.map((item) => [item.category, item._count._all]));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Knowledge RAG</p>
        <h1 className="mt-4 text-3xl font-semibold">主管知识库与语义检索管理</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          把课程、测评解读、话术、案例、禁用表达和风格资料统一沉淀进来。系统会自动切片、向量化，并在解读台按客户测评结果召回最相关内容。
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          使用方式：左侧新增知识，右侧按标题/正文/关键词搜索；“启用”表示这条知识会参与后续召回，“保存”用于确认这条知识是否继续参与系统生成。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {knowledgeCategories.map((category) => {
          const slug = slugFromCategory(category);
          if (!slug) return null;
          return (
            <Link
              key={category}
              href={`/dashboard/knowledge/category/${slug}`}
              className="block rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-950">{category}</p>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  {countMap.get(category) ?? 0} 条
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{categoryDescriptions[category]}</p>
              <p className="mt-4 text-xs font-medium text-amber-700">点击进入本模块 →</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">新增知识</p>
          {uploadError ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{uploadError}</p>
          ) : null}
          {resolved?.uploaded === "1" ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              上传并向量化已完成。
            </p>
          ) : null}
          <KnowledgeIngestForm
            action="/api/knowledge/ingest"
            method="POST"
            encType="multipart/form-data"
            className="mt-5 space-y-3"
          >
            <input type="hidden" name="redirectSuccess" value="/dashboard/knowledge" />
            <input type="hidden" name="redirectError" value="/dashboard/knowledge" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="title" placeholder="知识标题，例如：模块五科学激励核心讲法" />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="category" defaultValue={knowledgeCategories[0]}>
              {knowledgeCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="assessmentTemplateId" defaultValue="">
              <option value="">通用于所有测评</option>
              {data.templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="tags" placeholder="标签，多个标签用逗号分隔，例如：自律,模块五,直播转化" />
            <textarea
              className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="content"
              placeholder="可以直接粘贴 PDF、Word、Excel 提炼后的正文，也可以只上传文件。"
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="file"
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.txt,.md"
            />
            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" type="submit">
              上传并向量化
            </button>
          </KnowledgeIngestForm>
          <p className="mt-4 text-xs leading-6 text-slate-400">
            当前默认向量模型：local-hash-v1。已支持 PDF / Word / Excel（.xlsx、.xls）/ 文本输入；Excel 按工作表导出为 CSV 行再切块向量化。
          </p>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">检索与状态</p>
          <form className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              defaultValue={data.q}
              name="q"
              placeholder="搜索标题、正文或关键术语"
            />
            <select className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={data.category} name="category">
              <option value="">全部分类</option>
              {knowledgeCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
              搜索
            </button>
          </form>

          <div className="mt-6 space-y-4">
            {data.documents.length ? (
              data.documents.map((document) => {
                const tags = parseJson<string[]>(document.tagsJson, []);
                const metadata = parseJson<{ chunkCount?: number; embeddingModel?: string }>(
                  document.metadataJson,
                  {},
                );

                return (
                  <div key={document.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            className="text-lg font-semibold text-slate-950 hover:text-amber-800 hover:underline"
                            href={`/dashboard/knowledge/document/${document.id}/edit`}
                          >
                            {document.title}
                          </Link>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                            {document.category}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                            {document.sourceType}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {document.summary?.trim() ? document.summary : "暂无摘要"}
                        </p>
                        {document.assessmentTemplate ? (
                          <p className="mt-3 text-xs text-amber-700">
                            关联测评：{document.assessmentTemplate.title}
                          </p>
                        ) : null}
                        {tags.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-3 text-xs text-slate-400">
                          切片数：{metadata.chunkCount ?? document.chunks.length} · 向量模型：
                          {metadata.embeddingModel ?? "local-hash-v1"} · 创建人：
                          {document.createdBy?.name ?? "系统"}
                        </p>
                      </div>
                      <form
                        action={updateKnowledgeDocumentState}
                        className="flex shrink-0 flex-row flex-nowrap items-center gap-2 md:gap-3 md:self-start"
                      >
                        <input name="id" type="hidden" value={document.id} />
                        <label className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-slate-600">
                          <input defaultChecked={document.enabled} name="enabled" type="checkbox" />
                          启用
                        </label>
                        <button
                          type="submit"
                          className="shrink-0 whitespace-nowrap rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                        >
                          保存
                        </button>
                      </form>
                    </div>

                    {document.chunks.length ? (
                      <div className="mt-4 grid gap-3">
                        {document.chunks.map((chunk) => (
                          <div key={chunk.id} className="rounded-2xl bg-white px-4 py-4 text-sm leading-7 text-slate-600">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Chunk {chunk.chunkIndex + 1}
                            </p>
                            {chunk.content}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                当前还没有知识条目，先上传一份课程、话术或测评解读资料。
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
