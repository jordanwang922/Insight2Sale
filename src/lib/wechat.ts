/** 微信内置浏览器、企业微信等 */
export function isWeChatInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /micromessenger|wxwork/i.test(navigator.userAgent);
}
