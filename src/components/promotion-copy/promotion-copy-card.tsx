"use client";

import { useActionState } from "react";
import { CopyButton } from "@/components/common/copy-button";
import { ActionFeedbackForm } from "@/components/forms/action-feedback-form";
import {
  deletePromotionCopy,
  generatePromotionCopyVariantAction,
  type PromotionVariantState,
  updatePromotionCopy,
} from "@/server/actions/promotion-copy";
import type { PromotionCopyImageAsset } from "@/features/promotion-copy/queries";

const initialState: PromotionVariantState = { status: "idle" };

export function PromotionCopyCard({
  promotionCopyId,
  title,
  content,
  imageAssets,
  authorName,
  visibilityLabel,
  defaultDate,
  canManage,
}: {
  promotionCopyId: string;
  title: string;
  content: string;
  imageAssets: PromotionCopyImageAsset[];
  authorName: string;
  visibilityLabel: string;
  defaultDate: string;
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState(generatePromotionCopyVariantAction, initialState);
  const generatedTitle = state.generatedTitle ?? title;
  const generatedContent = state.generatedContent ?? content;
  const copyPayload = `${generatedTitle}\n\n${generatedContent}`.trim();

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{visibilityLabel}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">发布人：{authorName}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950 sm:text-xl">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{content}</p>

      {imageAssets.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">配图</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {imageAssets.map((asset, index) => (
              <a
                key={`${asset.storedName}-${index}`}
                className="block overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50"
                href={`/api/promotion-copies/images/${promotionCopyId}/${index}`}
                target="_blank"
              >
                <img
                  alt={asset.fileName || `推广文案配图 ${index + 1}`}
                  className="h-36 w-full object-cover"
                  src={`/api/promotion-copies/images/${promotionCopyId}/${index}`}
                />
                <div className="px-3 py-2 text-xs text-slate-600">{asset.fileName || `图片 ${index + 1}`}</div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-[1.25rem] bg-slate-50 px-4 py-4">
        <p className="text-sm font-semibold text-slate-900">生成后的个人版本</p>
        <p className="mt-3 text-sm font-semibold text-slate-950 sm:text-base">{generatedTitle}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{generatedContent}</p>
      </div>

      <form action={formAction} className="mt-4">
        <input name="promotionCopyId" type="hidden" value={promotionCopyId} />
        <button
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={pending}
        >
          {pending ? "正在生成…" : "生成我的版本"}
        </button>
      </form>
      {state.message ? (
        <p
          className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
            state.status === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-3">
        <CopyButton
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
          copiedLabel="文案已复制"
          label="一键复制标题和正文"
          text={copyPayload}
        />
      </div>

      {canManage ? (
        <details className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">编辑 / 删除这条文案</summary>
          <div className="mt-4 space-y-4">
            <ActionFeedbackForm action={updatePromotionCopy} successMessage="推广文案已更新。">
              <input name="id" type="hidden" value={promotionCopyId} />
              <div className="space-y-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  defaultValue={defaultDate}
                  name="eventDate"
                  type="date"
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  defaultValue={title}
                  name="title"
                />
                <textarea
                  className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  defaultValue={content}
                  name="content"
                />
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-4">
                  <p className="text-sm font-medium text-slate-800">替换图片（可选）</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    不上传新图则保留原图；勾选“清空现有图片”则移除当前所有图片。
                  </p>
                  <input
                    accept="image/*"
                    className="mt-3 block w-full text-sm text-slate-600"
                    multiple
                    name="images"
                    type="file"
                  />
                  <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <input name="clearImages" type="checkbox" />
                    清空现有图片
                  </label>
                </div>
              </div>
              <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                保存修改
              </button>
            </ActionFeedbackForm>

            <ActionFeedbackForm action={deletePromotionCopy} successMessage="推广文案已删除。">
              <input name="id" type="hidden" value={promotionCopyId} />
              <button className="w-full rounded-2xl border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-700">
                删除这条文案
              </button>
            </ActionFeedbackForm>
          </div>
        </details>
      ) : null}
    </article>
  );
}
