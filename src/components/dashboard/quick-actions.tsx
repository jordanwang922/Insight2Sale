"use client";

import Link from "next/link";
import { useState } from "react";
import type { UserRole } from "@prisma/client";
import { getQuickActions } from "@/features/crm/dashboard";

export function QuickActions({
  role,
  assessmentHref,
  assessmentLabel,
}: {
  role: UserRole;
  assessmentHref: string;
  assessmentLabel: string;
}) {
  const [copyMessage, setCopyMessage] = useState("");
  const actions = getQuickActions(role);
  const sharedAssessmentActions = actions.filter((action) =>
    ["assessment-open", "assessment-copy"].includes(action.key),
  );
  const otherActions = actions.filter(
    (action) => !["assessment-open", "assessment-copy"].includes(action.key),
  );

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // 非 HTTPS 或权限失败时走降级
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

  async function handleCopy() {
    const link = `${window.location.origin}${assessmentHref}`;
    const ok = await copyToClipboard(link);
    setCopyMessage(
      ok ? "已复制测评链接，请发给客户。" : `无法自动复制，请手动复制链接：${link}`,
    );
    window.setTimeout(() => setCopyMessage(""), ok ? 3200 : 8000);
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {sharedAssessmentActions.map((action) =>
          action.kind === "copy" ? (
            <button
              key={action.key}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              onClick={handleCopy}
              type="button"
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

      {copyMessage ? (
        <p
          role="status"
          className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700 shadow-lg md:static md:inset-auto md:bottom-auto md:left-auto md:right-auto md:z-auto md:text-left md:shadow-none"
        >
          {copyMessage}
        </p>
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
