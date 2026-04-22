"use client";

import { useMemo, useRef, useState } from "react";
import { submitAssessment } from "@/server/actions/assessment";
import { intakeFields } from "@/features/assessment/intake-fields";
import { coreQuestions, anxietyQuestions, burnoutQuestions, competenceQuestions } from "@/features/assessment/questions";
import { phonePattern } from "@/lib/validation";

const allQuestions = [...coreQuestions, ...anxietyQuestions, ...burnoutQuestions, ...competenceQuestions];

export function AssessmentForm({ templateSlug }: { templateSlug?: string }) {
  const [step, setStep] = useState<"intake" | "questions">("intake");
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [startedAt] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  const progress = useMemo(() => {
    const total = allQuestions.length;
    const answered = Object.keys(selected).length;
    return Math.round((answered / total) * 100);
  }, [selected]);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const completionSeconds = Math.round((Date.now() - startedAt) / 1000);
        formData.set("completionSeconds", String(completionSeconds));
        await submitAssessment(formData);
      }}
      className="space-y-8"
    >
      <input name="templateSlug" type="hidden" value={templateSlug ?? ""} />
      <section className={step === "intake" ? "space-y-5" : "hidden"}>
          {intakeFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  className="min-h-28 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm"
                  name={field.key}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : field.type === "single-select" ? (
                <select
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm"
                  name={field.key}
                  required={field.required}
                  defaultValue=""
                >
                  <option value="" disabled>
                    请选择
                  </option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "multi-select" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {field.options?.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      <input type="checkbox" name={field.key} value={option.value} />
                      {option.label}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm"
                  name={field.key}
                  placeholder={field.placeholder}
                  type={field.type === "phone" ? "tel" : "text"}
                  pattern={field.type === "phone" ? phonePattern.source : undefined}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <button
            className="w-full rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white"
            onClick={(event) => {
              event.preventDefault();
              if (!formRef.current?.reportValidity()) {
                return;
              }
              setStep("questions");
            }}
            type="button"
          >
            继续开始答题
          </button>
        </section>
        <section className={step === "questions" ? "space-y-6" : "hidden"}>
          <div className="rounded-[1.5rem] bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
                答题进度
              </p>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-white/10">
              <div className="h-3 rounded-full bg-amber-400" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {allQuestions.map((question, index) => (
            <article key={question.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">
                    第 {index + 1} 题 · {question.dimension}
                  </p>
                  <h2 className="mt-3 text-lg font-semibold leading-8 text-slate-950">{question.text}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {question.type === "child" ? "孩子" : question.type === "parent" ? "家长" : "指数"}
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {question.options.map((option) => {
                  const checked = selected[question.id] === option.label;
                  return (
                    <label
                      key={option.label}
                      className={`flex cursor-pointer gap-3 rounded-[1.25rem] border px-4 py-4 text-sm transition ${
                        checked
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <input
                        checked={checked}
                        className="mt-1"
                        name={`q_${question.id}`}
                        onChange={() =>
                          setSelected((current) => ({ ...current, [question.id]: option.label }))
                        }
                        type="radio"
                        value={JSON.stringify({ label: option.label, score: option.score })}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </article>
          ))}

          <button
            className="w-full rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white"
            type="submit"
          >
            提交并生成测评报告
          </button>
        </section>
    </form>
  );
}
