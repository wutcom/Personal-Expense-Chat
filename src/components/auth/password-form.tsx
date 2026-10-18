"use client";
import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import type { AuthState } from "@/types/auth";
const initial: AuthState = { status: "idle", message: "" };
export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);
  return (
    <form action={action} className="auth-form">
      <label htmlFor="new-password">รหัสผ่านใหม่</label>
      <input
        id="new-password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
        disabled={pending}
      />
      <label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</label>
      <input
        id="confirm-password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
        disabled={pending}
      />
      <p role="status" aria-live="polite" className="form-error">
        {state.message}
      </p>
      <button className="primary-link" disabled={pending}>
        {" "}
        {pending ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}
