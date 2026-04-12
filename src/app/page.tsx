import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,#fde68a_0%,#fff7ed_30%,#f8fafc_60%,#e2e8f0_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between gap-12 px-6 py-16 lg:flex-row lg:items-center lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">
            Parenting Sales CRM
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-slate-950 md:text-7xl">
            用测评建立信任，用 SOP 把转化链路真正跑起来。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            一套同时服务家长、销售和主管的系统。家长完成测评，系统自动评分与生成报告；
            销售在工作台里直接看到雷达图、家长类型、课程挂钩建议和分步解读话术。
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/assessment"
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              打开家长测评端
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-950"
            >
              进入销售后台
            </Link>
          </div>
        </div>

        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {[
            ["双雷达图", "孩子和家长 6 维度得分直观看清"],
            ["分步 SOP", "边通话边看页面，不用切文档"],
            ["课程挂钩", "根据薄弱维度自然连接课程模块"],
            ["主管总览", "预约、到课、试听、付款、退款统一看"],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.18)] backdrop-blur"
            >
              <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
