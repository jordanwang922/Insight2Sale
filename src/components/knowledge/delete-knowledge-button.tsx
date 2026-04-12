"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { KNOWLEDGE_LIST_ACTION_TEXT_STYLE } from "@/features/knowledge/list-action-button-classes";
import { deleteKnowledgeDocument } from "@/server/actions/knowledge";
import { cn } from "@/lib/utils";

export function DeleteKnowledgeButton({
  id,
  label = "删除",
  redirectTo,
  className,
}: {
  id: string;
  label?: string;
  /** 删除成功后跳转（例如编辑页删完回到模块列表） */
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      style={KNOWLEDGE_LIST_ACTION_TEXT_STYLE}
      className={cn(
        "appearance-none box-border inline-flex h-9 w-full min-w-0 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-red-200 bg-white px-4 font-sans text-red-600 antialiased hover:bg-red-50 disabled:opacity-50",
        className,
      )}
      onClick={() => {
        if (!confirm("确定删除这条知识？删除后无法恢复。")) return;
        startTransition(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deleteKnowledgeDocument(fd);
          if (redirectTo) {
            router.push(redirectTo);
          } else {
            router.refresh();
          }
        });
      }}
    >
      {isPending ? "删除中…" : label}
    </button>
  );
}
