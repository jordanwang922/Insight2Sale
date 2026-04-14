import { describe, expect, it } from "vitest";
import { buildCallModeBriefSegments } from "@/features/crm/call-mode-brief";

describe("buildCallModeBriefSegments", () => {
  it("矩阵有风险/提醒时第二句用矩阵，第三句用提醒", () => {
    const segs = buildCallModeBriefSegments({
      weakestDimension: "接纳情绪",
      parentTypeName: "温情弹性型",
      matrixRisk: "隐性风险原文",
      matrixReminder: "关键提醒原文",
      burnoutPercent: 40,
      coreProblem: "手机",
    });
    const flat = segs.map((s) => s.text).join("");
    expect(flat).toContain("接纳情绪");
    expect(flat).toContain("温情弹性型");
    expect(flat).toContain("隐性风险原文");
    expect(flat).toContain("关键提醒原文");
    expect(flat).not.toContain("手机");
  });

  it("无矩阵风险时用倦怠规则；无提醒时用核心难题", () => {
    const segs = buildCallModeBriefSegments({
      weakestDimension: "沟通",
      parentTypeName: "权威型",
      matrixRisk: null,
      matrixReminder: null,
      burnoutPercent: 30,
      coreProblem: "孩子学习拖延",
    });
    const flat = segs.map((s) => s.text).join("");
    expect(flat).toContain("行动意愿");
    expect(flat).toContain("孩子学习拖延");
  });
});
