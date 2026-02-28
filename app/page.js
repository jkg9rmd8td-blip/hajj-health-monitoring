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

export default function Home() {
  const [data, setData] = useState([])
  const [events, setEvents] = useState([])
  const [lastSync, setLastSync] = useState(null)

  const load = () => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => {
        setData(Array.isArray(rows) ? rows : [])
        setLastSync(new Date())
      })
      .catch(() => setData([]))

    fetch("/api/events", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => setEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setEvents([]))
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  const national = useMemo(() => {
    const total = data.length
    const critical = data.filter(p => normalizeRiskArabic(p.risk_level ?? p.risk) === "critical").length
    const medium = data.filter(p => normalizeRiskArabic(p.risk_level ?? p.risk) === "medium").length
    const low = total - critical - medium
    const score = readinessIndex(total, critical, medium)
    const b = band(score)

    const highTemp = data.filter(p => Number(p.temperature) >= 38.5).length
    const highPulse = data.filter(p => Number(p.heartRate) >= 120).length
    const highHyd = data.filter(p => Number(p.hydrationRisk) >= 60).length

    return { total, critical, medium, low, score, b, highTemp, highPulse, highHyd }
  }, [data])

  const hotspots = useMemo(() => {
    const map = new Map()
    for (const p of data) {
      const sector = String(p.clinic_location ?? p.location ?? "غير محدد")
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)
      const e = map.get(sector) ?? { sector, total: 0, critical: 0, medium: 0, low: 0 }
      e.total++; e[risk]++
      map.set(sector, e)
    }
    const arr = Array.from(map.values()).map(s => ({
      ...s,
      readiness: readinessIndex(s.total, s.critical, s.medium),
      band: band(readinessIndex(s.total, s.critical, s.medium))
    }))
    return arr.sort((a, b) => (a.readiness - b.readiness) || (b.critical - a.critical)).slice(0, 6)
  }, [data])

  const topAlerts = useMemo(() => {
    const raised = events.filter(e => e.type === "ALERT_RAISED").slice(-10).reverse()
    return raised
  }, [events])

  const actions = useMemo(() => {
    const items = []
    if (national.b.label === "تأهب") {
      items.push({ t: "رفع التأهب", d: "تعزيز فرق الإسعاف والفرز في القطاعات الأقل جاهزية خلال الذروة." })
      items.push({ t: "إجراءات بيئية", d: "تكثيف التبريد/الرش في البؤر الساخنة وفق الخريطة التشغيلية." })
      items.push({ t: "تنبيه الحملات", d: "إجراءات وقائية إلزامية للمجموعات عالية الخطورة داخل الحملات." })
    } else if (national.b.label === "مراقبة") {
      items.push({ t: "مراقبة معززة", d: "رفع نقاط الفرز وتهيئة فرق متنقلة احتياطية." })
      items.push({ t: "وقاية استباقية", d: "توجيه الحملات لإدارة الإجهاد (راحة/سوائل/تقليل جهد)." })
    } else {
      items.push({ t: "استقرار تشغيلي", d: "استمرار الرصد وتحسين التوزيع حسب الاتجاهات." })
    }
    return items
  }, [national])

  return (
    <main>
      <div className="split" style={{ marginTop: 10 }}>
        <div>
          <div className="sectionTitle" style={{ margin: 0 }}>غرفة العمليات الوطنية</div>
          <div style={{ opacity: .75, fontSize: 13, lineHeight: 1.8 }}>
            لوحة قيادة سيادية لرصد المخاطر والتوجيه الاستباقي لضيوف الرحمن.
          </div>
        </div>
        <span className="badge">
          آخر تحديث: {lastSync ? lastSync.toLocaleTimeString("ar-SA") : "—"}
        </span>
      </div>

      <div className="grid4" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="kpiLabel">جاهزية وطنية</div>
          <div className={"kpiValue " + national.b.cls}>{national.score}%</div>
        </div>
        <div className="card">
          <div className="kpiLabel">حالات حرجة</div>
          <div className="kpiValue red">{national.critical}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">حالات متوسطة</div>
          <div className="kpiValue amber">{national.medium}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">تحت الرصد</div>
          <div className="kpiValue">{national.total}</div>
        </div>
      </div>

      <div className="grid3" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="kpiLabel">إشارات حيوية (إن وجدت)</div>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <div className="tile split"><span style={{ opacity:.8 }}>حرارة ≥ 38.5</span><b className="amber">{national.highTemp}</b></div>
            <div className="tile split"><span style={{ opacity:.8 }}>نبض ≥ 120</span><b className="red">{national.highPulse}</b></div>
            <div className="tile split"><span style={{ opacity:.8 }}>مخاطر جفاف ≥ 60</span><b className="amber">{national.highHyd}</b></div>
          </div>
          <div style={{ opacity:.65, fontSize: 12, marginTop: 10 }}>
            * تظهر القيم إذا كانت موجودة في بيانات السوار.
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">قرارات تنفيذية فورية</div>
          <div style={{ display:"grid", gap: 10, marginTop: 10 }}>
            {actions.map((a, i) => (
              <div className="tile" key={i}>
                <div style={{ fontWeight: 900 }}>{a.t}</div>
                <div style={{ opacity:.8, fontSize: 13, lineHeight: 1.8, marginTop: 6 }}>{a.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">آخر التنبيهات (Raised)</div>
          <div style={{ display:"grid", gap: 10, marginTop: 10 }}>
            {topAlerts.map((e, i) => (
              <div className="tile" key={i}>
                <div className="split">
                  <b>{e.sector ?? "—"}</b>
                  <span className={String(e.severity).includes("CRIT") ? "red" : "amber"} style={{ fontWeight: 900 }}>
                    {String(e.severity).includes("CRIT") ? "حرج" : "وقائي"}
                  </span>
                </div>
                <div style={{ opacity:.8, fontSize: 13, marginTop: 6 }}>
                  {e.pilgrim_id ?? "—"} — {e.campaign_id ?? "—"}
                </div>
                <div style={{ opacity:.6, fontSize: 12, marginTop: 6 }}>{e.reason ?? ""}</div>
              </div>
            ))}
            {topAlerts.length === 0 && (
              <div style={{ opacity:.7, fontSize: 13 }}>لا توجد أحداث بعد (أضف events.json).</div>
            )}
          </div>
        </div>
      </div>

      <div className="sectionTitle">البؤر الساخنة (Hotspots)</div>
      <div className="grid3">
        {hotspots.map((h, i) => (
          <div className="tile" key={i}>
            <div className="split">
              <b>{h.sector}</b>
              <b className={h.band.cls}>{h.readiness}%</b>
            </div>
            <div style={{ opacity:.8, fontSize: 13, marginTop: 8 }}>
              إجمالي {h.total} — حرج <b className="red">{h.critical}</b> — متوسط <b className="amber">{h.medium}</b>
            </div>
          </div>
        ))}
        {hotspots.length === 0 && (
          <div className="tile" style={{ opacity:.7 }}>لا توجد بيانات قطاعات.</div>
        )}
      </div>
    </main>
  )
}
