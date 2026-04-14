export function knowledgeSourceTypeLabel(sourceType: string): string {
  switch (sourceType) {
    case "pdf":
      return "PDF 文件";
    case "docx":
      return "Word 文件";
    case "xlsx":
      return "Excel 文件";
    default:
      return "粘贴文本";
  }
}
