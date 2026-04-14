declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export const GlobalWorkerOptions: { workerSrc: string };

  type PdfPage = {
    getTextContent: () => Promise<{ items: unknown[] }>;
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (opts: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  };

  type PdfDoc = {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PdfPage>;
    destroy: () => Promise<void>;
  };

  export function getDocument(src?: unknown): { promise: Promise<PdfDoc> };
}
