import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagerSession } from "@/features/crm/queries";
import { createStatusDefinition, updateStatusDefinition } from "@/server/actions/statuses";

export default async function StatusSettingsPage() {
  const session = await requireManagerSession();
  if (!session) {
    redirect("/dashboard");
  }

  const statuses = await prisma.statusDefinition.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">新增状态</p>
        <form action={createStatusDefinition} className="mt-5 space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="code" placeholder="状态编码，例如 booked_consult" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="name" placeholder="状态名称" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="color" placeholder="#0ea5e9" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" name="sortOrder" placeholder="排序值" type="number" />
          <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            保存状态
          </button>
        </form>
      </article>

      <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">状态字典</p>
        <div className="mt-6 space-y-4">
          {statuses.map((status) => (
            <form key={status.id} action={updateStatusDefinition} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <input name="id" type="hidden" value={status.id} />
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_140px_120px]">
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  defaultValue={status.name}
                  name="name"
                />
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  defaultValue={status.description ?? ""}
                  name="description"
                  placeholder="状态说明"
                />
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  defaultValue={status.color}
                  name="color"
                />
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  defaultValue={status.sortOrder}
                  name="sortOrder"
                  type="number"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
                  <label className="inline-flex items-center gap-2">
                    <input defaultChecked={status.enabled} name="enabled" type="checkbox" />
                    启用
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input defaultChecked={status.inPrimaryFunnel} name="inPrimaryFunnel" type="checkbox" />
                    主漏斗
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input defaultChecked={status.manualAllowed} name="manualAllowed" type="checkbox" />
                    允许手动流转
                  </label>
                </div>
                <button className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  保存状态配置
                </button>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                <span>编码：{status.code}</span>
              </div>
            </form>
          ))}
        </div>
      </article>
    </div>
  );
}
