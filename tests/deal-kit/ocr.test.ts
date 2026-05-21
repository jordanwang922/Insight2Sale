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

  test("tolerates spaced labels and alternate contributor lines", () => {
    const parsed = parseDealKitStructuredText(`
田老师团队主管
用 户 画 像：学员“久月”是一位妈妈，9岁男孩，沉迷手机和游戏。
用 户 判 断：妈妈学过很多课程，但还没看到实质改变，现在最担心孩子学不会。
成 交 经 验：先解决她对效果和经济压力的顾虑，再把试听和实践性讲清楚。
`);

    expect(parsed.contributorName).toBe("田老师团队主管");
    expect(parsed.profileText).toContain("沉迷手机和游戏");
    expect(parsed.judgmentText).toContain("最担心孩子学不会");
    expect(parsed.experienceText).toContain("试听和实践性");
  });
});
