import { describe, expect, test } from "vitest";
import { buildAssessmentReviewQuestions } from "@/features/assessment/review";

describe("assessment review", () => {
  test("maps stored answers back to ordered 45-question review rows", () => {
    const rows = buildAssessmentReviewQuestions(
      JSON.stringify([
        { questionId: 1, selectedOption: "A", score: 0 },
        { questionId: 100, selectedOption: "B", score: 3 },
        { questionId: 302, selectedOption: "C", score: 1 },
      ]),
    );

    expect(rows).toHaveLength(45);
    expect(rows[0]).toMatchObject({
      order: 1,
      question: { id: 1 },
      selectedOption: "A",
      selectedScore: 0,
    });
    expect(rows[36]).toMatchObject({
      order: 37,
      question: { id: 100 },
      selectedOption: "B",
      selectedScore: 3,
    });
    expect(rows[44]).toMatchObject({
      order: 45,
      question: { id: 302 },
      selectedOption: "C",
      selectedScore: 1,
    });
  });
});
