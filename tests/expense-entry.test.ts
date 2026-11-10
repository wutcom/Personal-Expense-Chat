import { describe, expect, it } from "vitest";
import { bangkokDate, parseEntry, summarizeMonth } from "@/lib/expenses/entry";

describe("expense chat input", () => {
  it("supports natural shorthand and explicit categories and notes", () => {
    expect(parseEntry(" กาแฟเย็น 65 ")).toEqual({
      kind: "expense",
      category: "ทั่วไป",
      satang: 6500,
      note: "กาแฟเย็น",
    });
    expect(parseEntry("จ่าย อาหาร 1,200.05 มื้อ เที่ยง")).toEqual({
      kind: "expense",
      category: "อาหาร",
      satang: 120005,
      note: "มื้อ เที่ยง",
    });
    expect(parseEntry("คืนเงิน 7-11 2.1")).toEqual({
      kind: "refund",
      category: "7-11",
      satang: 210,
      note: "",
    });
  });

  it.each([
    "กาแฟ 0",
    "จ่าย อาหาร -12",
    "กาแฟ 0.001",
    "กาแฟ 12,3",
    "กาแฟ 1e6",
    "กาแฟ 10000000",
    "จ่าย 120",
    "20",
    "กาแฟ\n65",
    "เพิ่มแผน car 10000",
    "จ่ายแล้ว UOB 300",
    "copy แผนเดือนก่อน 1",
  ])("rejects invalid amounts and unsupported commands: %s", (input) => {
    expect(parseEntry(input)).toBeNull();
  });

  it("uses the Bangkok day and month boundary and sums integer satang", () => {
    const date = new Date("2026-10-31T17:00:00.000Z");
    expect(bangkokDate(date)).toBe("2026-11-01");
    const base = {
      id: "1",
      createdAt: date.toISOString(),
      category: "food",
      note: "",
    };
    expect(
      summarizeMonth(
        [
          { ...base, date: "2026-10-31", kind: "expense", satang: 9999 },
          { ...base, date: "2026-11-01", kind: "expense", satang: 11 },
          { ...base, date: "2026-11-01", kind: "expense", satang: 12 },
          { ...base, date: "2026-11-01", kind: "refund", satang: 13 },
        ],
        date,
      ),
    ).toEqual({ month: "2026-11", expenses: 23, refunds: 13, net: 10 });
  });
});
