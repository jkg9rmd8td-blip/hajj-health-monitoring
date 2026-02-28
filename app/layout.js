"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export const dynamic = "force-dynamic"

const role = "NATIONAL_ADMIN"

export default function RootLayout({ children }) {

  const pathname = usePathname()

  const nav = [
    { name: "الرئيسية", path: "/" },
    { name: "الخريطة", path: "/map" },
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
        color: "#E5E7EB",
        fontFamily: "system-ui"
      }}>

        <div style={{ display: "flex", minHeight: "100vh" }}>

          {/* Sidebar */}
          <aside style={{
            width: 250,
            background: "#111827",
            padding: 20,
            borderLeft: "1px solid rgba(255,255,255,0.05)"
          }}>

            <div style={{
              fontWeight: 900,
              fontSize: 18,
              marginBottom: 25
            }}>
              🇸🇦 المسار الصحي
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {nav.map((item, i) => (
                <Link key={i} href={item.path}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 14,
                    color: pathname === item.path ? "#38BDF8" : "#9CA3AF",
                    background: pathname === item.path
                      ? "rgba(56,189,248,0.1)"
                      : "transparent",
                    transition: "0.2s"
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
              fontSize: 12
            }}>
              الدور:
              <div style={{ fontWeight: 700 }}>
                {role}
              </div>
            </div>

          </aside>

          {/* Main */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

            {/* Top Bar */}
            <header style={{
              height: 65,
              background: "#0F172A",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}>
              <div style={{ fontWeight: 700 }}>
                غرفة العمليات الوطنية للحج
              </div>

              <div style={{
                padding: "6px 14px",
                background: "rgba(34,197,94,0.15)",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600
              }}>
                مستوى التأهب: مستقر
              </div>
            </header>

            {/* Executive Strip */}
            <div style={{
              background: "#111827",
              padding: "14px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13
            }}>
              <div>آخر تحديث: مباشر</div>
              <div>الوضع الوطني: مستقر</div>
              <div>نظام تنبؤ نشط</div>
            </div>

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
