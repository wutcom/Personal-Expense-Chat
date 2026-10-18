import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/layout/empty-state";
export const metadata: Metadata = { title: "แผนรายเดือน" };
export default function BudgetsPage() {
  return (
    <div className="page">
      <PageHeading
        eyebrow="MAKE ROOM FOR WHAT MATTERS"
        title="แผนรายเดือน"
        description="แบ่งงบให้สิ่งที่จำเป็น และสิ่งที่ทำให้คุณมีความสุข"
      />
      <EmptyState
        title="เตรียมพื้นที่ให้แผนแรกของคุณ"
        description="เพิ่มหมวดหมู่ ตั้งงบรายเดือน และคัดลอกแผนเดือนก่อนเมื่อระบบพร้อม"
        phase="จัดการงบประมาณในระยะที่ 5"
      />
    </div>
  );
}
