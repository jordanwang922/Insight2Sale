import { describe, expect, test } from "vitest";
import { scoreAssessment } from "@/features/assessment/scoring";
import { anxietyQuestions, burnoutQuestions, competenceQuestions, coreQuestions } from "@/features/assessment/questions";

describe("Word 文档分档与 9 型矩阵", () => {
  test("单维度 15 分原始分：13+ 优势，9–12 潜力，0–8 卡点", () => {
    const answers = [
      ...coreQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: q.options[0].label,
        score: q.options[0].score,
      })),
      ...anxietyQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: q.options[0].label,
        score: 0,
      })),
      ...burnoutQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: q.options[0].label,
        score: 0,
      })),
      ...competenceQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: q.options[0].label,
        score: 0,
      })),
    ];
    const report = scoreAssessment(answers);
    for (const d of report.dimensionScores) {
      expect(["优势", "潜力", "卡点"]).toContain(d.childWordBand);
      expect(["优势", "潜力", "卡点"]).toContain(d.parentWordBand);
    }
  });

  test("三指数含 Word 话术档与 verbalBand", () => {
    const answers = [
      ...coreQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: q.options[0].label,
        score: q.options[0].score,
      })),
      ...anxietyQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: q.options[3].label,
        score: 5,
      })),
      ...burnoutQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: q.options[2].label,
        score: 3,
      })),
      ...competenceQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: q.options[2].label,
        score: 3,
      })),
    ];
    const report = scoreAssessment(answers);
    expect(report.anxiety.verbalBand.length).toBeGreaterThan(0);
    expect(report.burnout.verbalBand.length).toBeGreaterThan(0);
    expect(report.competence.verbalBand.length).toBeGreaterThan(0);
    expect(report.emotionalSupportRaw).toBeGreaterThanOrEqual(0);
    expect(report.emotionalSupportRaw).toBeLessThanOrEqual(45);
    expect(report.ruleGuidanceRaw).toBeGreaterThanOrEqual(0);
    expect(report.ruleGuidanceRaw).toBeLessThanOrEqual(45);
    expect(["优势", "潜力", "卡点"]).toContain(report.emotionalSupportWordBand);
    expect(["优势", "潜力", "卡点"]).toContain(report.ruleGuidanceWordBand);
    expect(report.competenceClarification.length).toBeGreaterThan(10);
    expect(report.percentConversionNote.length).toBeGreaterThan(10);
  });
});
