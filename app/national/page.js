"use client"

import { useEffect, useMemo, useState } from "react"

/* ===========================
   أدوات مساعدة
=========================== */

function clamp(n, a, b) {
  if (!isFinite(n)) return null
  return Math.max(a, Math.min(b, n))
}
function num(v) {
  const x = Number(v)
  return isFinite(x) ? x : null
}
function sanitizeHR(v) { return clamp(num(v), 35, 200) }
function sanitizeTemp(v) { return clamp(num(v), 34, 41.5) }
function sanitizeHyd(v) { return clamp(num(v), 0, 100) }

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

/* ===========================
   الصفحة الوطنية
=========================== */

export default function National() {

  const [data, setData] = useState([])
  const [role, setRole] = useState("national") // national | cluster | field
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setData([]))
  }, [])

  const national = useMemo(() => {

    let total = 0, critical = 0, medium = 0
    let hrs = [], temps = [], hyds = []

    for (const p of data) {
      total++
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)
      if (risk === "critical") critical++
      if (risk === "medium") medium++

      const hr = sanitizeHR(p.heartRate)
      const temp = sanitizeTemp(p.temperature)
      const hyd = sanitizeHyd(p.hydrationRisk)

      if (hr != null) hrs.push(hr)
      if (temp != null) temps.push(temp)
      if (hyd != null) hyds.push(hyd)
    }

    const score = readinessIndex(total, critical, medium)
    const mood = band(score)

    const hrAvg = hrs.length ? Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length) : null
    const tempAvg = temps.length ? (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) : null
    const hydAvg = hyds.length ? Math.round(hyds.reduce((a,b)=>a+b,0)/hyds.length) : null

    return {
      total, critical, medium,
      score, mood,
      hrAvg, tempAvg, hydAvg
    }

  }, [data])

  function generateRecommendation() {

    if (national.score < 70)
      return "الوضع الوطني في حالة تأهب. يوصى بتعزيز الموارد في القطاعات الأقل جاهزية، وإعادة توزيع فرق الإسعاف خلال الـ 30 دقيقة القادمة."

    if (national.score < 85)
      return "الوضع تحت المراقبة المتقدمة. يوصى بتفعيل إجراءات وقائية للحملات وتكثيف التبريد في القطاعات ذات المتوسط المرتفع."

    return "الوضع مستقر. استمرار الرصد وتحديث خطة التوزيع كل 20 دقيقة."
  }

  function copyReport() {

    const text =
`تقرير الحالة الوطنية
التاريخ: ${new Date().toLocaleString("ar-SA")}

الجاهزية الوطنية: ${national.score}% (${national.mood.label})
إجمالي تحت الرصد: ${national.total}
الحالات الحرجة: ${national.critical}
الحالات المتوسطة: ${national.medium}

متوسط المؤشرات:
HR: ${national.hrAvg ?? "—"}
Temp: ${national.tempAvg ?? "—"}
Hydration: ${national.hydAvg ?? "—"}

التوصية التنفيذية:
${generateRecommendation()}
`

    navigator.clipboard.writeText(text)
    alert("تم نسخ التقرير الرسمي ✅")
  }

  function addEvent(type) {
    const newEvent = {
      time: new Date().toLocaleTimeString("ar-SA"),
      type
    }
    setEvents(prev => [newEvent, ...prev].slice(0, 10))
  }

  return (
    <main>

      <div className="sectionTitle">المركز الوطني لإدارة صحة الحشود</div>

      {/* صلاحيات */}
      <div style={{display:"flex", gap:10, marginBottom:20}}>
        <button className="btn" onClick={()=>setRole("national")}>قيادة وطنية</button>
        <button className="btn" onClick={()=>setRole("cluster")}>تجمع صحي</button>
        <button className="btn" onClick={()=>setRole("field")}>ميداني</button>
      </div>

      {/* مؤشرات */}
      <div className="grid4">

        <div className="card">
          <div className="kpiLabel">الجاهزية الوطنية</div>
          <div className={`kpiValue ${national.mood.cls}`}>
            {national.score}%
          </div>
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
          <div className="kpiLabel">إجمالي تحت الرصد</div>
          <div className="kpiValue">{national.total}</div>
        </div>

      </div>

      {/* توصية تنفيذية */}
      <div className="card" style={{marginTop:20}}>
        <div style={{fontWeight:900}}>التوصية التنفيذية</div>
        <div style={{marginTop:10, opacity:.9}}>
          {generateRecommendation()}
        </div>
        <button className="btn" style={{marginTop:15}} onClick={copyReport}>
          نسخ تقرير رسمي
        </button>
      </div>

      {/* أوامر تشغيلية حسب الصلاحية */}
      {role === "national" && (
        <div className="card" style={{marginTop:20}}>
          <div style={{fontWeight:900}}>أوامر سيادية</div>
          <div style={{display:"flex", gap:10, marginTop:10}}>
            <button className="btn" onClick={()=>addEvent("تعزيز موارد وطنية")}>
              تعزيز موارد
            </button>
            <button className="btn" onClick={()=>addEvent("إعادة توزيع فرق")}>
              إعادة توزيع
            </button>
            <button className="btn" onClick={()=>addEvent("تعديل سياسة تشغيل")}>
              تعديل سياسة
            </button>
          </div>
        </div>
      )}

      {role === "cluster" && (
        <div className="card" style={{marginTop:20}}>
          <div style={{fontWeight:900}}>أوامر التجمع الصحي</div>
          <button className="btn" onClick={()=>addEvent("تعزيز قطاع محلي")}>
            تعزيز قطاع
          </button>
        </div>
      )}

      {role === "field" && (
        <div className="card" style={{marginTop:20}}>
          <div style={{fontWeight:900}}>تنفيذ ميداني</div>
          <button className="btn" onClick={()=>addEvent("تنفيذ تدخل ميداني")}>
            تسجيل تنفيذ
          </button>
        </div>
      )}

      {/* سجل تدقيق */}
      <div className="card" style={{marginTop:20}}>
        <div style={{fontWeight:900}}>سجل الأوامر التشغيلية</div>
        <div style={{marginTop:10}}>
          {events.map((e,i)=>(
            <div key={i} style={{fontSize:13, opacity:.85}}>
              {e.time} — {e.type}
            </div>
          ))}
          {events.length === 0 && <div style={{opacity:.6}}>لا يوجد سجل حالياً</div>}
        </div>
      </div>

    </main>
  )
}
