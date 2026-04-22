import { describe, expect, test } from "vitest";
import { scoreAssessment } from "@/features/assessment/scoring";
import { anxietyQuestions, burnoutQuestions, competenceQuestions, coreQuestions } from "@/features/assessment/questions";

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
});
