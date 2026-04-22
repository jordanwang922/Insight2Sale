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
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0f172a",
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
        下方长图含雷达、各维度分档、三指数、家长类型矩阵、课程建议与 Word 脚注，可与结果页对照。
      </p>

      <div className="overflow-x-auto pb-2">
        <div
          ref={captureRef}
          className="mx-auto w-[min(390px,100%)] shrink-0 space-y-4 rounded-[1.75rem] bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 p-4 text-white shadow-2xl ring-1 ring-white/10"
          style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
        >
          <header className="border-b border-white/10 pb-4 text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-amber-200/90">
              家长养育能力与孩子成长潜能匹配度
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">{nickname} · 测评报告</h2>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                家长类型：{report.parentType.name}
              </span>
              <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-slate-900">
                总分 {report.overallScore}
              </span>
            </div>
          </header>

          <AssessmentReportParentTypeBlock report={report} variant="dark" />

          <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <RadarChartCardDual
              title="孩子与家长 · 六维雷达"
              childRadar={childRadar}
              parentRadar={parentRadar}
              compact
              className="border-white/15 bg-slate-950/90"
            />
          </div>

          <section className="space-y-2 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
              各维度得分（百分制 · Word 分档）
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] leading-snug">
              {report.dimensionScores.map((d) => (
                <div key={d.name} className="rounded-xl bg-black/25 px-2.5 py-2">
                  <p className="font-semibold text-amber-100">{d.name}</p>
                  <p className="mt-1 text-white/85">
                    孩子 {d.childPercent}%（{d.childWordBand}）· 家长 {d.parentPercent}%（{d.parentWordBand}）
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/55">差距 {d.gap}</p>
                </div>
              ))}
            </div>
          </section>

          <AssessmentReportIndexCards report={report} variant="dark" />

          <section className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-xs font-semibold text-amber-200">匹配度解读</p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/90 whitespace-pre-line">{report.matchAnalysis}</p>
          </section>

          <section className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-xs font-semibold text-amber-200">成长建议</p>
            <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-white/88">
              {report.suggestions.map((s) => (
                <li key={s} className="rounded-lg bg-black/20 px-2 py-2">
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <AssessmentReportCourseBlock report={report} variant="dark" />
          </div>

          <AssessmentReportFootnotes report={report} variant="dark" />

          <footer className="border-t border-white/10 pt-3 text-center text-[10px] text-white/45">
            本报告由智慧父母养育测评系统自动生成，具体解读以顾问沟通为准。
          </footer>
        </div>
      </div>
    </div>
  );
}
