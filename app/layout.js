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
        {/* شريط علوي رسمي */}
        <div className="officialTopbar">
          <div className="topbarRow">
            <span>المملكة العربية السعودية</span>
            <span>وزارة الصحة — وزارة الحج والعمرة</span>
            <span>الحج الذكي</span>
          </div>
        </div>

        <div className="shell">
          {/* رأس المنصة */}
          <div className="navbar">
            <div className="brand">
              <div className="brandTitle">منصة المسار الصحي التنبؤية</div>
              <div className="brandSub">غرفة عمليات وطنية لرصد المخاطر الصحية والتوجيه الاستباقي</div>
            </div>

            {/* ترتيب قيادي: قيادة → تشغيل → حوكمة */}
            <nav className="navlinks">
              <Link className="navlink" href="/">القيادة</Link>
              <Link className="navlink" href="/national">المؤشر الوطني</Link>
              <Link className="navlink" href="/sectors">القطاعات</Link>
              <Link className="navlink" href="/map">الخريطة</Link>

              <Link className="navlink" href="/analytics">التحليلات</Link>
              <Link className="navlink" href="/operations">التشغيل</Link>
              <Link className="navlink" href="/alerts">التنبيهات</Link>

              <Link className="navlink" href="/campaigns">الحملات</Link>
              <Link className="navlink" href="/campaigns-sla">امتثال SLA</Link>
              <Link className="navlink" href="/audit">التدقيق</Link>
            </nav>
          </div>

          {children}

          {/* تذييل رسمي */}
          <div style={{ marginTop: 26, opacity: .65, fontSize: 12 }}>
            © {new Date().getFullYear()} — منصة تشغيلية تجريبية قابلة للتوسع — بيانات مجهولة الهوية لأغراض السلامة.
          </div>
        </div>
      </body>
    </html>
  )
}
