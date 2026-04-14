import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { callRecordingListWhere } from "@/features/crm/call-recording-access";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("未登录", { status: 401 });
  }
  const { id } = await ctx.params;

  const row = await prisma.callRecording.findFirst({
    where: { id, ...callRecordingListWhere(session) },
  });
  if (!row) {
    return new NextResponse("未找到", { status: 404 });
  }

  const absolutePath = join(process.cwd(), row.audioFilePath);
  try {
    await stat(absolutePath);
  } catch {
    return new NextResponse("文件不存在", { status: 404 });
  }

  const buf = await readFile(absolutePath);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
