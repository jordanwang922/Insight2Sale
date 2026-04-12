import { auth } from "@/auth";
import { changePassword } from "@/server/actions/users";

export default async function PasswordPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f8fafc_55%,#e2e8f0_100%)] px-6 py-16">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Password</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">修改密码</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {session?.user
            ? `当前登录用户：${session.user.name}（${session.user.email}）`
            : "可直接输入用户名、当前密码和新密码进行修改。"}
        </p>
        <form action={changePassword} className="mt-6 space-y-3">
          {!session?.user ? (
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              name="username"
              placeholder="用户名，例如：zhoulan"
              type="text"
            />
          ) : null}
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            name="currentPassword"
            placeholder="当前密码"
            type="password"
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            name="password"
            placeholder="输入新密码"
            type="password"
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            name="confirmPassword"
            placeholder="再次输入新密码"
            type="password"
          />
          <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            保存新密码
          </button>
        </form>
      </div>
    </main>
  );
}
