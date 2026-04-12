import path from "node:path";
import { pathToFileURL } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { createWorker } from "tesseract.js";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

type TextItem = { str?: string };

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envFloat(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

let workerConfigured = false;

function ensurePdfWorker() {
  if (workerConfigured) return;
  const workerPath = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
  GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  workerConfigured = true;
}

function pageTextFromContent(textContent: { items: unknown[] }): string {
  const parts: string[] = [];
  for (const item of textContent.items) {
    if (item && typeof item === "object" && "str" in item) {
      const s = (item as TextItem).str;
      if (typeof s === "string" && s.length) parts.push(s);
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * 将 PDF 渲染为页面位图，用 Tesseract 做中英 OCR，用于补充「纯扫描 / 图片内文字」等 pdf-parse 无法拿到的内容。
 */
export async function extractPdfOcrText(buffer: Buffer): Promise<string> {
  if (process.env.PDF_OCR_DISABLE === "1" || process.env.PDF_OCR_DISABLE === "true") {
    return "";
  }

  const maxPages = envInt("PDF_OCR_MAX_PAGES", 40);
  const renderScale = envFloat("PDF_OCR_RENDER_SCALE", 1.75);
  /** 单页文本层字符数低于此值时，对该页做整页 OCR（或全文很短时强制 OCR）。 */
  const minPageTextChars = envInt("PDF_OCR_MIN_PAGE_TEXT_CHARS", 90);
  /** 全文嵌入文本过短（多为扫描件）时，对每一页都跑 OCR。 */
  const shortDocThreshold = envInt("PDF_OCR_SHORT_DOC_THRESHOLD", 220);
  /** `full`：每页都 OCR（适合图文混排、同页既有可选文字又有大图文字）；`hybrid`：默认省算力，可能漏掉「文字很多页里的一小块图」。 */
  const ocrMode = (process.env.PDF_OCR_MODE ?? "hybrid").toLowerCase();
  const forceFullOcr = ocrMode === "full";

  ensurePdfWorker();

  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pagesToProcess = Math.min(pdf.numPages, maxPages);

  const pageTexts: string[] = [];
  let fullEmbedded = "";

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const embedded = pageTextFromContent(textContent);
    fullEmbedded += embedded;
    pageTexts.push(embedded);
  }

  const needsFullOcr = forceFullOcr || fullEmbedded.length < shortDocThreshold;

  const ocrParts: string[] = [];
  const worker = await createWorker("chi_sim+eng");

  try {
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const embedded = pageTexts[pageNum - 1] ?? "";

      if (!forceFullOcr && !needsFullOcr && embedded.length >= minPageTextChars) {
        continue;
      }

      const viewport = page.getViewport({ scale: renderScale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      const png = canvas.toBuffer("image/png");
      const {
        data: { text },
      } = await worker.recognize(png);

      const cleaned = text.replace(/\s+/g, " ").trim();
      if (cleaned.length > 0) {
        ocrParts.push(`【第 ${pageNum} 页 OCR】\n${cleaned}`);
      }
    }
  } finally {
    await worker.terminate();
  }

  await pdf.destroy();

  return ocrParts.join("\n\n").trim();
}
