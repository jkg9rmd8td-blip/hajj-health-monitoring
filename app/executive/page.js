"use client"

import { useEffect, useMemo, useState } from "react"

export default function التنفيذي() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims")
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const kpi = useMemo(() => {
    const total = data.length
    const critical = data.filter(p => p.risk === "critical").length
    const medium = data.filter(p => p.risk === "medium").length
    const stability = total ? 100 - Math.round((critical / total) * 100) : 100
    return { total, critical, medium, stability }
  }, [data])

  return (
    <main>
      <div className="sectionTitle">الوضع التنفيذي (ملخص لصنّاع القرار)</div>

      <div className="grid2">
        <div className="card">
          <div className="kpiLabel">مؤشر الاستقرار العام</div>
          <div className={"kpiValue " + (kpi.stability >= 85 ? "green" : kpi.stability >= 70 ? "amber" : "red")}>
            {kpi.stability}%
          </div>
          <div style={{ marginTop: 10, opacity: .7, fontSize: 13, lineHeight: 1.8 }}>
            قراءة سريعة لجاهزية المنظومة الصحية بناءً على الحالات الحرجة مقارنةً بالإجمالي.
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">ملخص المخاطر</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <Pill tone="green" label="إجمالي" value={kpi.total} />
            <Pill tone="red" label="حرج" value={kpi.critical} />
            <Pill tone="amber" label="متوسط" value={kpi.medium} />
          </div>
          <div style={{ marginTop: 12, opacity: .7, fontSize: 13, lineHeight: 1.8 }}>
            يُستخدم هذا العرض في الاجتماعات التنفيذية لاتخاذ قرار التعزيز الميداني وإعادة توزيع الموارد.
          </div>
        </div>
      </div>

      <div className="sectionTitle">قرارات مقترحة (تلقائي)</div>
      <div className="card">
        <ol style={{ margin: 0, paddingRight: 18, opacity: .85, lineHeight: 2, fontSize: 13 }}>
          <li>رفع جاهزية فرق الاستجابة السريعة عند تجاوز الحالات الحرجة حدًا تشغيليًا.</li>
          <li>تعزيز نقاط الفرز في القطاعات ذات الازدحام مع ارتفاع المؤشرات الحيوية.</li>
          <li>تفعيل تنبيهات متقدمة لمراقبة الإجهاد الحراري أثناء أوقات الذروة.</li>
        </ol>
      </div>
    </main>
  )
}

function Pill({ tone, label, value }) {
  const cl = tone === "red" ? "red" : tone === "amber" ? "amber" : "green"
  return (
    <div style={{
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.10)",
      padding: "10px 14px",
      borderRadius: 999,
      display: "flex",
      gap: 10,
      alignItems: "center"
    }}>
      <span style={{ opacity: .75, fontSize: 12 }}>{label}</span>
      <span className={cl} style={{ fontWeight: 900 }}>{value}</span>
    </div>
  )
}
