import { describe, expect, test } from "vitest";
import {
  injectOrderedFiguresFromTemplate,
  normalizeInterpretationDeskPlainText,
  stripDeskNineTypePreviewBlock,
} from "@/features/sales/interpretation-desk-template";

describe("normalizeInterpretationDeskPlainText", () => {
  test("merges PDF soft line breaks within a sentence", () => {
    const raw = `📕我专注于用科学养育的家庭教育体系，擅长帮助家长解决孩子作业拖拉、手机沉迷、
亲子沟通等问题。过去 2 年，我已经陪伴超过 300 个家庭。`;
    const out = normalizeInterpretationDeskPlainText(raw);
    expect(out).not.toMatch(/\n/);
    expect(out).toContain("手机沉迷、亲子沟通");
  });

  test("keeps numbered sections on separate paragraphs", () => {
    const raw = `❤为了更好地帮助您，可以结合一个场景和行动简单告诉我，【AI 给出问卷里孩子
的信息（比如您 8 岁的孩子）】，最让您头疼的一个育儿问题是什么吗？
2、测评解读邀约
核心目标：秒级响应`;
    const parts = normalizeInterpretationDeskPlainText(raw).split(/\n\n+/);
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts.some((p) => p.includes("2、测评解读邀约"))).toBe(true);
    expect(parts.some((p) => p.startsWith("核心目标："))).toBe(true);
  });

  test("禁忌清单：🚫 各行独立，结尾句不与最后一条 🚫 粘成一段", () => {
    const raw = `三、"禁忌清单"
🚫 不许用太多专业名词
我们解读的任务不是教育，是激发学习动机。`;
    const out = normalizeInterpretationDeskPlainText(raw);
    expect(out).toContain("🚫 不许用太多专业名词");
    expect(out).toContain("我们解读的任务不是教育");
    expect(out).not.toMatch(/专业名词我们解读/);
  });
});

describe("stripDeskNineTypePreviewBlock", () => {
  test("removes 解读前/图8/相关话术 block before 二、解读 7 步法 (placeholder)", () => {
    const raw = `前文\n解读前，把这张图片发给用户\n【这里放图 8.jpeg】\n相关话术：\n猜类型\n二、解读 7 步法\n第 1 步`;
    const out = stripDeskNineTypePreviewBlock(raw);
    expect(out).toContain("前文");
    expect(out).toContain("二、解读 7 步法");
    expect(out).not.toContain("解读前");
    expect(out).not.toContain("相关话术");
    expect(out).not.toContain("【这里放图");
  });

  test("removes block after markdown figure injection", () => {
    const withMd = injectOrderedFiguresFromTemplate(
      "解读前，把这张图片发给用户\n【这里放图 8.jpeg】\n相关话术：\nX\n二、解读 7 步法",
    );
    const out = stripDeskNineTypePreviewBlock(withMd);
    expect(out).toContain("二、解读 7 步法");
    expect(out).not.toContain("解读前");
    expect(out).not.toMatch(/figure-8/);
  });
});
