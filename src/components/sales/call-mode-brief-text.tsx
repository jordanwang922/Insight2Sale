import type { CallModeBriefSegment } from "@/features/crm/call-mode-brief";

export function CallModeBriefText({ segments }: { segments: CallModeBriefSegment[] }) {
  return (
    <p className="text-sm leading-7 text-slate-700">
      {segments.map((s, i) =>
        s.emphasis ? (
          <span key={i} className="font-semibold text-slate-950">
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}
