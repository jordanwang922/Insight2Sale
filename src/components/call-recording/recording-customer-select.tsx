"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecordingCustomerSelect({
  recordingId,
  value,
  options,
}: {
  recordingId: string;
  value: string | null;
  options: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [v, setV] = useState(value ?? "");

  return (
    <select
      value={v}
      className="max-w-[10rem] rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
      onChange={async (e) => {
        const next = e.target.value;
        setV(next);
        try {
          await fetch(`/api/call-recordings/${recordingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: next || null }),
          });
        } finally {
          router.refresh();
        }
      }}
    >
      <option value="">未关联客户</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
