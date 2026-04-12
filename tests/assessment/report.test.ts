import { describe, expect, test } from "vitest";
import { buildSalesSummary, toRadarData } from "@/features/assessment/report";
import { scoreAssessment } from "@/features/assessment/scoring";
import { anxietyQuestions, burnoutQuestions, competenceQuestions, coreQuestions } from "@/features/assessment/questions";

describe("assessment report helpers", () => {
  test("generates radar chart data for parent and child sides", () => {
    const answers = [
      ...coreQuestions.map((question) => ({
        questionId: question.id,
        selectedOption: question.options.at(-1)?.label ?? "",
        score: question.options.at(-1)?.score ?? 0,
      })),
      ...anxietyQuestions.map((question) => ({
        questionId: question.id,
        selectedOption: question.options[0].label,
        score: question.options[0].score,
      })),
      ...burnoutQuestions.map((question) => ({
        questionId: question.id,
        selectedOption: question.options[0].label,
        score: question.options[0].score,
      })),
      ...competenceQuestions.map((question) => ({
        questionId: question.id,
        selectedOption: question.options[0].label,
        score: question.options[0].score,
      })),
    ];

    const report = scoreAssessment(answers);

    expect(toRadarData(report, "child")).toHaveLength(6);
    expect(toRadarData(report, "parent")).toHaveLength(6);
    expect(buildSalesSummary(report, "测试家长").headline).toContain("测试家长");
  });
});
