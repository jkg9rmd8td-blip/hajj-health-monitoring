"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"

function normalizeRisk(v) {
  const x = String(v ?? "")
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

export default function MapPage() {

  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setData([]))
  }, [])

  const heatMap = useMemo(() => {

    const map = new Map()

    for (const p of data) {
      const sector = String(p.clinic_location ?? "غير محدد")
      const risk = normalizeRisk(p.risk_level ?? p.risk)

      const e = map.get(sector) ?? {
        sector,
        critical: 0,
        medium: 0
      }

      if (risk === "critical") e.critical++
      if (risk === "medium") e.medium++

      map.set(sector, e)
    }

    return Array.from(map.values())
      .map(s => ({
        ...s,
        heatScore: (s.critical * 3) + (s.medium * 1.5)
      }))
      .sort((a, b) => b.heatScore - a.heatScore)

  }, [data])

  const nationalHeat = heatMap.reduce((acc, s) => acc + s.heatScore, 0)

  return (
    <main>
      <div className="sectionTitle">الخريطة الحرارية الوطنية</div>

      <div className="card" style={{ marginBottom: 20 }}>
        🔥 مؤشر الضغط الوطني: {nationalHeat.toFixed(1)}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {heatMap.map((s, i) => (
          <div key={i} className="card">
            <div style={{ fontWeight: 900 }}>{s.sector}</div>
            <div style={{ marginTop: 6 }}>
              🔥 Heat Score: {s.heatScore.toFixed(1)}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              حرجة {s.critical} — متوسطة {s.medium}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
