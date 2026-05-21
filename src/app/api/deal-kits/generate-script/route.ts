import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateDealKitScriptResult } from "@/features/deal-kit/script";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ status: "error", message: "请先登录后再执行操作。" }, { status: 401 });
    }

    const body = (await request.json()) as {
      query?: unknown;
      entryIds?: unknown;
    };

    const query = typeof body.query === "string" ? body.query : "";
    const entryIds = Array.isArray(body.entryIds) ? body.entryIds.map((item) => String(item)) : [];
    const result = await generateDealKitScriptResult({
      userId: session.user.id,
      query,
      entryIds,
    });

    const statusCode = result.status === "error" ? 400 : 200;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成成交话术失败，请稍后再试。";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
