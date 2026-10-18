import { requireUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata: Metadata = { title: "แชต" };

export default async function ChatPage() {
  await requireUser();
  return (
    <div className="page chat-page">
      <PageHeading
        eyebrow="YOUR EVERYDAY MONEY COMPANION"
        title="คุยเรื่องเงิน ให้เป็นเรื่องง่าย"
        description="พื้นที่สำหรับวางแผน บันทึก และทบทวนค่าใช้จ่ายของคุณ"
      />
      <section className="chat-panel" aria-label="พื้นที่แชต">
        <div className="chat-panel-header">
          <MessageCircle aria-hidden="true" size={20} />
          <strong>แชตส่วนตัว</strong>
          <span>เริ่มต้นใช้งาน</span>
        </div>
        <div className="chat-welcome">
          <span className="welcome-icon">
            <Sparkles aria-hidden="true" size={30} />
          </span>
          <h2>เริ่มจากข้อความสั้น ๆ</h2>
          <p>
            เมื่อระบบพร้อม คุณจะบันทึกรายจ่าย
            <br />
            และดูเงินคงเหลือได้จากที่นี่
          </p>
          <div className="command-examples">
            <code>เพิ่มแผน car 10000</code>
            <code>จ่าย car 500</code>
            <code>คงเหลือเดือนนี้</code>
          </div>
        </div>
        <div className="composer">
          <label htmlFor="message">ข้อความ</label>
          <div className="composer-row">
            <input
              id="message"
              placeholder="พิมพ์ข้อความที่นี่…"
              disabled
              aria-describedby="composer-status"
            />
            <button disabled aria-label="ส่งข้อความ">
              <Send aria-hidden="true" size={20} />
            </button>
          </div>
          <p id="composer-status">
            แชตจะพร้อมใช้งานในระยะที่ 6 ขณะนี้ยังไม่มีการบันทึกข้อมูล
          </p>
        </div>
      </section>
      <p className="page-footnote">
        ทีละรายการ ทีละวัน เห็นภาพการเงินได้ชัดขึ้น
      </p>
    </div>
  );
}
