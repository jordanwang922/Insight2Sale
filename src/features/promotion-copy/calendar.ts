import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export interface PromotionCalendarCell {
  date: Date;
  isoDate: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  count: number;
}

export function buildPromotionCalendar(activeMonth: Date, countsByDate: Map<string, number>) {
  const monthStart = startOfMonth(activeMonth);
  const monthEnd = endOfMonth(activeMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: PromotionCalendarCell[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    const isoDate = format(cursor, "yyyy-MM-dd");
    days.push({
      date: cursor,
      isoDate,
      dayNumber: Number(format(cursor, "d")),
      isCurrentMonth: isSameMonth(cursor, activeMonth),
      count: countsByDate.get(isoDate) ?? 0,
    });
  }

  const weeks: PromotionCalendarCell[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}
