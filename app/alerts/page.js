"use client"

import { useEffect, useMemo, useState } from "react"

export default function التنبيهات() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims")
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const alerts = useMemo(() => {
    const critical = data.filter(p => p.risk === "critical")
    const highTemp = data.filter(p => Number(p.temperature) >= 39)
    const highPulse = data.filter(p => Number(p.heartRate) >= 120)

    const items = []

    if (critical.length) {
      items.push({
        level: "حرج",
        tone: "red",
        title: "ارتفاع عدد الحالات الحرجة",
        detail: `تم رصد ${critical.length} حالة حرجة تتطلب تدخلًا عاجلًا.`
      })
    }

    if (highTemp.length) {
      items.push({
        level: "تحذير",
        tone: "amber",
        title: "ارتفاع حرارة محتمل",
        detail: `تم رصد ${highTemp.length} حالة بدرجة حرارة ≥ 39°م.`
      })
    }

    if (highPulse.length) {
      items.push({
        level: "تحذير",
        tone: "amber",
        title: "تسارع نبض مرتفع",
        detail: `تم رصد ${highPulse.length} حالة بنبض ≥ 120.`
      })
    }

    if (!items.length) {
      items.push({
        level: "مستقر",
        tone: "green",
        title: "لا توجد تنبيهات حالياً",
        detail: "المنظومة تعمل ضمن المؤشرات الطبيعية."
      })
    }

    return items
  }, [data])

  return (
    <main>
      <div className="sectionTitle">مركز التنبيهات الصحية</div>

      <div className="grid2">
        {alerts.map((a, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{a.title}</div>
              <Badge tone={a.tone}>{a.level}</Badge>
            </div>
            <div style={{ marginTop: 10, opacity: .75, fontSize: 13, lineHeight: 1.8 }}>
              {a.detail}
            </div>
          </div>
        ))}
      </div>

      <div className="sectionTitle">آخر الحالات الحرجة</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الموقع</th>
              <th>الحرارة</th>
              <th>النبض</th>
            </tr>
          </thead>
          <tbody>
            {data.filter(p => p.risk === "critical").slice(0, 10).map((p, i) => (
              <tr key={i}>
                <td>{p.name ?? "—"}</td>
                <td>{p.location ?? "—"}</td>
                <td>{p.temperature ?? "—"}</td>
                <td className="red" style={{ fontWeight: 900 }}>{p.heartRate ?? "—"}</td>
              </tr>
            ))}
            {data.filter(p => p.risk === "critical").length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", opacity: .6, padding: 18 }}>
                  لا توجد حالات حرجة حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function Badge({ tone, children }) {
  const bg = tone === "red" ? "rgba(239,68,68,.18)" : tone === "amber" ? "rgba(245,158,11,.18)" : "rgba(34,197,94,.18)"
  const bd = tone === "red" ? "rgba(239,68,68,.35)" : tone === "amber" ? "rgba(245,158,11,.35)" : "rgba(34,197,94,.35)"
  const cl = tone === "red" ? "#ef4444" : tone === "amber" ? "#f59e0b" : "#22c55e"

  return (
    <span style={{
      background: bg,
      border: `1px solid ${bd}`,
      color: cl,
      padding: "8px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900
    }}>
      {children}
    </span>
  )
}
