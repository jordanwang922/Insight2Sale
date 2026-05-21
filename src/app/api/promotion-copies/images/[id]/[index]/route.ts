import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { canViewPromotionCopy } from "@/features/promotion-copy/access";
import type { PromotionCopyImageAsset } from "@/features/promotion-copy/queries";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string; index: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("未登录", { status: 401 });
  }

  const { id, index } = await ctx.params;
  const imageIndex = Number(index);
  if (!Number.isInteger(imageIndex) || imageIndex < 0) {
    return new NextResponse("图片索引无效", { status: 400 });
  }

  const [viewer, copy] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, managerId: true },
    }),
    prisma.promotionCopy.findUnique({
      where: { id },
      select: {
        scope: true,
        teamScopeManagerId: true,
        imageAssetsJson: true,
        enabled: true,
      },
    }),
  ]);

  if (!viewer || !copy || !copy.enabled) {
    return new NextResponse("未找到", { status: 404 });
  }

  if (
    !canViewPromotionCopy({
      role: viewer.role,
      userId: viewer.id,
      managerId: viewer.managerId,
      scope: copy.scope,
      teamScopeManagerId: copy.teamScopeManagerId,
    })
  ) {
    return new NextResponse("无权访问", { status: 403 });
  }

  const assets = parseJson<PromotionCopyImageAsset[]>(copy.imageAssetsJson, []);
  const asset = assets[imageIndex];
  if (!asset?.relativePath) {
    return new NextResponse("未找到图片", { status: 404 });
  }

  const absolutePath = join(process.cwd(), asset.relativePath);
  try {
    await stat(absolutePath);
  } catch {
    return new NextResponse("图片不存在", { status: 404 });
  }

  const buffer = await readFile(absolutePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": asset.mimeType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${encodeURIComponent(asset.fileName || "promotion-image")}"`,
    },
  });
}
