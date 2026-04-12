export type QuestionDimension =
  | "需求"
  | "接纳情绪"
  | "沟通"
  | "家庭系统"
  | "自律"
  | "自主";

export type QuestionRole = "child" | "parent" | "anxiety" | "burnout" | "competence";

export interface AssessmentOption {
  label: string;
  score: number;
  analysis: string;
}

export interface AssessmentQuestion {
  id: number;
  dimension: string;
  type: QuestionRole;
  text: string;
  options: AssessmentOption[];
  theory?: string[];
  scoringLogic?: string;
  explanation?: string;
}

export interface DimensionDefinition {
  name: string;
  icon: string;
  description: string;
  childQuestions: number[];
  parentQuestions: number[];
  courseModule: string;
}

export interface ParentTypeDefinition {
  id: number;
  name: string;
  description: string;
  characteristics: string[];
  suggestions: string[];
}

export interface IntakeFieldOption {
  label: string;
  value: string;
}

export interface IntakeFieldDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "single-select" | "multi-select" | "phone";
  required: boolean;
  options?: IntakeFieldOption[];
  placeholder?: string;
}

export interface AssessmentAnswer {
  questionId: number;
  selectedOption: string;
  score: number;
}

export interface DimensionScore {
  name: string;
  icon: string;
  childScore: number;
  childMaxScore: number;
  childPercent: number;
  parentScore: number;
  parentMaxScore: number;
  parentPercent: number;
  gap: number;
  level: "高" | "中" | "低";
}

export interface IndexScore {
  score: number;
  maxScore: number;
  percent: number;
}

export interface AssessmentReport {
  overallScore: number;
  dimensionScores: DimensionScore[];
  anxiety: IndexScore;
  burnout: IndexScore;
  competence: IndexScore;
  parentType: ParentTypeDefinition;
  matchAnalysis: string;
  suggestions: string[];
  courseRecommendations: {
    module: string;
    reason: string;
    talkingPoint: string;
  }[];
}
