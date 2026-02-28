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
  if (score < 0) score = 0
  if (score > 100) score = 100
  return score
}

function band(score) {
  if (score >= 85) return { label: "مستقر", cls: "green" }
  if (score >= 70) return { label: "مراقبة", cls: "amber" }
  return { label: "تأهب", cls: "red" }
}

function toMashaaer(loc) {
  const s = String(loc ?? "").toLowerCase()
  if (s.includes("عرفات")) return "عرفات"
  if (s.includes("مزدلفة")) return "مزدلفة"
  if (s.includes("جمر")) return "الجمرات"
  if (s.includes("منى")) return "منى"
  return "أخرى"
}

export default function National() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const national = useMemo(() => {
    const total = data.length
    const critical = data.filter(p => normalizeRiskArabic(p.risk_level ?? p.risk) === "critical").length
    const medium = data.filter(p => normalizeRiskArabic(p.risk_level ?? p.risk) === "medium").length
    const score = readinessIndex(total, critical, medium)
    const b = band(score)
    return { total, critical, medium, score, ...b }
  }, [data])

  const mashaaer = useMemo(() => {
    const map = new Map()
    for (const p of data) {
      const key = toMashaaer(p.clinic_location ?? p.location)
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)
      const e = map.get(key) ?? { name: key, total: 0, critical: 0, medium: 0, low: 0 }
      e.total++
      e[risk]++
      map.set(key, e)
    }

    const arr = Array.from(map.values()).map(x => {
      const score = readinessIndex(x.total, x.critical, x.medium)
      const b = band(score)
      return { ...x, score, bandLabel: b.label, bandClass: b.cls }
    })

    return arr.sort((a, b) => a.score - b.score)
  }, [data])

  const actions = useMemo(() => {
    const items = []
    if (national.score < 70) {
      items.push("رفع مستوى التأهب الوطني: تعزيز فرق الإسعاف في القطاعات الأقل جاهزية.")
      items.push("تفعيل إجراءات بيئية: زيادة التبريد/الرش في بؤر الخطر خلال الذروة.")
      items.push("تنبيه الحملات: توجيه وقائي إلزامي للمجموعات عالية الخطورة.")
    } else if (national.score < 85) {
      items.push("رفع المراقبة: زيادة نقاط الفرز وتفعيل رسائل وقائية للحملات.")
      items.push("تجهيز فرق متنقلة احتياطية قرب القطاعات ذات الجاهزية المتوسطة.")
    } else {
      items.push("المنظومة مستقرة: الاستمرار في الرصد وتحسين توزيع الموارد حسب الاتجاهات.")
    }
    return items
  }, [national])

  return (
    <main>
      <div className="sectionTitle">المؤشر الوطني للجاهزية الصحية (National Readiness Index)</div>

      <div className="grid2">
        <div className="card">
          <div className="kpiLabel">جاهزية المنظومة الوطنية</div>
          <div className={"kpiValue " + national.cls}>{national.score}%</div>
          <div style={{ marginTop: 10, opacity: .75, fontSize: 13 }}>
            الحالة: <b>{national.label}</b> — إجمالي {national.total} — حرجة <b className="red">{national.critical}</b> — متوسطة <b className="amber">{national.medium}</b>
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">توصيات سيادية فورية</div>
          <ol style={{ margin: 0, paddingRight: 18, opacity: .9, lineHeight: 2, fontSize: 13 }}>
            {actions.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
        </div>
      </div>

      <div className="sectionTitle">جاهزية المشاعر (ملخص قيادي)</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>المشعر</th>
              <th>الجاهزية</th>
              <th>الحالة</th>
              <th>إجمالي</th>
              <th>حرج</th>
              <th>متوسط</th>
            </tr>
          </thead>
          <tbody>
            {mashaaer.map((m, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 900 }}>{m.name}</td>
                <td className={m.bandClass} style={{ fontWeight: 900 }}>{m.score}%</td>
                <td>{m.bandLabel}</td>
                <td>{m.total}</td>
                <td className="red" style={{ fontWeight: 900 }}>{m.critical}</td>
                <td className="amber" style={{ fontWeight: 900 }}>{m.medium}</td>
              </tr>
            ))}
            {mashaaer.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", opacity: .6, padding: 18 }}>لا توجد بيانات.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
