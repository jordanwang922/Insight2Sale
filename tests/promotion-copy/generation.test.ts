import { describe, expect, test } from "vitest";
import { buildPromotionVariantFallback } from "@/features/promotion-copy/generation";

describe("promotion copy fallback generator", () => {
  test("keeps meaning while making a light rewrite", () => {
    const variant = buildPromotionVariantFallback({
      title: "今天 520，也别忘了先爱自己 ❤️",
      content: "今天想提醒你，先照顾好自己，才更有力量照顾孩子。",
    });

    expect(variant.title).not.toBe("");
    expect(variant.content).toContain("照顾好自己");
    expect(variant.content).not.toBe("今天想提醒你，先照顾好自己，才更有力量照顾孩子。");
  });

  test("forces a visible difference when common replacements exist", () => {
    const variant = buildPromotionVariantFallback({
      title: "【最后8小时·明天封班】",
      content: "北师大教育心理学博士田宏杰体系+42天学习教练，最后5个名额。\n现在报名立马开营，回复“报名”锁定，8小时后关闭通道！",
    });

    expect(variant.title).not.toBe("【最后8小时·明天封班】");
    expect(variant.content).not.toBe(
      "北师大教育心理学博士田宏杰体系+42天学习教练，最后5个名额。\n现在报名立马开营，回复“报名”锁定，8小时后关闭通道！",
    );
  });
});
