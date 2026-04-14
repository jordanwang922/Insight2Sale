"use client";

import { useState } from "react";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * 解读台 SOP 内联：复制主推测评链接（与工作台「复制智慧父母养育测评」同款样式）。
 */
export function InterpretationDeskCopyAssessmentButton({
  assessmentPath,
}: {
  /** 如 `/assessment/xxx`，会拼成绝对 URL 再复制 */
  assessmentPath: string;
}) {
  const [toast, setToast] = useState("");

  async function handleClick() {
    const link = `${window.location.origin}${assessmentPath.startsWith("/") ? assessmentPath : `/${assessmentPath}`}`;
    const ok = await copyToClipboard(link);
    setToast(ok ? "复制成功。请转发给家长" : `无法自动复制，请手动复制：${link}`);
    window.setTimeout(() => setToast(""), ok ? 3200 : 8000);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="mx-0.5 inline-flex max-w-full align-baseline rounded-2xl bg-slate-950 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800 sm:text-sm"
      >
        复制智慧父母养育测评
      </button>
      {toast ? (
        <div
          role="status"
          className="fixed bottom-20 left-4 right-4 z-[60] rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800 shadow-lg md:bottom-8 md:left-auto md:right-8 md:max-w-sm"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
