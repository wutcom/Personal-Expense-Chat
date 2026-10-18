import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/layout/page-heading";
export const metadata: Metadata = { title: "ตั้งค่า" };
export default function SettingsPage() {
  return (
    <div className="page">
      <PageHeading
        eyebrow="A SPACE THAT FITS YOU"
        title="ตั้งค่า"
        description="ค่าเริ่มต้นสำหรับพื้นที่การเงินส่วนตัวของคุณ"
      />
      <section className="settings-card">
        <h2>รูปแบบการใช้งาน</h2>
        <dl>
          <div>
            <dt>ภาษา</dt>
            <dd>ไทย (th-TH)</dd>
          </div>
          <div>
            <dt>สกุลเงิน</dt>
            <dd>บาท (THB)</dd>
          </div>
          <div>
            <dt>เขตเวลา</dt>
            <dd>Asia/Bangkok</dd>
          </div>
        </dl>
        <p>
          ค่าเริ่มต้นยังไม่มีการบันทึก
          การจัดการโปรไฟล์จะเพิ่มหลังระบบยืนยันตัวตน
        </p>
      </section>
      <section className="settings-card">
        <h2>บัญชีและการติดตั้ง</h2>
        <p>เข้าสู่ระบบในระยะที่ 2 และติดตั้งเป็น PWA ในระยะที่ 8</p>
        <Link className="text-link" href="/login">
          ดูหน้าการเข้าสู่ระบบ →
        </Link>
      </section>
    </div>
  );
}
