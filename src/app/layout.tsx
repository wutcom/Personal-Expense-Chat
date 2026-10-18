import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Personal Expense Chat", template: "%s | Expense Chat" },
  description: "วางแผนและบันทึกค่าใช้จ่ายส่วนตัวผ่านแชต",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
