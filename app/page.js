"use client"

import { useEffect, useMemo, useState } from "react"

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)) }

function calcRiskScore(p) {
  const hr = Number(p.heartRate ?? p.hr ?? p.pulse ?? 0)
  const t = Number(p.temperature ?? p.temp ?? p.bodyTemp ?? 0)
  const move = Number(p.movement ?? p.steps ?? p.activity ?? 0)

  // نموذج مبسط رسمي للعرض (يُستبدل لاحقاً بنموذج ML)
  let score = 0
  if (t >= 39) score += 45
  else if (t >= 38) score += 30
  else if (t >= 37.5) score += 18

  if (hr >= 130) score += 40
  else if (hr >= 120) score += 30
  else if (hr >= 110) score += 18

  if (move >= 80) score += 10
  else if (move >= 40) score += 6

  return clamp(Math.round(score), 0, 100)
}

function scoreToRisk(score) {
  if (score >= 70) return "critical"
  if (score >= 45) return "medium"
  return "low"
}

export default function Home() {
  const [data, setData] = useState([])
  const [lastSync, setLastSync] = useState(null)

  const load = () => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then((r) => r.json())
      .then((rows) => {
        const enriched = (Array.isArray(rows) ? rows : []).map((p, idx) => {
          const riskScore = calcRiskScore(p)
          const computedRisk = scoreToRisk(riskScore)
          return {
            id: p.id ?? idx + 1,
            ...p,
            riskScore,
            computedRisk,
          }
        })
        setData(enriched)
        setLastSync(new Date())
      })
      .catch(() => {
        setData([])
        setLastSync(new Date())
      })
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000) // تحديث كل 10 ثواني
    return () => clearInterval(t)
  }, [])

  const stats = useMemo(() => {
    const total = data.length

    // نقرأ "computedRisk" أولاً، وإذا غير موجود نرجع لـ risk
    const riskOf = (p) => p.computedRisk ?? p.risk

    const critical = data.filter(p => riskOf(p) === "critical").length
    const medium = data.filter(p => riskOf(p) === "medium").length
    const low = data.filter(p => riskOf(p) === "low").length

    const stability = total ? 100 - Math.round((critical / total) * 100) : 100

    const avgRisk = total
      ? Math.round(data.reduce((s, p) => s + (Number(p.riskScore) || 0), 0) / total)
      : 0

    return { total, critical, medium, low, stability, avgRisk }
  }, [data])

  const criticalRows = useMemo(() => {
    const riskOf = (p) => p.computedRisk ?? p.risk
    return data
      .filter(p => riskOf(p) === "critical")
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
      .slice(0, 8)
  }, [data])

  const locationHeat = useMemo(() => {
    const riskOf = (p) => p.computedRisk ?? p.risk
    const map = new Map()

    for (const p of data) {
      const loc = String(p.location ?? "غير محدد")
      const entry = map.get(loc) ?? { location: loc, total: 0, critical: 0, avgRiskSum: 0 }
      entry.total += 1
      if (riskOf(p) === "critical") entry.critical += 1
      entry.avgRiskSum += Number(p.riskScore) || 0
      map.set(loc, entry)
    }

    return Array.from(map.values())
      .map(x => ({ ...x, avgRisk: x.total ? Math.round(x.avgRiskSum / x.total) : 0 }))
      .sort((a, b) => (b.critical - a.critical) || (b.avgRisk - a.avgRisk))
      .slice(0, 6)
  }, [data])

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 8 }}>
        <div className="sectionTitle" style={{ margin: 0 }}>لوحة القيادة الوطنية</div>
        <div style={{ opacity: .65, fontSize: 13 }}>
          آخر تحديث: {lastSync ? lastSync.toLocaleTimeString("ar-SA") : "—"}
        </div>
      </div>

      <div className="grid4" style={{ marginTop: 14 }}>
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
          <div className="kpiLabel">المؤشر التنبؤي العام (متوسط)</div>
          <div className={"kpiValue " + (stats.avgRisk >= 70 ? "red" : stats.avgRisk >= 45 ? "amber" : "green")}>
            {stats.avgRisk}%
          </div>
          <div style={{ marginTop: 12, opacity: .7, fontSize: 13 }}>
            مؤشر تشغيلي مبسط مبني على (الحرارة + النبض + الحركة). قابل للاستبدال بنموذج تعلم آلة لاحقاً.
          </div>
        </div>
      </div>

      <div className="sectionTitle">بؤر المخاطر حسب المواقع (ملخص تشغيلي)</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>الموقع</th>
              <th>إجمالي</th>
              <th>حرج</th>
              <th>متوسط الخطر</th>
            </tr>
          </thead>
          <tbody>
            {locationHeat.map((x, i) => (
              <tr key={i}>
                <td>{x.location}</td>
                <td>{x.total}</td>
                <td className="red" style={{ fontWeight: 900 }}>{x.critical}</td>
                <td className={x.avgRisk >= 70 ? "red" : x.avgRisk >= 45 ? "amber" : "green"} style={{ fontWeight: 900 }}>
                  {x.avgRisk}%
                </td>
              </tr>
            ))}
            {locationHeat.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", opacity: .6, padding: 18 }}>
                  لا توجد بيانات كافية لتجميع المواقع.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
              <th>مؤشر الخطر</th>
            </tr>
          </thead>
          <tbody>
            {criticalRows.map((p, i) => (
              <tr key={i}>
                <td>{p.name ?? "—"}</td>
                <td>{p.location ?? "—"}</td>
                <td>{p.temperature ?? "—"}</td>
                <td className="red" style={{ fontWeight: 900 }}>{p.heartRate ?? "—"}</td>
                <td className={p.riskScore >= 70 ? "red" : p.riskScore >= 45 ? "amber" : "green"} style={{ fontWeight: 900 }}>
                  {p.riskScore}%
                </td>
              </tr>
            ))}

            {criticalRows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", opacity: .6, padding: 18 }}>
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
