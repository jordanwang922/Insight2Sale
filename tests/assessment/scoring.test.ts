import { describe, expect, test } from "vitest";
import {
  anxietyQuestions,
  burnoutQuestions,
  competenceQuestions,
  coreQuestions,
} from "@/features/assessment/questions";
import { scoreAssessment } from "@/features/assessment/scoring";

describe("assessment scoring", () => {
  test("builds a full report from answer payloads", () => {
    const answers = [
      ...coreQuestions.map((question) => ({
        questionId: question.id,
        selectedOption: question.options[0].label,
        score: question.options[0].score,
      })),
      ...anxietyQuestions.map((question) => ({
        questionId: question.id,
        selectedOption: question.options[1].label,
        score: question.options[1].score,
      })),
      ...burnoutQuestions.map((question) => ({
        questionId: question.id,
        selectedOption: question.options[1].label,
        score: question.options[1].score,
      })),
      ...competenceQuestions.map((question) => ({
        questionId: question.id,
        selectedOption: question.options[2].label,
        score: question.options[2].score,
      })),
    ];

    const report = scoreAssessment(answers);

    expect(report.dimensionScores).toHaveLength(6);
    expect(report.courseRecommendations.length).toBeGreaterThan(0);
    expect(report.parentType.name).toBeTruthy();
    expect(report.anxiety.percent).toBeGreaterThanOrEqual(0);
    expect(report.burnout.percent).toBeGreaterThanOrEqual(0);
    expect(report.competence.percent).toBeGreaterThanOrEqual(0);
  });
});
