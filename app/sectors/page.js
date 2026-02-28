"use client"

import { useEffect, useMemo, useState } from "react"

function normalizeRiskArabic(v) {
  const x = String(v ?? "").trim()
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

function readinessIndex({ total, critical, medium }) {
  // مؤشر جاهزية تشغيلي (MVP) قابل للتطوير
  // كلما ارتفعت الحرجة والمتوسطة انخفضت الجاهزية
  if (!total) return 100
  const cRate = (critical / total) * 100
  const mRate = (medium / total) * 100

  let score = 100
  score -= Math.round(cRate * 1.25)   // وزن أعلى للحالات الحرجة
  score -= Math.round(mRate * 0.55)

  // حد أدنى وأعلى
  if (score < 0) score = 0
  if (score > 100) score = 100
  return score
}

function band(score) {
  if (score >= 85) return { label: "جاهزية عالية", cls: "green" }
  if (score >= 70) return { label: "جاهزية متوسطة", cls: "amber" }
  return { label: "جاهزية منخفضة", cls: "red" }
}

function recommendations(sector, s) {
  const rec = []
  if (s.critical >= 2) {
    rec.push("رفع التأهب (أحمر): توجيه فريق إسعافي ميداني وتعزيز مسار الإحالة.")
    rec.push("تعزيز نقاط الفرز القريبة وتفعيل مراقبة لصيقة للحالات المتوسطة.")
  } else if (s.medium >= 3) {
    rec.push("رفع المتابعة (أصفر): تعزيز التوعية الوقائية للحملات داخل القطاع.")
    rec.push("رفع التواجد الوقائي (مياه/تبريد) عند نقاط الحركة.")
  } else {
    rec.push("الاستمرار في الرصد وفق الوضع الطبيعي دون تصعيد.")
  }

  if (String(sector).includes("منى") && (s.critical + s.medium) >= 3) {
    rec.push("إجراء بيئي: رفع كثافة التبريد/الرش في محيط القطاع خلال الذروة.")
  }

  return rec
}

export default function Sectors() {
  const [data, setData] = useState([])

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
      const e = map.get(sector) ?? { sector, total: 0, critical: 0, medium: 0, low: 0 }
      e.total += 1
      e[risk] += 1
      map.set(sector, e)
    }

    const arr = Array.from(map.values()).map(s => {
      const score = readinessIndex(s)
      const b = band(score)
      return {
        ...s,
        readiness: score,
        bandLabel: b.label,
        bandClass: b.cls,
        actions: recommendations(s.sector, s),
      }
    })

    // ترتيب: الأقل جاهزية أولاً
    return arr.sort((a, b) => (a.readiness - b.readiness) || (b.critical - a.critical))
  }, [data])

  return (
    <main>
      <div className="sectionTitle">مؤشر جاهزية القطاعات الصحية (Sector Readiness)</div>

      <div className="card" style={{ opacity: .82, fontSize: 13, lineHeight: 1.9 }}>
        يعرض هذا المؤشر جاهزية كل قطاع بناءً على توزيع مستويات الخطورة (حرج/متوسط/منخفض).
        المؤشر تشغيلي (MVP) وسيتم ترقيته لاحقاً بنماذج تنبؤية (AI) ومؤشرات السوار (نبض/حرارة/نشاط).
      </div>

      <div className="sectionTitle">ترتيب القطاعات حسب الجاهزية</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>القطاع</th>
              <th>الجاهزية</th>
              <th>التصنيف</th>
              <th>إجمالي</th>
              <th>حرج</th>
              <th>متوسط</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 900 }}>{s.sector}</td>
                <td className={s.bandClass} style={{ fontWeight: 900 }}>{s.readiness}%</td>
                <td style={{ opacity: .9 }}>{s.bandLabel}</td>
                <td>{s.total}</td>
                <td className="red" style={{ fontWeight: 900 }}>{s.critical}</td>
                <td className="amber" style={{ fontWeight: 900 }}>{s.medium}</td>
              </tr>
            ))}

            {sectors.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", opacity: .6, padding: 18 }}>
                  لا توجد بيانات.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sectionTitle">التوصيات التشغيلية حسب القطاع</div>
      <div className="grid2">
        {sectors.slice(0, 6).map((s, i) => (
          <div className="card" key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>{s.sector}</div>
              <div className={s.bandClass} style={{ fontWeight: 900 }}>
                جاهزية {s.readiness}%
              </div>
            </div>
            <ul style={{ margin: "10px 0 0", paddingRight: 18, opacity: .9, lineHeight: 1.9, fontSize: 13 }}>
              {s.actions.map((a, idx) => <li key={idx}>{a}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </main>
  )
}
