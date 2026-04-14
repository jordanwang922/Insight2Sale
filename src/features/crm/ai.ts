import { generateDoubaoJson } from "@/lib/ai/doubao";
import { AssessmentReport, DimensionScore } from "@/features/assessment/types";
import { sanitizeKnowledgeChunkBody } from "@/features/knowledge/chunk-sanitize";
import { RetrievedKnowledge } from "@/features/knowledge/retrieval";
import type { InterpretationSopStep } from "@/features/sales/interpretation-sop";

export interface WorkspaceKnowledge {
  interpretation: RetrievedKnowledge[];
  courses: RetrievedKnowledge[];
  scripts: RetrievedKnowledge[];
  forbidden: RetrievedKnowledge[];
  style: RetrievedKnowledge[];
  cases: RetrievedKnowledge[];
  /** 与当前报告维度顺序一一对应，每条为「测评解读库」中该维度的检索切片 */
  interpretationByDimension: RetrievedKnowledge[][];
  /** 《解读台模版.pdf》整文档切片（按顺序），供解读台与口播步骤对齐 */
  interpretationDeskTemplate: RetrievedKnowledge[];
}

export interface WorkspaceAiOutput {
  callMode: {
    focusDimension: string;
    riskSignal: string;
    summary: string;
    /** 图二主标题，可改写知识库表述，默认可与报告 headline 一致 */
    headline?: string;
    /** 图二长文案：综合测评解读库，供销售直接照读或微调 */
    extendedBrief?: string;
    /** 高转化销售话术要点（短句列表） */
    salesHooks?: string[];
  };
  sopSteps: Array<{
    title: string;
    content: string;
  }>;
  dimensionInterpretations: Array<{
    name: string;
    childInterpretation: string;
    parentInterpretation: string;
    gapInterpretation: string;
  }>;
  courseRecommendations: Array<{
    module: string;
    reason: string;
    talkingPoint: string;
  }>;
}

function buildFallback(
  report: AssessmentReport,
  context?: {
    coreProblem?: string;
    parentType?: string;
    weakestDimension?: string;
    courseTalk?: string;
  },
  sopParsedSteps?: InterpretationSopStep[],
): WorkspaceAiOutput {
  const weakest = [...report.dimensionScores].sort((a, b) => a.childPercent - b.childPercent)[0];
  const focusDimension = context?.weakestDimension || weakest?.name || "沟通";
  const courseTalk =
    context?.courseTalk || report.courseRecommendations[0]?.talkingPoint || "说明为什么当前模块更适合他，而不是直接推销。";
  const problemText = context?.coreProblem || "当前的具体育儿问题";

  const defaultFiveSteps = [
    {
      title: "1. 开场建立权威",
      content: `先说明今天是一起看报告，不做评判，重点是帮家长看清“${problemText}”背后的真正卡点和下一步方法。`,
    },
    {
      title: "2. 代入感确认",
      content: `先围绕“${focusDimension}”询问家长最有感受的场景，让对方先说，优先让家长自己描述“${problemText}”最困扰的瞬间。`,
    },
    {
      title: "3. 解读优势与卡点",
      content: `先给家长看到孩子已有优势，再自然进入“${focusDimension}”为什么会持续拖住“${problemText}”的现实卡点和长期风险。`,
    },
    {
      title: "4. 连接课程模块",
      content: courseTalk,
    },
    {
      title: "5. 推进下一动作",
      content: `根据家长当前意愿，推进 1V1 深聊、直播、试听或后续跟进，但始终围绕“${problemText}”如何被解决来收口。`,
    },
  ];

  const sopSteps =
    sopParsedSteps && sopParsedSteps.length > 0
      ? sopParsedSteps.map((step) => ({
          title: step.title,
          content:
            step.content.length > 900
              ? `${step.content.slice(0, 900)}…\n\n（以上为知识库《解读台模版》原文节录；若上方未显示 AI 个性化话术，请按原文结合本客户现场口播。）`
              : `${step.content}\n\n（以上为知识库《解读台模版》原文；若上方未显示 AI 个性化话术，请按原文结合本客户现场口播。）`,
        }))
      : defaultFiveSteps;

  return {
    callMode: {
      focusDimension,
      riskSignal:
        report.burnout.percent > 60
          ? "家长倦怠偏高，解读时要先共情再讲方法。"
          : "家长还有行动意愿，适合从具体问题和未来画面入手。",
      summary: `当前这位家长更适合从“${focusDimension}”切入，围绕“${problemText}”先建立代入感，再衔接 ${report.courseRecommendations[0]?.module ?? "对应课程模块"}。`,
      headline: undefined,
      extendedBrief: [report.matchAnalysis, report.suggestions?.length ? `建议关注：${report.suggestions.slice(0, 3).join("；")}` : ""]
        .filter(Boolean)
        .join("\n\n"),
      salesHooks: undefined,
    },
    sopSteps,
    dimensionInterpretations: report.dimensionScores.map((dimension) =>
      buildDimensionInterpretation(dimension),
    ),
    courseRecommendations: report.courseRecommendations.map((item, index) => ({
      module: item.module,
      reason:
        index === 0
          ? `当前最优先先围绕“${focusDimension}”去解释为什么孩子会反复卡住，再顺势过渡到 ${item.module}。`
          : `在建立第一步改变之后，再把 ${item.module} 作为后续巩固模块，帮助家长看到更完整的方法路径。`,
      talkingPoint:
        index === 0
          ? `${item.talkingPoint} 先不要急着卖课，而是先让家长觉得“这门课正好在解决我眼前的问题”。`
          : `${item.talkingPoint} 用“先解决眼前问题，再系统补方法”的节奏去讲，阻力会更小。`,
    })),
  };
}

