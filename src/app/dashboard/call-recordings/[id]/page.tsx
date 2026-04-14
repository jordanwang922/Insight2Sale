import Link from "next/link";
import { notFound } from "next/navigation";
import { getCallRecordingDetail } from "@/features/crm/queries";
import { parseHighlightsJson, parseTranscriptSegmentsJson } from "@/features/crm/call-recording-process";
import { TranscriptTimeline } from "@/components/call-recording/transcript-timeline";

export default async function CallRecordingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCallRecordingDetail(id);
  if (!data) notFound();

  const { recording: row } = data;
  const highlights = parseHighlightsJson(row.highlightsJson);
  let segments = parseTranscriptSegmentsJson(row.transcriptSegmentsJson);
  const fullText = row.transcript?.trim() || segments.map((s) => s.text).join("\n");
  if (!segments.length && fullText) {
    segments = [{ startMs: 0, endMs: 0, text: fullText }];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/dashboard/call-recordings" className="font-medium text-amber-700 hover:underline">
          ← 通话管理
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-slate-950">通话录音详情</h1>
        <p className="mt-2 text-sm text-slate-600">
          {row.startedAt.toLocaleString("zh-CN")} · 时长约 {row.durationSeconds ?? "—"} 秒 · 销售 {row.owner.name}{" "}
          · 客户 {row.customer?.wechatNickname ?? "未关联"}
        </p>
      </div>

      {row.processingError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{row.processingError}</div>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">转写（妙记式分句）</h2>
        <div className="mt-3">
          {fullText ? (
            <TranscriptTimeline recordingId={row.id} segments={segments} fullText={fullText} />
          ) : (
            <p className="text-sm text-slate-500">（无转写内容）</p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">通话纪要</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">{row.summary?.trim() || "—"}</p>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">要点</h2>
        {highlights.length ? (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            {highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">—</p>
        )}
      </section>
    </div>
  );
}
