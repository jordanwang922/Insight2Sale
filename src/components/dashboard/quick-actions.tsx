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

  async function handleCopy() {
    const link = `${window.location.origin}${assessmentHref}`;
    await navigator.clipboard.writeText(link);
    setCopyMessage("已复制测评链接，请发给客户。");
    window.setTimeout(() => setCopyMessage(""), 2400);
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
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {copyMessage}
        </p>
      ) : null}

      <div className="grid gap-3">
        {otherActions.map((action) => (
          <Link
            key={action.key}
            href={action.href ?? "#"}
            className="rounded-2xl bg-slate-950 px-4 py-4 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
