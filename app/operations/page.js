"use client"

import { useEffect, useMemo, useState } from "react"

function normalizeRiskArabic(v) {
  const x = String(v ?? "").trim()
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

function buildActionsBySector(sector, stats) {
  const actions = []

  if (stats.critical >= 2) {
    actions.push("رفع مستوى الاستجابة (أحمر): توجيه فريق إسعافي ميداني إلى القطاع فورًا.")
    actions.push("تفعيل مسار نقل سريع للحالات الحرجة (الساعة الذهبية).")
  } else if (stats.medium >= 3) {
    actions.push("رفع مستوى المتابعة (أصفر): تعزيز نقاط الفرز وتوجيه فريق وقائي.")
  }

  if (String(sector).includes("منى")) {
    actions.push("إجراء تشغيلي: تعزيز نقاط التبريد/الرش في محيط القطاع.")
  }

  if (stats.total >= 5 && stats.critical === 0 && stats.medium >= 3) {
    actions.push("إجراء وقائي: إرسال رسائل توعوية للحملات داخل القطاع (سوائل/راحة/تقليل إجهاد).")
  }

  if (actions.length === 0) {
    actions.push("لا إجراءات تصعيد حالياً. الاستمرار في الرصد.")
  }

  return actions
}

export default function Operations() {
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
      const sector = String(p.clinic_location ?? "غير محدد")
      const risk = normalizeRiskArabic(p.risk_level)
      const e = map.get(sector) ?? { sector, total: 0, critical: 0, medium: 0, low: 0 }
      e.total += 1
      e[risk] += 1
      map.set(sector, e)
    }

    const arr = Array.from(map.values()).map(s => ({
      ...s,
      actions: buildActionsBySector(s.sector, s)
    }))

    return arr.sort((a, b) => (b.critical - a.critical) || (b.medium - a.medium) || (b.total - a.total))
  }, [data])

  return (
    <main>
      <div className="sectionTitle">محرك القرار التشغيلي (Policy Engine)</div>

      <div className="card" style={{ opacity: .8, fontSize: 13, lineHeight: 1.9 }}>
        يحوّل هذا المحرك مستويات الخطورة إلى <b>إجراءات تنفيذية</b> حسب القطاع.
        في المرحلة القادمة سيتم تغذيته بمؤشرات السوار (نبض/حرارة/نشاط) لرفع دقة التوصيات.
      </div>

      <div className="sectionTitle">إجراءات مقترحة حسب القطاعات</div>
      <div className="grid2">
        {sectors.map((s, i) => (
          <div className="card" key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{s.sector}</div>
              <div style={{ opacity: .75, fontSize: 12 }}>
                إجمالي {s.total} — <span className="red" style={{ fontWeight: 900 }}>حرج {s.critical}</span> — <span className="amber" style={{ fontWeight: 900 }}>متوسط {s.medium}</span>
              </div>
            </div>

            <ul style={{ margin: "10px 0 0", paddingRight: 18, opacity: .9, lineHeight: 1.9, fontSize: 13 }}>
              {s.actions.map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </div>
        ))}

        {sectors.length === 0 && (
          <div className="card" style={{ opacity: .6 }}>
            لا توجد بيانات.
          </div>
        )}
      </div>
    </main>
  )
}
