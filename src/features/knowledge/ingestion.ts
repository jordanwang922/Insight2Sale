import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { embedText, chunkKnowledgeText } from "@/features/knowledge/rag";

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
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text.trim();
  }

  if (lowerName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  return buffer.toString("utf-8").trim();
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
