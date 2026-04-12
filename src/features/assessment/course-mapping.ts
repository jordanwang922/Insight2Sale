import { DimensionDefinition } from "./types";

export const courseModuleLabels = {
  认识孩子: "模块一：认识孩子",
  安全依恋: "模块二：安全依恋",
  有边界有自由: "模块三：有边界有自由",
  家庭协同: "模块四：家庭协同",
  科学激励: "模块五：科学激励",
  激发自驱: "模块六：激发自驱",
} as const;

export const dimensionToCourseModule: Record<string, string> = {
  需求: courseModuleLabels.认识孩子,
  接纳情绪: courseModuleLabels.安全依恋,
  沟通: courseModuleLabels.认识孩子,
  家庭系统: courseModuleLabels.家庭协同,
  自律: courseModuleLabels.科学激励,
  自主: courseModuleLabels.激发自驱,
};

export function getDimensionCourseReason(definition: DimensionDefinition) {
  const courseModule = dimensionToCourseModule[definition.name];

  switch (definition.name) {
    case "需求":
      return {
        module: courseModule,
        reason: "需求维度是后续情绪、沟通、自驱的入口，先看懂孩子的真实需求，后面的养育动作才会更精准。",
        talkingPoint:
          "从报告看，先把“看懂孩子”和“让孩子说清楚自己”这件事做好，很多表面冲突会先降下来。",
      };
    case "接纳情绪":
      return {
        module: courseModule,
        reason: "情绪被接住，孩子才会慢慢建立安全感与稳定的情绪调节能力。",
        talkingPoint:
          "情绪不是要立刻压住，而是要先被理解。模块二会讲如何接住情绪、再慢慢带到行为层。",
      };
    case "沟通":
      return {
        module: courseModule,
        reason: "沟通维度直接影响亲子关系质量，也是销售解读最容易让家长共鸣的切入口。",
        talkingPoint:
          "很多家长以为是孩子不听话，实际上是沟通通道被堵住了，先把通道打开，后面的方法才能进去。",
      };
    case "家庭系统":
      return {
        module: courseModule,
        reason: "规则混乱、夫妻口径不一致时，孩子很难形成稳定边界。",
        talkingPoint:
          "这不是谁一个人的问题，是整个家庭系统要重新调频。模块四更适合解决这种“家里不在一个频道上”的情况。",
      };
    case "自律":
      return {
        module: courseModule,
        reason: "自律问题往往不是单纯懒散，而是结构、激励和执行机制没有搭建起来。",
        talkingPoint:
          "如果一直靠催，孩子只会越来越依赖外部推力。模块五更聚焦怎么把“外部管控”慢慢过渡到“内部坚持”。",
      };
    case "自主":
      return {
        module: courseModule,
        reason: "自主维度反映孩子是否愿意为自己做事，是长期成长动力的核心。",
        talkingPoint:
          "孩子不是没有火种，而是还没把“喜欢”“意义”和“我要做”连起来。模块六会重点处理这块。",
      };
    default:
      return {
        module: courseModule,
        reason: "该维度需要系统训练与方法支持。",
        talkingPoint: "这部分建议结合正式课程来建立更稳定的方法路径。",
      };
  }
}
