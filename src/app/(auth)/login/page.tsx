import type { Metadata } from "next";
import Link from "next/link";
import { WalletCards } from "lucide-react";
export const metadata: Metadata = { title: "เข้าสู่ระบบ" };
export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="brand-icon">
          <WalletCards aria-hidden="true" size={28} />
        </span>
        <p className="eyebrow">PERSONAL EXPENSE CHAT</p>
        <h1>พื้นที่การเงินของคุณ</h1>
        <p>
          ระบบเข้าสู่ระบบ สมัครสมาชิก และรีเซ็ตรหัสผ่านด้วย Supabase
          จะเพิ่มในระยะที่ 2
        </p>
        <p className="auth-notice">
          ขณะนี้เป็นโครงสร้างแอป ยังไม่มีการยืนยันตัวตนหรือจัดเก็บข้อมูลส่วนตัว
        </p>
        <Link href="/chat" className="primary-link">
          สำรวจโครงสร้างแอป →
        </Link>
      </section>
    </main>
  );
}
