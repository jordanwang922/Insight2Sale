"use client";

import { type ChangeEvent, type FormEvent, type ReactNode, useState } from "react";
import { stripFileExtension } from "@/components/knowledge/sync-title-from-file";

type Props = Omit<React.ComponentProps<"form">, "onSubmit"> & {
  children: ReactNode;
};

/**
 * 知识库「上传并向量化」：拦截提交，用 fetch 显示全屏处理中；
 * API 返回 JSON `{ ok, redirectUrl }`，由浏览器跳转，避免 fetch 跟随 302 拉整页时把 RSC 500 当成上传失败。
 */
export function KnowledgeIngestForm({ children, className, onChange, ...rest }: Props) {
  const [busy, setBusy] = useState(false);

  /** 委托在 form 上，避免子组件 useEffect + closest(form) 在 RSC/客户端边界下未绑到正确表单 */
  function handleFormChange(e: ChangeEvent<HTMLFormElement>) {
    onChange?.(e);
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== "file" || target.name !== "file") return;
    const file = target.files?.[0];
    if (!file) return;
    const titleInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="title"]');
    if (!titleInput) return;
    titleInput.value = stripFileExtension(file.name);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const actionUrl = form.getAttribute("action") ?? "/api/knowledge/ingest";
    setBusy(true);
    try {
      const res = await fetch(actionUrl, {
        method: "POST",
        body: new FormData(form),
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const raw = await res.text();
      let data: { ok?: boolean; redirectUrl?: string; error?: string } | null = null;
      try {
        data = JSON.parse(raw) as { ok?: boolean; redirectUrl?: string; error?: string };
      } catch {
        data = null;
      }

      if (res.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (res.ok && data?.ok === true && typeof data.redirectUrl === "string") {
        window.location.assign(data.redirectUrl);
        return;
      }

      setBusy(false);
      const msg = data?.error?.trim() || raw.slice(0, 400) || `HTTP ${res.status}`;
      window.alert(`上传失败（HTTP ${res.status}）\n${msg}`);
    } catch (err) {
      setBusy(false);
      window.alert(err instanceof Error ? err.message : "网络错误，请重试。");
    }
  }

  return (
    <>
      {busy ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]"
          role="alertdialog"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <p className="text-base font-semibold text-slate-900">正在处理中</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              正在上传并解析文件、切片与向量化，请稍候…
            </p>
            <p className="mt-3 text-xs text-slate-400">大文件或需 OCR 时可能需数分钟，请勿关闭本页</p>
          </div>
        </div>
      ) : null}
      <form {...rest} className={className} onChange={handleFormChange} onSubmit={handleSubmit}>
        {children}
      </form>
    </>
  );
}
