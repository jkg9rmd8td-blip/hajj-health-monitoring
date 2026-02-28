import "./globals.css"
import Link from "next/link"

export const metadata = {
  title: "منصة المسار الصحي التنبؤية — غرفة العمليات الوطنية",
  description: "منصة سيادية لرصد المخاطر الصحية لضيوف الرحمن لحظياً ودعم القرار التشغيلي",
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="officialTopbar">
          <div className="topbarRow">
            <span>المملكة العربية السعودية</span>
            <span>وزارة الصحة — وزارة الحج والعمرة</span>
            <span>الحج الذكي</span>
          </div>
        </div>

        <div className="shell">
          <div className="navbar">
            <div className="brand">
              <div className="brandTitle">منصة المسار الصحي التنبؤية</div>
              <div className="brandSub">غرفة عمليات وطنية لرصد المخاطر والتوجيه الاستباقي</div>
            </div>

            <nav className="navlinks">
              <Link className="navlink" href="/">القيادة</Link>
              <Link className="navlink" href="/national">المؤشر الوطني</Link>
              <Link className="navlink" href="/sectors">القطاعات</Link>
              <Link className="navlink" href="/map">الخريطة</Link>

              <Link className="navlink" href="/operations">التشغيل</Link>
              <Link className="navlink" href="/campaigns">الحملات</Link>
              <Link className="navlink" href="/campaigns-sla">امتثال SLA</Link>
              <Link className="navlink" href="/audit">التدقيق</Link>
              <Link className="navlink" href="/movement">التحركات</Link>
            </nav>
          </div>

          {children}

          <div className="footerNote">
            © {new Date().getFullYear()} — منصة تشغيلية تجريبية قابلة للتوسع — بيانات مجهولة الهوية لأغراض السلامة.
          </div>
        </div>
      </body>
    </html>
  )
}
