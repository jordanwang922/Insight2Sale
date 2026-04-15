import type { ReactNode } from "react";
import type { SopRenderPiece } from "@/features/sales/sop-doc-pieces";
import { InterpretationDeskMarkdownBlocks } from "@/components/sales/interpretation-desk-markdown";

function groupConsecutiveImages(pieces: SopRenderPiece[]): Array<SopRenderPiece | SopRenderPiece[]> {
  const out: Array<SopRenderPiece | SopRenderPiece[]> = [];
  let imgRun: Extract<SopRenderPiece, { kind: "image" }>[] = [];

  const flushImages = () => {
    if (!imgRun.length) return;
    out.push(imgRun.length === 1 ? imgRun[0] : [...imgRun]);
    imgRun = [];
  };

  for (const p of pieces) {
    if (p.kind === "image") {
      imgRun.push(p);
    } else {
      flushImages();
      out.push(p);
    }
  }
  flushImages();
  return out;
}

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

/** 与模版一致的轻量 Markdown：## 标题、--- 分隔、段落、行内粗体（段落边界由上游 PDF 换行归一化） */
function SopMarkdownBlocks({ text }: { text: string }) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;

  const blocks = normalized.split(/\n\n+/);
  const nodes: ReactNode[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi].trim();
    if (!block) continue;

    if (/^##\s+/.test(block)) {
      const lines = block.split("\n");
      const first = lines[0].replace(/^##\s+/, "").trim();
      nodes.push(
        <h2 key={`h2-${bi}`} className="mt-6 scroll-mt-4 text-base font-bold text-slate-950 first:mt-0">
          {first}
        </h2>,
      );
      const rest = lines.slice(1).join("\n").trim();
      if (rest) {
        nodes.push(
          <p key={`h2-rest-${bi}`} className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {renderInlineBold(rest)}
          </p>,
        );
      }
      continue;
    }

    if (/^---+\s*$/.test(block)) {
      nodes.push(<hr key={`hr-${bi}`} className="my-5 border-slate-200" />);
      continue;
    }

    nodes.push(
      <p key={`p-${bi}`} className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {renderInlineBold(block)}
      </p>,
    );
  }

  return <div className="space-y-3">{nodes}</div>;
}

/**
 * 解读台插图：限制最大高度以免撑破解读 SOP 卡片；宽度随比例延伸，超宽时横向滚动查看。
 */
const sopDeskFigureClass =
  "block h-auto max-h-[min(40rem,96vh)] w-auto max-w-none shrink-0 rounded-xl border border-slate-200 bg-white object-contain object-left shadow-sm";

const sopDeskScrollWrapClass =
  "w-full max-w-full overflow-x-scroll overflow-y-visible pb-3 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)] [-ms-overflow-style:auto] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100";

function SopTemplateFigureRow({ images }: { images: Extract<SopRenderPiece, { kind: "image" }>[] }) {
  return (
    <div className={sopDeskScrollWrapClass} style={{ WebkitOverflowScrolling: "touch" }}>
      <div className="inline-flex w-max flex-nowrap items-start gap-6">
        {images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${img.src}-${img.alt}`}
            src={img.src}
            alt={img.alt || "解读台插图"}
            className={sopDeskFigureClass}
            decoding="async"
          />
        ))}
      </div>
    </div>
  );
}

function SopTemplateFigureSingle({ img }: { img: Extract<SopRenderPiece, { kind: "image" }> }) {
  return (
    <div className={sopDeskScrollWrapClass} style={{ WebkitOverflowScrolling: "touch" }}>
      <div className="inline-block w-max">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.src}
          alt={img.alt || "解读台插图"}
          className={sopDeskFigureClass}
          decoding="async"
        />
      </div>
    </div>
  );
}

/**
 * 解读台模版：占位【】+ 插图（视口高度、横向滚动）。
 * @param interpretationDesk 为 true 时使用解读台专用标题层级与换行（与 PDF 大节/小节对齐）。
 * @param assessmentHref 主推测评路径（如 `/assessment/xxx`），供解读台内「复制智慧父母养育测评」使用。
 * @param assessmentAbsoluteUrl 完整测评 URL（服务端拼好），供只读链接区 SSR
 */
export function SopDocRichText({
  pieces,
  interpretationDesk = false,
  assessmentHref,
  assessmentAbsoluteUrl,
}: {
  pieces: SopRenderPiece[];
  interpretationDesk?: boolean;
  assessmentHref?: string | null;
  assessmentAbsoluteUrl?: string | null;
}) {
  const grouped = groupConsecutiveImages(pieces);

  return (
    <div className="min-w-0 text-sm leading-7 text-slate-700">
      {grouped.map((block, index) => {
        if (Array.isArray(block)) {
          return (
            <SopTemplateFigureRow
              key={`img-row-${index}`}
              images={block as Extract<SopRenderPiece, { kind: "image" }>[]}
            />
          );
        }

        if (block.kind === "text") {
          return interpretationDesk ? (
            <InterpretationDeskMarkdownBlocks
              key={`t-${index}`}
              text={block.value}
              assessmentHref={assessmentHref}
              assessmentAbsoluteUrl={assessmentAbsoluteUrl}
            />
          ) : (
            <SopMarkdownBlocks key={`t-${index}`} text={block.value} />
          );
        }

        if (block.kind === "literalBracket") {
          return interpretationDesk ? (
            <span key={`lb-${index}`} className="inline align-baseline text-sm leading-7 text-slate-700">
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700">
                【{block.inner}】
              </span>
            </span>
          ) : (
            <p key={`lb-${index}`} className="my-2 text-sm leading-7">
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700">
                【{block.inner}】
              </span>
            </p>
          );
        }

        if (block.kind === "rag") {
          return (
            <div
              key={`rag-${index}`}
              className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-slate-800"
            >
              <p className="text-xs font-medium text-rose-700">【{block.query}】· 知识库召回</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{block.body}</p>
            </div>
          );
        }

        return <SopTemplateFigureSingle key={`img-${index}`} img={block} />;
      })}
    </div>
  );
}
