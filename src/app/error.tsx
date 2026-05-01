"use client";

import { useEffect } from "react";

function readableErrorMessage(error: Error & { digest?: string }) {
  const message = error.message?.trim();
  if (message && message !== "An error occurred in the Server Components render.") {
    return message;
  }
  if (error.digest) {
    return `服务器处理失败，错误编号：${error.digest}`;
  }
  return "页面加载失败，请检查输入内容或稍后重试。";
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <section className="w-full max-w-xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-600">页面出错</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">当前页面没有正确加载</h1>
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
          {readableErrorMessage(error)}
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          如果你刚刚提交了表单，请先检查必填项、时间、手机号、账号密码等输入；如果仍然失败，把上面的错误信息发给开发处理。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            重新加载
          </button>
          <a className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700" href="/dashboard">
            返回工作台
          </a>
        </div>
      </section>
    </main>
  );
}
