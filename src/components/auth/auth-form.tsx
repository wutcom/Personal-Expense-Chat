"use client";
import { useActionState, useState } from "react";
import { authenticate } from "@/app/(auth)/actions";
import type { AuthState } from "@/types/auth";
const initial: AuthState = { status: "idle", message: "" };
const labels = {
  signin: "เข้าสู่ระบบ",
  signup: "สมัครสมาชิก",
  reset: "ลืมรหัสผ่าน",
} as const;
export function AuthForm() {
  const [intent, setIntent] = useState<keyof typeof labels>("signin");
  return (
    <>
      <div className="auth-tabs" aria-label="เลือกการจัดการบัญชี">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={intent === key}
            onClick={() => setIntent(key as keyof typeof labels)}
          >
            {label}
          </button>
        ))}
      </div>
      <CredentialForm key={intent} intent={intent} />
    </>
  );
}
function CredentialForm({ intent }: { intent: keyof typeof labels }) {
  const [state, action, pending] = useActionState(authenticate, initial);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="intent" value={intent} />
      <label htmlFor="email">อีเมล</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        disabled={pending}
      />
      {intent !== "reset" ? (
        <>
          <label htmlFor="password">รหัสผ่าน</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              intent === "signup" ? "new-password" : "current-password"
            }
            required
            minLength={intent === "signup" ? 8 : 1}
            maxLength={128}
            disabled={pending}
          />
        </>
      ) : null}
      <p
        role="status"
        aria-live="polite"
        className={state.status === "error" ? "form-error" : "form-status"}
      >
        {state.message}
      </p>
      <button type="submit" className="primary-link" disabled={pending}>
        {pending
          ? "กำลังดำเนินการ…"
          : intent === "reset"
            ? "ส่งลิงก์ตั้งรหัสผ่านใหม่"
            : labels[intent]}
      </button>
    </form>
  );
}
