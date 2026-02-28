"use client"

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

function band(score) {
  if (score >= 85) return { label: "مستقر", cls: "green" }
  if (score >= 70) return { label: "مراقبة", cls: "amber" }
  return { label: "تأهب", cls: "red" }
}

function fmtTime(d) {
  try { return d.toLocaleTimeString("ar-SA") } catch { return "—" }
}

export default function Home() {
  const [data, setData] = useState([])
  const [lastSync, setLastSync] = useState(null)

  const load = () => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => {
        setData(Array.isArray(rows) ? rows : [])
        setLastSync(new Date())
      })
      .catch(() => {
        setData([])
        setLastSync(new Date())
      })
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000) // تحديث 10 ثواني
    return () => clearInterval(t)
  }, [])

  const stats = useMemo(() => {
    const total = data.length
    const critical = data.filter(p => normalizeRiskArabic(p.risk_level ?? p.risk) === "critical").length
    const medium = data.filter(p => normalizeRiskArabic(p.risk_level ?? p.risk) === "medium").length
    const low = data.filter(p => normalizeRiskArabic(p.risk_level ?? p.risk) === "low").length

    const readiness = readinessIndex(total, critical, medium)
    const b = band(readiness)

    // إشارات سوار (إذا موجودة)
    const highTemp = data.filter(p => Number(p.temperature) >= 38.5).length
    const highPulse = data.filter(p => Number(p.heartRate) >= 120).length
    const highHyd = data.filter(p => Number(p.hydrationRisk) >= 60).length

    return { total, critical, medium, low, readiness, band: b, highTemp, highPulse, highHyd }
  }, [data])

  const hotspots = useMemo(() => {
    const map = new Map()
    for (const p of data) {
      const sector = String(p.clinic_location ?? p.location ?? "غير محدد")
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)
      const e = map.get(sector) ?? { sector, total: 0, critical: 0, medium: 0, low: 0 }
      e.total++
      e[risk]++
      map.set(sector, e)
    }
    const arr = Array.from(map.values()).map(s => ({
      ...s,
      readiness: readinessIndex(s.total, s.critical, s.medium)
    }))
    return arr.sort((a, b) => (a.readiness - b.readiness) || (b.critical - a.critical)).slice(0, 6)
  }, [data])

  const criticalRows = useMemo(() => {
    return data
      .filter(p => normalizeRiskArabic(p.risk_level ?? p.risk) === "critical")
      .slice(0, 8)
  }, [data])

  const actions = useMemo(() => {
    const items = []
    if (stats.band.label === "تأهب") {
      items.push({ title: "رفع التأهب", detail: "تعزيز فرق الإسعاف والفرز في القطاعات الأقل جاهزية خلال الذروة." })
      items.push({ title: "إجراءات بيئية", detail: "تكثيف التبريد/الرش في البؤر الساخنة وفق الخريطة التشغيلية." })
      items.push({ title: "تنبيه الحملات", detail: "تفعيل رسائل وقائية إلزامية للمجموعات عالية الخطورة." })
    } else if (stats.band.label === "مراقبة") {
      items.push({ title: "مراقبة معززة", detail: "رفع نقاط الفرز وتهيئة فرق متنقلة احتياطية." })
      items.push({ title: "وقاية استباقية", detail: "توجيه الحملات لإدارة الإجهاد (راحة/سوائل/تقليل جهد)." })
    } else {
      items.push({ title: "استقرار تشغيلي", detail: "استمرار الرصد وتحسين التوزيع حسب الاتجاهات." })
    }
    return items
  }, [stats])

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginTop: 10 }}>
        <div className="sectionTitle" style={{ margin: 0 }}>غرفة العمليات الوطنية — صحة ضيوف الرحمن</div>
        <div style={{ opacity: .65, fontSize: 13 }}>آخر تحديث: {lastSync ? fmtTime(lastSync) : "—"}</div>
      </div>

      <div className="grid4" style={{ marginTop: 14 }}>
        <KPI label="إجمالي الحالات تحت الرصد" value={stats.total} />
        <KPI label="حالات حرجة" value={stats.critical} tone="red" />
        <KPI label="حالات متوسطة" value={stats.medium} tone="amber" />
        <KPI label="حالات منخفضة" value={stats.low} tone="green" />
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="kpiLabel">المؤشر الوطني للجاهزية الصحية</div>
          <div className={"kpiValue " + stats.band.cls}>{stats.readiness}%</div>
          <div style={{ marginTop: 10, opacity: .8, fontSize: 13 }}>
            الحالة: <b>{stats.band.label}</b> — يعتمد على توزيع (حرج/متوسط) لكل الحالات.
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <MiniChip label="حرارة مرتفعة" value={stats.highTemp} tone="amber" />
            <MiniChip label="نبض مرتفع" value={stats.highPulse} tone="red" />
            <MiniChip label="مخاطر جفاف" value={stats.highHyd} tone="amber" />
          </div>
          <div style={{ marginTop: 10, opacity: .65, fontSize: 12 }}>
            * المؤشرات الحيوية تظهر فقط إذا كانت موجودة في البيانات.
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">بطاقات قرار (Executive Actions)</div>
          <div style={{ display: "grid", gap: 10 }}>
            {actions.map((a, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.10)",
                borderRadius: 14,
                padding: 14
              }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{a.title}</div>
                <div style={{ opacity: .8, fontSize: 13, lineHeight: 1.8 }}>{a.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sectionTitle">البؤر الساخنة (Hotspots) حسب القطاعات</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>القطاع</th>
              <th>الجاهزية</th>
              <th>إجمالي</th>
              <th>حرج</th>
              <th>متوسط</th>
            </tr>
          </thead>
          <tbody>
            {hotspots.map((h, i) => {
              const b = band(h.readiness)
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 900 }}>{h.sector}</td>
                  <td className={b.cls} style={{ fontWeight: 900 }}>{h.readiness}%</td>
                  <td>{h.total}</td>
                  <td className="red" style={{ fontWeight: 900 }}>{h.critical}</td>
                  <td className="amber" style={{ fontWeight: 900 }}>{h.medium}</td>
                </tr>
              )
            })}
            {hotspots.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", opacity: .6, padding: 18 }}>لا توجد بيانات.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sectionTitle">الحالات الحرجة — عرض سريع</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>المعرّف</th>
              <th>العمر</th>
              <th>الحالة</th>
              <th>القطاع</th>
              <th>المستوى</th>
            </tr>
          </thead>
          <tbody>
            {criticalRows.map((p, i) => (
              <tr key={i}>
                <td>{p.id ?? "—"}</td>
                <td>{p.age ?? "—"}</td>
                <td>{p.health_status ?? "—"}</td>
                <td>{p.clinic_location ?? "—"}</td>
                <td className="red" style={{ fontWeight: 900 }}>{p.risk_level ?? "حرجة"}</td>
              </tr>
            ))}
            {criticalRows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", opacity: .6, padding: 18 }}>لا توجد حالات حرجة حالياً.</td></tr>
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

function MiniChip({ label, value, tone }) {
  const cls = tone === "red" ? "red" : tone === "amber" ? "amber" : "green"
  return (
    <div style={{
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.10)",
      borderRadius: 999,
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 10
    }}>
      <span style={{ opacity: .75, fontSize: 12 }}>{label}</span>
      <span className={cls} style={{ fontWeight: 900 }}>{value}</span>
    </div>
  )
}
