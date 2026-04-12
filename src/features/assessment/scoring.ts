import {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentReport,
  DimensionScore,
  IndexScore,
  ParentTypeDefinition,
} from "./types";
import {
  anxietyQuestions,
  burnoutQuestions,
  competenceQuestions,
  coreQuestions,
  dimensionDefinitions,
  parentTypeDefinitions,
} from "./questions";
import { getDimensionCourseReason } from "./course-mapping";

function getScoreMap(answers: AssessmentAnswer[]) {
  return new Map(answers.map((answer) => [answer.questionId, answer.score]));
}

function sumQuestionScores(scoreMap: Map<number, number>, questions: AssessmentQuestion[]) {
  return questions.reduce((total, question) => total + (scoreMap.get(question.id) ?? 0), 0);
}

function toIndexScore(scoreMap: Map<number, number>, questions: AssessmentQuestion[]): IndexScore {
  const score = sumQuestionScores(scoreMap, questions);
  const maxScore = questions.length * 5;
  const percent = Math.round((score / maxScore) * 100);

  return { score, maxScore, percent };
}

function toParentType(dimensionScores: DimensionScore[]): ParentTypeDefinition {
  const support = dimensionScores
    .slice(0, 3)
    .reduce((sum, item) => sum + item.parentPercent, 0) / 3;
  const guidance = dimensionScores
    .slice(3)
    .reduce((sum, item) => sum + item.parentPercent, 0) / 3;

  let index = 8;

  if (support >= 65 && guidance >= 65) index = 0;
  else if (support >= 65 && guidance >= 45) index = 1;
  else if (support < 50 && guidance >= 65) index = 2;
  else if (support >= 65 && guidance < 45)
    index = dimensionScores.some((item) => item.gap > 5) ? 3 : 4;
  else if (support >= 50 && support < 65 && guidance >= 65) index = 5;
  else if (support >= 65 && guidance < 30) index = 6;
  else if (support < 50 && guidance >= 45) index = 7;

  return parentTypeDefinitions[index];
}

function buildMatchAnalysis(dimensionScores: DimensionScore[]) {
  const sorted = [...dimensionScores].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  const strongestGap = sorted[0];
  const mildestGap = [...dimensionScores].sort((a, b) => Math.abs(a.gap) - Math.abs(b.gap))[0];

  if (strongestGap.gap > 10) {
    return `在“${strongestGap.name}”维度，家长对孩子的要求与孩子当前状态差距较大，建议先降低过度要求，再补上具体练习和支持。`;
  }

  if (strongestGap.gap < -10) {
    return `在“${strongestGap.name}”维度，孩子已经表现出更高潜力，而家长端的支持与激励还可以继续升级，建议给孩子更多挑战和表达空间。`;
  }

  return `整体匹配度较平衡，其中“${mildestGap.name}”维度默契度最好，可以作为后续建立信任和推动改变的切入口。`;
}

export function scoreAssessment(answers: AssessmentAnswer[]): AssessmentReport {
  const scoreMap = getScoreMap(answers);

  const dimensionScores = dimensionDefinitions.map<DimensionScore>((dimension) => {
    const childItems = coreQuestions.filter(
      (question) => question.dimension === dimension.name && question.type === "child",
    );
    const parentItems = coreQuestions.filter(
      (question) => question.dimension === dimension.name && question.type === "parent",
    );

    const childScore = sumQuestionScores(scoreMap, childItems);
    const parentScore = sumQuestionScores(scoreMap, parentItems);
    const childMaxScore = childItems.length * 5;
    const parentMaxScore = parentItems.length * 5;
    const childPercent = Math.round((childScore / childMaxScore) * 100);
    const parentPercent = Math.round((parentScore / parentMaxScore) * 100);
    const average = (childPercent + parentPercent) / 2;

    return {
      name: dimension.name,
      icon: dimension.icon,
      childScore,
      childMaxScore,
      childPercent,
      parentScore,
      parentMaxScore,
      parentPercent,
      gap: parentPercent - childPercent,
      level: average >= 70 ? "高" : average >= 40 ? "中" : "低",
    };
  });

  const anxiety = toIndexScore(scoreMap, anxietyQuestions);
  const burnout = toIndexScore(scoreMap, burnoutQuestions);
  const competence = toIndexScore(scoreMap, competenceQuestions);
  const parentType = toParentType(dimensionScores);
  const overallScore = Math.round(
    dimensionScores.reduce((sum, item) => sum + item.parentPercent, 0) / dimensionScores.length,
  );
  const matchAnalysis = buildMatchAnalysis(dimensionScores);

  const lowDimensions = dimensionScores.filter((item) => item.level === "低");

  const suggestions = [
    ...parentType.suggestions,
    ...(lowDimensions.length
      ? [
          `当前需要重点关注的薄弱维度包括：${lowDimensions
            .map((item) => item.name)
            .join("、")}。建议先围绕 1-2 个最关键维度进行系统学习和持续练习。`,
        ]
      : []),
    ...(anxiety.percent > 60
      ? ["教育焦虑指数偏高，建议在解决孩子问题前，先降低家长自身的紧绷感和无力感。"] 
      : []),
  ];

  const courseRecommendations = dimensionDefinitions
    .map((definition) => ({
      definition,
      score: dimensionScores.find((item) => item.name === definition.name)?.parentPercent ?? 0,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map(({ definition }) => getDimensionCourseReason(definition));

  return {
    overallScore,
    dimensionScores,
    anxiety,
    burnout,
    competence,
    parentType,
    matchAnalysis,
    suggestions,
    courseRecommendations,
  };
}
