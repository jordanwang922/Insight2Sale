"use client";

import { useMemo, useState } from "react";
import { ActionFeedbackForm } from "@/components/forms/action-feedback-form";
import { CopyButton } from "@/components/common/copy-button";
import {
  markDealKitScriptSuccessful,
  type DealKitScriptState,
} from "@/server/actions/deal-kit";
import type { DealKitSearchResult } from "@/features/deal-kit/queries";

const initialState: DealKitScriptState = { status: "idle" };

export function DealKitSearchPanel({
  query,
  results,
}: {
  query: string;
  results: DealKitSearchResult[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [state, setState] = useState<DealKitScriptState>(initialState);
  const [pending, setPending] = useState(false);

  const selectedResults = useMemo(
    () => results.filter((item) => selectedIds.includes(item.id)),
    [results, selectedIds],
  );

  function toggle(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, id];
    });
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    try {
      const response = await fetch("/api/deal-kits/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          entryIds: selectedIds,
        }),
      });

      const payload = (await response.json()) as DealKitScriptState;
      if (!response.ok) {
        setState({
          status: "error",
          message: payload.message || "生成成交话术失败，请稍后再试。",
        });
        return;
      }

      setState(payload);
    } catch {
      setState({
        status: "error",
        message: "生成成交话术失败，请检查网络后再试。",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <form className="space-y-4" onSubmit={handleGenerate}>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">搜索结果</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">勾选 1 到 3 条经验生成话术</h2>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              已选 {selectedIds.length}/3
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {results.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`block rounded-[1.5rem] border px-4 py-4 transition ${
                    checked ? "border-amber-400 bg-amber-50/70" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      checked={checked}
                      className="mt-1 h-5 w-5 shrink-0"
                      onChange={() => toggle(item.id)}
                      type="checkbox"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">成交经验</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-500">
                          贡献人：{item.contributorName}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-500">
                          助攻 {item.conversionAssistCount}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-800">{item.experienceText}</p>
                      <details className="mt-3 rounded-2xl bg-white/70 px-3 py-3 text-sm text-slate-600">
                        <summary className="cursor-pointer font-medium text-slate-700">展开看用户画像与判断</summary>
                        <p className="mt-3 leading-7">
                          <span className="font-semibold text-slate-900">用户画像：</span>
                          {item.profileText}
                        </p>
                        <p className="mt-2 leading-7">
                          <span className="font-semibold text-slate-900">用户判断：</span>
                          {item.judgmentText}
                        </p>
                      </details>
                      {item.tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <button
            className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={pending || selectedIds.length === 0}
          >
            {pending ? "正在生成…" : "生成成交话术"}
          </button>
          {state.status === "error" ? (
            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.message}</p>
          ) : null}
        </div>
      </form>

      <div className="space-y-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">生成结果</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">可直接照着讲的话术</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            系统会把你勾选的经验融合成一段临场能说的话，优先保留成交推进逻辑，不会大幅改写方向。
          </p>

          <textarea
            className="mt-5 min-h-72 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-800"
            readOnly
            value={state.generatedScript ?? ""}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <CopyButton
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
              copiedLabel="话术已复制"
              label="复制话术"
              text={state.generatedScript ?? ""}
            />
            <ActionFeedbackForm action={markDealKitScriptSuccessful} successMessage="已记录为一次成交助攻。">
              <input name="generationId" type="hidden" value={state.generationId ?? ""} />
              <button
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                disabled={!state.generationId}
              >
                通过这个话术成交
              </button>
            </ActionFeedbackForm>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">当前已选</p>
          <div className="mt-4 space-y-3">
            {selectedResults.length ? (
              selectedResults.map((item, index) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {index + 1}. {item.contributorName}
                  </p>
                  <p className="mt-2 line-clamp-4 leading-7">{item.experienceText}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                先从左侧勾选你想融合的成交经验。
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
