"use client"

import { useEffect, useMemo, useState } from "react"

function normalizeRiskArabic(v) {
  const x = String(v ?? "").trim()
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

function riskLabel(r) {
  return r === "critical" ? "حرج" : r === "medium" ? "متوسط" : "منخفض"
}

function scoreCampaign(c) {
  // مؤشر امتثال تشغيلي (MVP) مبني على الاستجابة + حجم الحالات الحرجة
  // لاحقاً نربطه بالأساور المفعلة وزمن الاستجابة الحقيقي.
  const total = c.total || 1
  const criticalRate = (c.critical / total) * 100
  const mediumRate = (c.medium / total) * 100

  // كلما زادت الحرجة/المتوسطة، ينخفض “الامتثال” (لأن الهدف الوقاية/الاحتواء)
  let score = 100
  score -= Math.round(criticalRate * 1.2)
  score -= Math.round(mediumRate * 0.5)

  // عقوبة بسيطة للحملات الكبيرة بدون مراقبة كافية (شكلية في MVP)
  if (total >= 50) score -= 5
  if (total >= 200) score -= 8

  if (score < 0) score = 0
  if (score > 100) score = 100
  return score
}

function grade(score) {
  if (score >= 85) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  return "D"
}

export default function Campaigns() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const campaigns = useMemo(() => {
    const map = new Map()

    for (const p of data) {
      const loc = String(p.clinic_location ?? "غير محدد")
      const risk = normalizeRiskArabic(p.risk_level)
      const entry = map.get(loc) ?? { campaign: loc, total: 0, critical: 0, medium: 0, low: 0, sample: [] }
      entry.total += 1
      entry[risk] += 1
      if (entry.sample.length < 4) entry.sample.push(p)
      map.set(loc, entry)
    }

    const arr = Array.from(map.values()).map(c => {
      const score = scoreCampaign(c)
      return { ...c, complianceScore: score, grade: grade(score) }
    })

    return arr.sort((a, b) => (a.complianceScore - b.complianceScore) || (b.critical - a.critical))
  }, [data])

  return (
    <main>
      <div className="sectionTitle">مركز الحملات ومؤشر الامتثال (تشغيلي)</div>

      <div className="card" style={{ opacity: .8, fontSize: 13, lineHeight: 1.9 }}>
        هذه صفحة تشغيلية للحملات. في النسخة الحالية يتم تجميع الحملات حسب <b>الموقع/القطاع</b>.
        لاحقًا: ربط كل حاج بمعرف حملة رسمي (Campaign ID) وربطه بسوار BLE ووقت الاستجابة.
      </div>

      <div className="sectionTitle">ترتيب الحملات حسب الامتثال</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>الحملة / القطاع</th>
              <th>إجمالي</th>
              <th>حرج</th>
              <th>متوسط</th>
              <th>مؤشر الامتثال</th>
              <th>التصنيف</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 900 }}>{c.campaign}</td>
                <td>{c.total}</td>
                <td className="red" style={{ fontWeight: 900 }}>{c.critical}</td>
                <td className="amber" style={{ fontWeight: 900 }}>{c.medium}</td>
                <td className={c.complianceScore < 55 ? "red" : c.complianceScore < 70 ? "amber" : "green"} style={{ fontWeight: 900 }}>
                  {c.complianceScore}%
                </td>
                <td style={{ fontWeight: 900 }}>{c.grade}</td>
              </tr>
            ))}

            {campaigns.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", opacity: .6, padding: 18 }}>
                  لا توجد بيانات.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sectionTitle">أمثلة حالات (عينات تشغيلية)</div>
      <div className="grid2">
        {campaigns.slice(0, 4).map((c, i) => (
          <div className="card" key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{c.campaign}</div>
              <span style={{ opacity: .75, fontSize: 12 }}>امتثال {c.complianceScore}% — {c.grade}</span>
            </div>

            <div style={{ marginTop: 10, opacity: .75, fontSize: 13 }}>
              حرجة: <b className="red">{c.critical}</b> — متوسطة: <b className="amber">{c.medium}</b> — منخفضة: <b className="green">{c.low}</b>
            </div>

            <ul style={{ margin: "10px 0 0", paddingRight: 18, opacity: .85, lineHeight: 1.9, fontSize: 13 }}>
              {c.sample.map((p, idx) => (
                <li key={idx}>
                  {p.id} — {p.health_status ?? "—"} — <b>{riskLabel(normalizeRiskArabic(p.risk_level))}</b>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  )
}
