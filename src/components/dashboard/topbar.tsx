import { auth, signOut } from "@/auth";

export async function DashboardTopbar() {
  const session = await auth();

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
      <div>
        <p className="text-sm text-slate-500">当前账号</p>
        <h2 className="text-lg font-semibold text-slate-950">
          {session?.user.name}
          <span className="ml-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {session?.user.role === "MANAGER" ? "主管" : "销售"}
          </span>
        </h2>
      </div>
      <form
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
    </header>
  );
}
