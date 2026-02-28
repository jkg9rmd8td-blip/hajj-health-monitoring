"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"

function normalizeRisk(v) {
  const x = String(v ?? "")
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

export default function Home() {

  const [pilgrims, setPilgrims] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(setPilgrims)
      .catch(() => setPilgrims([]))

    fetch("/api/events", { cache: "no-store" })
      .then(r => r.json())
      .then(setEvents)
      .catch(() => setEvents([]))
  }, [])

  const national = useMemo(() => {

    let critical = 0
    let medium = 0

    for (const p of pilgrims) {
      const r = normalizeRisk(p.risk)
      if (r === "critical") critical++
      if (r === "medium") medium++
    }

    const score = 100 - (critical * 2.5) - (medium * 1.2)

    return {
      readiness: Math.max(0, Math.round(score)),
      critical,
      medium,
      alerts: events.filter(e => e.type === "ALERT_RAISED").length
    }

  }, [pilgrims, events])

  const level =
    national.readiness >= 90 ? "مستقر"
    : national.readiness >= 75 ? "مراقبة"
    : "تأهب"

  return (
    <main style={{ display: "grid", gap: 24 }}>

      <div className="sectionTitle">
        غرفة العمليات الوطنية للحج
      </div>

      {/* الشريط السيادي */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>

        <div className="card">
          <div>🇸🇦 مؤشر صحة الحج الوطني</div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>
            {national.readiness}%
          </div>
        </div>

        <div className="card">
          <div>🚨 مستوى التأهب</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {level}
          </div>
        </div>

        <div className="card">
          <div>⚠️ الحالات الحرجة</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {national.critical}
          </div>
        </div>

        <div className="card">
          <div>🟡 الحالات المتوسطة</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {national.medium}
          </div>
        </div>

      </div>

      {/* محرك القرار */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>
          🧠 محرك القرار الوطني
        </div>
        <div style={{ opacity: 0.85 }}>
          إذا استمر الاتجاه الحالي، سيبقى الوضع مستقر خلال 30 دقيقة القادمة.
          يوصى بمتابعة قطاع منى 1 كأكثر القطاعات حساسية.
        </div>
      </div>

      {/* سجل الأحداث */}
      <div className="card">
        <div style={{ fontWeight: 900, marginBottom: 10 }}>
          📜 آخر الأحداث التشغيلية
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {events.slice(0,5).map((e,i)=>(
            <div key={i} style={{ opacity:0.8 }}>
              {e.type} — {e.sector} — {new Date(e.ts).toLocaleTimeString()}
            </div>
          ))}
        </div>
      </div>

    </main>
  )
}
