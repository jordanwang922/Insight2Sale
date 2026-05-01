"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

type ActionFeedbackState =
  | { status: "success"; message: string; nonce: number }
  | { status: "error"; message: string; nonce: number }
  | null;

type ServerFormAction = (formData: FormData) => Promise<void>;

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "保存失败，请检查输入后重试。";
}

export function ActionFeedbackForm({
  action,
  children,
  className,
  successMessage = "保存成功。",
}: {
  action: ServerFormAction;
  children: ReactNode;
  className?: string;
  successMessage?: string;
}) {
  const [visibleState, setVisibleState] = useState<ActionFeedbackState>(null);
  const [state, formAction, pending] = useActionState<ActionFeedbackState, FormData>(
    async (_previous, formData) => {
      try {
        await action(formData);
        return { status: "success", message: successMessage, nonce: Date.now() };
      } catch (error) {
        return { status: "error", message: errorMessage(error), nonce: Date.now() };
      }
    },
    null,
  );

  useEffect(() => {
    if (!state) return;
    setVisibleState(state);
    if (state.status !== "success") return;
    const timer = window.setTimeout(() => setVisibleState(null), 3500);
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <form action={formAction} className={className}>
      <fieldset disabled={pending} className="space-y-3 disabled:opacity-70">
        {children}
      </fieldset>
      {visibleState ? (
        <p
          className={
            visibleState.status === "success"
              ? "mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
          role="status"
        >
          {visibleState.message}
        </p>
      ) : null}
      {pending ? <p className="mt-3 text-sm text-slate-500">正在保存，请不要重复点击。</p> : null}
    </form>
  );
}
