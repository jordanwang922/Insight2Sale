import { describe, expect, test } from "vitest";
import { buildMonthCalendar } from "@/features/crm/calendar";

describe("calendar month builder", () => {
  test("places appointments on the correct day cell for the active month", () => {
    const month = new Date("2026-04-15T10:00:00+08:00");
    const weeks = buildMonthCalendar(month, [
      {
        id: "a1",
        customerName: "快乐女孩",
        kind: "1V1解读",
        startAt: new Date("2026-04-08T15:00:00+08:00"),
        endAt: new Date("2026-04-08T16:00:00+08:00"),
        notes: "",
      },
    ]);

    const targetDay = weeks.flat().find((day) => day.isoDate === "2026-04-08");

    expect(targetDay).toBeTruthy();
    expect(targetDay?.appointments).toHaveLength(1);
    expect(targetDay?.appointments[0]?.customerName).toBe("快乐女孩");
  });
});
