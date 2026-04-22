"use client";

import { useCallback, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { AssessmentReport } from "@/features/assessment/types";
import { RadarChartCardDual } from "@/components/charts/radar-chart-card";
import { AssessmentReportCourseBlock } from "@/components/assessment/assessment-report-course-block";
import { AssessmentReportFootnotes } from "@/components/assessment/assessment-report-footnotes";
import { AssessmentReportIndexCards } from "@/components/assessment/assessment-report-index-cards";
import { AssessmentReportParentTypeBlock } from "@/components/assessment/assessment-report-parent-type-block";

type RadarDatum = { dimension: string; score: number; fullMark: number };

export interface AssessmentReportSharePanelProps {
  nickname: string;
  report: AssessmentReport;
  childRadar: RadarDatum[];
  parentRadar: RadarDatum[];
  /** 下载文件名前缀（不含扩展名） */
  fileNameBase?: string;
}

export function AssessmentReportSharePanel({
  nickname,
  report,
  childRadar,
  parentRadar,
  fileNameBase = "智慧父母测评报告",
}: AssessmentReportSharePanelProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadPng = useCallback(async () => {
    const node = captureRef.current;
    if (!node) return;
    setBusy(true);
    setError(null);
    try {
      /** 等布局稳定后再量宽高，避免 foreignObject 截图像素与可视不一致 */
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const rect = node.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(node.scrollHeight));

      const dataUrl = await toPng(node, {
        width,
        height,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0f172a",
        style: {
          width: `${width}px`,
          maxWidth: `${width}px`,
          overflow: "hidden",
          transform: "none",
          marginLeft: "0",
          marginRight: "0",
        },
      });
      const link = document.createElement("a");
      link.download = `${fileNameBase}-${nickname || "家长"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败，请重试或更换浏览器");
    } finally {
      setBusy(false);
    }
  }, [fileNameBase, nickname]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void downloadPng()}
          className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-500 disabled:opacity-60"
        >
          {busy ? "正在生成图片…" : "保存分享长图（PNG）"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        下方长图按常见手机屏宽（约 390px）排版，字号偏大便于保存后在微信里满屏阅读；可与结果页对照。
      </p>

      {/** 勿包 overflow-x-auto：html-to-image 截长图时易把整图拉成超宽、只露右侧一条 */}
      <div className="flex w-full justify-center pb-2">
        <div
          ref={captureRef}
          className="box-border w-full max-w-[min(390px,calc(100vw-1.5rem))] shrink-0 space-y-5 overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 px-4 py-5 text-[16px] leading-relaxed text-white shadow-2xl ring-1 ring-white/10 sm:max-w-[390px]"
          style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
        >
          <header className="border-b border-white/10 pb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/90">
              家长养育能力与孩子成长潜能匹配度
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight">{nickname} · 测评报告</h2>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium">
                家长类型：{report.parentType.name}
              </span>
              <span className="rounded-full bg-amber-400/90 px-3.5 py-1.5 text-sm font-semibold text-slate-900">
                总分 {report.overallScore}
              </span>
            </div>
          </header>

          <AssessmentReportParentTypeBlock forSharePng report={report} variant="dark" />

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <RadarChartCardDual
              title="孩子与家长 · 六维雷达"
              childRadar={childRadar}
              parentRadar={parentRadar}
              compact
              forSharePng
              className="border-white/15 bg-slate-950/90"
            />
          </div>

          <section className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.15em] text-amber-200/85">
              各维度得分（百分制 · Word 分档）
            </p>
            <div className="grid grid-cols-2 gap-2.5 text-sm leading-snug">
              {report.dimensionScores.map((d) => (
                <div key={d.name} className="rounded-xl bg-black/25 px-3 py-2.5">
                  <p className="text-[15px] font-semibold text-amber-100">{d.name}</p>
                  <p className="mt-1.5 text-white/90">
                    孩子 {d.childPercent}%（{d.childWordBand}）· 家长 {d.parentPercent}%（{d.parentWordBand}）
                  </p>
                  <p className="mt-1 text-xs text-white/65">差距 {d.gap}</p>
                </div>
              ))}
            </div>
          </section>

          <AssessmentReportIndexCards forSharePng report={report} variant="dark" />

          <section className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-sm font-semibold text-amber-200">匹配度解读</p>
            <p className="mt-3 text-sm leading-relaxed text-white/92 whitespace-pre-line">{report.matchAnalysis}</p>
          </section>

          <section className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-sm font-semibold text-amber-200">成长建议</p>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/90">
              {report.suggestions.map((s) => (
                <li key={s} className="rounded-lg bg-black/20 px-3 py-2.5">
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <AssessmentReportCourseBlock forSharePng report={report} variant="dark" />
          </div>

          <AssessmentReportFootnotes forSharePng report={report} variant="dark" />

          <footer className="border-t border-white/10 pt-4 text-center text-xs leading-relaxed text-white/55">
            本报告由智慧父母养育测评系统自动生成，具体解读以顾问沟通为准。
          </footer>
        </div>
      </div>
    </div>
  );
}
