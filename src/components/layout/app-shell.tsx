import Link from "next/link";
import { WalletCards, ArrowUpRight } from "lucide-react";
import { Navigation } from "./navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        ข้ามไปยังเนื้อหา
      </a>
      <aside className="sidebar">
        <Link href="/chat" className="brand">
          <span className="brand-icon">
            <WalletCards aria-hidden="true" size={24} />
          </span>
          <span>
            Expense Chat<small>พื้นที่เล็ก ๆ เพื่อแผนที่ดีขึ้น</small>
          </span>
        </Link>
        <p className="nav-caption">พื้นที่ของคุณ</p>
        <Navigation variant="desktop" />
        <div className="sidebar-note">
          <span className="status-dot" />
          เริ่มต้นทีละรายการ<p>วางแผนวันนี้ เพื่อความสบายใจในวันข้างหน้า</p>
        </div>
        <Link className="login-link" href="/login">
          การเข้าสู่ระบบ <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link href="/chat" className="mobile-brand">
            Expense Chat
          </Link>
          <span className="topbar-label">จัดการเงินในแบบของคุณ</span>
          <span className="phase-badge">ระยะที่ 1 · โครงสร้างแอป</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <Navigation variant="mobile" />
    </div>
  );
}
