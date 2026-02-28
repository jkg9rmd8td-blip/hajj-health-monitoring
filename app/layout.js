"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export const dynamic = "force-dynamic"

const role = "NATIONAL_ADMIN"

export default function RootLayout({ children }) {

  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            position: "fixed",
            height: "100vh",
            right: open ? 0 : -260,
            transition: "0.3s",
            zIndex: 1000
          }}>

            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 25 }}>
              🇸🇦 المسار الصحي
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {nav.map((item, i) => (
                <Link key={i} href={item.path}
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 14,
                    color: pathname === item.path ? "#38BDF8" : "#9CA3AF",
                    background: pathname === item.path
                      ? "rgba(56,189,248,0.1)"
                      : "transparent"
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

          {/* Overlay */}
          {open && (
            <div
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                zIndex: 900
              }}
            />
          )}

          {/* Main Area */}
          <div style={{ flex: 1, marginRight: 0 }}>

            {/* Top Bar */}
            <header style={{
              height: 60,
              background: "#0F172A",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}>
              <button
                onClick={() => setOpen(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: 20,
                  cursor: "pointer"
                }}>
                ☰
              </button>

              <div style={{ fontWeight: 700 }}>
                غرفة العمليات الوطنية
              </div>

              <div style={{
                padding: "5px 12px",
                background: "rgba(34,197,94,0.15)",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600
              }}>
                مستقر
              </div>
            </header>

            {/* Executive Strip */}
            <div style={{
              background: "#111827",
              padding: "10px 20px",
              fontSize: 12,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              flexWrap: "wrap",
              gap: 15,
              justifyContent: "space-between"
            }}>
              <div>آخر تحديث: مباشر</div>
              <div>نظام تنبؤ نشط</div>
              <div>مؤشر وطني: 100%</div>
            </div>

            {/* Page Content */}
            <main style={{
              padding: 20,
              maxWidth: 1400,
              margin: "0 auto"
            }}>
              {children}
            </main>

          </div>
        </div>

      </body>
    </html>
  )
}
