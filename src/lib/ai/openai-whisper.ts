/**
 * OpenAI Whisper 语音转写（备选；需 OPENAI_API_KEY）。
 * 生产环境优先使用豆包语音极速版（见 `doubao-speech.ts`）。
 */
export function isOpenAiWhisperConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function transcribeWithOpenAiWhisper(params: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<{ text: string } | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const form = new FormData();
  const file = new File([new Uint8Array(params.buffer)], params.filename, { type: params.mimeType || "audio/webm" });
  form.append("file", file);
  form.append("model", "whisper-1");
  form.append("language", "zh");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[whisper]", res.status, err);
    return null;
  }

  const data = (await res.json()) as { text?: string };
  const text = typeof data.text === "string" ? data.text.trim() : "";
  return { text };
}
