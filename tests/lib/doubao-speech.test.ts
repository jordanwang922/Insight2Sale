import { describe, expect, it } from "vitest";
import { extractDoubaoAsrText, extractDoubaoUtterances } from "@/lib/ai/doubao-speech";

describe("extractDoubaoAsrText", () => {
  it("解析 result.text", () => {
    expect(extractDoubaoAsrText({ result: { text: " 你好 " } })).toBe("你好");
  });

  it("解析 payload.result.text", () => {
    expect(
      extractDoubaoAsrText({
        payload: { result: { text: "第二路径" } },
      }),
    ).toBe("第二路径");
  });
});

describe("extractDoubaoUtterances", () => {
  it("解析 result.utterances（毫秒 + 说话人）", () => {
    expect(
      extractDoubaoUtterances({
        result: {
          utterances: [
            { start_time: 100, end_time: 1500, text: " 第一句 ", speaker_id: "1" },
            { start_time: 2000, end_time: 3500, text: "第二句", spk_id: "2" },
          ],
        },
      }),
    ).toEqual([
      { startMs: 100, endMs: 1500, text: "第一句", speakerId: "1" },
      { startMs: 2000, endMs: 3500, text: "第二句", speakerId: "2" },
    ]);
  });

  it("兼容字符串时间戳", () => {
    expect(
      extractDoubaoUtterances({
        result: {
          utterances: [{ start_time: "0", end_time: "500", text: "嗨" }],
        },
      }),
    ).toEqual([{ startMs: 0, endMs: 500, text: "嗨" }]);
  });
});
