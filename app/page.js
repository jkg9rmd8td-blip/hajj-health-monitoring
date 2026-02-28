"use client"

import { useEffect, useMemo, useState } from "react"

export default function Home() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const stats = useMemo(() => {
    const total = data.length
    const critical = data.filter(p => p.risk === "critical").length
    const medium = data.filter(p => p.risk === "medium").length
    const low = data.filter(p => p.risk === "low").length
    const stability = total ? 100 - Math.round((critical / total) * 100) : 100
    return { total, critical, medium, low, stability }
  }, [data])

  const criticalRows = data
    .filter(p => p.risk === "critical")
    .slice(0, 8)

  return (
    <main>
      <div className="grid4" style={{ marginTop: 18 }}>
        <KPI label="إجمالي الحجاج تحت المراقبة" value={stats.total} />
        <KPI label="حالات حرجة" value={stats.critical} tone="red" />
        <KPI label="حالات متوسطة" value={stats.medium} tone="amber" />
        <KPI label="حالات منخفضة" value={stats.low} tone="green" />
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="kpiLabel">مؤشر استقرار المنظومة الصحية</div>
          <div className={"kpiValue " + (stats.stability >= 85 ? "green" : stats.stability >= 70 ? "amber" : "red")}>
            {stats.stability}%
          </div>
          <div style={{ marginTop: 12, opacity: .7, fontSize: 13 }}>
            يعتمد المؤشر على نسبة الحالات الحرجة من إجمالي الحالات المراقَبة.
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">ملخص تشغيلي</div>
          <ul style={{ margin: 0, paddingRight: 18, opacity: .85, lineHeight: 1.9, fontSize: 13 }}>
            <li>تحديث البيانات تلقائيًا من واجهة الخدمة الداخلية.</li>
            <li>أولوية الاستجابة للحالات الحرجة وفق مسار الفرز الطبي.</li>
            <li>إتاحة التقارير التنفيذية للقيادات عبر وضع “التنفيذي”.</li>
          </ul>
        </div>
      </div>

      <div className="sectionTitle">الحالات الحرجة (عرض سريع)</div>
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
            {criticalRows.map((p, i) => (
              <tr key={i}>
                <td>{p.name ?? "—"}</td>
                <td>{p.location ?? "—"}</td>
                <td>{p.temperature ?? "—"}</td>
                <td className="red" style={{ fontWeight: 800 }}>{p.heartRate ?? "—"}</td>
              </tr>
            ))}

            {criticalRows.length === 0 && (
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

function KPI({ label, value, tone }) {
  return (
    <div className="card">
      <div className="kpiLabel">{label}</div>
      <div className={"kpiValue " + (tone || "")}>{value}</div>
    </div>
  )
}
