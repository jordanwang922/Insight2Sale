"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "insight2sale:login";
const FORM_ID = "login-form";

/**
 * 勾选后在 submit 捕获阶段写入 localStorage，不包装 form action。
 */
export function LoginRememberCheckbox() {
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { username?: string; password?: string };
      if (String(parsed.username ?? "").trim() && String(parsed.password ?? "")) {
        setRemember(true);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const form = document.getElementById(FORM_ID);
    if (!form) return;

    const onSubmit = () => {
      if (!remember) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const fd = new FormData(form as HTMLFormElement);
      const username = String(fd.get("username") ?? "").trim();
      const password = String(fd.get("password") ?? "");
      if (username && password) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ username, password }));
      }
    };

    form.addEventListener("submit", onSubmit, { capture: true });
    return () => form.removeEventListener("submit", onSubmit, { capture: true });
  }, [remember]);

  return (
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
      />
      记住登录名和密码
    </label>
  );
}
