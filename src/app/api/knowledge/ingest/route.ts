import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ingestKnowledgeFromFormData } from "@/features/knowledge/ingest-document";
import { isManagerOrAdmin } from "@/lib/role-access";

export const runtime = "nodejs";
/** 大 PDF + OCR 可能较慢 */
export const maxDuration = 300;

function safeRedirectPath(raw: FormDataEntryValue | null, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.includes("//")) return fallback;
  if (!t.startsWith("/dashboard/knowledge")) return fallback;
  return t;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isManagerOrAdmin(session.user.role)) {
      return NextResponse.json({ ok: false, error: "未登录或无权上传知识库。" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ ok: false, error: "无法读取上传内容。" }, { status: 400 });
    }

    const defaultSuccess = "/dashboard/knowledge";
    const redirectSuccess = safeRedirectPath(formData.get("redirectSuccess"), defaultSuccess);

    try {
      await ingestKnowledgeFromFormData(formData, session.user.id);
      const okUrl = new URL(redirectSuccess, request.url);
      okUrl.searchParams.set("uploaded", "1");
      /** fetch 跟随 302 会去 GET 整页 RSC，若页面偶发 500 会被误判为「上传失败」；改为 JSON + 前端跳转，与页面渲染解耦 */
      return NextResponse.json({
        ok: true,
        redirectUrl: `${okUrl.pathname}${okUrl.search}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "上传失败";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
