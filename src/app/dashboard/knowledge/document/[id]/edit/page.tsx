import Link from "next/link";
import { notFound } from "next/navigation";
import { knowledgeCategories } from "@/features/knowledge/categories";
import { knowledgeSourceTypeLabel } from "@/features/knowledge/source-type-label";
import { slugFromCategory } from "@/features/knowledge/category-slugs";
import { getKnowledgeDocumentForEdit } from "@/features/crm/queries";
import { updateKnowledgeDocument } from "@/server/actions/knowledge";
import { DeleteKnowledgeButton } from "@/components/knowledge/delete-knowledge-button";
import { parseJson } from "@/lib/utils";

export default async function EditKnowledgeDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getKnowledgeDocumentForEdit(id);
  if (!result) {
    notFound();
  }

  const { document: doc, templates } = result;
  const categorySlug = slugFromCategory(doc.category);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link className="text-amber-700 hover:underline" href="/dashboard/knowledge">
          知识库管理
        </Link>
        {categorySlug ? (
          <>
            <span className="mx-2">/</span>
            <Link className="text-amber-700 hover:underline" href={`/dashboard/knowledge/category/${categorySlug}`}>
              {doc.category}
            </Link>
          </>
        ) : null}
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-800">编辑</span>
      </nav>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">编辑知识条目</p>
        <p className="mt-2 text-sm text-slate-500">
          当前来源类型：{knowledgeSourceTypeLabel(doc.sourceType)}
          {doc.fileName ? ` · 已存文件：${doc.fileName}` : ""} · 创建人：{doc.createdBy?.name ?? "—"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          上传时间 {doc.createdAt.toLocaleString("zh-CN")} · 更新 {doc.updatedAt.toLocaleString("zh-CN")}
        </p>

        <form action={updateKnowledgeDocument} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={doc.id} />
          <div>
            <label className="text-xs font-medium text-slate-600">标题</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="title"
              defaultValue={doc.title}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">所属模块</label>
            <select className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" name="category" defaultValue={doc.category}>
              {knowledgeCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">关联测评（可选）</label>
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="assessmentTemplateId"
              defaultValue={doc.assessmentTemplateId ?? ""}
            >
              <option value="">通用于所有测评</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">标签（逗号分隔）</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="tags"
              defaultValue={parseJson<string[]>(doc.tagsJson, []).join(",")}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="enabled" defaultChecked={doc.enabled} />
            启用（参与 RAG 召回）
          </label>
          <div>
            <label className="text-xs font-medium text-slate-600">正文（可编辑；保存后会重新切片并向量化）</label>
            <textarea
              className="mt-1 min-h-64 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm leading-7"
              name="content"
              defaultValue={doc.rawText}
              placeholder="留空则须在下方选择新文件以更新正文"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">替换文件（可选，PDF / Word / Excel / 文本）</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="file"
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.txt,.md"
            />
            <p className="mt-1 text-xs text-slate-400">若选择新文件，将重新解析正文并覆盖上方正文（含 OCR）。</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white" type="submit">
              保存修改
            </button>
            {categorySlug ? (
              <Link
                className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                href={`/dashboard/knowledge/category/${categorySlug}`}
              >
                取消并返回模块
              </Link>
            ) : (
              <Link
                className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                href="/dashboard/knowledge"
              >
                取消并返回
              </Link>
            )}
          </div>
        </form>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs text-slate-500">危险操作</p>
          <DeleteKnowledgeButton
            id={doc.id}
            redirectTo={categorySlug ? `/dashboard/knowledge/category/${categorySlug}` : "/dashboard/knowledge"}
          />
        </div>
      </section>
    </div>
  );
}
