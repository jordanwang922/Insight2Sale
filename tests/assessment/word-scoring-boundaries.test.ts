import { describe, expect, test } from "vitest";
import { scoreAssessment } from "@/features/assessment/scoring";
import { anxietyQuestions, burnoutQuestions, competenceQuestions, coreQuestions } from "@/features/assessment/questions";
import { normalizeAssessmentReport } from "@/features/assessment/report-normalize";

function buildAnswers(
  coreFactory: (q: (typeof coreQuestions)[0]) => { label: string; score: number },
  anxietyEach: [number, number, number],
  burnoutEach: [number, number, number],
  competenceEach: [number, number, number],
) {
  return [
    ...coreQuestions.map((q) => {
      const p = coreFactory(q);
      return { questionId: q.id, selectedOption: p.label, score: p.score };
    }),
    ...anxietyQuestions.map((q, i) => {
      const s = anxietyEach[i]!;
      const opt = q.options.find((o) => o.score === s) ?? q.options[0]!;
      return { questionId: q.id, selectedOption: opt.label, score: s };
    }),
    ...burnoutQuestions.map((q, i) => {
      const s = burnoutEach[i]!;
      const opt = q.options.find((o) => o.score === s) ?? q.options[0]!;
      return { questionId: q.id, selectedOption: opt.label, score: s };
    }),
    ...competenceQuestions.map((q, i) => {
      const s = competenceEach[i]!;
      const opt = q.options.find((o) => o.score === s) ?? q.options[0]!;
      return { questionId: q.id, selectedOption: opt.label, score: s };
    }),
  ];
}

describe("Word 文档分档边界（与 scoring.ts 一致）", () => {
  const maxOpt = (q: (typeof coreQuestions)[0]) => {
    const o = q.options.reduce((a, b) => (a.score > b.score ? a : b));
    return { label: o.label, score: o.score };
  };

  test("六维 15 分：全高分→孩子与家长均为优势", () => {
    const z = [0, 0, 0] as [number, number, number];
    const r = scoreAssessment(buildAnswers(maxOpt, z, z, z));
    const d0 = r.dimensionScores[0]!;
    expect(d0.childWordBand).toBe("优势");
    expect(d0.parentWordBand).toBe("优势");
  });

  test("焦虑指数合计 3→从容，4→比较焦虑，9→很焦虑", () => {
    const z = [0, 0, 0] as [number, number, number];
    const r3 = scoreAssessment(buildAnswers(maxOpt, [1, 1, 1], z, z));
    expect(r3.anxiety.score).toBe(3);
    expect(r3.anxiety.verbalBand).toBe("从容");
    const r4 = scoreAssessment(buildAnswers(maxOpt, [1, 1, 2], z, z));
    expect(r4.anxiety.score).toBe(4);
    expect(r4.anxiety.verbalBand).toBe("比较焦虑");
    const r9 = scoreAssessment(buildAnswers(maxOpt, [3, 3, 3], z, z));
    expect(r9.anxiety.score).toBe(9);
    expect(r9.anxiety.verbalBand).toBe("很焦虑");
  });

  test("情感支持度家长侧合计 45→优势档", () => {
    const parentMax = (q: (typeof coreQuestions)[0]) => {
      if (q.type !== "parent") return { label: q.options[0]!.label, score: q.options[0]!.score };
      return maxOpt(q);
    };
    const z = [0, 0, 0] as [number, number, number];
    const rHi = scoreAssessment(buildAnswers(parentMax, z, z, z));
    expect(rHi.emotionalSupportRaw).toBe(45);
    expect(rHi.emotionalSupportWordBand).toBe("优势");
  });

  test("家长 9 型矩阵按情感支持度 x 规则引导度映射", () => {
    const byParentDimensionScore = (scoreByDimension: Record<string, number>) =>
      buildAnswers(
        (q) => {
          if (q.type !== "parent") return { label: q.options[0]!.label, score: q.options[0]!.score };
          const score = scoreByDimension[q.dimension] ?? 0;
          const opt = q.options.find((o) => o.score === score) ?? q.options[0]!;
          return { label: opt.label, score };
        },
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      );

    const cases: Array<[string, Record<string, number>, string]> = [
      ["高支持高规则", { 需求: 5, 接纳情绪: 5, 沟通: 5, 家庭系统: 5, 自律: 5, 自主: 5 }, "权威型"],
      ["中支持高规则", { 需求: 3, 接纳情绪: 3, 沟通: 3, 家庭系统: 5, 自律: 5, 自主: 5 }, "温和管控型"],
      ["低支持高规则", { 需求: 1, 接纳情绪: 1, 沟通: 1, 家庭系统: 5, 自律: 5, 自主: 5 }, "独裁型"],
      ["高支持中规则", { 需求: 5, 接纳情绪: 5, 沟通: 5, 家庭系统: 3, 自律: 3, 自主: 3 }, "爱心管家型"],
      ["中支持中规则", { 需求: 3, 接纳情绪: 3, 沟通: 3, 家庭系统: 3, 自律: 3, 自主: 3 }, "温柔引导型"],
      ["低支持中规则", { 需求: 1, 接纳情绪: 1, 沟通: 1, 家庭系统: 3, 自律: 3, 自主: 3 }, "冷静管理型"],
      ["高支持低规则", { 需求: 5, 接纳情绪: 5, 沟通: 5, 家庭系统: 1, 自律: 1, 自主: 1 }, "放任型"],
      ["中支持低规则", { 需求: 3, 接纳情绪: 3, 沟通: 3, 家庭系统: 1, 自律: 1, 自主: 1 }, "温情弹性型"],
      ["低支持低规则", { 需求: 1, 接纳情绪: 1, 沟通: 1, 家庭系统: 1, 自律: 1, 自主: 1 }, "忽视型"],
    ];

    for (const [label, scoreByDimension, expected] of cases) {
      expect(scoreAssessment(byParentDimensionScore(scoreByDimension)).parentType.name, label).toBe(expected);
    }
  });

  test("三指数百分制显示用 0-15 原始分映射到指定文案", () => {
    const z = [0, 0, 0] as [number, number, number];
    const r = scoreAssessment(buildAnswers(maxOpt, [3, 3, 3], [3, 3, 3], [3, 3, 3]));
    expect(r.anxiety).toMatchObject({ score: 9, percent: 60, verbalBand: "很焦虑" });
    expect(r.burnout).toMatchObject({ score: 9, percent: 60, verbalBand: "很疲惫" });
    expect(r.competence).toMatchObject({ score: 9, percent: 60, verbalBand: "能力强" });

    const low = scoreAssessment(buildAnswers(maxOpt, z, z, z));
    expect(low.competence.verbalBand).toBe("能力弱");
  });

  test("历史快照 normalize 时按新 9 型矩阵重算展示类型", () => {
    const report = scoreAssessment(
      buildAnswers(
        (q) => {
          if (q.type !== "parent") return { label: q.options[0]!.label, score: q.options[0]!.score };
          const score = ["需求", "接纳情绪", "沟通"].includes(q.dimension) ? 3 : 5;
          const opt = q.options.find((o) => o.score === score) ?? q.options[0]!;
          return { label: opt.label, score };
        },
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ),
    );
    const normalized = normalizeAssessmentReport({
      ...report,
      parentType: { ...report.parentType, name: "爱心管家型" },
    });
    expect(normalized?.emotionalSupportRaw).toBe(27);
    expect(normalized?.ruleGuidanceRaw).toBe(45);
    expect(normalized?.parentType.name).toBe("温和管控型");
  });
});
