import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/forms/change-password-form";

export default async function PasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ username?: string; required?: string }>;
}) {
  const session = await auth();
  const query = searchParams ? await searchParams : {};
  const prefilledUsername = String(query.username ?? "")
    .trim()
    .toLowerCase();
  const forcePasswordChange = query.required === "1" || Boolean(session?.user?.mustChangePassword);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f8fafc_55%,#e2e8f0_100%)] px-6 py-16">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Password</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">修改密码</h1>
        {forcePasswordChange ? (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
            <p className="font-semibold">首次登录须修改密码</p>
            <p className="mt-1">
              当前账号仍在使用系统默认密码。请填写<strong>当前密码</strong>并设置<strong>新密码</strong>（至少 8
              位）后，即可进入工作台。
            </p>
          </div>
        ) : null}
        {session?.user ? (
          <p className="mt-4 text-sm leading-7 text-slate-600">
            当前登录用户：{session.user.name}（{session.user.email}）
          </p>
        ) : null}
        <ChangePasswordForm
          hasSession={Boolean(session?.user)}
          prefilledUsername={prefilledUsername}
          forcePasswordChange={forcePasswordChange}
        />
      </div>
    </main>
  );
}
