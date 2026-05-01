import {
  anxietyQuestions as rawAnxietyQuestions,
  burnoutQuestions as rawBurnoutQuestions,
  competenceQuestions as rawCompetenceQuestions,
  coreQuestions as rawCoreQuestions,
  dimensionDefinitions,
  parentTypeDefinitions,
} from "./questions.generated";
import { questionDetailMap } from "./question-details.generated";

function enrichQuestion<T extends { id: number }>(question: T) {
  const detail = questionDetailMap[question.id];
  /** 仅以 Word 导出的解析为准；无解析则留空 */
  return {
    ...question,
    theory: detail?.theory ?? [],
    scoringLogic: detail?.scoringLogic ?? "",
    explanation: detail?.explanation ?? "",
  };
}

export { dimensionDefinitions, parentTypeDefinitions };

export const coreQuestions = rawCoreQuestions.map(enrichQuestion);
export const anxietyQuestions = rawAnxietyQuestions.map((question) => ({
  ...enrichQuestion(question),
  dimension: "家长的教育焦虑指数",
}));
export const burnoutQuestions = rawBurnoutQuestions.map((question) => ({
  ...enrichQuestion(question),
  dimension: "家长的教育倦怠指数",
}));
export const competenceQuestions = rawCompetenceQuestions.map((question) => ({
  ...enrichQuestion(question),
  dimension: "家长的教养能力感",
}));

/** 用户端测评说明等处使用的总题数（与题库一致） */
export const assessmentTotalQuestionCount =
  coreQuestions.length + anxietyQuestions.length + burnoutQuestions.length + competenceQuestions.length;
