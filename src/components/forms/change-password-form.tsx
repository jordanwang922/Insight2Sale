"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { changePassword, type ChangePasswordResult } from "@/server/actions/users";

interface ChangePasswordFormProps {
  /** 已登录时由会话确定用户，无需填用户名 */
  hasSession: boolean;
  /** 未登录时：来自 /password?username= 或本地记住的登录名 */
  prefilledUsername: string;
  /** 仍在使用默认密码，须先改密才能进工作台 */
  forcePasswordChange?: boolean;
}

async function submitChangePassword(
  _prev: ChangePasswordResult | null,
  formData: FormData,
): Promise<ChangePasswordResult> {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  if (password !== confirmPassword) {
    return { ok: false, error: "两次输入的新密码不一致。" };
  }
  return changePassword(formData);
}

export function ChangePasswordForm({
  hasSession,
  prefilledUsername,
  forcePasswordChange = false,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitChangePassword, null);
  const [username, setUsername] = useState(prefilledUsername);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fromProp = prefilledUsername.trim().toLowerCase();
    if (fromProp) setUsername(fromProp);
  }, [prefilledUsername]);

  useEffect(() => {
    if (hasSession || username.trim()) return;
    try {
      const raw = window.localStorage.getItem("insight2sale:login");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { username?: string };
      const u = String(parsed.username ?? "").trim().toLowerCase();
      if (u) setUsername(u);
    } catch {
      window.localStorage.removeItem("insight2sale:login");
    }
  }, [hasSession, username]);

  useEffect(() => {
    if (!state?.ok || !hasSession) return;
    router.replace("/dashboard");
    router.refresh();
  }, [state?.ok, hasSession, router]);

  const needUsernameField = !hasSession && !username.trim();

  return (
    <form action={formAction} className="mt-6 space-y-3">
      {!hasSession ? (
        needUsernameField ? (
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            name="username"
            placeholder="用户名，例如：zhoulan"
            type="text"
            required
            autoComplete="username"
          />
        ) : (
          <>
            <input type="hidden" name="username" value={username} />
            <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              将修改用户 <span className="font-semibold text-slate-900">{username}</span> 的密码
            </p>
          </>
        )
      ) : null}

      <div className="flex min-h-[48px] items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <input
          className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-4 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 md:pr-2"
          name="currentPassword"
          placeholder="当前密码"
          type={showCurrent ? "text" : "password"}
          required
          autoComplete="current-password"
        />
        <button
          type="button"
          className="hidden shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 px-3 text-slate-600 md:flex [-webkit-tap-highlight-color:transparent] active:bg-slate-100"
          onClick={() => setShowCurrent((v) => !v)}
          aria-label={showCurrent ? "隐藏当前密码" : "显示当前密码"}
        >
          {showCurrent ? (
            <Eye className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          ) : (
            <EyeOff className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>

      <div className="flex min-h-[48px] items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <input
          className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-4 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 md:pr-2"
          name="password"
          placeholder="输入新密码"
          type={showNew ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="hidden shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 px-3 text-slate-600 md:flex [-webkit-tap-highlight-color:transparent] active:bg-slate-100"
          onClick={() => setShowNew((v) => !v)}
          aria-label={showNew ? "隐藏新密码" : "显示新密码"}
        >
          {showNew ? (
            <Eye className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          ) : (
            <EyeOff className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>

      <div className="flex min-h-[48px] items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <input
          className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-4 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 md:pr-2"
          name="confirmPassword"
          placeholder="再次输入新密码"
          type={showConfirm ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="hidden shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 px-3 text-slate-600 md:flex [-webkit-tap-highlight-color:transparent] active:bg-slate-100"
          onClick={() => setShowConfirm((v) => !v)}
          aria-label={showConfirm ? "隐藏确认密码" : "显示确认密码"}
        >
          {showConfirm ? (
            <Eye className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          ) : (
            <EyeOff className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>

      {state && !state.ok ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      {state?.ok && !hasSession ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          密码已更新。请使用新密码
          <a className="ml-1 font-semibold underline" href="/login">
            登录
          </a>
          。
        </p>
      ) : null}

      {state?.ok && hasSession ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" aria-live="polite">
          密码已更新，正在进入工作台…
        </p>
      ) : null}

      <button
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        disabled={pending || state?.ok}
        type="submit"
      >
        {pending
          ? "保存中…"
          : state?.ok
            ? "已完成"
            : forcePasswordChange && hasSession
              ? "保存新密码并进入工作台"
              : "保存新密码"}
      </button>
    </form>
  );
}
