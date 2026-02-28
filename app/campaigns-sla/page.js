"use client"

import { useEffect, useMemo, useState } from "react"

function normalizeRiskArabic(v) {
  const x = String(v ?? "").trim()
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

function grade(score) {
  if (score >= 90) return "A+"
  if (score >= 80) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  return "D"
}

// SLA تجريبي للعرض: (زمن استجابة + تنفيذ توصيات) يتم توليده مبدئياً
function pseudoSLA(campaignId) {
  // ثابت شبه عشوائي حسب اسم الحملة (بدون مكتبات)
  let h = 0
  const s = String(campaignId ?? "")
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000
  const responseMin = 3 + (h % 18)           // 3 إلى 20 دقيقة
  const complianceExec = 55 + (h % 41)       // 55% إلى 95%
  const violations = h % 4                   // 0..3
  return { responseMin, complianceExec, violations }
}

function complianceScore(c) {
  const total = c.total || 1
  const criticalRate = (c.critical / total) * 100
  const mediumRate = (c.medium / total) * 100

  const sla = c.sla

  // الامتثال = (تقليل الحرجة/المتوسطة) + (سرعة الاستجابة) + (تنفيذ التوصيات) - (مخالفات)
  let score = 100
  score -= Math.round(criticalRate * 1.2)
  score -= Math.round(mediumRate * 0.5)

  // زمن الاستجابة: كل دقيقة فوق 8 تُخصم
  score -= Math.max(0, sla.responseMin - 8) * 2

  // تنفيذ التوصيات: يضيف نقاط
  score += Math.round((sla.complianceExec - 70) * 0.4)

  // المخالفات: خصم
  score -= sla.violations * 6

  if (score < 0) score = 0
  if (score > 100) score = 100
  return score
}

export default function CampaignSLA() {
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
      const cid = String(p.campaign_id ?? p.campaignId ?? p.clinic_location ?? "CAMP-UNKNOWN")
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)
      const e = map.get(cid) ?? { campaign_id: cid, total: 0, critical: 0, medium: 0, low: 0 }
      e.total += 1
      e[risk] += 1
      map.set(cid, e)
    }

    const arr = Array.from(map.values()).map(c => {
      const sla = pseudoSLA(c.campaign_id)
      const score = complianceScore({ ...c, sla })
      return { ...c, sla, score, grade: grade(score) }
    })

    return arr.sort((a, b) => (a.score - b.score) || (b.critical - a.critical))
  }, [data])

  return (
    <main>
      <div className="sectionTitle">امتثال الحملات + SLA (Compliance 2.0)</div>

      <div className="card" style={{ opacity: .82, fontSize: 13, lineHeight: 1.9 }}>
        هذا النموذج يُظهر الامتثال كمنظومة حوكمة: <b>زمن الاستجابة</b> + <b>تنفيذ التوصيات</b> + <b>مخالفات</b>.
        القيم الحالية تجريبية (MVP) وسيتم ربطها لاحقاً بأحداث فعلية من مركز التنبيهات وسجل التدقيق.
      </div>

      <div className="sectionTitle">ترتيب الحملات حسب الامتثال</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>الحملة</th>
              <th>الامتثال</th>
              <th>التصنيف</th>
              <th>زمن الاستجابة</th>
              <th>تنفيذ التوصيات</th>
              <th>مخالفات</th>
              <th>حرج</th>
              <th>متوسط</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 900 }}>{c.campaign_id}</td>
                <td className={c.score < 55 ? "red" : c.score < 70 ? "amber" : "green"} style={{ fontWeight: 900 }}>{c.score}%</td>
                <td style={{ fontWeight: 900 }}>{c.grade}</td>
                <td>{c.sla.responseMin} دقيقة</td>
                <td className={c.sla.complianceExec < 70 ? "amber" : "green"} style={{ fontWeight: 900 }}>{c.sla.complianceExec}%</td>
                <td className={c.sla.violations ? "red" : "green"} style={{ fontWeight: 900 }}>{c.sla.violations}</td>
                <td className="red" style={{ fontWeight: 900 }}>{c.critical}</td>
                <td className="amber" style={{ fontWeight: 900 }}>{c.medium}</td>
              </tr>
            ))}

            {campaigns.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", opacity: .6, padding: 18 }}>لا توجد بيانات.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
