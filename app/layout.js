"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export const dynamic = "force-dynamic"

const role = "NATIONAL_ADMIN" // لاحقاً يتحول إلى نظام صلاحيات حقيقي

export default function RootLayout({ children }) {

  const pathname = usePathname()

  const nav = [
    { name: "الرئيسية", path: "/" },
    { name: "الخريطة التشغيلية", path: "/map" },
    { name: "الحملات", path: "/campaigns" },
    { name: "القطاعات", path: "/sectors" },
    { name: "المحاكاة", path: "/simulation" },
    { name: "الموارد", path: "/resources" },
    { name: "التحليلات", path: "/analytics" }
  ]

  return (
    <html lang="ar" dir="rtl">
      <body style={{
        margin: 0,
        background: "#0B1220",
        color: "white",
        fontFamily: "system-ui"
      }}>

        <div style={{ display: "flex", minHeight: "100vh" }}>

          {/* Sidebar */}
          <aside style={{
            width: 260,
            background: "#111827",
            padding: 20,
            borderLeft: "1px solid rgba(255,255,255,0.08)"
          }}>

            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 30 }}>
              🇸🇦 منصة المسار الصحي
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {nav.map((item, i) => (
                <Link key={i} href={item.path}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: pathname === item.path ? "#38BDF8" : "#D1D5DB",
                    background: pathname === item.path ? "rgba(56,189,248,0.08)" : "transparent"
                  }}>
                  {item.name}
                </Link>
              ))}
            </div>

            <div style={{
              marginTop: 40,
              padding: 12,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              fontSize: 13
            }}>
              الدور الحالي:
              <div style={{ fontWeight: 700, marginTop: 4 }}>
                {role}
              </div>
            </div>

          </aside>

          {/* Main */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

            {/* Top Bar */}
            <header style={{
              height: 70,
              background: "#0F172A",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)"
            }}>
              <div style={{ fontWeight: 700 }}>
                غرفة العمليات الوطنية
              </div>

              <div style={{
                padding: "6px 14px",
                background: "rgba(34,197,94,0.15)",
                borderRadius: 20,
                fontSize: 13
              }}>
                مستوى التأهب: مستقر
              </div>
            </header>

            {/* Page Content */}
            <main style={{
              flex: 1,
              padding: 30,
              overflowY: "auto"
            }}>
              {children}
            </main>

          </div>
        </div>

      </body>
    </html>
  )
}
