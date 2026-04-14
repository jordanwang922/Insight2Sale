import type { AssessmentReport } from "@/features/assessment/types";
import { CANONICAL_INTERPRETATION_DESK_STEP_7_BLOCK } from "@/features/sales/interpretation-desk-canonical-overrides";
import { parseJson } from "@/lib/utils";

/** 第 7 步「最想改善」：优先报告 salesSummary，否则取亲子差值绝对值最大的维度 */
export function pickWeakestDimensionNameForDesk(
  report:
    | (AssessmentReport & {
        salesSummary?: { weakestDimension?: string; headline?: string; riskSignal?: string };
      })
    | null,
): string | null {
  if (!report?.dimensionScores?.length) return null;
  const fromSummary = report.salesSummary?.weakestDimension?.trim();
  if (fromSummary) return fromSummary;
  const sorted = [...report.dimensionScores].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  return sorted[0]?.name?.trim() ?? null;
}

/** 解读台 SOP 内联按钮占位（与 InterpretationDeskMarkdownBlocks 解析一致） */
export const INTERPRETATION_DESK_COPY_MARK = "⟦DESK_COPY⟧";

export type InterpretationDeskLiveContext = {
  consultantName: string;
  /** 孩子年龄段展示，如「7-9岁」 */
  childAgeDisplay: string;
  /** 根据年龄段推断的学段简述 */
  gradeStageDisplay: string;
  /** 当前最困扰的核心问题 */
  coreConcernDisplay: string;
  /**
   * ❤ 话术里「问卷里孩子信息」：有档案年龄段时用于【比如您家7-9岁的孩子】；
   * 无则去掉整段【】，句子直连「最让您头疼…」
   */
  childDescriptorForHeartLine: string | null;
  /** 测评摘要中的薄弱维度名，用于第 7 步【最想改善维度】 */
  weakestDimensionName: string | null;
};

function normalizeNewlines(s: string) {
  return s.replace(/\r\n/g, "\n");
}

/**
 * 从客户档案中的 childAgeRanges（JSON 数组字符串）生成「年龄」展示文案。
 */
export function formatChildAgeForDesk(childAgeRangesJson: string): string {
  const parsed = parseJson<string[] | string>(childAgeRangesJson, []);
  const labels = Array.isArray(parsed) ? parsed : [String(parsed)];
  const cleaned = labels.map((s) => s.trim()).filter(Boolean);
  if (!cleaned.length) return "（未填写孩子年龄段）";
  return cleaned.join("、");
}

/**
 * 根据年龄段文案推断小学/初中/高中等（启发式，供口播参考）。
 */
export function inferSchoolStageFromChildAgeRanges(childAgeRangesJson: string): string {
  const raw = formatChildAgeForDesk(childAgeRangesJson);
  if (raw.startsWith("（未填写")) return "（学龄未填）";

  const s = raw.replace(/\s+/g, "");
  const singleAge = /(\d+)\s*岁/.exec(s);
  if (singleAge) {
    const a = parseInt(singleAge[1]!, 10);
    if (a <= 3) return "婴幼儿段";
    if (a <= 6) return "幼儿园/学前";
    if (a <= 12) return "小学";
    if (a <= 15) return "初中";
    if (a <= 18) return "高中";
    return "成年后";
  }

  const range = /(\d+)\s*[-–~～]\s*(\d+)/.exec(s);
  if (range) {
    const mid = (parseInt(range[1]!, 10) + parseInt(range[2]!, 10)) / 2;
    if (mid <= 4) return "幼儿园/学前";
    if (mid <= 12) return "小学";
    if (mid <= 15) return "初中";
    if (mid <= 18) return "高中";
    return "高中以上";
  }

  if (/婴|幼|托|园/.test(raw)) return "幼儿园/学前";
  if (/小学/.test(raw)) return "小学";
  if (/初中/.test(raw)) return "初中";
  if (/高中/.test(raw)) return "高中";

  return raw.length <= 12 ? raw : "（请结合档案判断学段）";
}

/**
 * 心形引导语中孩子信息：来自客户档案「孩子年龄段」（与测评问卷 intake 一致）。
 * 无有效数据时返回 null，由上层去掉【】整段。
 */
