import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const storageRoot = path.join(process.cwd(), "storage", "promotion-copy-images");
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\p{Letter}\p{Number}._-]+/gu, "-");
}

export interface PromotionCopyImageAsset {
  fileName: string;
  storedName: string;
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
}

export async function persistPromotionCopyImages(files: File[]) {
  await mkdir(storageRoot, { recursive: true });

  const assets: PromotionCopyImageAsset[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`文件 ${file.name} 不是图片，无法上传。`);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) continue;
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error(`图片 ${file.name} 超过 8MB，请压缩后重试。`);
    }

    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(file.name || "promotion-image")}`;
    const destination = path.join(storageRoot, storedName);
    await writeFile(destination, buffer);
    assets.push({
      fileName: file.name,
      storedName,
      relativePath: path.join("storage", "promotion-copy-images", storedName).replace(/\\/g, "/"),
      mimeType: file.type,
      sizeBytes: buffer.length,
    });
  }

  return assets;
}

export async function safeUnlinkPromotionCopyImages(assets: PromotionCopyImageAsset[]) {
  for (const asset of assets) {
    if (!asset?.relativePath) continue;
    try {
      await unlink(path.join(process.cwd(), asset.relativePath));
    } catch {
      // ignore missing files
    }
  }
}
