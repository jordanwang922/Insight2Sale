import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCustomerForUser, callRecordingListWhere } from "@/features/crm/call-recording-access";
import { parseHighlightsJson } from "@/features/crm/call-recording-process";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const row = await prisma.callRecording.findFirst({
    where: { id, ...callRecordingListWhere(session) },
    include: {
      customer: { select: { id: true, wechatNickname: true, phone: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  if (!row) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  return NextResponse.json({
    recording: {
      ...row,
      highlights: parseHighlightsJson(row.highlightsJson),
    },
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const existing = await prisma.callRecording.findFirst({
    where: { id, ...callRecordingListWhere(session) },
  });
  if (!existing) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  let body: { customerId?: string | null };
  try {
    body = (await request.json()) as { customerId?: string | null };
  } catch {
    return NextResponse.json({ error: "JSON 无效" }, { status: 400 });
  }

  const nextId =
    typeof body.customerId === "string" && body.customerId.trim() ? body.customerId.trim() : null;

  if (nextId) {
    const ok = await canAccessCustomerForUser(session, nextId);
    if (!ok) {
      return NextResponse.json({ error: "无权关联该客户" }, { status: 403 });
    }
  }

  const updated = await prisma.callRecording.update({
    where: { id },
    data: { customerId: nextId },
    include: {
      customer: { select: { id: true, wechatNickname: true } },
    },
  });

  return NextResponse.json({ ok: true, recording: updated });
}
