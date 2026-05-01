export type AssessmentReportPracticeSection = {
  title: string;
  text: string;
};

export function AssessmentReportPracticeSections({
  sections,
  variant = "light",
  forSharePng = false,
}: {
  sections: AssessmentReportPracticeSection[];
  variant?: "light" | "dark";
  forSharePng?: boolean;
}) {
  if (!sections.length) return null;

  const isDark = variant === "dark";
  const wrap = isDark
    ? "space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
    : "rounded-[2rem] border border-slate-200 bg-white p-6";
  const title = isDark
    ? forSharePng
      ? "text-sm font-semibold text-amber-200"
      : "text-xs font-semibold text-amber-200"
    : "text-xl font-semibold text-slate-950";
  const card = isDark
    ? "rounded-xl bg-black/20 px-3 py-3"
    : "rounded-2xl bg-slate-50 px-4 py-4";
  const sectionTitle = isDark
    ? "text-sm font-semibold text-white"
    : "text-base font-semibold text-slate-950";
  const body = isDark
    ? "mt-2 whitespace-pre-line text-sm leading-relaxed text-white/90"
    : "mt-2 whitespace-pre-line text-sm leading-7 text-slate-600";

  if (isDark && forSharePng) {
    return (
      <section className={wrap}>
        {sections.map((section) => (
          <article key={section.title} className="space-y-2">
            <h3 className="text-sm font-semibold text-amber-200">{section.title}</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{section.text}</p>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className={wrap}>
      <h2 className={title}>家长类型重点提醒</h2>
      <div className={isDark ? "mt-3 space-y-3" : "mt-4 space-y-3"}>
        {sections.map((section) => (
          <article key={section.title} className={card}>
            <h3 className={sectionTitle}>{section.title}</h3>
            <p className={body}>{section.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
