import { describe, expect, test } from "vitest";
import { parseDealKitStructuredText } from "@/features/deal-kit/ocr";

describe("deal kit OCR parser", () => {
  test("extracts contributor and three core fields from chat style text", () => {
    const parsed = parseDealKitStructuredText(`
学习顾问-小曼
用户画像：三个孩子，其中一个9岁，奶奶带大，孩子有明显的看手机习惯。
用户判断：学过一些育儿课程，但没有形成改变，现在妈妈主要担心孩子再继续沉迷下去。
成交经验：先帮她明确问题再拖下去会越来越难，再让她看三个孩子都能受益，最后先试一试。
`);

    expect(parsed.contributorName).toBe("小曼");
    expect(parsed.profileText).toContain("三个孩子");
    expect(parsed.judgmentText).toContain("担心孩子再继续沉迷");
    expect(parsed.experienceText).toContain("最后先试一试");
  });
});
