import { auth, signOut } from "@/auth";

export async function DashboardTopbar() {
  const session = await auth();

  return (
    <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur md:px-8">
      <p className="text-sm text-slate-500">当前账号</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <h2 className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-semibold text-slate-950">
          <span className="min-w-0">{session?.user.name}</span>
          <span className="inline-flex shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {session?.user.role === "MANAGER" ? "主管" : "销售"}
          </span>
        </h2>
        <form
          className="shrink-0"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            type="submit"
          >
            退出登录
          </button>
        </form>
      </div>
    </header>
  );
}
