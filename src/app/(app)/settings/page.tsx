import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { requireUser } from "@/lib/auth/session";
import { signOut } from "@/app/(auth)/actions";
import Link from "next/link";
export const metadata: Metadata = { title: "ตั้งค่า" };
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user } = await requireUser();
  const { error } = await searchParams;
  return (
    <div className="page">
      <PageHeading
        eyebrow="A SPACE THAT FITS YOU"
        title="ตั้งค่า"
        description="พื้นที่การเงินส่วนตัวของคุณ"
      />
      <section className="settings-card">
        <h2>บัญชีของคุณ</h2>
        <p>{user.email}</p>
        <Link className="text-link" href="/reset-password">
          เปลี่ยนรหัสผ่าน
        </Link>
        {error === "signout" ? (
          <p role="alert" className="form-error">
            ออกจากระบบไม่สำเร็จ กรุณาลองใหม่
          </p>
        ) : null}
        <form action={signOut}>
          <button type="submit" className="primary-link">
            ออกจากระบบ
          </button>
        </form>
      </section>
      <section className="settings-card">
        <h2>รูปแบบการใช้งานเริ่มต้น</h2>
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
        <p>การแก้ไขการตั้งค่าและหมวดหมู่จะเพิ่มในระยะถัดไป</p>
      </section>
    </div>
  );
}
