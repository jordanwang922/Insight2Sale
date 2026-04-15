"use client";

import { useMemo } from "react";

/** 解读台正文内嵌：仅展示可长按复制的测评链接（不依赖一键复制按钮） */
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

  if (!displayUrl) return null;

  return (
    <span className="inline-flex max-w-full flex-col gap-1.5 align-baseline">
      <span className="text-[10px] leading-snug text-slate-500">测评链接（长按复制）</span>
      <textarea
        readOnly
        value={displayUrl}
        className="box-border max-h-24 min-h-[3.25rem] w-full min-w-[12rem] max-w-full resize-y rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] leading-snug text-slate-900 sm:min-w-[18rem]"
        aria-label="测评链接"
      />
    </span>
  );
}
