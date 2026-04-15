import { headers } from "next/headers";

function baseFromEnvUrl(raw: string | undefined): string {
  const s = raw?.trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

/**
 * 当前站点根 URL（协议 + 主机[:端口]），用于拼测评等完整链接。
 *
 * 顺序：① 本次请求的 Host / X-Forwarded-*（与浏览器地址栏一致，部署公网域名后自动变为公网）
 *      ② NEXT_PUBLIC_SITE_URL → AUTH_URL → NEXTAUTH_URL（代理未传 Host 时的兜底）
 *
 * 不在代码里写死域名；本地开发显示 localhost、部署后显示公网域名，取决于用户实际访问的 URL。
 */
export async function getPublicSiteUrl(): Promise<string> {
  const h = await headers();
  const rawHost = h.get("x-forwarded-host") ?? h.get("host");
  const host = rawHost?.split(",")[0]?.trim();
  if (host) {
    const rawProto = h.get("x-forwarded-proto");
    const proto = rawProto?.split(",")[0]?.trim() ?? "http";
    return `${proto}://${host}`;
  }

  const fromEnv =
    baseFromEnvUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    baseFromEnvUrl(process.env.AUTH_URL) ||
    baseFromEnvUrl(process.env.NEXTAUTH_URL);
  return fromEnv;
}
