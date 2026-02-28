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
function mins(a, b) {
  const x = new Date(a).getTime()
  const y = new Date(b).getTime()
  if (!isFinite(x) || !isFinite(y)) return null
  return Math.max(0, Math.round((y - x) / 60000))
}
function calcSLA(events, campaignId) {
  const ev = (events || []).filter(e => String(e.campaign_id ?? "") === String(campaignId))
  const raised = ev.filter(e => e.type === "ALERT_RAISED")
  const ack = ev.filter(e => e.type === "ALERT_ACK")
  const dispatch = ev.filter(e => e.type === "DISPATCH")
  const closed = ev.filter(e => e.type === "CASE_CLOSED")
  const rec = ev.filter(e => e.type === "RECOMMENDATION_SENT")

  const responseTimes = []
  const dispatchTimes = []
  const closeTimes = []

  for (const r of raised) {
    const a = ack.find(x => x.pilgrim_id === r.pilgrim_id && x.sector === r.sector && new Date(x.ts) >= new Date(r.ts))
    const d = dispatch.find(x => x.pilgrim_id === r.pilgrim_id && x.sector === r.sector && new Date(x.ts) >= new Date(r.ts))
    const c = closed.find(x => x.pilgrim_id === r.pilgrim_id && x.sector === r.sector && new Date(x.ts) >= new Date(r.ts))
    if (a) responseTimes.push(mins(r.ts, a.ts))
    if (d) dispatchTimes.push(mins(r.ts, d.ts))
    if (c) closeTimes.push(mins(r.ts, c.ts))
  }

  const avg = (xs) => xs.length ? Math.round(xs.reduce((s, v) => s + (v ?? 0), 0) / xs.length) : null

  let recAck = 0
  for (const rr of rec) {
    const a = ack.find(x => x.pilgrim_id === rr.pilgrim_id && x.sector === rr.sector && new Date(x.ts) >= new Date(rr.ts))
    if (a) recAck++
  }
  const recExec = rec.length ? Math.round((recAck / rec.length) * 100) : 0

  return { alerts: raised.length, responseMin: avg(responseTimes), dispatchMin: avg(dispatchTimes), closeMin: avg(closeTimes), recExec }
}

