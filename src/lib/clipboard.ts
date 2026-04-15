/**
 * 跨浏览器复制。微信 X5：隐藏域不可近于「不可选」（opacity:0、pointer-events:none 等易导致失败），
 * 常用 left:-9999px + 仍占位的 textarea（与 Stack Overflow / MDN 讨论一致）。
 */

export type CopyTextResult = "clipboard" | "execCommand" | "share" | "failed";

function copyViaOffscreenTextarea(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("autocomplete", "off");
    ta.setAttribute("autocorrect", "off");
    ta.setAttribute("autocapitalize", "off");
    ta.setAttribute("spellcheck", "false");
    ta.style.cssText = [
      "position:fixed",
      "top:0",
      "left:-9999px",
      "width:1px",
      "height:1px",
      "padding:0",
      "border:0",
      "outline:0",
      "box-shadow:none",
      "background:transparent",
      "font-size:16px",
      "line-height:1",
    ].join(";");
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function copyViaTextareaScreenEdge(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "width:100%",
      "height:48px",
      "opacity:1",
      "z-index:2147483646",
      "font-size:16px",
      "padding:8px",
      "margin:0",
      "border:1px solid #ccc",
    ].join(";");
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function copyViaInputSync(text: string): boolean {
  try {
    const input = document.createElement("input");
    input.value = text;
    input.style.cssText = [
      "position:fixed",
      "left:-9999px",
      "top:0",
      "opacity:0",
      "width:1px",
      "height:1px",
    ].join(";");
    document.body.appendChild(input);
    input.focus();
    input.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

export function copyTextToClipboardSync(text: string): { ok: boolean; method: CopyTextResult } {
  if (typeof window === "undefined") {
    return { ok: false, method: "failed" };
  }
  if (copyViaOffscreenTextarea(text)) {
    return { ok: true, method: "execCommand" };
  }
  if (copyViaTextareaScreenEdge(text)) {
    return { ok: true, method: "execCommand" };
  }
  if (copyViaInputSync(text)) {
    return { ok: true, method: "execCommand" };
  }
  return { ok: false, method: "failed" };
}

export async function copyTextToClipboard(text: string): Promise<{ ok: boolean; method: CopyTextResult }> {
  if (typeof window === "undefined") {
    return { ok: false, method: "failed" };
  }

  const syncFirst = copyTextToClipboardSync(text);
  if (syncFirst.ok) {
    return syncFirst;
  }

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    } catch {
      if (copyTextToClipboardSync(text).ok) {
        return { ok: true, method: "execCommand" };
      }
    }
  }

  if (typeof navigator.share === "function") {
    try {
      const payload: ShareData = /^https?:\/\//i.test(text.trim())
        ? { url: text.trim() }
        : { text };
      const can =
        typeof navigator.canShare === "function" ? navigator.canShare(payload) : true;
      if (can) {
        await navigator.share(payload);
        return { ok: true, method: "share" };
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return { ok: false, method: "failed" };
      }
    }
  }

  return { ok: false, method: "failed" };
}
