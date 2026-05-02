"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  disabled = false,
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const [open, setOpen] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setOpen(true);
  }

  function handleConfirm() {
    setOpen(false);
    window.setTimeout(() => submitRef.current?.click(), 0);
  }

  return (
    <>
      <button className={className} disabled={disabled} onClick={handleOpen} type="button">
        {children}
      </button>
      <button
        aria-hidden="true"
        className="hidden"
        disabled={disabled}
        name={name}
        ref={submitRef}
        type="submit"
        value={value}
      />
      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[1.5rem] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
            <h2 className="text-xl font-semibold text-slate-950">是否确认重置密码？</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{confirmMessage}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                onClick={() => setOpen(false)}
                type="button"
              >
                取消
              </button>
              <button
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
                onClick={handleConfirm}
                type="button"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
