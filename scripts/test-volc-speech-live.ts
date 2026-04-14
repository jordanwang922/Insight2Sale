/**
 * 本地验证豆包语音极速版是否可用（读 .env，不调仓库外服务）。
 * 用法：node --env-file=.env --import tsx scripts/test-volc-speech-live.ts [音频路径]
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { transcribeWithDoubaoFlash, isDoubaoSpeechAsrConfigured } from "../src/lib/ai/doubao-speech";

async function main() {
  if (!isDoubaoSpeechAsrConfigured()) {
    console.error("FAIL: 请在 .env 中配置 VOLC_SPEECH_APP_KEY 与 VOLC_SPEECH_ACCESS_KEY");
    process.exit(1);
  }

  const sample =
    process.argv[2] ||
    join(process.cwd(), "storage/call-recordings/e766936d-0067-4a71-8cdd-c3606dbfc2aa.webm");

  const buf = await readFile(sample);
  console.log("样本:", sample);
  console.log("大小:", buf.length, "bytes");

  const r = await transcribeWithDoubaoFlash({ buffer: buf, mimeType: "audio/webm" });
  if (!r) {
    console.error("FAIL: 转写返回 null（请查看上方 [doubao-speech] 控制台输出）");
    process.exit(2);
  }

  console.log("");
  console.log("OK — 豆包语音接口已通");
  console.log("--- 全文（前 800 字）---");
  console.log(r.text.length > 800 ? `${r.text.slice(0, 800)}…` : r.text);
  console.log("--- 分句数:", r.segments.length, "---");
  if (r.segments[0]) {
    console.log("首句:", JSON.stringify(r.segments[0]));
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(3);
});
