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
  if (score >= 85) return "green"
  if (score >= 70) return "amber"
  return "red"
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
      .map(s => ({
        ...s,
        readiness: readiness(s.total, s.critical, s.medium),
        status: band(readiness(s.total, s.critical, s.medium))
      }))
      .sort((a, b) => a.readiness - b.readiness)

  }, [data])

  return (
    <main>
      <div className="sectionTitle">تحليل جاهزية القطاعات</div>

      <div style={{ display: "grid", gap: 16 }}>
        {sectors.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900 }}>{s.sector}</div>
              <div className={s.status}>{s.readiness}%</div>
            </div>

            <div style={{ marginTop: 8 }}>
              حرجة {s.critical} — متوسطة {s.medium}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
