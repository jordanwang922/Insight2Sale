import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { embedText, chunkKnowledgeText } from "@/features/knowledge/rag";

/** pdf-parse / mammoth / pdf-ocr（含 pdfjs、tesseract、canvas）体积与运行时内存都大，勿顶层静态 import，避免 dev 首次编译与常驻进程拖垮内存 */

const storageRoot = path.join(process.cwd(), "storage", "knowledge-base");

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\p{Letter}\p{Number}._-]+/gu, "-");
}

export async function persistKnowledgeFile(file: File) {
  await mkdir(storageRoot, { recursive: true });
  const fileName = `${Date.now()}-${sanitizeFileName(file.name || "knowledge-upload")}`;
  const destination = path.join(storageRoot, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(destination, buffer);

  return {
    fileName: file.name,
    filePath: destination,
    buffer,
  };
}

export async function extractKnowledgeText(file: File, buffer: Buffer) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    const embedded = result.text.trim();

    let ocr = "";
    try {
      const { extractPdfOcrText } = await import("@/features/knowledge/pdf-ocr");
      ocr = await extractPdfOcrText(buffer);
    } catch {
      // OCR 依赖本机 worker/内存，失败时仍保留嵌入文字层，避免上传整体失败
    }

    if (!ocr) {
      return embedded;
    }

    if (!embedded) {
      return ocr;
    }

    return `${embedded}\n\n--- PDF 页面图像 OCR 补充 ---\n${ocr}`;
  }

  if (lowerName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.default.extractRawText({ buffer });
    return result.value.trim();
  }

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    return extractExcelPlainText(buffer);
  }

  return buffer.toString("utf-8").trim();
}

/**
 * 将 Excel 各工作表转为可读纯文本（CSV 行），供切片与向量化。
 * 使用动态 import，避免非 Excel 上传路径加载 xlsx。
 */
async function extractExcelPlainText(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const blocks: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet).trim();
    if (!csv) continue;
    blocks.push(`--- 工作表：${sheetName} ---\n${csv}`);
  }

  return blocks.join("\n\n").trim();
}

export function summarizeKnowledge(rawText: string) {
  const normalized = rawText.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 220);
}

export function buildKnowledgeChunks(rawText: string) {
  return chunkKnowledgeText(rawText).map((chunk) => ({
    chunkIndex: chunk.index,
    content: chunk.content,
    embeddingJson: JSON.stringify(embedText(chunk.content)),
    embeddingModel: "local-hash-v1",
    tokensJson: JSON.stringify([]),
  }));
}
