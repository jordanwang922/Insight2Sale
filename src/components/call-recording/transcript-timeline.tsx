"use client";

import { useCallback, useMemo, useRef } from "react";
import type { TranscriptSegment } from "@/lib/ai/doubao-speech";
import { copyTextToClipboard } from "@/lib/clipboard";

function formatClock(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function hasUsableTiming(segments: TranscriptSegment[]): boolean {
  return segments.some((s) => (s.startMs > 0 || s.endMs > 0) && (s.endMs >= s.startMs || s.startMs > 0));
}

export function TranscriptTimeline({
  recordingId,
  segments,
  fullText,
}: {
  recordingId: string;
  segments: TranscriptSegment[];
  fullText: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const showTimes = useMemo(() => hasUsableTiming(segments), [segments]);

  const onSeek = useCallback((startMs: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(startMs) || startMs <= 0) return;
    el.currentTime = startMs / 1000;
    void el.play().catch(() => {});
  }, []);

  const onCopy = useCallback(async () => {
    const t = fullText.trim();
    if (!t) return;
    await copyTextToClipboard(t);
  }, [fullText]);

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        controls
        className="w-full max-w-xl"
        src={`/api/call-recordings/${recordingId}/audio`}
      >
        您的浏览器不支持音频播放。
      </audio>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCopy}
          disabled={!fullText.trim()}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
        >
          复制全文
        </button>
        {!showTimes ? (
          <span className="text-xs text-slate-500">当前转写无逐句时间戳（如 Whisper 备选），点击句子无法定位。</span>
        ) : (
          <span className="text-xs text-slate-500">点击句子可跳转到对应时间。</span>
        )}
      </div>

      {segments.length ? (
        <ul className="space-y-3 border-l-2 border-amber-200/80 pl-4">
          {segments.map((seg, i) => {
            const range =
              showTimes && (seg.startMs > 0 || seg.endMs > 0)
                ? seg.endMs > seg.startMs
                  ? `${formatClock(seg.startMs)} – ${formatClock(seg.endMs)}`
                  : formatClock(seg.startMs)
                : null;
            const canSeek = showTimes && seg.startMs > 0;

            return (
              <li key={i} className="relative">
                <div className="flex flex-wrap items-baseline gap-2 text-sm leading-7 text-slate-800">
                  {range ? (
                    <button
                      type="button"
                      disabled={!canSeek}
                      onClick={() => onSeek(seg.startMs)}
                      className={`shrink-0 font-mono text-xs tabular-nums ${
                        canSeek
                          ? "cursor-pointer text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
                          : "text-slate-400"
                      }`}
                    >
                      {range}
                    </button>
                  ) : null}
                  {seg.speakerId ? (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                      {seg.speakerId}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 whitespace-pre-wrap">{seg.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">（无分句数据）</p>
      )}
    </div>
  );
}
