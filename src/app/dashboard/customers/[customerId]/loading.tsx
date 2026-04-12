export default function CustomerWorkspaceLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Loading</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">正在进行 AI 智能解读</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          正在根据测评结果、RAG 知识库和高价值话术模板生成当前客户的解读建议，请稍等几秒。
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-[2rem] border border-slate-200 bg-white/70"
          />
        ))}
      </section>
    </div>
  );
}
