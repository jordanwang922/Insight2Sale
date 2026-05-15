import { intakeFields } from "@/features/assessment/intake-fields";
import {
  anxietyQuestions,
  burnoutQuestions,
  competenceQuestions,
  coreQuestions,
} from "@/features/assessment/questions";
import type { AssessmentAnswer, AssessmentQuestion, IntakeFieldDefinition } from "@/features/assessment/types";
import { parseJson } from "@/lib/utils";

const allAssessmentQuestions = [
  ...coreQuestions,
  ...anxietyQuestions,
  ...burnoutQuestions,
  ...competenceQuestions,
];

export interface AssessmentReviewQuestion {
  order: number;
  question: AssessmentQuestion;
  selectedOption: string | null;
  selectedScore: number | null;
}

export function buildAssessmentReviewQuestions(answersData: string): AssessmentReviewQuestion[] {
  const answers = parseJson<AssessmentAnswer[]>(answersData, []);
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));

  return allAssessmentQuestions.map((question, index) => {
    const selected = answerMap.get(question.id);
    return {
      order: index + 1,
      question,
      selectedOption: selected?.selectedOption ?? null,
      selectedScore: selected?.score ?? null,
    };
  });
}

export function buildAssessmentReviewIntake(intakeData: string) {
  const values = parseJson<Record<string, string>>(intakeData, {});
  return intakeFields
    .filter((field) => field.key !== "occupationDetail")
    .map((field) => ({
      field,
      value: formatIntakeValue(field, values[field.key]),
    }));
}

function formatIntakeValue(field: IntakeFieldDefinition, rawValue: string | undefined) {
  if (!rawValue) return "未填写";
  if (field.type !== "multi-select") return rawValue;
  const parsed = parseJson<string[] | string>(rawValue, rawValue);
  return Array.isArray(parsed) ? (parsed.length ? parsed.join(" / ") : "未填写") : parsed || "未填写";
}
