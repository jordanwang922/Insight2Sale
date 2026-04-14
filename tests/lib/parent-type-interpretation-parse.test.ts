import { describe, expect, it } from "vitest";
import { parseParentTypeInterpretationSections } from "@/lib/parent-type-interpretation-parse";

describe("parseParentTypeInterpretationSections", () => {
  it("识别全部 9 段标题（段间仅单换行、无空行）", () => {
    const parts = Array.from({ length: 9 }, (_, i) => `【维度${i + 1}】\n正文${i + 1}`);
    const text = parts.join("\n");
    const out = parseParentTypeInterpretationSections(text);
    expect(out).toHaveLength(9);
    expect(out[0]).toEqual({ title: "维度1", body: "正文1" });
    expect(out[8]).toEqual({ title: "维度9", body: "正文9" });
  });

  it("段间有空行时仍正确", () => {
    const text = "【A】\na1\n\n【B】\nb2";
    const out = parseParentTypeInterpretationSections(text);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ title: "A", body: "a1" });
    expect(out[1]).toEqual({ title: "B", body: "b2" });
  });
});
