import { randomUUID } from "node:crypto";

/**
 * 豆包语音 · 大模型录音文件极速版（本地音频 Base64，无需公网 URL）
 * 对齐「飞书妙记」体验：开启分句 + 时间戳（utterances），可选说话人信息。
 * 文档：https://www.volcengine.com/docs/6561/1631584
 */
const FLASH_RECOGNIZE_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash";

export type TranscriptSegment = {
  /** 起始时间 ms */
  startMs: number;
  /** 结束时间 ms */
  endMs: number;
  text: string;
  /** 说话人 id（若接口返回） */
  speakerId?: string;
};

/** 与 Header `X-Api-App-Key` 对应（控制台「应用 ID / AppKey」） */
export function isDoubaoSpeechAsrConfigured(): boolean {
  return Boolean(process.env.VOLC_SPEECH_APP_KEY?.trim() && process.env.VOLC_SPEECH_ACCESS_KEY?.trim());
}

function mimeToFormat(mime: string): { format: string; codec?: string } {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return { format: "webm", codec: "opus" };
  if (m.includes("wav")) return { format: "wav" };
  if (m.includes("mpeg") || m.includes("mp3")) return { format: "mp3" };
  if (m.includes("mp4") || m.includes("m4a")) return { format: "m4a" };
  return { format: "webm", codec: "opus" };
}

function getResultPayload(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  if (root.result && typeof root.result === "object") return root.result as Record<string, unknown>;
  const payload = root.payload;
  if (payload && typeof payload === "object") {
    const inner = (payload as Record<string, unknown>).result;
    if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  }
  return null;
}

/** 从响应 JSON 中取整段转写（兼容不同嵌套） */
export function extractDoubaoAsrText(data: unknown): string | null {
  const result = getResultPayload(data);
  if (result) {
    const t = result.text;
    if (typeof t === "string" && t.trim()) return t.trim();
  }
  if (data && typeof data === "object") {
    const t = (data as Record<string, unknown>).text;
    if (typeof t === "string" && t.trim()) return t.trim();
  }
  return null;
}

/** 解析豆包返回的 utterances → 妙记分句 */
export function extractDoubaoUtterances(data: unknown): TranscriptSegment[] {
  const result = getResultPayload(data);
  if (!result) return [];
  const raw = result.utterances;
  if (!Array.isArray(raw)) return [];

  const out: TranscriptSegment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const text = typeof o.text === "string" ? o.text.trim() : "";
    if (!text) continue;
    const startRaw = o.start_time ?? o.startTime;
    const endRaw = o.end_time ?? o.endTime;
    const startMs =
      typeof startRaw === "number"
        ? startRaw
        : typeof startRaw === "string"
          ? parseInt(startRaw, 10)
          : 0;
    const endMs =
      typeof endRaw === "number" ? endRaw : typeof endRaw === "string" ? parseInt(endRaw, 10) : startMs;
    const speakerRaw = o.speaker_id ?? o.speakerId ?? o.spk_id;
    const speakerId =
      typeof speakerRaw === "string" || typeof speakerRaw === "number" ? String(speakerRaw) : undefined;
    out.push({
      startMs: Number.isFinite(startMs) ? startMs : 0,
      endMs: Number.isFinite(endMs) ? endMs : 0,
      text,
      ...(speakerId ? { speakerId } : {}),
    });
  }
  return out;
}

/**
 * 使用豆包语音极速版将本地音频转为文字 + 分句时间轴。
 */
export async function transcribeWithDoubaoFlash(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<{ text: string; segments: TranscriptSegment[] } | null> {
  const appKey = process.env.VOLC_SPEECH_APP_KEY?.trim();
  const accessKey = process.env.VOLC_SPEECH_ACCESS_KEY?.trim();
  const resourceId = process.env.VOLC_SPEECH_RESOURCE_ID?.trim() || "volc.bigasr.auc_turbo";

  if (!appKey || !accessKey) return null;

  const { format, codec } = mimeToFormat(params.mimeType);
  const dataB64 = params.buffer.toString("base64");

  const body: Record<string, unknown> = {
    user: { uid: "insight2sale" },
    audio: {
      format,
      data: dataB64,
      ...(codec ? { codec } : {}),
    },
    request: {
      model_name: "bigmodel",
      enable_itn: true,
      enable_punc: true,
      show_utterances: true,
      /** 说话人区分（若控制台/资源支持；不支持时服务端会忽略） */
      enable_speaker_info: true,
    },
  };

  const res = await fetch(FLASH_RECOGNIZE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-App-Key": appKey,
      "X-Api-Access-Key": accessKey,
      "X-Api-Resource-Id": resourceId,
      "X-Api-Request-Id": randomUUID(),
      "X-Api-Sequence": "-1",
    },
    body: JSON.stringify(body),
  });

  const statusCode = res.headers.get("x-api-status-code") ?? res.headers.get("X-Api-Status-Code");
  const raw = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[doubao-speech] 响应非 JSON", res.status, raw.slice(0, 400));
    return null;
  }

  if (statusCode && statusCode !== "20000000" && statusCode !== "0") {
    console.error("[doubao-speech] 业务状态", statusCode, raw.slice(0, 600));
  }

  if (!res.ok) {
    console.error("[doubao-speech] HTTP", res.status, raw.slice(0, 600));
    return null;
  }

  const text = extractDoubaoAsrText(parsed);
  if (!text) {
    console.error("[doubao-speech] 未解析到文本", raw.slice(0, 800));
    return null;
  }

  let segments = extractDoubaoUtterances(parsed);
  if (!segments.length) {
    segments = [{ startMs: 0, endMs: 0, text }];
  }

  return { text, segments };
}
