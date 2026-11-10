// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { saveExpense } from "@/app/(app)/chat/actions";

const { session, append, access, revalidate } = vi.hoisted(() => ({
  session: vi.fn(),
  append: vi.fn(),
  access: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getAuthenticatedSession: session }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
vi.mock("@/lib/expenses/sheets", () => ({
  appendEntry: append,
  ledgerAccess: access,
  ledgerUnavailable: { forbidden: "forbidden" },
}));

beforeEach(() => {
  vi.resetAllMocks();
  session.mockResolvedValue({ status: "authenticated", user: { id: "owner" } });
  access.mockReturnValue("ready");
});
function submit(message: string) {
  const data = new FormData();
  data.set("message", message);
  data.set("userId", "forged");
  return saveExpense({ status: "idle", message: "" }, data);
}

it("saves only for the server-verified owner and refreshes the read views", async () => {
  expect(await submit("กาแฟ 65")).toMatchObject({ status: "saved" });
  expect(append).toHaveBeenCalledWith("owner", {
    kind: "expense",
    category: "ทั่วไป",
    satang: 6500,
    note: "กาแฟ",
  });
  expect(revalidate.mock.calls).toEqual([["/history"], ["/dashboard"]]);
});

it("does not call Google for invalid, anonymous, or forbidden requests", async () => {
  expect(await submit("กาแฟ -2")).toMatchObject({ status: "error" });
  access.mockReturnValue("forbidden");
  expect(await submit("กาแฟ 65")).toMatchObject({ status: "error" });
  session.mockResolvedValue({ status: "unauthenticated" });
  expect(await submit("กาแฟ 65")).toMatchObject({ status: "error" });
  expect(append).not.toHaveBeenCalled();
});

it("does not claim success or reveal credential errors on a failed write", async () => {
  append.mockRejectedValue(new Error("private credential detail"));
  expect(await submit("กาแฟ 65")).toEqual({
    status: "error",
    message: "ยืนยันการบันทึกไม่ได้ กรุณาตรวจหน้าประวัติหรือชีตก่อนส่งซ้ำ",
  });
  expect(append).toHaveBeenCalledOnce();
  expect(revalidate).not.toHaveBeenCalled();
});
