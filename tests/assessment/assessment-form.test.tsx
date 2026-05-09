import { describe, expect, test } from "vitest";
import { displayAssessmentOptionLabel } from "@/components/assessment/assessment-form";

describe("displayAssessmentOptionLabel", () => {
  test("removes trailing score text from assessment option labels", () => {
    expect(displayAssessmentOptionLabel("不看菜单，一般会说“随便”、“听你的”。（1分）")).toBe(
      "不看菜单，一般会说“随便”、“听你的”。",
    );
    expect(displayAssessmentOptionLabel("完全不符合 (0分)")).toBe("完全不符合");
  });

  test("keeps normal option labels unchanged", () => {
    expect(displayAssessmentOptionLabel("会和你讨论菜的口味")).toBe("会和你讨论菜的口味");
  });
});
