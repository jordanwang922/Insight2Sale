"use client";

import { useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";

export function CopyButton({
  text,
  label = "复制",
  copiedLabel = "已复制",
  className = "",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    const result = await copyTextToClipboard(text);
    setStatus(result.ok ? "copied" : "failed");
    window.setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <button
      className={className}
      onClick={() => void handleCopy()}
      type="button"
    >
      {status === "copied" ? copiedLabel : status === "failed" ? "复制失败" : label}
    </button>
  );
}
