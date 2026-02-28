import "./globals.css"
import Link from "next/link"

export const metadata = {
  title: "المركز الوطني لمراقبة صحة الحجاج",
  description: "منصة رسمية لرصد وتحليل المؤشرات الصحية لضيوف الرحمن لحظياً",
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="officialTopbar">
          <div className="topbarRow">
            <span>المملكة العربية السعودية</span>
            <span>وزارة الصحة</span>
            <span>موسم حج 1447هـ</span>
          </div>
        </div>

        <div className="shell">
          <div className="navbar">
            <div className="brand">
              <div className="brandTitle">المركز الوطني لمراقبة صحة الحجاج</div>
              <div className="brandSub">غرفة عمليات رقمية لرصد المخاطر الصحية لحظياً</div>
            </div>

            <nav className="navlinks">
              <Link className="navlink" href="/">الرئيسية</Link>
              <Link className="navlink" href="/analytics">التحليلات</Link>
              <Link className="navlink" href="/map">الخريطة</Link>
              <Link className="navlink" href="/alerts">التنبيهات</Link>
              <Link className="navlink" href="/pilgrims">الحجاج</Link>
              <Link className="navlink" href="/executive">التنفيذي</Link>
            </nav>
          </div>

          {children}
        </div>
      </body>
    </html>
  )
}
