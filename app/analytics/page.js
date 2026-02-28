"use client"

import { useEffect, useMemo, useState } from "react"

export default function التحليلات() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims")
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const computed = useMemo(() => {
    const total = data.length
    const critical = data.filter(p => p.risk === "critical").length
    const medium = data.filter(p => p.risk === "medium").length
    const low = data.filter(p => p.risk === "low").length

    const avgTemp = total
      ? (data.reduce((s, p) => s + (Number(p.temperature) || 0), 0) / total).toFixed(1)
      : "0.0"

    const highPulse = data.filter(p => Number(p.heartRate) >= 110).length

    // مؤشر تنبؤي بسيط (محاكاة رسمية للعرض)
    const riskForecast = Math.min(
      100,
      Math.round((critical * 4 + medium * 2 + highPulse * 1.5) / Math.max(total, 1) * 20)
    )

    return { total, critical, medium, low, avgTemp, highPulse, riskForecast }
  }, [data])

  return (
    <main>
      <div className="sectionTitle">التحليلات التنبؤية والإنذار المبكر</div>

      <div className="grid4">
        <Card label="متوسط الحرارة (°م)" value={computed.avgTemp} tone="amber" />
        <Card label="نبض مرتفع (≥ 110)" value={computed.highPulse} tone="red" />
        <Card label="حالات حرجة" value={computed.critical} tone="red" />
        <Card label="حالات متوسطة" value={computed.medium} tone="amber" />
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="kpiLabel">مؤشر الخطر التنبؤي (محاكاة)</div>
          <div className={"kpiValue " + (computed.riskForecast >= 70 ? "red" : computed.riskForecast >= 45 ? "amber" : "green")}>
            {computed.riskForecast}%
          </div>

          <div style={{ marginTop: 12, background: "rgba(255,255,255,.06)", borderRadius: 999, height: 12, overflow: "hidden" }}>
            <div
              style={{
                width: `${computed.riskForecast}%`,
                height: "100%",
                background: computed.riskForecast >= 70 ? "#ef4444" : computed.riskForecast >= 45 ? "#f59e0b" : "#22c55e",
                transition: "width .35s ease"
              }}
            />
          </div>

          <div style={{ marginTop: 10, opacity: .7, fontSize: 13 }}>
            يعتمد المؤشر على الوزن النسبي للحالات الحرجة والمتوسطة وارتفاع النبض، بغرض العرض التشغيلي.
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">توصيات تشغيلية تلقائية</div>
          <ul style={{ margin: 0, paddingRight: 18, opacity: .85, lineHeight: 1.9, fontSize: 13 }}>
            <li>تعزيز فرق الفرز في النقاط ذات الارتفاع الملحوظ في النبض والحرارة.</li>
            <li>رفع مستوى التنبيه عند تجاوز مؤشر الخطر 70%.</li>
            <li>توجيه فرق الإسعاف المتنقلة لقطاعات التركّز الحرِج.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

function Card({ label, value, tone }) {
  return (
    <div className="card">
      <div className="kpiLabel">{label}</div>
      <div className={"kpiValue " + (tone || "")}>{value}</div>
    </div>
  )
}
