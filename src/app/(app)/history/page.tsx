import { requireUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { ledgerUnavailable, loadLedger } from "@/lib/expenses/sheets";
import { formatMoney } from "@/lib/expenses/entry";

export const metadata: Metadata = { title: "ประวัติ" };

export default async function HistoryPage() {
  const { user } = await requireUser();
  const ledger = await loadLedger(user.id);
  const recent =
    ledger.status === "ready"
      ? ledger.rows
          .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 50)
      : [];
  return (
    <div className="page">
      <PageHeading
        eyebrow="EVERY LITTLE DETAIL"
        title="ประวัติรายการ"
        description="50 รายการล่าสุดจาก Google Sheets"
      />
      {ledger.status !== "ready" ? (
        <p role="status">{ledgerUnavailable[ledger.status]}</p>
      ) : recent.length ? (
        <ul className="expense-history">
          {recent.map((row) => (
            <li key={row.id}>
              <div>
                <strong>{row.category}</strong>
                {row.note && <p>{row.note}</p>}
                <small>{row.date}</small>
              </div>
              <div>
                <strong>{formatMoney(row.satang)}</strong>
                <small>{row.kind === "refund" ? "เงินคืน" : "รายจ่าย"}</small>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>ยังไม่มีรายการที่บันทึก</p>
      )}
    </div>
  );
}
