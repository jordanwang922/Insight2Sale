import { readFile } from "node:fs/promises";
import { parentTypeDefinitions } from "@/features/assessment/questions";

const CANON_TYPE_NAMES = parentTypeDefinitions.map((d) => d.name);

function norm(s: string) {
  return s.replace(/\s+/g, "").trim();
}

/** 常见后缀：Excel 写「权威型」、系统或另一处写「权威型父母」时仍视为同一类型 */
const TYPE_LABEL_SUFFIXES = ["父母", "家长", "养育者"] as const;

/**
 * 判断两处文案是否指向同一养育类型（不要求 100% 字符串一致）。
 * 规则：去空格后相等，或一方比另一方仅多上述后缀之一（如 权威型 ↔ 权威型父母）。
 */
export function parentingTypeLabelsEquivalent(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  for (const suf of TYPE_LABEL_SUFFIXES) {
    if (x === y + suf || y === x + suf) return true;
    if (x.endsWith(suf) && x.slice(0, -suf.length) === y) return true;
    if (y.endsWith(suf) && y.slice(0, -suf.length) === x) return true;
  }
  return false;
}

/** 表头行：至少 2 个单元格与系统 9 型名称之一一致（含后缀等价） */
function findHeaderRowIndex(matrix: string[][]): number {
  for (let r = 0; r < Math.min(10, matrix.length); r++) {
    const row = matrix[r];
    if (!row?.length) continue;
    let hits = 0;
    for (const cell of row) {
      const t = String(cell ?? "").trim();
      if (!t) continue;
      if (CANON_TYPE_NAMES.some((n) => parentingTypeLabelsEquivalent(t, n))) hits++;
    }
    if (hits >= 2) return r;
  }
  return 0;
}

function findTypeColumnIndex(headerRow: string[], typeName: string): number {
  if (!norm(typeName)) return -1;

  for (let j = 0; j < headerRow.length; j++) {
    const h = String(headerRow[j] ?? "").trim();
    if (!h) continue;
    if (parentingTypeLabelsEquivalent(h, typeName)) return j;
  }
  return -1;
}

/**
 * 从二维表（首行为类型列头，首列为行标签）抽取某一「养育类型」整列。
 * 每个有行标签的维度输出为：`【标题】\n正文`，段落之间空一行；不输出工作表名（避免出现 Sheet1）。
 */
export function extractParentTypeColumnFromMatrix(
  matrix: string[][],
  typeName: string,
  _sheetLabel?: string,
): string | null {
  if (!matrix.length) return null;
  const headerRowIdx = findHeaderRowIndex(matrix);
  const headerRow = matrix[headerRowIdx] ?? [];
  const colIdx = findTypeColumnIndex(headerRow, typeName);
  if (colIdx < 0) return null;

  const sections: string[] = [];
  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r];
    const label = String(row?.[0] ?? "").trim();
    const cell = String(row?.[colIdx] ?? "").trim();
    if (!cell) continue;
    if (label) {
      sections.push(`【${label}】\n${cell}`);
    } else {
      sections.push(cell);
    }
  }
  const text = sections.join("\n\n").trim();
  return text.length >= 6 ? text : null;
}

/** 行标签是否像「隐性风险」类（只匹配首列，避免与其它行混淆） */
function rowMatchesRiskLabel(label: string): boolean {
  const n = norm(label);
  if (!n) return false;
  if (n.includes("关键提醒")) return false;
  if (n.includes("隐性风险")) return true;
  if (n.includes("需警惕") && n.includes("风险")) return true;
  return n.includes("风险") && (n.includes("警惕") || n.includes("隐性"));
}

function rowMatchesReminderLabel(label: string): boolean {
  const n = norm(label);
  return n.includes("关键提醒");
}

/**
 * 从矩阵中仅取当前养育类型列下「隐性风险」「关键提醒」等行的单元格（不混其它类型列）。
 * 用于通话模式短文案，与整列长文抽取共用同一套表头/列定位逻辑。
 */
export function extractCallModeCellsFromMatrix(
  matrix: string[][],
  typeName: string,
): { risk: string | null; reminder: string | null } {
  if (!matrix.length) return { risk: null, reminder: null };
  const headerRowIdx = findHeaderRowIndex(matrix);
  const headerRow = matrix[headerRowIdx] ?? [];
  const colIdx = findTypeColumnIndex(headerRow, typeName);
  if (colIdx < 0) return { risk: null, reminder: null };

  let risk: string | null = null;
  let reminder: string | null = null;
  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r];
    const label = String(row?.[0] ?? "").trim();
    const cell = String(row?.[colIdx] ?? "").trim();
    if (!label || !cell) continue;
    if (!risk && rowMatchesRiskLabel(label)) risk = cell;
    if (!reminder && rowMatchesReminderLabel(label)) reminder = cell;
    if (risk && reminder) break;
  }
  return { risk, reminder };
}

