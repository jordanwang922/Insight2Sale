import { describe, expect, test } from "vitest";
import { applyInterpretationDeskLiveData } from "@/features/sales/interpretation-desk-live-data";

describe("applyInterpretationDeskLiveData 强制覆盖（知识库旧版）", () => {
  test("❤ 行：有孩子年龄段则插入【比如您家…】；无则去掉中间【】", () => {
    const kbOld = `❤为了更好地帮助您，可以结合一个场景和行动简单告诉我，【AI 给出问卷里孩子
的信息（比如您 8 岁的孩子）】，最让您头疼的一个育儿问题是什么吗？`;

    const withAge = applyInterpretationDeskLiveData(kbOld, {
      consultantName: "测",
      childAgeDisplay: "7-9岁",
      gradeStageDisplay: "小学",
      coreConcernDisplay: "",
      childDescriptorForHeartLine: "比如您家7-9岁的孩子",
      weakestDimensionName: "沟通",
    });
    expect(withAge).toContain("【比如您家7-9岁的孩子】");
    expect(withAge).not.toContain("AI 给出问卷");

    const noAge = applyInterpretationDeskLiveData(kbOld, {
      consultantName: "测",
      childAgeDisplay: "（未填写孩子年龄段）",
      gradeStageDisplay: "（学龄未填）",
      coreConcernDisplay: "",
      childDescriptorForHeartLine: null,
      weakestDimensionName: null,
    });
    expect(noAge).toContain("简单告诉我，最让您头疼");
    expect(noAge).not.toMatch(/，【[^】]*】，最让您头疼/);
  });

  test("第 7 步：整段替换为规范块并注入【最想改善维度】→ 维度名", () => {
    const kbOld = `第 7 步：引导家长自己规划下一步（3 分钟）
（开场）
“旧版一句话。”
没把握的，还是让学员去看直播

三、“禁忌清单”`;

    const out = applyInterpretationDeskLiveData(kbOld, {
      consultantName: "测",
      childAgeDisplay: "x",
      gradeStageDisplay: "y",
      coreConcernDisplay: "",
      childDescriptorForHeartLine: null,
      weakestDimensionName: "自律",
    });
    expect(out).toContain("（4）描绘未来画面");
    expect(out).toContain("【自律】");
    expect(out).not.toContain("旧版一句话");
  });
});
