import { describe, expect, test } from "vitest";
import { buildAssessmentStatistics } from "@/features/crm/assessment-statistics";

describe("assessment statistics", () => {
  test("counts every submitted assessment by intake snapshot", () => {
    const groups = buildAssessmentStatistics([
      {
        intakeData: JSON.stringify({
          residenceCity: "一线城市（北上广深）",
          memberStatus: "不是",
          gender: "女",
          ageRange: "36-40岁",
          education: "大学本科",
          childrenCount: "1个",
          childAgeRanges: JSON.stringify(["7-9岁", "10-12岁"]),
          primaryCaretaker: "孩子妈妈",
          parentingRole: "职场妈妈/爸爸（兼顾工作与育儿）",
          occupationCategory: "教育行业（教师/教培机构/教育科技等教育行业）",
        }),
        customer: {},
      },
      {
        intakeData: JSON.stringify({
          residenceCity: "一线城市（北上广深）",
          childAgeRanges: JSON.stringify(["7-9岁"]),
        }),
        customer: {
          gender: "男",
          decisionMakerCount: "2人共同决策",
        },
      },
    ]);

    expect(groups.find((group) => group.key === "residenceCity")?.slices).toEqual([
      { label: "一线城市（北上广深）", count: 2 },
    ]);
    expect(groups.find((group) => group.key === "childAgeRanges")?.slices).toEqual([
      { label: "7-9岁", count: 2 },
      { label: "10-12岁", count: 1 },
    ]);
    expect(groups.find((group) => group.key === "gender")?.slices).toEqual([
      { label: "男", count: 1 },
      { label: "女", count: 1 },
    ]);
    expect(groups.find((group) => group.key === "decisionMakerCount")?.slices).toEqual([
      { label: "2人共同决策", count: 1 },
      { label: "未填写", count: 1 },
    ]);
  });
});
