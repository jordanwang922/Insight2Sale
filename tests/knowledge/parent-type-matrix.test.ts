import { describe, expect, it } from "vitest";
import {
  extractCallModeCellsFromMatrix,
  extractParentTypeColumnFromMatrix,
  parentingTypeLabelsEquivalent,
} from "@/features/knowledge/parent-type-matrix";

describe("parentingTypeLabelsEquivalent", () => {
  it("系统带「父母」后缀与 Excel 短名等价", () => {
    expect(parentingTypeLabelsEquivalent("权威型", "权威型父母")).toBe(true);
    expect(parentingTypeLabelsEquivalent("权威型父母", "权威型")).toBe(true);
  });
  it("完全相同仍匹配", () => {
    expect(parentingTypeLabelsEquivalent("温情弹性型", "温情弹性型")).toBe(true);
  });
});

describe("extractParentTypeColumnFromMatrix", () => {
  it("只取匹配类型列，按行标签拼接", () => {
    const matrix = [
      ["", "权威型", "温情弹性型", "忽视型"],
      ["你的教养画像", "权威内容A", "温情内容A", "忽视内容A"],
      ["孩子感受", "权威内容B", "温情内容B", "忽视内容B"],
    ];
    const out = extractParentTypeColumnFromMatrix(matrix, "温情弹性型", "测评");
    expect(out).toContain("【你的教养画像】\n温情内容A");
    expect(out).toContain("【孩子感受】\n温情内容B");
    expect(out).not.toContain("权威内容");
    expect(out).not.toContain("忽视内容");
    expect(out).not.toContain("【测评】");
  });

  it("表头为短名、查询为「型+父母」仍能命中该列", () => {
    const matrix = [
      ["", "权威型", "忽视型"],
      ["你的教养画像", "短名权威格", "忽视格"],
    ];
    const out = extractParentTypeColumnFromMatrix(matrix, "权威型父母");
    expect(out).toContain("短名权威格");
    expect(out).not.toContain("忽视格");
  });
});

describe("extractCallModeCellsFromMatrix", () => {
  it("只取当前类型列下「隐性风险」「关键提醒」行，不串列", () => {
    const matrix = [
      ["", "权威型", "温情弹性型"],
      ["你需要警惕的隐性风险", "错列风险", "对的风险文案"],
      ["给你一句关键提醒", "错提醒", "对的提醒文案"],
    ];
    const cells = extractCallModeCellsFromMatrix(matrix, "温情弹性型");
    expect(cells.risk).toBe("对的风险文案");
    expect(cells.reminder).toBe("对的提醒文案");
  });
});
