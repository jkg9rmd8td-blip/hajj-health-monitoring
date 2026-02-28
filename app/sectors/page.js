"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"

function normalizeRisk(v) {
  const x = String(v ?? "")
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

function readiness(total, critical, medium) {
  if (!total) return 100
  const score = 100 - (critical * 2.5) - (medium * 1.2)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function band(score) {
  if (score >= 85) return { label: "مستقر", cls: "green" }
  if (score >= 70) return { label: "مراقبة", cls: "amber" }
  return { label: "تأهب", cls: "red" }
}

function predict(critical, medium) {
  const score = (critical * 3) + (medium * 1.5)
  if (score >= 15) return "تصاعد خطر خلال 20 دقيقة"
  if (score >= 8) return "مراقبة متقدمة"
  return "مستقر"
}

function recommendation(readiness) {
  if (readiness < 60)
    return "تعزيز موارد فوري + نقل فريق ميداني"
  if (readiness < 75)
    return "تكثيف تبريد + متابعة لصيقة"
  return "استمرار الرصد الدوري"
}

export default function Sectors() {

  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setData([]))
  }, [])

  const sectors = useMemo(() => {

    const map = new Map()

    for (const p of data) {
      const sector = String(p.clinic_location ?? "غير محدد")
      const risk = normalizeRisk(p.risk_level ?? p.risk)

      const e = map.get(sector) ?? {
        sector,
        total: 0,
        critical: 0,
        medium: 0
      }

      e.total++
      e[risk]++
      map.set(sector, e)
    }

    return Array.from(map.values())
      .map(s => {
        const r = readiness(s.total, s.critical, s.medium)
        return {
          ...s,
          readiness: r,
          band: band(r)
        }
      })
      .sort((a, b) => a.readiness - b.readiness)

  }, [data])

  const worst = sectors[0]

  return (
    <main>
      <div className="sectionTitle">غرفة عمليات القطاعات</div>

      {worst && (
        <div className="card" style={{ marginBottom: 20 }}>
          ⚠️ أكثر قطاع يحتاج تدخل: <b>{worst.sector}</b> — {worst.readiness}%
        </div>
      )}

      <div style={{ display: "grid", gap: 18 }}>
        {sectors.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900 }}>{s.sector}</div>
              <div className={s.band.cls} style={{ fontWeight: 900 }}>
                {s.readiness}%
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              حرجة {s.critical} — متوسطة {s.medium}
            </div>

            <div style={{ marginTop: 6, fontSize: 13 }}>
              📈 {predict(s.critical, s.medium)}
            </div>

            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
              🧠 توصية تشغيلية: {recommendation(s.readiness)}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
