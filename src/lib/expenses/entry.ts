import { z } from "zod";

const maxSatang = 999_999_999;
const otherCommands = new Set([
  "เพิ่มแผน",
  "จ่ายแล้ว",
  "คงเหลือ",
  "คงเหลือเดือนนี้",
  "ดูวันนี้",
  "สรุปเดือนนี้",
  "copy",
  "ยกเลิกรายการล่าสุด",
  "ช่วยเหลือ",
]);
const amountPattern = /^(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:\.[0-9]{1,2})?$/;

export const entrySchema = z.object({
  kind: z.enum(["expense", "refund"]),
  category: z.string().trim().min(1).max(60),
  satang: z.number().int().min(1).max(maxSatang),
  note: z.string().trim().max(240),
});
export type Entry = z.infer<typeof entrySchema>;
export type LedgerRow = Entry & { id: string; createdAt: string; date: string };
export type SaveState = { status: "idle" | "error" | "saved"; message: string };

function parseSatang(amount: string) {
  if (!amountPattern.test(amount)) return 0;
  const [whole, decimal = ""] = amount.replaceAll(",", "").split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

export function parseEntry(raw: unknown) {
  const input = z.string().trim().min(1).max(360).safeParse(raw);
  if (!input.success || /[\r\n]/.test(input.data)) return null;
  const parts = input.data.split(/\s+/);
  const verb = parts[0];
  if (otherCommands.has(verb.toLowerCase())) return null;
  let entry: unknown;
  if (verb === "จ่าย" || verb === "คืนเงิน") {
    const [, category, amount = "", ...note] = parts;
    entry = {
      kind: verb === "จ่าย" ? "expense" : "refund",
      category,
      satang: parseSatang(amount),
      note: note.join(" "),
    };
  } else {
    const amount = parts.pop() ?? "";
    entry = {
      kind: "expense",
      category: "ทั่วไป",
      satang: parseSatang(amount),
      note: parts.join(" "),
    };
    if (!parts.length) return null;
  }
  const parsed = entrySchema.safeParse(entry);
  return parsed.success ? parsed.data : null;
}

const thaiDay = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export const bangkokDate = (date: Date) => thaiDay.format(date);
const baht = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});
export const formatMoney = (satang: number) => baht.format(satang / 100);
export function summarizeMonth(rows: LedgerRow[], date: Date) {
  const month = bangkokDate(date).slice(0, 7);
  let expenses = 0;
  let refunds = 0;
  for (const row of rows) {
    if (row.date.slice(0, 7) !== month) continue;
    if (row.kind === "expense") expenses += row.satang;
    else refunds += row.satang;
  }
  return { month, expenses, refunds, net: expenses - refunds };
}
