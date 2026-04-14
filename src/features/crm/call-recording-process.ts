import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { prisma } from "@/lib/prisma";
import { generateDoubaoJson, isDoubaoConfigured } from "@/lib/ai/doubao";
import {
  isDoubaoSpeechAsrConfigured,
  transcribeWithDoubaoFlash,
  type TranscriptSegment,
} from "@/lib/ai/doubao-speech";
import { transcribeWithOpenAiWhisper, isOpenAiWhisperConfigured } from "@/lib/ai/openai-whisper";
import { parseJson } from "@/lib/utils";

function normalizeHighlights(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/** Whisper 无时间戳：按行拆成多段，便于妙记式阅读 */
function segmentsFromWhisperPlainText(text: string): TranscriptSegment[] {
  const t = text.trim();
  if (!t) return [];
  const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.map((line) => ({ startMs: 0, endMs: 0, text: line }));
  }
  return [{ startMs: 0, endMs: 0, text: t }];
}

export async function processCallRecordingAfterUpload(recordingId: string) {
  const row = await prisma.callRecording.findUnique({ where: { id: recordingId } });
  if (!row) return;

  await prisma.callRecording.update({
    where: { id: recordingId },
    data: { processingStatus: "processing", processingError: null },
  });

  let transcript = "";
  let transcriptSegments: TranscriptSegment[] = [];
  let summary = "";
  let highlights: string[] = [];
  let processingError: string | null = null;
  let usedWhisperFallback = false;

  try {
    const buffer = await readFile(join(process.cwd(), row.audioFilePath));

    if (isDoubaoSpeechAsrConfigured()) {
      const tr = await transcribeWithDoubaoFlash({
        buffer,
        mimeType: row.mimeType,
      });
      if (tr?.text) {
        transcript = tr.text;
        transcriptSegments = tr.segments?.length ? tr.segments : [{ startMs: 0, endMs: 0, text: tr.text }];
      } else {
        processingError =
          "豆包语音转写未返回文本。请核对 VOLC_SPEECH_APP_KEY / VOLC_SPEECH_ACCESS_KEY、控制台是否开通「大模型录音文件极速版」，以及音频格式。";
      }
    } else if (isOpenAiWhisperConfigured()) {
      const tr = await transcribeWithOpenAiWhisper({
        buffer,
        filename: basename(row.audioFilePath),
        mimeType: row.mimeType,
      });
      if (tr?.text) {
        transcript = tr.text;
        transcriptSegments = segmentsFromWhisperPlainText(tr.text);
        usedWhisperFallback = true;
      } else {
        processingError = "备选 Whisper 转写失败（可检查额度或音频格式）。";
      }
    } else {
      processingError =
        "未配置语音转写：请配置豆包语音 VOLC_SPEECH_APP_KEY 与 VOLC_SPEECH_ACCESS_KEY（火山引擎豆包语音控制台，见 .env.example）。可选临时配置 OPENAI_API_KEY 作为备选。";
    }

    if (transcript) {
      const summaryPrefix = usedWhisperFallback
        ? "【转写说明：当前使用 OpenAI Whisper 备选；建议配置豆包语音以统一火山引擎链路。】\n\n"
        : "";

      const out = await generateDoubaoJson<{ summary?: string; highlights?: unknown }>({
        system: `你是田老师家庭教育团队的销售质检助手。根据「销售与家长」的电话通话转写，只输出 JSON 对象：
- summary：一段通话纪要（260 字以内，客观、可入库；保留关键事实与家长原意倾向）
- highlights：3～6 条字符串数组，每条为要点短句（每条不超过 48 字）
禁止编造转写中不存在的事实；人名可用「家长」指代若转写未出现姓名。`,
        user: transcript.slice(0, 14000),
        fallback: { summary: "", highlights: [] },
        temperature: 0.25,
        timeoutMs: 120_000,
      });

      const body = typeof out.summary === "string" ? out.summary.trim() : "";
      summary = summaryPrefix + body;

      if (!isDoubaoConfigured()) {
        summary =
          summaryPrefix +
          (body || "（未配置方舟豆包 ARK_*，无法生成结构化纪要；转写正文见上方「转写」区块。）");
      }

      highlights = normalizeHighlights(out.highlights);
    }
  } catch (e) {
    processingError = e instanceof Error ? e.message : "处理失败";
  }

  await prisma.callRecording.update({
    where: { id: recordingId },
    data: {
      transcript,
      transcriptSegmentsJson: JSON.stringify(transcriptSegments),
      summary,
      highlightsJson: JSON.stringify(highlights),
      processingStatus: "done",
      processingError,
    },
  });
}

export function parseHighlightsJson(json: string): string[] {
  return normalizeHighlights(parseJson(json, []));
}

export function parseTranscriptSegmentsJson(json: string): TranscriptSegment[] {
  const raw = parseJson(json, []);
  if (!Array.isArray(raw)) return [];
  const out: TranscriptSegment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const text = typeof o.text === "string" ? o.text.trim() : "";
    if (!text) continue;
    const startMs = typeof o.startMs === "number" ? o.startMs : 0;
    const endMs = typeof o.endMs === "number" ? o.endMs : 0;
    const speakerId = typeof o.speakerId === "string" ? o.speakerId : undefined;
    out.push({ startMs, endMs, text, ...(speakerId ? { speakerId } : {}) });
  }
  return out;
}
