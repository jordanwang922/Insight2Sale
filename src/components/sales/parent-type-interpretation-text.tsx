import { parseParentTypeInterpretationSections } from "@/lib/parent-type-interpretation-parse";

/**
 * 家长类型解读正文：每个「【标题】」单独加粗、略大于正文；支持 9 段等任意多段。
 */
export function ParentTypeInterpretationText({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const sections = parseParentTypeInterpretationSections(trimmed);

  if (sections.length > 0) {
    return (
      <div className="space-y-5">
        {sections.map((sec, i) => (
          <section key={`${sec.title}-${i}`} className="min-w-0">
            <p className="text-base font-bold text-slate-950">【{sec.title}】</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{sec.body}</p>
          </section>
        ))}
      </div>
    );
  }

  return (
    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{trimmed}</p>
  );
}