export default function Campaigns() {
  const [data, setData] = useState([])
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState(null)
  const [q, setQ] = useState("")
  const [riskFilter, setRiskFilter] = useState("all") // all | critical | medium
  const [sortBy, setSortBy] = useState("compliance") // compliance | critical

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then((rows) => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setData([]))
  }, [])

  useEffect(() => {
    fetch("/api/events", { cache: "no-store" })
      .then(r => r.json())
      .then((rows) => setEvents(Array.isArray(rows) ? rows : []))
      .catch(() => setEvents([]))
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
      const compliance = readiness
      const sectors = Array.from(c.sectors.values()).map(s => ({
        ...s,
        readiness: readinessIndex(s.total, s.critical, s.medium)
      })).sort((a, b) => a.readiness - b.readiness)

      const sla = calcSLA(events, c.campaign_id)

      return {
        ...c,
        compliance,
        grade: grade(compliance),
        sectors,
        sla
      }
    })

    const filtered = arr.filter(c => {
      const hit = String(c.campaign_id).toLowerCase().includes(q.trim().toLowerCase())
      if (!hit) return false
      if (riskFilter === "critical") return c.critical > 0
      if (riskFilter === "medium") return c.medium > 0
      return true
    })

    filtered.sort((a, b) => {
      if (sortBy === "critical") return (b.critical - a.critical) || (a.compliance - b.compliance)
      return (a.compliance - b.compliance) || (b.critical - a.critical)
    })

    return filtered
  }, [data, events, q, riskFilter, sortBy])

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
      <div className="split" style={{ marginTop: 10 }}>
        <div>
          <div className="sectionTitle" style={{ margin: 0 }}>مركز الحملات (Campaign Command)</div>
          <div style={{ opacity: .75, fontSize: 13, lineHeight: 1.8 }}>
            لوحة تشغيلية للحملات: امتثال تشغيلي + SLA فعلي من سجل الأحداث.
          </div>
        </div>
        <span className="badge">SLA من /api/events</span>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="split">
            <div style={{ fontWeight: 900 }}>الحملات</div>
            <div style={{ opacity: .7, fontSize: 12 }}>بحث/فلاتر/ترتيب</div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث عن حملة… (CAMP-MINA-01)"
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setRiskFilter("all")} aria-pressed={riskFilter === "all"}>الكل</button>
              <button className="btn" onClick={() => setRiskFilter("critical")} aria-pressed={riskFilter === "critical"}>حرجة فقط</button>
              <button className="btn" onClick={() => setRiskFilter("medium")} aria-pressed={riskFilter === "medium"}>متوسطة فقط</button>

              <span style={{ width: 10 }} />

              <button className="btn" onClick={() => setSortBy("compliance")} aria-pressed={sortBy === "compliance"}>ترتيب: الامتثال</button>
              <button className="btn" onClick={() => setSortBy("critical")} aria-pressed={sortBy === "critical"}>ترتيب: الحرجة</button>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {campaigns.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(c.campaign_id)}
                className="tile"
                style={{ textAlign: "right", cursor: "pointer", color: "white" }}
              >
                <div className="split">
                  <div style={{ fontWeight: 900 }}>{c.campaign_id}</div>
                  <div className={c.compliance < 70 ? "red" : c.compliance < 85 ? "amber" : "green"} style={{ fontWeight: 900 }}>
                    {c.compliance}%
                  </div>
                </div>
                <div style={{ marginTop: 8, opacity: .85, fontSize: 12, lineHeight: 1.8 }}>
                  إجمالي {c.total} — حرج <b className="red">{c.critical}</b> — متوسط <b className="amber">{c.medium}</b> — تصنيف <b>{c.grade}</b>
                  <br />
                  SLA: استجابة <b>{c.sla?.responseMin == null ? "—" : `${c.sla.responseMin}د`}</b> — تنفيذ <b className={(c.sla?.recExec ?? 0) < 70 ? "amber" : "green"}>{c.sla?.recExec ?? 0}%</b>
                </div>
              </button>
            ))}
            {campaigns.length === 0 && (
              <div style={{ opacity: .7 }}>لا توجد بيانات حملات (أضف campaign_id في data.json).</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="split">
            <div style={{ fontWeight: 900 }}>لوحة الحملة</div>
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

              <div className="grid4" style={{ marginTop: 12 }}>
                <div className="card">
                  <div className="kpiLabel">تنبيهات</div>
                  <div className="kpiValue">{current.sla?.alerts ?? 0}</div>
                </div>
                <div className="card">
                  <div className="kpiLabel">متوسط الاستجابة</div>
                  <div className="kpiValue">{current.sla?.responseMin == null ? "—" : `${current.sla.responseMin}د`}</div>
                </div>
                <div className="card">
                  <div className="kpiLabel">متوسط الإرسال</div>
                  <div className="kpiValue">{current.sla?.dispatchMin == null ? "—" : `${current.sla.dispatchMin}د`}</div>
                </div>
                <div className="card">
                  <div className="kpiLabel">تنفيذ التوصيات</div>
                  <div className={"kpiValue " + ((current.sla?.recExec ?? 0) < 70 ? "amber" : "green")}>
                    {current.sla?.recExec ?? 0}%
                  </div>
                </div>
              </div>

              <div className="sectionTitle" style={{ marginTop: 16 }}>توصيات تشغيلية</div>
              <ol style={{ margin: 0, paddingRight: 18, opacity: .9, lineHeight: 2, fontSize: 13 }}>
                {actions.map((x, i) => <li key={i}>{x}</li>)}
              </ol>

              <button
                className="btn"
                style={{ marginTop: 12 }}
                onClick={() => {
                  const worst = current.sectors?.[0]
                  const text =
`تقرير موجز — مركز الحملات
الحملة: ${current.campaign_id}
الامتثال (تشغيلي): ${current.compliance}% — التصنيف: ${current.grade}
إجمالي الحالات: ${current.total}
حرجة: ${current.critical} | متوسطة: ${current.medium} | منخفضة: ${current.low}
SLA: استجابة ${current.sla?.responseMin ?? "—"} د | إرسال ${current.sla?.dispatchMin ?? "—"} د | إغلاق ${current.sla?.closeMin ?? "—"} د | تنفيذ ${current.sla?.recExec ?? 0}%
أخطر قطاع: ${worst ? `${worst.sector} (جاهزية ${worst.readiness}%)` : "—"}
توصيات:
- ${actions.join("\n- ")}`
                  navigator.clipboard?.writeText(text)
                  alert("تم نسخ التقرير ✅")
                }}
              >
                نسخ تقرير موجز
              </button>

              <div className="sectionTitle" style={{ marginTop: 16 }}>القطاعات التابعة للحملة</div>
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
                    {current.sectors.slice(0, 8).map((s, i) => {
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
            </>
          )}
        </div>
      </div>
    </main>
  )
}
