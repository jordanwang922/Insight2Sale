import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCustomerForUser, callRecordingListWhere } from "@/features/crm/call-recording-access";
import { processCallRecordingAfterUpload } from "@/features/crm/call-recording-process";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 45 * 1024 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const items = await prisma.callRecording.findMany({
    where: callRecordingListWhere(session),
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { id: true, wechatNickname: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "无法读取表单" }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "缺少录音文件" }, { status: 400 });
  }

  const customerIdRaw = form.get("customerId");
  const customerId =
    typeof customerIdRaw === "string" && customerIdRaw.trim() ? customerIdRaw.trim() : null;

  if (customerId) {
    const ok = await canAccessCustomerForUser(session, customerId);
    if (!ok) {
      return NextResponse.json({ error: "无权关联该客户" }, { status: 403 });
    }
  }

  const startedAt = new Date(String(form.get("startedAt") ?? ""));
  const endedAt = new Date(String(form.get("endedAt") ?? ""));
  const durationSeconds = Math.max(0, parseInt(String(form.get("durationSeconds") ?? "0"), 10) || 0);

  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    return NextResponse.json({ error: "时间字段无效" }, { status: 400 });
  }

  const buf = Buffer.from(await audio.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "录音为空" }, { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "文件过大（单段不超过约 45MB）" }, { status: 400 });
  }

  const mimeType = audio.type || "audio/webm";
  const id = crypto.randomUUID();
  const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("mpeg") ? "mp3" : "webm";
  const relativePath = join("storage", "call-recordings", `${id}.${ext}`);
  const absolutePath = join(process.cwd(), relativePath);

  await mkdir(join(process.cwd(), "storage", "call-recordings"), { recursive: true });
  await writeFile(absolutePath, buf);

  const row = await prisma.callRecording.create({
    data: {
      id,
      ownerId: session.user.id,
      customerId,
      startedAt,
      endedAt,
      durationSeconds,
      audioFilePath: relativePath.replace(/\\/g, "/"),
      mimeType,
      sizeBytes: buf.length,
      processingStatus: "pending",
    },
  });

  await processCallRecordingAfterUpload(row.id);

  const fresh = await prisma.callRecording.findUnique({
    where: { id: row.id },
    include: {
      customer: { select: { id: true, wechatNickname: true } },
    },
  });

  return NextResponse.json({ ok: true, recording: fresh });
}