function buildDimensionInterpretation(dimension: DimensionScore) {
  const dimensionScenes: Record<string, { child: string; parent: string; gap: string }> = {
    需求: {
      child: "孩子很多时候不是故意对着干，而是不知道怎么把真实需求表达清楚。",
      parent: "家长这边如果一着急，就容易先纠正行为，没先看见孩子背后的需要。",
      gap: "这一维更适合从“先看懂需求，再谈规则”切进去。",
    },
    接纳情绪: {
      child: "孩子的情绪如果总是被压住，表面安静了，里面的不安和对抗反而会累积。",
      parent: "家长在情绪面前如果急着讲道理，往往会让孩子觉得‘我不被理解’。",
      gap: "这一维最怕一上来就纠错，应该先共情，再慢慢带到方法层。",
    },
    沟通: {
      child: "很多冲突不是孩子不听，而是沟通一开始就进了对抗通道。",
      parent: "家长如果习惯用提醒、催促、说服推进，短期有效，长期容易越说越远。",
      gap: "这一维更适合帮家长先看到‘说了很多但孩子没真正听进去’的原因。",
    },
    家庭系统: {
      child: "孩子的问题常常不只是孩子个人问题，而是整个家庭配合方式带出来的结果。",
      parent: "家长一方再努力，如果家庭节奏不一致，孩子也容易反复摇摆。",
      gap: "这一维更适合从家庭协同、规则一致和角色分工去解读。",
    },
    自律: {
      child: "自律薄弱往往不是孩子单纯懒散，而是外部结构还没搭起来，内在坚持也没形成。",
      parent: "家长如果总靠催、盯、提醒，孩子会更依赖外部推动，很难长出稳定的执行力。",
      gap: "这一维适合自然衔接到‘结构、激励、执行机制’这些方法。",
    },
    自主: {
      child: "孩子的自主不是放任出来的，而是在可承接的边界里一点点长出来的。",
      parent: "家长如果担心出错就包办太多，孩子会慢慢失去尝试和负责的空间。",
      gap: "这一维更适合从‘给空间但不失边界’去解读。",
    },
  };
  const scene = dimensionScenes[dimension.name] ?? {
    child: "",
    parent: "",
    gap: "",
  };
  const childInterpretation =
    dimension.childPercent >= 70
      ? `孩子在${dimension.name}上已经有比较好的基础，说明这一块不是当前最核心的短板。${scene.child}`
      : dimension.childPercent >= 40
        ? `孩子在${dimension.name}上有一定基础，但还不够稳定，容易一到具体场景就掉下来。${scene.child}`
        : `孩子在${dimension.name}上当前比较薄弱，这说明这里已经开始影响日常互动和后续成长。${scene.child}`;

  const parentInterpretation =
    dimension.parentPercent >= 70
      ? `家长在${dimension.name}上的支持相对稳定，这是这份报告里很重要的优势。${scene.parent}`
      : dimension.parentPercent >= 40
        ? `家长在${dimension.name}上的做法不是完全没有方法，但还没有形成稳定抓手。${scene.parent}`
        : `家长在${dimension.name}上的支持还比较吃经验和情绪，容易反复用力却效果不稳。${scene.parent}`;

  const gapInterpretation =
    dimension.gap >= 15
      ? `当前更像“家长高、孩子低”，也就是家长已经很努力了，但孩子还接不住。风险是要求走得比孩子当前能力更快，孩子容易挫败。${scene.gap}`
      : dimension.gap <= -15
        ? `当前更像“孩子高、家长低”，说明孩子不是没有潜力，而是家长这边的支持方式还可以升级。${scene.gap}`
        : `当前匹配度相对接近，说明这里既不是最强优势，也不是最危险断点，比较适合作为建立信任和推动改变的切入口。${scene.gap}`;

  return {
    name: dimension.name,
    childInterpretation,
    parentInterpretation,
    gapInterpretation,
  };
}

