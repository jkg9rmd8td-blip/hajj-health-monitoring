"use client"

import { useEffect, useMemo, useState } from "react"

export default function سجل_الحجاج() {
  const [data, setData] = useState([])
  const [q, setQ] = useState("")
  const [risk, setRisk] = useState("all")

  useEffect(() => {
    fetch("/api/pilgrims")
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const rows = useMemo(() => {
    const text = q.trim().toLowerCase()
    return data
      .filter(p => (risk === "all" ? true : p.risk === risk))
      .filter(p => {
        if (!text) return true
        const name = String(p.name ?? "").toLowerCase()
        const loc = String(p.location ?? "").toLowerCase()
        return name.includes(text) || loc.includes(text)
      })
      .slice(0, 100)
  }, [data, q, risk])

  return (
    <main>
      <div className="sectionTitle">سجل الحجاج (تشغيلي)</div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو الموقع…"
            style={{
              flex: "1 1 240px",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(0,0,0,.25)",
              color: "white",
              outline: "none"
            }}
          />

          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(0,0,0,.25)",
              color: "white",
              outline: "none"
            }}
          >
            <option value="all">كل المستويات</option>
            <option value="critical">حرج</option>
            <option value="medium">متوسط</option>
            <option value="low">منخفض</option>
          </select>

          <span style={{ opacity: .65, fontSize: 13 }}>
            عرض {rows.length} من {data.length}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>العمر</th>
              <th>الموقع</th>
              <th>المستوى</th>
              <th>الحرارة</th>
              <th>النبض</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={i}>
                <td>{p.name ?? "—"}</td>
                <td>{p.age ?? "—"}</td>
                <td>{p.location ?? "—"}</td>
                <td style={{ fontWeight: 900 }} className={p.risk === "critical" ? "red" : p.risk === "medium" ? "amber" : "green"}>
                  {p.risk === "critical" ? "حرج" : p.risk === "medium" ? "متوسط" : "منخفض"}
                </td>
                <td>{p.temperature ?? "—"}</td>
                <td className={Number(p.heartRate) >= 120 ? "red" : ""} style={{ fontWeight: Number(p.heartRate) >= 120 ? 900 : 600 }}>
                  {p.heartRate ?? "—"}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", opacity: .6, padding: 18 }}>
                  لا توجد نتائج مطابقة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
