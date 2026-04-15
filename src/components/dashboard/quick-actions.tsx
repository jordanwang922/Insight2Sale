"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { UserRole } from "@prisma/client";
import { getQuickActions } from "@/features/crm/dashboard";
import { copyTextToClipboardSync } from "@/lib/clipboard";

export function QuickActions({
  role,
  assessmentHref,
  assessmentLabel,
  assessmentAbsoluteUrl,
}: {
  role: UserRole;
  assessmentHref: string;
  assessmentLabel: string;
  assessmentAbsoluteUrl: string;
}) {
  const [originFallback, setOriginFallback] = useState("");
  const [copiedHint, setCopiedHint] = useState(false);

  useEffect(() => {
    if (!assessmentAbsoluteUrl.trim()) {
      setOriginFallback(`${window.location.origin}${assessmentHref}`);
    }
  }, [assessmentAbsoluteUrl, assessmentHref]);

  const fullUrl = assessmentAbsoluteUrl.trim() || originFallback;

  const actions = getQuickActions(role);
  const sharedAssessmentActions = actions.filter((action) =>
    ["assessment-open", "assessment-copy"].includes(action.key),
  );
  const otherActions = actions.filter(
    (action) => !["assessment-open", "assessment-copy"].includes(action.key),
  );

  const runCopy = useCallback(() => {
    if (!fullUrl) return;
    copyTextToClipboardSync(fullUrl);
    setCopiedHint(true);
    window.setTimeout(() => setCopiedHint(false), 2500);
  }, [fullUrl]);

  return (
    <div className="mt-6 space-y-3">
      {/* 网页端：打开 + 复制链接按钮；手机端不显示此行 */}
      <div className="hidden gap-3 md:grid md:grid-cols-2">
        {sharedAssessmentActions.map((action) =>
          action.kind === "copy" ? (
            <button
              key={action.key}
              type="button"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              onClick={runCopy}
            >
              {`复制${assessmentLabel}`}
            </button>
          ) : (
            <Link
              key={action.key}
              href={action.key === "assessment-open" ? assessmentHref : action.href ?? "#"}
              className="rounded-2xl bg-slate-950 px-4 py-4 text-center text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {action.key === "assessment-open" ? `打开${assessmentLabel}` : action.label}
            </Link>
          ),
        )}
      </div>
      {copiedHint ? (
        <p
          role="status"
          className="hidden text-center text-sm text-emerald-700 md:block"
        >
          已尝试复制到剪贴板，可直接粘贴发给客户。
        </p>
      ) : null}

      {/* 仅手机端：长按链接框 */}
      {fullUrl ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 md:hidden">
          <p className="text-xs leading-relaxed text-amber-900/90">
            <span className="font-medium">测评链接：</span>
            长按下面框内链接 → 全选 → 复制后发给客户。
          </p>
          <textarea
            readOnly
            value={fullUrl}
            className="mt-2 box-border min-h-[5.5rem] w-full resize-y rounded-xl border border-amber-200/90 bg-white p-3 font-mono text-[13px] leading-snug text-slate-900"
            aria-label={`${assessmentLabel}链接`}
          />
        </div>
      ) : null}

      <div className="grid gap-3">
        {otherActions.map((action) => (
          <Link
            key={action.key}
            href={action.href ?? "#"}
            className="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-4 text-center text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