/** 拼接检索正文：不再把「整卷问卷」类文档标题刷在每一段前，避免界面像问卷 dump */
function summarizeKnowledgeItems(items: RetrievedKnowledge[]) {
  return items
    .map((item) => sanitizeKnowledgeChunkBody(item.content).trim())
    .filter(Boolean)
    .join("\n\n");
}

/** 模型或底稿若仍夹带链接/题干痕迹，展示前最后一道清洗 */
function sanitizeWorkspaceAiOutputForDisplay(output: WorkspaceAiOutput): WorkspaceAiOutput {
  return {
    ...output,
    callMode: {
      ...output.callMode,
      headline: output.callMode.headline
        ? sanitizeKnowledgeChunkBody(output.callMode.headline).slice(0, 120)
        : undefined,
      summary: sanitizeKnowledgeChunkBody(output.callMode.summary),
      extendedBrief: output.callMode.extendedBrief
        ? sanitizeKnowledgeChunkBody(output.callMode.extendedBrief)
        : undefined,
      riskSignal: sanitizeKnowledgeChunkBody(output.callMode.riskSignal),
      focusDimension: sanitizeKnowledgeChunkBody(output.callMode.focusDimension),
      salesHooks: output.callMode.salesHooks?.map((h) => sanitizeKnowledgeChunkBody(h).slice(0, 200)),
    },
    dimensionInterpretations: output.dimensionInterpretations.map((d) => ({
      ...d,
      childInterpretation: sanitizeKnowledgeChunkBody(d.childInterpretation),
      parentInterpretation: sanitizeKnowledgeChunkBody(d.parentInterpretation),
      gapInterpretation: sanitizeKnowledgeChunkBody(d.gapInterpretation),
    })),
    sopSteps: output.sopSteps?.map((s) => ({
      ...s,
      content: sanitizeKnowledgeChunkBody(s.content),
    })),
    courseRecommendations: output.courseRecommendations?.map((c) => ({
      ...c,
      reason: sanitizeKnowledgeChunkBody(c.reason),
      talkingPoint: sanitizeKnowledgeChunkBody(c.talkingPoint),
    })),
  };
}

function alignSopStepsToBlueprint(
  blueprint: InterpretationSopStep[],
  output: WorkspaceAiOutput,
): WorkspaceAiOutput {
  if (!blueprint.length) return output;
  const padded = [...(output.sopSteps ?? [])];
  while (padded.length < blueprint.length) {
    padded.push({
      title: blueprint[padded.length].title,
      content: `请围绕「${blueprint[padded.length].title}」结合本客户测评与知识库该步要求现场口播。`,
    });
  }
  return {
    ...output,
    sopSteps: blueprint.map((step, index) => ({
      title: step.title,
      content: padded[index]?.content?.trim() || `请围绕「${step.title}」结合本客户测评与知识库该步要求现场口播。`,
    })),
  };
}

