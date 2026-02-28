"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"

export default function MapPage() {

  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setData([]))
  }, [])

  return (
    <main>
      <div className="sectionTitle">الخريطة التشغيلية</div>

      <div className="card">
        عدد الحالات: {data.length}
      </div>

      <div style={{ marginTop: 20 }}>
        {data.slice(0, 20).map((p, i) => (
          <div key={i} className="card" style={{ marginBottom: 10 }}>
            {p.name ?? p.id ?? "—"} — {p.clinic_location ?? "غير محدد"}
          </div>
        ))}
      </div>
    </main>
  )
}
