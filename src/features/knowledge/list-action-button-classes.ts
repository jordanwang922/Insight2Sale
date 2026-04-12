import type { CSSProperties } from "react";

/**
 * 知识库分类列表「编辑」「删除」共用内联排版，保证浏览器计算出的字号/行高一致。
 * （仅靠 class 时，`<a>` 与 `<button>` 仍可能表现不同。）
 */
export const KNOWLEDGE_LIST_ACTION_TEXT_STYLE: CSSProperties = {
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 500,
  fontStyle: "normal",
  letterSpacing: "normal",
};
