import { requireUser } from "@/lib/auth/session";
import { ledgerAccess, ledgerUnavailable } from "@/lib/expenses/sheets";
import type { Metadata } from "next";
import { MessageCircle, Sparkles } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { ExpenseComposer } from "@/components/expenses/composer";

export const metadata: Metadata = { title: "แชต" };

export default async function ChatPage() {
  const { user } = await requireUser();
  const access = ledgerAccess(user.id);
  return (
    <div className="page chat-page">
      <PageHeading
        eyebrow="YOUR EVERYDAY MONEY COMPANION"
        title="คุยเรื่องเงิน ให้เป็นเรื่องง่าย"
        description="พิมพ์ข้อความเพื่อบันทึกรายจ่ายและเงินคืนลง Google Sheets"
      />
      <section className="chat-panel" aria-label="พื้นที่แชต">
        <div className="chat-panel-header">
          <MessageCircle aria-hidden="true" size={20} />
          <strong>แชตส่วนตัว</strong>
          <span>Google Sheets</span>
        </div>
        <div className="chat-welcome">
          <span className="welcome-icon">
            <Sparkles aria-hidden="true" size={30} />
          </span>
          <h2>เริ่มจากข้อความสั้น ๆ</h2>
          <p>พิมพ์ชื่อรายการกับยอดเงิน หรือระบุหมวดหมู่ด้วยคำสั่ง</p>
          <div className="command-examples">
            <code>กาแฟ 65</code>
            <code>จ่าย อาหาร 120 มื้อเที่ยง</code>
            <code>คืนเงิน อาหาร 30</code>
          </div>
        </div>
        {access === "ready" ? (
          <ExpenseComposer />
        ) : (
          <div className="composer">
            <p role="status">{ledgerUnavailable[access]}</p>
          </div>
        )}
      </section>
    </div>
  );
}
