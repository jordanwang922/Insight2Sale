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

/** Word「6个维度」单测 3 题满分 15 分：13–15 优势，9–12 潜力，0–8 卡点 */
export type DimensionWordBand = "优势" | "潜力" | "卡点";

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
  /** 兼容旧展示：取孩子与家长 Word 分档中较低一侧（卡点 > 潜力 > 优势）用于单一徽标 */
  level: "高" | "中" | "低";
  /** Word 文档：孩子该维度原始分档 */
  childWordBand: DimensionWordBand;
  /** Word 文档：家长该维度原始分档 */
  parentWordBand: DimensionWordBand;
}

export interface IndexScore {
  score: number;
  maxScore: number;
  percent: number;
  /** Word 文档对 0–15 原始分合计的档（焦虑 / 倦怠 / 教养能力感文案不同） */
  verbalBand: string;
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
  /** Word：情感支持度（维度1+2+3）家长侧原始分 0–45 */
  emotionalSupportRaw: number;
  /** Word：规则引导度（维度4+5+6）家长侧原始分 0–45 */
  ruleGuidanceRaw: number;
  /** Word 文档 9 型矩阵用的家长侧分档 */
  emotionalSupportWordBand: DimensionWordBand;
  ruleGuidanceWordBand: DimensionWordBand;
  /** Word 503-505 脚注 */
  competenceClarification: string;
  percentConversionNote: string;
  /** 写入快照时的销售侧摘要（非 Word 字段，可选） */
  salesSummary?: {
    headline?: string;
    weakestDimension?: string;
    strongestDimension?: string;
    riskSignal?: string;
  };
}
