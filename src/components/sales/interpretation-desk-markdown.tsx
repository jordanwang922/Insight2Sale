"use client";

import type { ReactNode } from "react";
import { INTERPRETATION_DESK_COPY_MARK } from "@/features/sales/interpretation-desk-live-data";
import { InterpretationDeskCopyAssessmentButton } from "@/components/sales/interpretation-desk-copy-button";
import { cn } from "@/lib/utils";

/** 行内 **粗体**（非贪婪、不跨行） */
function renderInlineBold(line: string): ReactNode {
  const segments = line.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((seg, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(seg);
    if (m) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{seg}</span>;
  });
}

function normalizeSpaces(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

/** 三号层级：一、二、三 大节标题 */
export function isInterpretationDeskMajorHeading(line: string): boolean {
  const t = normalizeSpaces(line);
  if (t === "一、准备工作") return true;
  if (t === "二、解读 7 步法") return true;
  return /^三、["\u201c\u201d]禁忌清单["\u201c\u201d]$/.test(t);
}

/** 一号层级：1、2、3、小节 与 第 N 步 */
export function isInterpretationDeskMinorHeading(line: string): boolean {
  const t = line.trim();
  if (/^[123]、/.test(t)) return true;
  return /^第\s*\d+\s*步[：:]/.test(t);
}

function isInterpretationDeskSpotlightLine(line: string): boolean {
  return line.trim() === "解读前，把这张图片发给用户";
}

function isForbiddenBulletLine(line: string): boolean {
  return /^\s*🚫/.test(line);
}

/** 第 7 步顾问提示行：单独成段，上方留白一行感 + 红色加粗 */
function isInterpretationDeskAdvisorStageCueLine(line: string): boolean {
  const t = line.trim();
  if (t === "家长能讲出 123") return true;
  return /^家长沉默\/说[\u201c"]我也不知道该怎么做[\u201d"]$/.test(t);
}

function renderBracketsAndBold(s: string): ReactNode {
  const bits = s.split(/(【[^】]*】)/g);
  return bits.map((bit, j) => {
    const m = /^【([^】]*)】$/.exec(bit);
    if (m) {
      const inner = m[1] ?? "";
      const display = inner.trim() === "" ? "【　　】" : `【${inner}】`;
      return (
        <span key={j} className="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700">
          {display}
        </span>
      );
    }
    return <span key={j}>{renderInlineBold(bit)}</span>;
  });
}

function renderDeskInlineParagraph(block: string, assessmentHref?: string | null): ReactNode {
  const parts = block.split(INTERPRETATION_DESK_COPY_MARK);
  const out: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i > 0) {
      out.push(
        assessmentHref ? (
          <InterpretationDeskCopyAssessmentButton key={`copy-${i}`} assessmentPath={assessmentHref} />
        ) : (
          <span key={`copy-${i}`} className="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">
            ［测评链接未配置］
          </span>
        ),
      );
    }
    out.push(<span key={`seg-${i}`}>{renderBracketsAndBold(part)}</span>);
  });
  return <>{out}</>;
}

/**
 * 解读台模版专用：大节/小节/要点行加粗与字号，正文保持 pre-wrap。
 * @param assessmentHref 主推测评路径，供「复制智慧父母养育测评」按钮使用
 */
export function InterpretationDeskMarkdownBlocks({
  text,
  assessmentHref,
}: {
  text: string;
  assessmentHref?: string | null;
}) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const nodes: ReactNode[] = [];
  let bodyBuf: string[] = [];
  let blockIndex = 0;
  let isFirstHeading = true;

  const flushBody = () => {
    if (bodyBuf.length === 0) return;
    const block = bodyBuf.join("\n").trimEnd();
    bodyBuf = [];
    if (!block.trim()) return;
    nodes.push(
      <p
        key={`body-${blockIndex++}`}
        className="whitespace-pre-wrap text-sm leading-7 text-slate-700"
      >
        {renderDeskInlineParagraph(block, assessmentHref)}
      </p>,
    );
  };

  for (const raw of lines) {
    const t = raw.trim();
    if (t === "") {
      flushBody();
      continue;
    }

    if (isInterpretationDeskMajorHeading(raw)) {
      flushBody();
      nodes.push(
        <p
          key={`maj-${blockIndex++}`}
          className={cn(
            "font-bold text-slate-950",
            "text-lg leading-snug",
            isFirstHeading ? "mt-0" : "mt-8",
          )}
        >
          {normalizeSpaces(raw)}
        </p>,
      );
      isFirstHeading = false;
      continue;
    }

    if (isInterpretationDeskMinorHeading(raw)) {
      flushBody();
      nodes.push(
        <p
          key={`min-${blockIndex++}`}
          className="mt-4 text-base font-bold leading-snug text-slate-900"
        >
          {normalizeSpaces(raw)}
        </p>,
      );
      isFirstHeading = false;
      continue;
    }

    if (isInterpretationDeskSpotlightLine(raw)) {
      flushBody();
      nodes.push(
        <p
          key={`spot-${blockIndex++}`}
          className="mt-4 text-sm font-bold leading-snug text-slate-900"
        >
          {normalizeSpaces(raw)}
        </p>,
      );
      isFirstHeading = false;
      continue;
    }

    if (isForbiddenBulletLine(raw)) {
      flushBody();
      nodes.push(
        <p key={`fb-${blockIndex++}`} className="mt-1 text-sm font-bold leading-7 text-slate-800">
          {raw.trim()}
        </p>,
      );
      isFirstHeading = false;
      continue;
    }

    if (isInterpretationDeskAdvisorStageCueLine(raw)) {
      flushBody();
      nodes.push(
        <p
          key={`cue-${blockIndex++}`}
          className="mt-8 text-sm font-bold leading-7 text-red-600"
        >
          {normalizeSpaces(raw)}
        </p>,
      );
      isFirstHeading = false;
      continue;
    }

    bodyBuf.push(raw);
  }
  flushBody();

  return <div className="flex flex-col gap-1">{nodes}</div>;
}
