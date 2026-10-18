export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WalletCards } from "lucide-react";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "เข้าสู่ระบบ" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAuthenticatedSession();
  if (session.status === "authenticated") redirect("/chat");
  const { error } = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="brand-icon">
          <WalletCards aria-hidden="true" size={28} />
        </span>
        <p className="eyebrow">PERSONAL EXPENSE CHAT</p>
        <h1>พื้นที่การเงินของคุณ</h1>
        <p>เข้าสู่ระบบเพื่อจัดการข้อมูลส่วนตัวของคุณ</p>
        {error ? (
          <p role="alert" className="form-error">
            ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่
          </p>
        ) : null}
        {session.status === "unconfigured" ? (
          <p role="status" className="auth-notice">
            ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase
            กรุณาให้ผู้ดูแลตั้งค่าระบบก่อนใช้งาน
          </p>
        ) : (
          <AuthForm />
        )}
      </section>
    </main>
  );
}
