import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  async function loginAction(
    _: { error?: string },
    formData: FormData,
  ): Promise<{ error?: string }> {
    "use server";

    try {
      await signIn("credentials", {
        username: String(formData.get("username")),
        password: String(formData.get("password")),
        redirectTo: "/dashboard",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return { error: "账号或密码错误，请检查后重试。" };
      }

      throw error;
    }

    return {};
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f8fafc_55%,#e2e8f0_100%)] px-6 py-16">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_40px_120px_rgba(15,23,42,0.12)] backdrop-blur lg:grid-cols-[1.2fr_0.8fr]">
        <section className="bg-slate-950 px-8 py-12 text-white md:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Sales Workspace
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight">
            让销售在一个页面里，看懂客户、说清问题、推进转化。
          </h1>
          <ul className="mt-8 space-y-4 text-sm leading-7 text-slate-300">
            <li>主管演示账号：`tianmanager / demo12345`</li>
            <li>销售演示账号：`zhoulan / demo12345`</li>
            <li>首版支持家长测评、雷达图报告、SOP 解读、状态跟进、模板沉淀。</li>
          </ul>
        </section>
        <section className="px-8 py-12 md:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            登录系统
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">进入工作台</h2>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            使用主管或销售账号登录，查看测评结果、客户状态和团队总览。
          </p>
          <div className="mt-8">
            <LoginForm action={loginAction} />
          </div>
        </section>
      </div>
    </main>
  );
}
