import { requireUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { ledgerUnavailable, loadLedger } from "@/lib/expenses/sheets";
import { formatMoney, summarizeMonth } from "@/lib/expenses/entry";

export const metadata: Metadata = { title: "ภาพรวม" };

export default async function DashboardPage() {
  const { user } = await requireUser();
  const ledger = await loadLedger(user.id);
  const totals =
    ledger.status === "ready" ? summarizeMonth(ledger.rows, new Date()) : null;
  return (
    <div className="page">
      <PageHeading
        eyebrow="THE BIG PICTURE"
        title="ภาพรวมการเงิน"
        description="รายจ่ายและเงินคืนเดือนนี้จาก Google Sheets ตามเวลาไทย"
      />
      {ledger.status !== "ready" && (
        <p role="status">{ledgerUnavailable[ledger.status]}</p>
      )}
      <div className="summary-grid">
        {(
          [
            ["รายจ่าย", "expenses"],
            ["เงินคืน", "refunds"],
            ["จ่ายสุทธิ", "net"],
          ] as const
        ).map(([label, key]) => (
          <section className="summary-card" key={key}>
            <h2>{label}</h2>
            {totals ? (
              <p>{formatMoney(totals[key])}</p>
            ) : (
              <p aria-label="ยังไม่มีข้อมูล">—</p>
            )}
            <span>{totals?.month ?? "บาท / เดือน"}</span>
          </section>
        ))}
      </div>
    </div>
  );
}
