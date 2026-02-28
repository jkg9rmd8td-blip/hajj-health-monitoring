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

function colorBy(score) {
  if (score >= 85) return "rgba(34,197,94,.20)"
  if (score >= 70) return "rgba(245,158,11,.20)"
  return "rgba(239,68,68,.20)"
}

function borderBy(score) {
  if (score >= 85) return "rgba(34,197,94,.35)"
  if (score >= 70) return "rgba(245,158,11,.35)"
  return "rgba(239,68,68,.35)"
}

function labelBy(score) {
  if (score >= 85) return { t: "مستقر", cls: "green" }
  if (score >= 70) return { t: "مراقبة", cls: "amber" }
  return { t: "تأهب", cls: "red" }
}

export default function MapPage() {
  const [data, setData] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const sectors = useMemo(() => {
    const map = new Map()
    for (const p of data) {
      const sector = String(p.clinic_location ?? p.location ?? "غير محدد")
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)
      const e = map.get(sector) ?? { sector, total: 0, critical: 0, medium: 0, low: 0, sample: [] }
      e.total++
      e[risk]++
      if (e.sample.length < 5) e.sample.push(p)
      map.set(sector, e)
    }
    const arr = Array.from(map.values()).map(s => ({
      ...s,
      readiness: readinessIndex(s.total, s.critical, s.medium)
    }))
    return arr.sort((a, b) => a.readiness - b.readiness)
  }, [data])

  const picked = selected ?? sectors[0] ?? null
  const pickedBand = picked ? labelBy(picked.readiness) : null

  const actions = useMemo(() => {
    if (!picked) return []
    const a = []
    if (picked.critical >= 2) {
      a.push("توجيه فريق إسعاف ميداني وتعزيز مسار الإحالة.")
      a.push("تعزيز نقاط الفرز القريبة وتفعيل مراقبة لصيقة.")
    } else if (picked.medium >= 3) {
      a.push("رفع المتابعة الوقائية للحملات (راحة/سوائل/تقليل جهد).")
      a.push("تجهيز فريق متنقل احتياطي قرب القطاع.")
    } else {
      a.push("استمرار الرصد دون تصعيد.")
    }
    if (String(picked.sector).includes("منى") && (picked.critical + picked.medium) >= 3) {
      a.push("رفع كثافة التبريد/الرش في محيط القطاع خلال الذروة.")
    }
    return a
  }, [picked])

  return (
    <main>
      <div className="sectionTitle">الخريطة التشغيلية — طبقات المخاطر (Heatmap)</div>

      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 900, marginBottom: 10 }}>خريطة القطاعات (عرض حراري)</div>
          <div style={{ opacity: .75, fontSize: 13, lineHeight: 1.8, marginBottom: 12 }}>
            اضغط على أي قطاع لعرض التفاصيل والتوصيات التشغيلية.
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10
          }}>
            {sectors.map((s, i) => {
              const b = labelBy(s.readiness)
              return (
                <button
                  key={i}
                  onClick={() => setSelected(s)}
                  style={{
                    textAlign: "right",
                    cursor: "pointer",
                    background: colorBy(s.readiness),
                    border: `1px solid ${borderBy(s.readiness)}`,
                    borderRadius: 14,
                    padding: 12,
                    color: "white"
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{s.sector}</div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: .85 }}>
                    جاهزية <span className={b.cls} style={{ fontWeight: 900 }}>{s.readiness}%</span> — {b.t}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: .75 }}>
                    حرج <b className="red">{s.critical}</b> — متوسط <b className="amber">{s.medium}</b>
                  </div>
                </button>
              )
            })}

            {sectors.length === 0 && (
              <div style={{ opacity: .6 }}>لا توجد بيانات.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900 }}>تفاصيل القطاع</div>
            {pickedBand && (
              <div className={pickedBand.cls} style={{ fontWeight: 900 }}>
                {pickedBand.t}
              </div>
            )}
          </div>

          {!picked && <div style={{ opacity: .7, marginTop: 12 }}>اختر قطاعًا لعرض التفاصيل.</div>}

          {picked && (
            <>
              <div style={{ marginTop: 12, opacity: .9, fontSize: 13, lineHeight: 1.9 }}>
                <b>{picked.sector}</b> — إجمالي {picked.total} — حرجة <b className="red">{picked.critical}</b> — متوسطة <b className="amber">{picked.medium}</b>
                <br />
                الجاهزية: <b className={pickedBand.cls}>{picked.readiness}%</b>
              </div>

              <div className="sectionTitle" style={{ marginTop: 16 }}>توصيات تشغيلية</div>
              <ol style={{ margin: 0, paddingRight: 18, opacity: .9, lineHeight: 2, fontSize: 13 }}>
                {actions.map((x, i) => <li key={i}>{x}</li>)}
              </ol>

              <div className="sectionTitle" style={{ marginTop: 16 }}>عينات حالات (للتحقق)</div>
              <div style={{ display: "grid", gap: 8 }}>
                {picked.sample.map((p, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,.05)",
                    border: "1px solid rgba(255,255,255,.10)",
                    borderRadius: 14,
                    padding: 12
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>{p.id ?? "—"}</div>
                      <div className={normalizeRiskArabic(p.risk_level) === "critical" ? "red" : normalizeRiskArabic(p.risk_level) === "medium" ? "amber" : "green"} style={{ fontWeight: 900 }}>
                        {p.risk_level ?? "—"}
                      </div>
                    </div>
                    <div style={{ opacity: .8, fontSize: 13, marginTop: 6 }}>
                      {p.health_status ?? "—"} — عمر {p.age ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
