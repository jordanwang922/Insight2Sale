import Link from "next/link";
import { redirect } from "next/navigation";
import { categoryDescriptions, knowledgeCategories } from "@/features/knowledge/categories";
import { slugFromCategory } from "@/features/knowledge/category-slugs";
import { getKnowledgeOverview, requireManagerSession } from "@/features/crm/queries";
import { KnowledgeIngestForm } from "@/components/knowledge/knowledge-ingest-form";

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

      <section className="grid gap-4">
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

      </section>
    </div>
  );
}