export async function generateWorkspaceAiOutput(params: {
  customerName: string;
  coreProblem: string;
  parentingRole: string;
  parentType: string;
  report: AssessmentReport;
  knowledge: WorkspaceKnowledge;
  /** 来自知识库《测评解读SOP》解析后的步骤；若存在，sopSteps 条数与标题须与其一致 */
  sopParsedSteps?: InterpretationSopStep[];
  sharedTemplates?: Array<{
    title: string;
    content: string;
    applicableDimension?: string | null;
    applicableStage?: string | null;
  }>;
}) {
  const weakest = [...params.report.dimensionScores].sort((a, b) => a.childPercent - b.childPercent)[0];
  const weakestDimension = weakest?.name ?? "";
  const fallback = buildFallback(
    params.report,
    {
      coreProblem: params.coreProblem,
      parentType: params.parentType,
      weakestDimension,
      courseTalk: params.report.courseRecommendations[0]?.talkingPoint,
    },
    params.sopParsedSteps,
  );

  const sopBlueprintText = summarizeKnowledgeItems(params.knowledge.interpretationDeskTemplate);
  const sopN = params.sopParsedSteps?.length ?? 0;

  const userPrompt = JSON.stringify(
    {
      customerName: params.customerName,
      coreProblem: params.coreProblem,
      parentingRole: params.parentingRole,
      parentType: params.parentType,
      weakestDimension: weakest?.name ?? "",
      report: {
        overallScore: params.report.overallScore,
        dimensionScores: params.report.dimensionScores,
        matchAnalysis: params.report.matchAnalysis,
        courseRecommendations: params.report.courseRecommendations,
      },
      retrievedKnowledge: params.knowledge,
      sopParsedSteps: params.sopParsedSteps ?? [],
      assessmentInterpretationSopDocument: sopBlueprintText || "（知识库中未检索到标题包含「解读台模版」的文档）",
      sharedTemplates: params.sharedTemplates ?? [],
      styleGuide: {
        requiredTone: [
          "像田老师团队里的专业顾问，不像硬销售",
          "先共情，再判断，再给出方法感",
          "少讲套话，多讲家长能听懂的真实场景",
          "不要 6 个维度都写成同样句式",
          "每个维度都要写出这个家庭此刻最像的风险和切入口",
        ],
        interpretationHints: {
          interpretation: summarizeKnowledgeItems(params.knowledge.interpretation),
          scripts: summarizeKnowledgeItems(params.knowledge.scripts),
          style: summarizeKnowledgeItems(params.knowledge.style),
          forbidden: summarizeKnowledgeItems(params.knowledge.forbidden),
          cases: summarizeKnowledgeItems(params.knowledge.cases),
          courses: summarizeKnowledgeItems(params.knowledge.courses),
        },
      },
      outputFormat: {
        callMode: {
          focusDimension: "string",
          riskSignal: "string",
          summary: "string",
          headline: "string",
          extendedBrief: "string",
          salesHooks: ["string"],
        },
        sopSteps: [{ title: "string", content: "string" }],
        dimensionInterpretations: [
          {
            name: "string",
            childInterpretation: "string",
            parentInterpretation: "string",
            gapInterpretation: "string",
          },
        ],
        courseRecommendations: [
          {
            module: "string",
            reason: "string",
            talkingPoint: "string",
          },
        ],
      },
    },
    null,
    2,
  );

  const sopRules =
    sopN > 0
      ? `【解读台模版 · 流程对齐】user JSON 中 sopParsedSteps 为知识库《解读台模版》中「解读 7 步法」解析出的 ${sopN} 步（含每步 title 与原文 content）。sopSteps 必须恰好 ${sopN} 条；sopSteps[i].title 必须与 sopParsedSteps[i].title 完全一致（逐字）。sopSteps[i].content 为该步针对本客户的电话口播话术（约 80～240 字）：必须融合该步原文中的关键动作与要求、测评维度与家长问题，写成可直接照读的高转化表达；禁止大段复述 sopParsedSteps[i].content，禁止与原文步骤目标冲突。`
      : `【测评解读库 · 解读台模版】assessmentInterpretationSopDocument 为《解读台模版》全文。若 sopParsedSteps 为空或文档未命中：sopSteps 必须恰好 5 条；顺序与阶段须尽量贴合文档，否则按「开场信任 → 代入感 → 优势卡点 → 课程 → 推进动作」默认五段，每条 content 为可直接口播话术（80～220 字）。`;

  const raw = await generateDoubaoJson<WorkspaceAiOutput>({
    system: `你是田老师家庭教育体系下的销售解读助手。根据测评结果、客户问题、检索到的知识库内容，输出适合销售一边通话一边使用的中文 JSON。

工作台页面上的「家长类型长文案」与「六维分档解读」已由系统在测评解读库中单独匹配展示；本 JSON 侧重通话摘要与口播步骤。

【测评 · 维度与图二占位】dimensionInterpretations 与 callMode.headline、callMode.extendedBrief 可与 report 简要一致即可（若无需可简短）；重点放在 focusDimension、riskSignal、summary 与 salesHooks。

${sopRules}

【通话模式】callMode.focusDimension、riskSignal、summary 结合测评；callMode.salesHooks 为 4～7 条极短话术要点。正文禁止网址、问卷题号、内部提示词。

【其它】课程挂钩须引用课程体系库说明「为何先讲该模块」。遵守 styleGuide 中的禁用与话术风格。`,
    user: userPrompt,
    fallback: sanitizeWorkspaceAiOutputForDisplay(fallback),
    temperature: 0.35,
  });

  const polished = params.sopParsedSteps?.length
    ? alignSopStepsToBlueprint(params.sopParsedSteps, raw)
    : raw;
  return sanitizeWorkspaceAiOutputForDisplay(polished);
}
