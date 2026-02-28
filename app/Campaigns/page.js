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

function grade(score) {
  if (score >= 90) return "A+"
  if (score >= 80) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  return "D"
}

function riskLabel(r) {
  return r === "critical" ? "حرج" : r === "medium" ? "متوسط" : "منخفض"
}

export default function Campaigns() {
  const [data, setData] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then((rows) => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setData([]))
  }, [])

  const campaigns = useMemo(() => {
    const map = new Map()

    for (const p of data) {
      const cid = String(p.campaign_id ?? p.campaignId ?? "CAMP-UNKNOWN")
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)
      const e = map.get(cid) ?? {
        campaign_id: cid,
        total: 0, critical: 0, medium: 0, low: 0,
        sectors: new Map(),
        sampleCritical: []
      }

      e.total++
      e[risk]++

      const sector = String(p.clinic_location ?? p.location ?? "غير محدد")
      const s = e.sectors.get(sector) ?? { sector, total: 0, critical: 0, medium: 0, low: 0 }
      s.total++
      s[risk]++
      e.sectors.set(sector, s)

      if (risk === "critical" && e.sampleCritical.length < 6) e.sampleCritical.push(p)

      map.set(cid, e)
    }

    const arr = Array.from(map.values()).map(c => {
      const readiness = readinessIndex(c.total, c.critical, c.medium)
      const compliance = readiness // في MVP: الامتثال التشغيلي = جاهزية (لاحقًا SLA من الأحداث)
      const sectors = Array.from(c.sectors.values()).map(s => ({
        ...s,
        readiness: readinessIndex(s.total, s.critical, s.medium)
      })).sort((a, b) => a.readiness - b.readiness)

      return {
        ...c,
        readiness,
        compliance,
        grade: grade(compliance),
        sectors
      }
    })

    return arr.sort((a, b) => (a.compliance - b.compliance) || (b.critical - a.critical))
  }, [data])

  const current = selected
    ? campaigns.find(c => c.campaign_id === selected) ?? campaigns[0] ?? null
    : campaigns[0] ?? null

  const actions = useMemo(() => {
    if (!current) return []
    const a = []
    if (current.critical >= 2) {
      a.push("رفع التأهب: توجيه فريق ميداني/إسعافي للحملة في القطاع الأكثر خطورة.")
      a.push("إلزام الحملة بإجراءات وقائية فورية: سوائل + راحة + تقليل جهد.")
      a.push("فتح مسار إحالة سريع للحالات الحرجة (الساعة الذهبية).")
    } else if (current.medium >= 3) {
      a.push("رفع المتابعة: تكثيف التوعية الوقائية داخل الحملة وتوزيع المياه.")
      a.push("تجهيز فريق متنقل احتياطي قرب القطاع الأقل جاهزية.")
    } else {
      a.push("استمرار الرصد: لا تصعيد، تحسين التنظيم الداخلي للحملة حسب الاتجاهات.")
    }
    return a
  }, [current])

  return (
    <main>
      <div className="sectionTitle">مركز الحملات (Campaign Command Center)</div>

      <div className="grid2">
        {/* قائمة الحملات */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900 }}>الحملات</div>
            <div style={{ opacity: .7, fontSize: 12 }}>ترتيب حسب الامتثال (MVP)</div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {campaigns.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(c.campaign_id)}
                style={{
                  textAlign: "right",
                  cursor: "pointer",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.10)",
                  borderRadius: 14,
                  padding: 12,
                  color: "white"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 900 }}>{c.campaign_id}</div>
                  <div style={{ fontWeight: 900 }} className={c.compliance < 70 ? "red" : c.compliance < 85 ? "amber" : "green"}>
                    {c.compliance}%
                  </div>
                </div>
                <div style={{ marginTop: 6, opacity: .8, fontSize: 12 }}>
                  إجمالي {c.total} — حرج <b className="red">{c.critical}</b> — متوسط <b className="amber">{c.medium}</b> — تصنيف <b>{c.grade}</b>
                </div>
              </button>
            ))}

            {campaigns.length === 0 && (
              <div style={{ opacity: .6 }}>لا توجد بيانات حملات (أضف campaign_id في data.json).</div>
            )}
          </div>
        </div>

        {/* تفاصيل الحملة */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900 }}>تفاصيل الحملة</div>
            {current && (
              <div style={{ opacity: .75, fontSize: 12 }}>
                الامتثال: <b className={current.compliance < 70 ? "red" : current.compliance < 85 ? "amber" : "green"}>{current.compliance}%</b> — {current.grade}
              </div>
            )}
          </div>

          {!current && <div style={{ opacity: .7, marginTop: 12 }}>اختر حملة لعرض التفاصيل.</div>}

          {current && (
            <>
              <div style={{ marginTop: 12, opacity: .9, fontSize: 13, lineHeight: 1.9 }}>
                <b>{current.campaign_id}</b> — إجمالي {current.total} — حرجة <b className="red">{current.critical}</b> — متوسطة <b className="amber">{current.medium}</b> — منخفضة <b className="green">{current.low}</b>
              </div>

              <div className="sectionTitle" style={{ marginTop: 16 }}>توصيات تشغيلية للحملة</div>
              <ol style={{ margin: 0, paddingRight: 18, opacity: .9, lineHeight: 2, fontSize: 13 }}>
                {actions.map((x, i) => <li key={i}>{x}</li>)}
              </ol>

              <div className="sectionTitle" style={{ marginTop: 16 }}>القطاعات التابعة للحملة (الأقل جاهزية أولاً)</div>
              <div className="card" style={{ padding: 0, marginTop: 10 }}>
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
                    {current.sectors.slice(0, 6).map((s, i) => {
                      const cls = s.readiness < 70 ? "red" : s.readiness < 85 ? "amber" : "green"
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 900 }}>{s.sector}</td>
                          <td className={cls} style={{ fontWeight: 900 }}>{s.readiness}%</td>
                          <td>{s.total}</td>
                          <td className="red" style={{ fontWeight: 900 }}>{s.critical}</td>
                          <td className="amber" style={{ fontWeight: 900 }}>{s.medium}</td>
                        </tr>
                      )
                    })}

                    {current.sectors.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: "center", opacity: .6, padding: 18 }}>لا توجد قطاعات.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="sectionTitle" style={{ marginTop: 16 }}>أعلى المخاطر داخل الحملة (Top Risk)</div>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {(current.sampleCritical.length ? current.sampleCritical : []).map((p, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,.05)",
                    border: "1px solid rgba(255,255,255,.10)",
                    borderRadius: 14,
                    padding: 12
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>{p.name ?? p.id ?? "—"}</div>
                      <div className="red" style={{ fontWeight: 900 }}>{riskLabel(normalizeRiskArabic(p.risk_level ?? p.risk))}</div>
                    </div>
                    <div style={{ opacity: .8, fontSize: 13, marginTop: 6 }}>
                      {p.health_status ?? "—"} — عمر {p.age ?? "—"} — {p.clinic_location ?? "—"}
                      {p.heartRate ? ` — نبض ${p.heartRate}` : ""}
                      {p.temperature ? ` — حرارة ${p.temperature}` : ""}
                    </div>
                  </div>
                ))}

                {current.sampleCritical.length === 0 && (
                  <div style={{ opacity: .7, fontSize: 13 }}>لا توجد حالات حرجة داخل هذه الحملة حالياً.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
