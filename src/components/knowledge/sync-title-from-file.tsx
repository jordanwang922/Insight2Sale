/** 去掉最后一个「.扩展名」；无点则返回原文件名 */
export function stripFileExtension(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return "";
  const lastSlash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  const base = lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return base;
  return base.slice(0, dot);
}
