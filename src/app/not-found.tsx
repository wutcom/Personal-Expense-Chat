import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">404</p>
        <h1>ไม่พบหน้านี้</h1>
        <p>ลองกลับไปเริ่มต้นที่หน้าแชต</p>
        <Link className="primary-link" href="/chat">
          กลับไปหน้าแชต
        </Link>
      </section>
    </main>
  );
}
