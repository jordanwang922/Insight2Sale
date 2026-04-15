"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "insight2sale:login";

/**
 * 仅在客户端把「记住的账号」写入用户名框；不参与表单 action，不阻塞提交。
 */
export function LoginRememberUsername() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw || !ref.current) return;
      const parsed = JSON.parse(raw) as { username?: string };
      const u = String(parsed.username ?? "").trim();
      if (u) ref.current.value = u;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <input
      ref={ref}
      id="username"
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-0 transition focus:border-amber-400"
      name="username"
      type="text"
      autoComplete="username"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      required
    />
  );
}
