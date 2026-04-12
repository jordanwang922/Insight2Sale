import { describe, expect, test } from "vitest";
import {
  anxietyQuestions,
  burnoutQuestions,
  competenceQuestions,
  coreQuestions,
  dimensionDefinitions,
  parentTypeDefinitions,
} from "@/features/assessment/questions";

describe("assessment question bank", () => {
  test("contains the expected number of questions and dimensions", () => {
    expect(dimensionDefinitions).toHaveLength(6);
    expect(coreQuestions).toHaveLength(36);
    expect(anxietyQuestions).toHaveLength(3);
    expect(burnoutQuestions).toHaveLength(3);
    expect(competenceQuestions).toHaveLength(3);
    expect(parentTypeDefinitions).toHaveLength(9);
  });

  test("keeps every core dimension mapped to three child and three parent questions", () => {
    for (const definition of dimensionDefinitions) {
      const child = coreQuestions.filter(
        (question) => question.dimension === definition.name && question.type === "child",
      );
      const parent = coreQuestions.filter(
        (question) => question.dimension === definition.name && question.type === "parent",
      );

      expect(child).toHaveLength(3);
      expect(parent).toHaveLength(3);
    }
  });

  test("attaches theory, scoring logic and explanation to all questions", () => {
    const allQuestions = [
      ...coreQuestions,
      ...anxietyQuestions,
      ...burnoutQuestions,
      ...competenceQuestions,
    ];

    expect(allQuestions).toHaveLength(45);

    for (const question of allQuestions) {
      expect(question.theory?.length ?? 0).toBeGreaterThan(0);
      expect(question.scoringLogic?.length ?? 0).toBeGreaterThan(0);
      expect(question.explanation?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
