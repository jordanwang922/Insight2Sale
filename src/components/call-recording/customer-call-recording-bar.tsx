"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

type Phase = "idle" | "recording" | "uploading";

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return types.find((t) => MediaRecorder.isTypeSupported(t));
}

export function CustomerCallRecordingBar({
  customerId,
  customerLabel,
}: {
  customerId: string;
  customerLabel: string;
}) {
  const [desktop, setDesktop] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef<number>(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef<string>("audio/webm");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const stopStreams = useCallback(() => {
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    mediaRef.current = null;
  }, []);

  const handleStop = useCallback(async () => {
    const rec = mediaRef.current;
    if (!rec || rec.state === "inactive") {
      setPhase("idle");
      stopTick();
      return;
    }

    const started = startedAtRef.current;
    const mime = mimeRef.current;
    setPhase("uploading");
    setError(null);
    stopTick();

    if (rec.state === "recording") {
      rec.requestData?.();
    }
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    stopStreams();

    const blob = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];
    const ended = Date.now();
    const durationSeconds = Math.max(1, Math.round((ended - started) / 1000));

    try {
      const form = new FormData();
      form.append("audio", blob, `call-${customerId}.webm`);
      form.append("customerId", customerId);
      form.append("startedAt", new Date(started).toISOString());
      form.append("endedAt", new Date(ended).toISOString());
      form.append("durationSeconds", String(durationSeconds));

      const res = await fetch("/api/call-recordings", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "上传失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setPhase("idle");
      setSeconds(0);
    }
  }, [customerId, stopTick, stopStreams]);

  const handleStart = useCallback(async () => {
    setError(null);
    if (!desktop || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("请在电脑浏览器（宽度≥1024px）使用并允许麦克风。");
      return;
    }

    const mime = pickMime();
    if (!mime) {
      setError("当前浏览器不支持录音。");
      return;
    }
    mimeRef.current = mime;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      startedAtRef.current = Date.now();
      rec.start(1000);
      setPhase("recording");
      setSeconds(0);
      stopTick();
      tickRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch {
      setError("无法访问麦克风，请检查权限。");
    }
  }, [desktop, stopTick]);

  useEffect(() => {
    return () => {
      stopTick();
      stopStreams();
    };
  }, [stopTick, stopStreams]);

  if (!desktop) {
    return (
      <div className="shrink-0 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-right text-[0.65rem] leading-snug text-slate-500">
        录音仅支持电脑端浏览器（宽屏），请将手机开外放后使用本机麦克风收录双方声音。
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        disabled={phase === "uploading"}
        onClick={() => {
          if (phase === "recording") void handleStop();
          else void handleStart();
        }}
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
          phase === "recording"
            ? "bg-rose-600 text-white hover:bg-rose-700"
            : "bg-amber-500 text-white hover:bg-amber-600"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <Mic className="h-4 w-4 shrink-0" />
        {phase === "uploading" ? "正在上传…" : phase === "recording" ? "停止录音" : "开始录音"}
      </button>
      {phase === "recording" ? (
        <p className="text-[0.65rem] text-rose-600">
          录制中 {seconds}s · {customerLabel}
        </p>
      ) : (
        <p className="max-w-[14rem] text-right text-[0.65rem] text-slate-500">
          外放通话收录双方声音；停止后由豆包语音转写 + 方舟豆包生成纪要（见环境变量说明）。
        </p>
      )}
      {error ? <p className="max-w-[14rem] text-right text-[0.65rem] text-rose-600">{error}</p> : null}
    </div>
  );
}
