import { sanitizeKnowledgeChunkBody } from "@/features/knowledge/chunk-sanitize";
import { lookupCallModeMatrixSnippets } from "@/features/knowledge/interpretation-lookup";

export type CallModeBriefSegment = { text: string; emphasis?: boolean };

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * 2～3 句通话引导：测评最弱维 + 当前类型 + 矩阵内风险/提醒（仅该类型列对应行），关键词加粗由 segments 表达。
 */
export function buildCallModeBriefSegments(params: {
  weakestDimension: string;
  parentTypeName: string;
  matrixRisk: string | null;
  matrixReminder: string | null;
  burnoutPercent: number;
  coreProblem: string;
}): CallModeBriefSegment[] {
  const weakest = params.weakestDimension.trim() || "关键维度";
  const ptype = params.parentTypeName.trim() || "未识别";

  const burnoutRisk =
    params.burnoutPercent > 60
      ? "家长养育倦怠偏高，宜先共情再谈方法。"
      : "家长仍有行动意愿，可从具体问题与未来画面入手。";

  const riskBody = clip(
    sanitizeKnowledgeChunkBody(params.matrixRisk?.trim() || burnoutRisk),
    140,
  );
  const rem = params.matrixReminder?.trim()
    ? clip(sanitizeKnowledgeChunkBody(params.matrixReminder.trim()), 110)
    : null;
  const core = clip(params.coreProblem, 44);

  const segs: CallModeBriefSegment[] = [];

  segs.push({ text: "建议优先从 " });
  segs.push({ text: weakest, emphasis: true });
  segs.push({ text: " 切入（孩子侧该维最弱），当前养育风格为 " });
  segs.push({ text: ptype, emphasis: true });
  segs.push({ text: "。" });

  segs.push({ text: " " });
  if (params.matrixRisk?.trim()) {
    segs.push({ text: "该类型在知识库中的风险侧重：" });
    segs.push({ text: riskBody, emphasis: true });
    segs.push({ text: "。" });
  } else {
    segs.push({ text: "风险提示：" });
    segs.push({ text: riskBody, emphasis: true });
    segs.push({ text: "。" });
  }

  if (rem) {
    segs.push({ text: " " });
    segs.push({ text: "销售可先对齐 " });
    segs.push({ text: rem, emphasis: true });
    segs.push({ text: "，再自然过渡到方案。" });
  } else if (core) {
    segs.push({ text: " " });
    segs.push({ text: "可围绕家长自述的 " });
    segs.push({ text: `「${core}」`, emphasis: true });
    segs.push({ text: " 建立代入感。" });
  }

  return segs;
}

export async function buildWorkspaceCallModeBrief(params: {
  parentTypeName: string;
  assessmentTemplateId?: string;
  weakestDimension: string;
  burnoutPercent: number;
  coreProblem: string;
}): Promise<{ segments: CallModeBriefSegment[] }> {
  const { risk, reminder } = await lookupCallModeMatrixSnippets({
    parentTypeName: params.parentTypeName,
    assessmentTemplateId: params.assessmentTemplateId,
  });

  return {
    segments: buildCallModeBriefSegments({
      weakestDimension: params.weakestDimension,
      parentTypeName: params.parentTypeName,
      matrixRisk: risk,
      matrixReminder: reminder,
      burnoutPercent: params.burnoutPercent,
      coreProblem: params.coreProblem,
    }),
  };
}
