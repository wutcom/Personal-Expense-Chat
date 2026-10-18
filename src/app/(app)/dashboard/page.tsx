import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/layout/empty-state";
export const metadata: Metadata = { title: "ภาพรวม" };
export default function DashboardPage() {
  return (
    <div className="page">
      <PageHeading
        eyebrow="THE BIG PICTURE"
        title="ภาพรวมการเงิน"
        description="ทุกแผนและค่าใช้จ่าย รวมอยู่ในมุมมองเดียว"
      />
      <div className="summary-grid">
        {["งบที่วางแผน", "ใช้จ่ายสุทธิ", "คงเหลือ"].map((label) => (
          <section className="summary-card" key={label}>
            <h2>{label}</h2>
            <p aria-label="ยังไม่มีข้อมูล">—</p>
            <span>บาท / เดือน</span>
          </section>
        ))}
      </div>
      <EmptyState
        title="ภาพรวมเริ่มต้นจากแผนของคุณ"
        description="ยอดรายเดือนและกราฟจะแสดงหลังเชื่อมต่อข้อมูลจริง"
        phase="รายงานในระยะที่ 5 · กราฟในระยะที่ 7"
      />
    </div>
  );
}