export function buildChildDescriptorForHeartLine(childAgeRangesJson: string): string | null {
  const raw = formatChildAgeForDesk(childAgeRangesJson);
  if (!raw || raw.startsWith("（未填写")) return null;
  return `比如您家${raw}的孩子`;
}

/**
 * 在解读台正文上注入：顾问姓名、复制测评按钮占位、测评结果相关高亮字段。
 * 不改变知识库原文结构，仅替换占位符与合并部分换行。
 */
export function applyInterpretationDeskLiveData(markdown: string, ctx: InterpretationDeskLiveContext): string {
  let t = normalizeNewlines(markdown);

  t = t.replace(/【登录人的名字】/g, ctx.consultantName.trim() || "顾问");

  t = t.replace(
    /【做一个按钮叫\s*[""\u201c\u201d]?\s*复制智慧父母养育测评\s*[""\u201c\u201d]?\s*】/g,
    INTERPRETATION_DESK_COPY_MARK,
  );

  t = t.replace(/【年龄从测评里复制】/g, `【${ctx.childAgeDisplay}】`);
  t = t.replace(/【年级自己判断】/g, `【${ctx.gradeStageDisplay}】`);
  t = t.replace(/【从测评里复制】/g, `【${ctx.coreConcernDisplay || "（未填写）"}】`);

  /** 知识库常为旧版 PDF：强制覆盖第 7 步全文 + ❤ 行（不依赖仓库 fallback 是否被采用） */
  t = forceCanonicalStepSevenBlock(t);
  t = applyStep7WeakestDimension(t, ctx);
  t = forceCanonicalHeartQuestionLine(t, ctx);

  t = mergeLegacyMultilineDeskBlocks(t);

  return t;
}

/** 用《解读台模版》规范正文整体替换「第 7 步」至「没把握的，还是让学员去看直播」 */
function forceCanonicalStepSevenBlock(t: string): string {
  const re = /第\s*7\s*步[：：][\s\S]*?没把握的，还是让学员去看直播/;
  if (!re.test(t)) {
    if (/三、[""\u201c\u201d]禁忌清单/.test(t)) {
      return t.replace(
        /(三、[""\u201c\u201d]禁忌清单)/,
        `${CANONICAL_INTERPRETATION_DESK_STEP_7_BLOCK}\n\n$1`,
      );
    }
    return t;
  }
  return t.replace(re, CANONICAL_INTERPRETATION_DESK_STEP_7_BLOCK);
}

/**
 * ❤ 行：有孩子年龄段档案则显示【比如您家7-9岁的孩子】；无则去掉红框整段，句子直连「最让您头疼…」。
 * 覆盖知识库里任意旧版「AI 给出问卷里孩子…」文案。
 */
function forceCanonicalHeartQuestionLine(t: string, ctx: InterpretationDeskLiveContext): string {
  const desc = ctx.childDescriptorForHeartLine?.trim() || null;
  const line = desc
    ? `❤为了更好地帮助您，可以结合一个场景和行动简单告诉我，【${desc}】，最让您头疼的一个育儿问题是什么吗？`
    : `❤为了更好地帮助您，可以结合一个场景和行动简单告诉我，最让您头疼的一个育儿问题是什么吗？`;
  if (!/❤为了更好地帮助您/.test(t)) return t;
  return t.replace(/❤为了更好地帮助您，[\s\S]*?最让您头疼的一个育儿问题是什么吗？/, line);
}

function applyStep7WeakestDimension(t: string, ctx: InterpretationDeskLiveContext): string {
  const name = ctx.weakestDimensionName?.trim();
  if (name) {
    t = t.replace(/【最想改善维度】/g, `【${name}】`);
  } else {
    t = t.replace(/【最想改善维度】/g, "【（请结合对话填入最想改善的一点）】");
  }
  return t;
}

/** 知识库旧版分页仍可能把「我和您确认一下…」拆成多行时，并成一行 */
function mergeLegacyMultilineDeskBlocks(s: string): string {
  let t = s;
  t = t.replace(
    /我和您确认一下，您孩子的基本情况：([\s\S]*?)对吗？/,
    (_, inner) => {
      const oneLine = String(inner)
        .replace(/\s*\n+\s*/g, "")
        .replace(/[ \t]+/g, "")
        .trim();
      return `我和您确认一下，您孩子的基本情况：${oneLine}对吗？`;
    },
  );
  return t;
}
