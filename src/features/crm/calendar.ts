import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export interface CalendarAppointmentItem {
  id: string;
  customerName: string;
  title: string;
  kind: string;
  ownerName: string;
  ownerColor: string;
  startAt: Date;
  endAt: Date;
  notes?: string | null;
}

export interface CalendarDay {
  date: Date;
  isoDate: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  appointments: CalendarAppointmentItem[];
}

export function buildMonthCalendar(
  activeMonth: Date,
  appointments: CalendarAppointmentItem[],
): CalendarDay[][] {
  const monthStart = startOfMonth(activeMonth);
  const monthEnd = endOfMonth(activeMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const appointmentsByDate = new Map<string, CalendarAppointmentItem[]>();
  for (const appointment of appointments) {
    const key = format(appointment.startAt, "yyyy-MM-dd");
    const bucket = appointmentsByDate.get(key) ?? [];
    bucket.push(appointment);
    appointmentsByDate.set(key, bucket);
  }

  const days: CalendarDay[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    const isoDate = format(cursor, "yyyy-MM-dd");
    days.push({
      date: cursor,
      isoDate,
      dayNumber: Number(format(cursor, "d")),
      isCurrentMonth: isSameMonth(cursor, activeMonth),
      appointments:
        appointmentsByDate
          .get(isoDate)
          ?.sort((left, right) => left.startAt.getTime() - right.startAt.getTime()) ?? [],
    });
  }

  const weeks: CalendarDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}
