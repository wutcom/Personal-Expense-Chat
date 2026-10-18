export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { PasswordForm } from "@/components/auth/password-form";
export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่" };
export default async function ResetPasswordPage() {
  await requireUser();
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>ตั้งรหัสผ่านใหม่</h1>
        <p>ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร</p>
        <PasswordForm />
      </section>
    </main>
  );
}
