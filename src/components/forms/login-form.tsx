"use client";

import { useActionState, useState } from "react";

interface LoginFormProps {
  action: (state: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
}

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const initialLogin =
    typeof window === "undefined"
      ? { username: "", password: "", remember: false }
      : (() => {
          const stored = window.localStorage.getItem("insight2sale:login");
          if (!stored) return { username: "", password: "", remember: false };
          try {
            const parsed = JSON.parse(stored) as { username?: string; password?: string };
            return {
              username: parsed.username ?? "",
              password: parsed.password ?? "",
              remember: Boolean(parsed.username && parsed.password),
            };
          } catch {
            window.localStorage.removeItem("insight2sale:login");
            return { username: "", password: "", remember: false };
          }
        })();
  const [remember, setRemember] = useState(initialLogin.remember);
  const [username, setUsername] = useState(initialLogin.username);
  const [password, setPassword] = useState(initialLogin.password);

  return (
    <form
      action={(formData) => {
        if (remember) {
          window.localStorage.setItem(
            "insight2sale:login",
            JSON.stringify({
              username: formData.get("username"),
              password: formData.get("password"),
            }),
          );
        } else {
          window.localStorage.removeItem("insight2sale:login");
        }
        return formAction(formData);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="username">
          用户名
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-amber-400"
          id="username"
          name="username"
          type="text"
          placeholder="例如：zhoulan"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          密码
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-amber-400"
          id="password"
          name="password"
          type="password"
          placeholder="demo12345"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
        <label className="inline-flex items-center gap-2">
          <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
          记住登录名和密码
        </label>
        <a className="font-medium text-amber-700" href="/password">
          修改密码
        </a>
      </div>

      {state?.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <button
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "登录中..." : "进入系统"}
      </button>
    </form>
  );
}
