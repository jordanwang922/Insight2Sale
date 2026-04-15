import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";

function loginErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "CredentialsSignin") return "用户名或密码错误，请重试。";
  return "登录失败，请重试。";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();

  if (session?.user) {
    if (session.user.mustChangePassword) {
      redirect("/password?required=1");
    }
    redirect("/dashboard");
  }

  const query = searchParams ? await searchParams : {};
  const errorMessage = loginErrorMessage(query.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f8fafc_55%,#e2e8f0_100%)] px-6 py-16">
      <div className="grid w-full max-w-5xl rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_40px_120px_rgba(15,23,42,0.12)] backdrop-blur lg:grid-cols-[1.2fr_0.8fr]">
        <section className="bg-slate-950 px-8 py-12 text-white md:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Sales Workspace
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight">
            让销售在一个页面里，看懂客户、说清问题、推进转化。
          </h1>
        </section>
        <section className="px-8 py-12 md:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            登录系统
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">进入工作台</h2>
          <div className="mt-8">
            <LoginForm errorMessage={errorMessage} />
          </div>
        </section>
      </div>
    </main>
  );
}
