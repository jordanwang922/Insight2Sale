"use client";

import { useCallback, useMemo, useState } from "react";

/** 解读台：一键复制测评链接 + 可长按复制的文本框 */
export function InterpretationDeskCopyAssessmentButton({
  assessmentPath,
  assessmentAbsoluteUrl,
}: {
  assessmentPath: string;
  assessmentAbsoluteUrl?: string | null;
}) {
  const path = assessmentPath.startsWith("/") ? assessmentPath : `/${assessmentPath}`;

  const displayUrl = useMemo(() => {
    if (assessmentAbsoluteUrl?.trim()) return assessmentAbsoluteUrl.trim();
    if (typeof window !== "undefined") return `${window.location.origin}${path}`;
    return "";
  }, [assessmentAbsoluteUrl, path]);

  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!displayUrl) return;
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("请手动复制测评链接：", displayUrl);
    }
  }, [displayUrl]);

  if (!displayUrl) return null;

  return (
    <span className="inline-flex max-w-full flex-col gap-2 align-baseline">
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex w-fit max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-500/80 bg-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 sm:text-sm"
      >
        {copied ? "已复制到剪贴板" : "复制测评链接"}
      </button>
      <span className="text-[10px] leading-snug text-slate-500 sm:text-xs">
        也可在下方文本框内长按复制
      </span>
      <textarea
        readOnly
        value={displayUrl}
        className="box-border max-h-24 min-h-[3.25rem] w-full min-w-[12rem] max-w-full resize-y rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] leading-snug text-slate-900 sm:min-w-[18rem] sm:text-xs"
        aria-label="测评链接"
      />
    </span>
  );
}
