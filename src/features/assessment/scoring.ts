import {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentReport,
  DimensionScore,
  DimensionWordBand,
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
import { WORD_COMPETENCE_CLARIFICATION, WORD_PERCENT_CONVERSION_NOTE } from "./report-word-copy";

function getScoreMap(answers: AssessmentAnswer[]) {
  return new Map(answers.map((answer) => [answer.questionId, answer.score]));
}

function sumQuestionScores(scoreMap: Map<number, number>, questions: AssessmentQuestion[]) {
  return questions.reduce((total, question) => total + (scoreMap.get(question.id) ?? 0), 0);
}

/** Word：单维度孩子或家长 3 题满分 15，13–15 优势，9–12 潜力，0–8 卡点 */
function dimensionWordBandFromRaw15(raw: number): DimensionWordBand {
  if (raw >= 13) return "优势";
  if (raw >= 9) return "潜力";
  return "卡点";
}

/** Word：情感支持度 / 规则引导度 各 9 题家长侧满分 45 */
function supportGuidanceWordBand045(raw: number): DimensionWordBand {
  if (raw >= 37) return "优势";
  if (raw >= 27) return "潜力";
  return "卡点";
}

function anxietyVerbalFromRaw(raw: number): string {
  if (raw >= 9) return "很焦虑";
  if (raw >= 4) return "比较焦虑";
  return "从容";
}

function burnoutVerbalFromRaw(raw: number): string {
  if (raw >= 9) return "很疲惫";
  if (raw >= 4) return "比较疲惫";
  return "轻松";
}

function competenceVerbalFromRaw(raw: number): string {
  if (raw >= 9) return "自我评估-教养能力强";
  if (raw >= 4) return "自我评估-教养能力待提升";
  return "自我评估-教养能力弱";
}

function toIndexScore(
  scoreMap: Map<number, number>,
  questions: AssessmentQuestion[],
  verbal: (raw: number) => string,
): IndexScore {
  const score = sumQuestionScores(scoreMap, questions);
  const maxScore = questions.length * 5;
  const percent = Math.round((score / maxScore) * 100);
  return { score, maxScore, percent, verbalBand: verbal(score) };
}

function sumParentRawForDimensions(scoreMap: Map<number, number>, dimNames: readonly string[]): number {
  let total = 0;
  for (const name of dimNames) {
    const items = coreQuestions.filter((q) => q.dimension === name && q.type === "parent");
    total += sumQuestionScores(scoreMap, items);
  }
  return total;
}

/**
 * Word 文档 9 型矩阵：情感支持度（维度1+2+3）为行、规则引导度（4+5+6）为列。
 * 高/中/低按原始分 37–45 / 27–36 / 0–26。
 */
function toParentTypeFromWordMatrix(
  emotionalSupportRaw: number,
  ruleGuidanceRaw: number,
): ParentTypeDefinition {
  const s = supportGuidanceWordBand045(emotionalSupportRaw);
  const g = supportGuidanceWordBand045(ruleGuidanceRaw);
  const table: Record<DimensionWordBand, Record<DimensionWordBand, number>> = {
    优势: { 优势: 0, 潜力: 1, 卡点: 2 },
    潜力: { 优势: 3, 潜力: 4, 卡点: 5 },
    卡点: { 优势: 6, 潜力: 7, 卡点: 8 },
  };
  const index = table[s][g];
  return parentTypeDefinitions[index]!;
}

function combinedLevelFromWordBands(
  childBand: DimensionWordBand,
  parentBand: DimensionWordBand,
): "高" | "中" | "低" {
  const order = (b: DimensionWordBand) => (b === "卡点" ? 0 : b === "潜力" ? 1 : 2);
  const worst = order(childBand) <= order(parentBand) ? childBand : parentBand;
  if (worst === "卡点") return "低";
  if (worst === "潜力") return "中";
  return "高";
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
    const childWordBand = dimensionWordBandFromRaw15(childScore);
    const parentWordBand = dimensionWordBandFromRaw15(parentScore);
    const level = combinedLevelFromWordBands(childWordBand, parentWordBand);

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
      level,
      childWordBand,
      parentWordBand,
    };
  });

  const anxiety = toIndexScore(scoreMap, anxietyQuestions, anxietyVerbalFromRaw);
  const burnout = toIndexScore(scoreMap, burnoutQuestions, burnoutVerbalFromRaw);
  const competence = toIndexScore(scoreMap, competenceQuestions, competenceVerbalFromRaw);

  const emotionalSupportRaw = sumParentRawForDimensions(scoreMap, ["需求", "接纳情绪", "沟通"]);
  const ruleGuidanceRaw = sumParentRawForDimensions(scoreMap, ["家庭系统", "自律", "自主"]);
  const parentType = toParentTypeFromWordMatrix(emotionalSupportRaw, ruleGuidanceRaw);

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
    emotionalSupportRaw,
    ruleGuidanceRaw,
    emotionalSupportWordBand: supportGuidanceWordBand045(emotionalSupportRaw),
    ruleGuidanceWordBand: supportGuidanceWordBand045(ruleGuidanceRaw),
    competenceClarification: WORD_COMPETENCE_CLARIFICATION,
    percentConversionNote: WORD_PERCENT_CONVERSION_NOTE,
  };
}
