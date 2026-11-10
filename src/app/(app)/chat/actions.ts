"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { formatMoney, parseEntry, type SaveState } from "@/lib/expenses/entry";
import {
  appendEntry,
  ledgerAccess,
  ledgerUnavailable,
} from "@/lib/expenses/sheets";

export async function saveExpense(
  _previous: SaveState,
  form: FormData,
): Promise<SaveState> {
  const session = await getAuthenticatedSession();
  if (session.status !== "authenticated")
    return { status: "error", message: "กรุณาเข้าสู่ระบบอีกครั้ง" };
  const access = ledgerAccess(session.user.id);
  if (access !== "ready")
    return { status: "error", message: ledgerUnavailable[access] };
  const entry = parseEntry(form.get("message"));
  if (!entry)
    return {
      status: "error",
      message:
        "ลองพิมพ์ กาแฟ 65 หรือ จ่าย อาหาร 120 โดยระบุยอดมากกว่า 0 บาทและทศนิยมไม่เกิน 2 ตำแหน่ง",
    };
  try {
    await appendEntry(session.user.id, entry);
  } catch {
    return {
      status: "error",
      message: "ยืนยันการบันทึกไม่ได้ กรุณาตรวจหน้าประวัติหรือชีตก่อนส่งซ้ำ",
    };
  }
  revalidatePath("/history");
  revalidatePath("/dashboard");
  return {
    status: "saved",
    message: `บันทึก${entry.kind === "refund" ? "เงินคืน" : "รายจ่าย"} ${formatMoney(entry.satang)} ลง Google Sheets แล้ว`,
  };
}
