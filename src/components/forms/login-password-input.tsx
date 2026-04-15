"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "insight2sale:login";

export function LoginPasswordInput() {
  const [password, setPassword] = useState("");
  const [showPlain, setShowPlain] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { password?: string };
      const p = String(parsed.password ?? "");
      if (p) setPassword(p);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <div className="space-y-1">
      <div className="flex min-h-[48px] items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <input
          id="password"
          className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-4 pr-4 text-base text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-0 md:pr-2"
          name="password"
          type={showPlain ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* 仅桌面端：小眼睛；手机端不展示（微信等环境交互不可靠） */}
        <button
          type="button"
          className="hidden shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 px-3 text-slate-600 md:flex [-webkit-tap-highlight-color:transparent] active:bg-slate-100"
          onClick={() => setShowPlain((v) => !v)}
          aria-label={showPlain ? "隐藏密码" : "显示密码"}
        >
          {showPlain ? (
            <Eye className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          ) : (
            <EyeOff className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
