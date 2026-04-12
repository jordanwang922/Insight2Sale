export const knowledgeCategories = [
  "课程体系库",
  "测评解读库",
  "专家话术库",
  "案例库",
  "禁用表达库",
  "关键词与风格库",
] as const;

export type KnowledgeCategory = (typeof knowledgeCategories)[number];

export const categoryDescriptions: Record<KnowledgeCategory, string> = {
  课程体系库: "记录课程模块、适用问题、学习前后变化和课程价值。",
  测评解读库: "记录 6 维度、9 类家长类型、双高双低等测评解释规则。",
  专家话术库: "记录开场、解读、衔接课程、推进成交的标准话术。",
  案例库: "记录典型家长问题、测评结果、沟通路径和成功案例。",
  禁用表达库: "记录不建议出现的表达、过度销售化或不符合风格的说法。",
  关键词与风格库: "记录田老师体系的常用词、核心理念、语气和风格要求。",
};
