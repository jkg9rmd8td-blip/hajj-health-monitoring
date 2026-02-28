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
    { name: "المحاكاة", path: "/simulation" }
  ]

  return (
    <html lang="ar" dir="rtl">
      <body style={{
        margin: 0,
        background: "radial-gradient(circle at 20% 20%, #1E293B, #0B1220)",
        color: "white",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui",
        WebkitFontSmoothing: "antialiased"
      }}>

        {/* Drawer */}
        <div style={{
          position: "fixed",
          top: 0,
          right: open ? 0 : -280,
          width: 260,
          height: "100vh",
          backdropFilter: "blur(20px)",
          background: "rgba(15,23,42,0.8)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          padding: 20,
          transition: "0.35s ease",
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 25 }}>
            🇸🇦 المسار الصحي
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {nav.map((item,i)=>(
              <Link key={i} href={item.path}
                onClick={()=>setOpen(false)}
                style={{
                  padding:"12px 14px",
                  borderRadius:12,
                  textDecoration:"none",
                  fontSize:14,
                  background: pathname===item.path ? "rgba(59,130,246,0.15)" : "transparent",
                  color: pathname===item.path ? "#60A5FA" : "#CBD5E1"
                }}>
                {item.name}
              </Link>
            ))}
          </div>

          <div style={{
            marginTop: 40,
            padding: 12,
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            fontSize: 12
          }}>
            الدور: <b>{role}</b>
          </div>
        </div>

        {open && (
          <div
            onClick={()=>setOpen(false)}
            style={{
              position:"fixed",
              inset:0,
              background:"rgba(0,0,0,0.6)",
              zIndex:900
            }}
          />
        )}

        {/* Top Bar */}
        <div style={{
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          backdropFilter: "blur(15px)",
          background: "rgba(15,23,42,0.6)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 500
        }}>
          <button
            onClick={()=>setOpen(true)}
            style={{
              background:"transparent",
              border:"none",
              color:"white",
              fontSize:22,
              cursor:"pointer"
            }}>
            ☰
          </button>

          <div style={{ fontWeight: 700 }}>
            National Health Command
          </div>

          <div style={{
            padding:"6px 14px",
            borderRadius:20,
            background:"rgba(34,197,94,0.15)",
            fontSize:12
          }}>
            مستقر
          </div>
        </div>

        {/* Content */}
        <main style={{
          padding: 20,
          maxWidth: 1100,
          margin: "0 auto"
        }}>
          {children}
        </main>

      </body>
    </html>
  )
}
