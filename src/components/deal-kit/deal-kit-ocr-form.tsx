"use client";

import { useActionState } from "react";
import { ActionFeedbackForm } from "@/components/forms/action-feedback-form";
import { createDealKitEntry, parseDealKitOcr, type DealKitOcrState } from "@/server/actions/deal-kit";

const initialState: DealKitOcrState = { status: "idle" };

export function DealKitOcrForm({ defaultContributorName }: { defaultContributorName: string }) {
  const [state, formAction, pending] = useActionState(parseDealKitOcr, initialState);

  return (
    <div className="space-y-4">
      <form action={formAction} className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">OCR 导入</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">把群聊截图整理成成交锦囊</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          适合主管或管理员集中整理群里的成交经验。先识别，再人工确认，不会直接自动入库。
        </p>
        <input
          accept="image/*"
          className="mt-5 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          name="image"
          type="file"
        />
        <button
          className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={pending}
        >
          {pending ? "正在识别…" : "开始 OCR 识别"}
        </button>
        {state.message ? (
          <p
            className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
              state.status === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </form>

      {state.status === "success" ? (
        <ActionFeedbackForm action={createDealKitEntry} successMessage="OCR 识别内容已保存为成交锦囊。">
          <input name="sourceType" type="hidden" value="ocr" />
          <input name="rawText" type="hidden" value={state.rawText ?? ""} />
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">识别结果确认</p>
            <div className="mt-5 space-y-3">
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                defaultValue={state.contributorName || defaultContributorName}
                name="contributorName"
                placeholder="贡献人，例如：学习顾问小曼"
              />
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
                defaultValue={state.profileText || ""}
                name="profileText"
                placeholder="用户画像"
              />
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
                defaultValue={state.judgmentText || ""}
                name="judgmentText"
                placeholder="用户判断"
              />
              <textarea
                className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3"
                defaultValue={state.experienceText || ""}
                name="experienceText"
                placeholder="成交经验"
              />
            </div>
            <button className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950">
              确认保存到成交锦囊
            </button>
          </div>
        </ActionFeedbackForm>
      ) : null}
    </div>
  );
}
