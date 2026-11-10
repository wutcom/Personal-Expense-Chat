"use client";

import { useActionState, useState } from "react";
import { Send } from "lucide-react";
import { saveExpense } from "@/app/(app)/chat/actions";
import type { SaveState } from "@/lib/expenses/entry";

const initial: SaveState = { status: "idle", message: "" };

export function ExpenseComposer() {
  const [message, setMessage] = useState("");
  const [state, action, pending] = useActionState(
    async (previous: SaveState, form: FormData) => {
      const result = await saveExpense(previous, form);
      if (result.status === "saved") setMessage("");
      return result;
    },
    initial,
  );
  return (
    <form className="composer" action={action}>
      <label htmlFor="message">ข้อความ</label>
      <div className="composer-row">
        <input
          id="message"
          name="message"
          placeholder="เช่น กาแฟ 65"
          maxLength={360}
          required
          readOnly={pending}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-describedby="composer-status"
        />
        <button
          type="submit"
          disabled={pending || !message.trim()}
          aria-label="ส่งข้อความ"
        >
          <Send aria-hidden="true" size={20} />
        </button>
      </div>
      <p id="composer-status" role="status">
        {pending
          ? "กำลังบันทึก…"
          : state.message || "บันทึกวันที่ปัจจุบันตามเวลาไทย"}
      </p>
    </form>
  );
}
