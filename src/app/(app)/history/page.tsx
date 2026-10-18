import { requireUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/layout/empty-state";
export const metadata: Metadata = { title: "ประวัติ" };
export default async function HistoryPage() {
  await requireUser();
  return (
    <div className="page">
      <PageHeading
        eyebrow="EVERY LITTLE DETAIL"
        title="ประวัติรายการ"
        description="ย้อนดูค่าใช้จ่ายและเงินคืน โดยเก็บทุกรายการไว้อย่างเป็นระเบียบ"
      />
      <EmptyState
        title="ยังไม่มีรายการที่แสดง"
        description="การค้นหา แก้ไข ยกเลิก และส่งออก CSV จะพร้อมหลังเชื่อมต่อระบบรายการ"
        phase="ประวัติและส่งออกในระยะที่ 7"
      />
    </div>
  );
}
