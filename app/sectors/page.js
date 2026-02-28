"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"

function normalizeRiskArabic(v) {
  const x = String(v ?? "").trim()
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

function readinessIndex(total, critical, medium) {
  if (!total) return 100
  const c = (critical / total) * 100
  const m = (medium / total) * 100
  let score = 100 - Math.round(c * 1.25) - Math.round(m * 0.55)
  return Math.max(0, Math.min(100, score))
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
      const sector = String(p.clinic_location ?? p.location ?? "غير محدد")
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)

      const e = map.get(sector) ?? {
        sector,
        total: 0,
        critical: 0,
        medium: 0,
        low: 0
      }

      e.total++
      e[risk]++
      map.set(sector, e)
    }

    return Array.from(map.values())
      .map(s => ({
        ...s,
        readiness: readinessIndex(s.total, s.critical, s.medium)
      }))
      .sort((a, b) => a.readiness - b.readiness)

  }, [data])

  return (
    <main>
      <div className="sectionTitle">غرفة عمليات القطاعات</div>

      <div style={{ display: "grid", gap: 16 }}>
        {sectors.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900 }}>{s.sector}</div>
              <div>{s.readiness}%</div>
            </div>
            <div style={{ marginTop: 8 }}>
              حرجة {s.critical} — متوسطة {s.medium} — إجمالي {s.total}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
