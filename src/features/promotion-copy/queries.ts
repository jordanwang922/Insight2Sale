import { addMonths, endOfDay, endOfMonth, format, parseISO, startOfDay, startOfMonth } from "date-fns";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { buildPromotionCalendar } from "@/features/promotion-copy/calendar";
import { buildPromotionVisibilityWhere, canManagePromotionCopy } from "@/features/promotion-copy/access";

export interface PromotionCopyImageAsset {
  fileName: string;
  storedName: string;
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
}

function resolveSelectedDate(input?: string) {
  if (!input) return new Date();
  try {
    return parseISO(`${input}T00:00:00`);
  } catch {
    return new Date();
  }
}

export async function getPromotionCopyPageData(selectedDateInput?: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, managerId: true, name: true },
  });
  if (!viewer) return null;

  const selectedDate = resolveSelectedDate(selectedDateInput);
  const activeMonth = startOfMonth(selectedDate);
  const monthStart = startOfMonth(activeMonth);
  const monthEnd = endOfMonth(activeMonth);
  const selectedDayStart = startOfDay(selectedDate);
  const selectedDayEnd = endOfDay(selectedDate);
  const visibilityWhere = buildPromotionVisibilityWhere(viewer.role, viewer.id, viewer.managerId);

  const [monthCopies, dayCopies] = await Promise.all([
    prisma.promotionCopy.findMany({
      where: {
        ...visibilityWhere,
        eventDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
      include: {
        createdBy: true,
      },
    }),
    prisma.promotionCopy.findMany({
      where: {
        ...visibilityWhere,
        eventDate: {
          gte: selectedDayStart,
          lte: selectedDayEnd,
        },
      },
      orderBy: [{ createdAt: "asc" }],
      include: {
        createdBy: true,
      },
    }),
  ]);

  const countsByDate = new Map<string, number>();
  for (const item of monthCopies) {
    const key = format(item.eventDate, "yyyy-MM-dd");
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }

  return {
    session,
    viewer,
    selectedDateLabel: format(selectedDate, "yyyy-MM-dd"),
    activeMonthLabel: format(activeMonth, "yyyy年M月"),
    monthPrevHref: `/dashboard/promotion-copies?date=${format(addMonths(activeMonth, -1), "yyyy-MM-dd")}`,
    monthNextHref: `/dashboard/promotion-copies?date=${format(addMonths(activeMonth, 1), "yyyy-MM-dd")}`,
    calendarWeeks: buildPromotionCalendar(activeMonth, countsByDate),
    mobileDateOptions: Array.from(countsByDate.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([isoDate, count]) => ({
        isoDate,
        count,
        label: format(parseISO(`${isoDate}T00:00:00`), "M月d日"),
        href: `/dashboard/promotion-copies?date=${isoDate}`,
        active: isoDate === format(selectedDate, "yyyy-MM-dd"),
      })),
    dayCopies: dayCopies.map((item) => ({
      ...item,
      imageAssets: parseJson<PromotionCopyImageAsset[]>(item.imageAssetsJson || "[]", []),
      canManage: canManagePromotionCopy({
        role: viewer.role,
        userId: viewer.id,
        scope: item.scope,
        teamScopeManagerId: item.teamScopeManagerId,
        createdById: item.createdById,
      }),
    })),
  };
}

export async function getPromotionCopyVisibilityContext(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, managerId: true },
  });
}

export function canManagePromotionCopies(role: UserRole) {
  return role === "MANAGER" || role === "ADMIN";
}

export function canCreateGlobalPromotionCopy(role: UserRole) {
  return role === "ADMIN";
}
