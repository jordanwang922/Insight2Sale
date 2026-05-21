import { describe, expect, test } from "vitest";
import { buildDealKitScriptFallback, buildDealKitSemanticText } from "@/features/deal-kit/entry";

describe("deal kit helpers", () => {
  test("builds semantic text with all three sections", () => {
    const text = buildDealKitSemanticText({
      profileText: "单亲妈妈，9岁男孩，长期沉迷手机",
      judgmentText: "最担心报名以后孩子还是坚持不住",
      experienceText: "先不急着谈报名，先把问题的严重性和试学路径说清楚",
    });

    expect(text).toContain("用户画像：单亲妈妈");
    expect(text).toContain("用户判断：最担心报名以后孩子还是坚持不住");
    expect(text).toContain("成交经验：先不急着谈报名");
  });

  test("builds a usable fallback script", () => {
    const script = buildDealKitScriptFallback([
      {
        judgmentText: "家长怕花了钱也学不会",
        experienceText: "先让她把目标从立刻见效改成先看到一小步变化",
      },
    ]);

    expect(script).toContain("我特别理解您现在最担心的点");
    expect(script).toContain("先看到一小步变化");
  });
});
