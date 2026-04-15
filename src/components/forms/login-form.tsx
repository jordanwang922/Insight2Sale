"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { submitLogin } from "@/server/actions/auth-login";
import { LoginPasswordInput } from "@/components/forms/login-password-input";
import { LoginRememberCheckbox } from "@/components/forms/login-remember-checkbox";
import { LoginRememberUsername } from "@/components/forms/login-remember-username";

const FORM_ID = "login-form";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "登录中..." : "进入系统"}
    </button>
  );
}

function LoginErrorBanner({ message }: { message: string | null }) {
  useEffect(() => {
    if (!message) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("error")) {
      url.searchParams.delete("error");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }
  }, [message]);

  if (!message) return null;
  return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>;
}

type LoginFormProps = {
  errorMessage?: string | null;
};

export function LoginForm({ errorMessage = null }: LoginFormProps) {
  const router = useRouter();

  return (
    <>
    <form id={FORM_ID} className="space-y-4" action={submitLogin}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="username">
          用户名
        </label>
        <LoginRememberUsername />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          密码
        </label>
        <LoginPasswordInput />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
        <LoginRememberCheckbox />
        <a
          className="font-medium text-amber-700"
          href="/password"
          onClick={(e) => {
            e.preventDefault();
            const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
            const u = form?.querySelector<HTMLInputElement>('input[name="username"]')?.value.trim();
            router.push(
              u ? `/password?username=${encodeURIComponent(u.toLowerCase())}` : "/password",
            );
          }}
        >
          修改密码
        </a>
      </div>

      <LoginErrorBanner message={errorMessage} />

      <SubmitButton />
    </form>
    </>
  );
}
