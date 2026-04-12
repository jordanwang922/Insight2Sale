import { generateDoubaoJson } from "@/lib/ai/doubao";
import { AssessmentReport, DimensionScore } from "@/features/assessment/types";
import { RetrievedKnowledge } from "@/features/knowledge/retrieval";

interface WorkspaceKnowledge {
  interpretation: RetrievedKnowledge[];
  courses: RetrievedKnowledge[];
  scripts: RetrievedKnowledge[];
  forbidden: RetrievedKnowledge[];
  style: RetrievedKnowledge[];
  cases: RetrievedKnowledge[];
}

export interface WorkspaceAiOutput {
  callMode: {
    focusDimension: string;
    riskSignal: string;
    summary: string;
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
): WorkspaceAiOutput {
  const weakest = [...report.dimensionScores].sort((a, b) => a.childPercent - b.childPercent)[0];
  const focusDimension = context?.weakestDimension || weakest?.name || "沟通";
  const courseTalk =
    context?.courseTalk || report.courseRecommendations[0]?.talkingPoint || "说明为什么当前模块更适合他，而不是直接推销。";
  const problemText = context?.coreProblem || "当前的具体育儿问题";
  return {
    callMode: {
      focusDimension,
      riskSignal:
        report.burnout.percent > 60
          ? "家长倦怠偏高，解读时要先共情再讲方法。"
          : "家长还有行动意愿，适合从具体问题和未来画面入手。",
      summary: `当前这位家长更适合从“${focusDimension}”切入，围绕“${problemText}”先建立代入感，再衔接 ${report.courseRecommendations[0]?.module ?? "对应课程模块"}。`,
    },
    sopSteps: [
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
    ],
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

function summarizeKnowledgeItems(items: RetrievedKnowledge[]) {
  return items.map((item) => `${item.title}：${item.content}`).join("\n");
}

export async function generateWorkspaceAiOutput(params: {
  customerName: string;
  coreProblem: string;
  parentingRole: string;
  parentType: string;
  report: AssessmentReport;
  knowledge: WorkspaceKnowledge;
  sharedTemplates?: Array<{
    title: string;
    content: string;
    applicableDimension?: string | null;
    applicableStage?: string | null;
  }>;
}) {
  const weakest = [...params.report.dimensionScores].sort((a, b) => a.childPercent - b.childPercent)[0];
  const weakestDimension = weakest?.name ?? "";
  const fallback = buildFallback(params.report, {
    coreProblem: params.coreProblem,
    parentType: params.parentType,
    weakestDimension,
    courseTalk: params.report.courseRecommendations[0]?.talkingPoint,
  });

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

  return generateDoubaoJson<WorkspaceAiOutput>({
    system:
      "你是田老师家庭教育体系下的销售解读助手。你的任务是根据测评结果、客户问题和检索到的课程/话术/禁用表达知识，输出适合销售一边通话一边使用的中文 JSON。要求专业、温和、确定，不要强销售，不要居高临下。SOP步骤必须符合：开场建立信任 -> 先确认代入感 -> 先优势后卡点 -> 连接课程模块 -> 推进下一动作。维度解读必须因维度而异，结合客户当前问题、家长类型、孩子表现和家长支持差值，写出更像真人顾问会说的话，避免模板腔。课程挂钩必须基于检索到的课程体系库与当前客户问题来说明“为什么先讲这个模块”，不能只重复模块名。",
    user: userPrompt,
    fallback,
  });
}
