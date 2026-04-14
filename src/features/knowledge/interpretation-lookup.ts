import { prisma } from "@/lib/prisma";
import { sanitizeKnowledgeChunkBody } from "@/features/knowledge/chunk-sanitize";
import {
  extractCallModeMatrixSnippetsFromStoredExcelRawText,
  extractCallModeMatrixSnippetsFromXlsxFile,
  extractParentTypeSnippetFromStoredExcelRawText,
  extractParentTypeSnippetFromXlsxFile,
} from "@/features/knowledge/parent-type-matrix";
import type { DimensionScore } from "@/features/assessment/types";

/** 工作台家长类型解读仅允许从这两类标题的知识库条目中读取（测评解读库） */
const PARENT_TYPE_DOC_TITLE_MARKERS = ["父母养育的9种类型解读", "家长9型解析"] as const;

const TEMPLATE_DOC_FILTER = (assessmentTemplateId: string | undefined) =>
  assessmentTemplateId
    ? {
        OR: [
          { assessmentTemplateId },
          { assessmentTemplateId: null },
        ],
      }
    : {};

/**
 * 从指定条目中按 **Excel 矩阵列头 = 养育类型** 抽取当前类型整列（行标签 + 单元格），
 * 不混其它类型列；优先读上传保存的 .xlsx/.xls 原文件，否则解析 rawText 中的 CSV 块。
 */
export async function lookupParentTypeSnippet(params: {
  parentTypeName: string;
  assessmentTemplateId?: string;
}): Promise<string | null> {
  const name = params.parentTypeName?.trim();
  if (!name || name === "未识别") return null;

  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      enabled: true,
      category: "测评解读库",
      ...TEMPLATE_DOC_FILTER(params.assessmentTemplateId),
      OR: PARENT_TYPE_DOC_TITLE_MARKERS.map((segment) => ({
        title: { contains: segment },
      })),
    },
    select: { rawText: true, title: true, filePath: true, fileName: true },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  const parts: string[] = [];
  const seen = new Set<string>();

  for (const doc of docs) {
    let block: string | null = null;
    const lower = doc.fileName?.toLowerCase() ?? "";
    if (doc.filePath && (lower.endsWith(".xlsx") || lower.endsWith(".xls"))) {
      block = await extractParentTypeSnippetFromXlsxFile(doc.filePath, name);
    }
    if (!block) {
      block = await extractParentTypeSnippetFromStoredExcelRawText(doc.rawText, name);
    }
    if (!block?.trim()) continue;
    const key = block.slice(0, 160);
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(block.trim());
  }

  if (!parts.length) return null;
  return sanitizeKnowledgeChunkBody(parts.join("\n\n")).slice(0, 4500);
}

/**
 * 从与「9 型解读」相同的矩阵 Excel 中，仅取当前类型列 + 「隐性风险」「关键提醒」行，
 * 供通话模式短句使用（不混用其它类型列）。
 */
export async function lookupCallModeMatrixSnippets(params: {
  parentTypeName: string;
  assessmentTemplateId?: string;
}): Promise<{ risk: string | null; reminder: string | null }> {
  const name = params.parentTypeName?.trim();
  if (!name || name === "未识别") return { risk: null, reminder: null };

  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      enabled: true,
      category: "测评解读库",
      ...TEMPLATE_DOC_FILTER(params.assessmentTemplateId),
      OR: PARENT_TYPE_DOC_TITLE_MARKERS.map((segment) => ({
        title: { contains: segment },
      })),
    },
    select: { rawText: true, filePath: true, fileName: true },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  let risk: string | null = null;
  let reminder: string | null = null;

  for (const doc of docs) {
    const lower = doc.fileName?.toLowerCase() ?? "";
    let cells: { risk: string | null; reminder: string | null } = { risk: null, reminder: null };
    if (doc.filePath && (lower.endsWith(".xlsx") || lower.endsWith(".xls"))) {
      cells = await extractCallModeMatrixSnippetsFromXlsxFile(doc.filePath, name);
    }
    if (!cells.risk && !cells.reminder) {
      cells = await extractCallModeMatrixSnippetsFromStoredExcelRawText(doc.rawText, name);
    }
    if (cells.risk && !risk) risk = cells.risk;
    if (cells.reminder && !reminder) reminder = cells.reminder;
    if (risk && reminder) break;
  }

  return { risk, reminder };
}

export type KbWorkspaceInterpretation = {
  parentTypeSnippet: string | null;
  dimensionSnippets: Array<{
    name: string;
    level: "高" | "中" | "低";
    text: string | null;
  }>;
};

export async function buildKbWorkspaceInterpretation(params: {
  parentTypeName: string;
  dimensionScores: DimensionScore[];
  assessmentTemplateId?: string;
}): Promise<KbWorkspaceInterpretation> {
  const parentTypeSnippet = await lookupParentTypeSnippet({
    parentTypeName: params.parentTypeName,
    assessmentTemplateId: params.assessmentTemplateId,
  });

  return {
    parentTypeSnippet,
    dimensionSnippets: params.dimensionScores.map((d) => ({
      name: d.name,
      level: d.level,
      text: null,
    })),
  };
}
