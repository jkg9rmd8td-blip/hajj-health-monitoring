"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"

function normalizeRisk(v) {
  const x = String(v ?? "")
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

function minutesBetween(a, b) {
  return Math.abs((new Date(b) - new Date(a)) / 60000)
}

export default function MapPage() {

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

  const sectors = useMemo(() => {

    const map = new Map()

    // ضغط حالي
    for (const p of pilgrims) {
      const sector = String(p.location ?? "غير محدد")
      const risk = normalizeRisk(p.risk)

      const e = map.get(sector) ?? {
        sector,
        critical: 0,
        medium: 0,
        alerts: 0,
        responseTimes: []
      }

      if (risk === "critical") e.critical++
      if (risk === "medium") e.medium++

      map.set(sector, e)
    }

    // تحليل الأحداث
    for (const evt of events) {
      const sector = evt.sector ?? "غير محدد"
      const e = map.get(sector)
      if (!e) continue

      if (evt.type === "ALERT_RAISED") e.alerts++

      if (evt.type === "CASE_CLOSED") {
        const raised = events.find(x =>
          x.pilgrim_id === evt.pilgrim_id &&
          x.type === "ALERT_RAISED"
        )
        if (raised) {
          const mins = minutesBetween(raised.ts, evt.ts)
          e.responseTimes.push(mins)
        }
      }
    }

    return Array.from(map.values()).map(s => {

      const heat = s.critical * 3 + s.medium * 1.5
      const avgResponse =
        s.responseTimes.length
          ? (s.responseTimes.reduce((a, b) => a + b, 0) / s.responseTimes.length).toFixed(1)
          : "—"

      const momentum =
        s.alerts >= 3 ? "تصاعدي" :
        s.alerts >= 1 ? "مراقبة" :
        "مستقر"

      const recommendation =
        heat > 10
          ? "تعزيز فوري + إرسال وحدة إسعاف"
          : heat > 5
            ? "تكثيف مراقبة ميدانية"
            : "لا تصعيد"

      return {
        ...s,
        heat,
        avgResponse,
        momentum,
        recommendation
      }

    }).sort((a, b) => b.heat - a.heat)

  }, [pilgrims, events])

  const nationalPressure =
    sectors.reduce((acc, s) => acc + s.heat, 0).toFixed(1)

  return (
    <main>
      <div className="sectionTitle">الخريطة التشغيلية الذكية</div>

      <div className="card" style={{ marginBottom: 20 }}>
        🇸🇦 مؤشر الضغط الوطني: {nationalPressure}
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {sectors.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900 }}>{s.sector}</div>
              <div style={{ fontWeight: 900 }}>
                Heat {s.heat.toFixed(1)}
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              حرجة {s.critical} — متوسطة {s.medium}
            </div>

            <div style={{ marginTop: 6, fontSize: 13 }}>
              📊 متوسط زمن الاستجابة: {s.avgResponse} دقيقة
            </div>

            <div style={{ marginTop: 6, fontSize: 13 }}>
              📈 اتجاه الخطر: {s.momentum}
            </div>

            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
              🧠 توصية تشغيلية: {s.recommendation}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
