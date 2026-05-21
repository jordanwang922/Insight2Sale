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
});