/** 从磁盘 Excel 原文件扫描各表，合并「风险 / 关键提醒」单元格（优先先出现的非空值） */
export async function extractCallModeMatrixSnippetsFromXlsxFile(
  filePath: string,
  typeName: string,
): Promise<{ risk: string | null; reminder: string | null }> {
  let risk: string | null = null;
  let reminder: string | null = null;
  try {
    const buffer = await readFile(filePath);
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
      const cells = extractCallModeCellsFromMatrix(matrix, typeName);
      if (cells.risk && !risk) risk = cells.risk;
      if (cells.reminder && !reminder) reminder = cells.reminder;
      if (risk && reminder) break;
    }
  } catch {
    /* empty */
  }
  return { risk, reminder };
}

/** 从入库 rawText（工作表 CSV 块）解析矩阵并抽取通话模式用单元格 */
export async function extractCallModeMatrixSnippetsFromStoredExcelRawText(
  rawText: string,
  typeName: string,
): Promise<{ risk: string | null; reminder: string | null }> {
  let risk: string | null = null;
  let reminder: string | null = null;
  const XLSX = await import("xlsx");

  let pos = 0;
  while (pos < rawText.length) {
    const mark = rawText.indexOf("---", pos);
    if (mark < 0) break;
    const headerMatch = /^---\s*工作表[：:]\s*([^\n]+)\s*---/.exec(rawText.slice(mark));
    if (!headerMatch) {
      pos = mark + 3;
      continue;
    }
    const afterHeader = mark + headerMatch[0].length;
    const nextMark = rawText.indexOf("---", afterHeader);
    const csvBody = (nextMark < 0 ? rawText.slice(afterHeader) : rawText.slice(afterHeader, nextMark)).trim();
    pos = nextMark >= 0 ? nextMark : rawText.length;

    if (!csvBody) continue;
    try {
      const wb = XLSX.read(csvBody, { type: "string" });
      const sn = wb.SheetNames[0];
      if (!sn) continue;
      const sheet = wb.Sheets[sn];
      if (!sheet) continue;
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
      const cells = extractCallModeCellsFromMatrix(matrix, typeName);
      if (cells.risk && !risk) risk = cells.risk;
      if (cells.reminder && !reminder) reminder = cells.reminder;
      if (risk && reminder) break;
    } catch {
      /* empty */
    }
  }

  if ((!risk || !reminder) && !rawText.includes("工作表")) {
    try {
      const wb = XLSX.read(rawText.trim(), { type: "string" });
      const sn = wb.SheetNames[0];
      if (sn) {
        const sheet = wb.Sheets[sn];
        if (sheet) {
          const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
          const cells = extractCallModeCellsFromMatrix(matrix, typeName);
          if (cells.risk && !risk) risk = cells.risk;
          if (cells.reminder && !reminder) reminder = cells.reminder;
        }
      }
    } catch {
      /* empty */
    }
  }

  return { risk, reminder };
}

/** 从磁盘上的 Excel 原文件按列抽取（保持矩阵结构，不混其它类型列） */
export async function extractParentTypeSnippetFromXlsxFile(
  filePath: string,
  typeName: string,
): Promise<string | null> {
  try {
    const buffer = await readFile(filePath);
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const parts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
      const block = extractParentTypeColumnFromMatrix(matrix, typeName, sheetName);
      if (block) parts.push(block);
    }
    return parts.length ? parts.join("\n\n") : null;
  } catch {
    return null;
  }
}

/**
 * 入库时 Excel 被转成 `--- 工作表：x ---\\nCSV` 存在 rawText，用同样规则按列解析。
 */
export async function extractParentTypeSnippetFromStoredExcelRawText(
  rawText: string,
  typeName: string,
): Promise<string | null> {
  const XLSX = await import("xlsx");
  const parts: string[] = [];

  let pos = 0;
  while (pos < rawText.length) {
    const mark = rawText.indexOf("---", pos);
    if (mark < 0) break;
    const headerMatch = /^---\s*工作表[：:]\s*([^\n]+)\s*---/.exec(rawText.slice(mark));
    if (!headerMatch) {
      pos = mark + 3;
      continue;
    }
    const sheetLabel = (headerMatch[1] ?? "").trim();
    const afterHeader = mark + headerMatch[0].length;
    const nextMark = rawText.indexOf("---", afterHeader);
    const csvBody = (nextMark < 0 ? rawText.slice(afterHeader) : rawText.slice(afterHeader, nextMark)).trim();
    pos = nextMark >= 0 ? nextMark : rawText.length;

    if (!csvBody) continue;
    try {
      const wb = XLSX.read(csvBody, { type: "string" });
      const sn = wb.SheetNames[0];
      if (!sn) continue;
      const sheet = wb.Sheets[sn];
      if (!sheet) continue;
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
      const block = extractParentTypeColumnFromMatrix(matrix, typeName);
      if (block) parts.push(block);
    } catch {
      // 解析失败则跳过该块
    }
  }

  if (!parts.length && !rawText.includes("工作表")) {
    try {
      const wb = XLSX.read(rawText.trim(), { type: "string" });
      const sn = wb.SheetNames[0];
      if (sn) {
        const sheet = wb.Sheets[sn];
        if (sheet) {
          const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
          const block = extractParentTypeColumnFromMatrix(matrix, typeName);
          if (block) parts.push(block);
        }
      }
    } catch {
      /* empty */
    }
  }

  return parts.length ? parts.join("\n\n") : null;
}
