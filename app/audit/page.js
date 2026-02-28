"use client"

import { useEffect, useMemo, useState } from "react"

function normalizeRiskArabic(v) {
  const x = String(v ?? "").trim()
  if (x.includes("حرج")) return "critical"
  if (x.includes("متوسط")) return "medium"
  return "low"
}

function eventType(risk) {
  if (risk === "critical") return "تنبيه حرج"
  if (risk === "medium") return "تنبيه وقائي"
  return "رصد اعتيادي"
}

export default function Audit() {
  const [data, setData] = useState([])
  const [now, setNow] = useState(null)

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then((rows) => {
        setData(rows)
        setNow(new Date())
      })
      .catch(() => {
        setData([])
        setNow(new Date())
      })
  }, [])

  const logs = useMemo(() => {
    const ts = now ? now.toISOString() : new Date().toISOString()
    return (Array.isArray(data) ? data : [])
      .map((p, idx) => {
        const risk = normalizeRiskArabic(p.risk_level)
        return {
          time: ts,
          type: eventType(risk),
          severity: risk,
          actor: "النظام الآلي",
          subject: p.id ?? `ROW-${idx + 1}`,
          location: p.clinic_location ?? "غير محدد",
          note: p.health_status ?? "—"
        }
      })
      .sort((a, b) => {
        const w = (x) => x.severity === "critical" ? 3 : x.severity === "medium" ? 2 : 1
        return w(b) - w(a)
      })
      .slice(0, 30)
  }, [data, now])

  return (
    <main>
      <div className="sectionTitle">سجل التدقيق (Audit Log)</div>

      <div className="card" style={{ opacity: .8, fontSize: 13, lineHeight: 1.9 }}>
        يعرض هذا السجل الأحداث التي رصدها النظام لأغراض الشفافية والتحسين المستمر.
        في المرحلة القادمة سيتم تسجيل: وقت الاستلام، وقت الاستجابة، الجهة المنفذة، والنتيجة.
      </div>

      <div className="sectionTitle">آخر الأحداث</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>الوقت</th>
              <th>النوع</th>
              <th>الشدة</th>
              <th>المعرف</th>
              <th>الموقع</th>
              <th>المسؤول</th>
              <th>ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i}>
                <td style={{ opacity: .75 }}>{String(l.time).slice(11, 19)}</td>
                <td style={{ fontWeight: 900 }}>{l.type}</td>
                <td className={l.severity === "critical" ? "red" : l.severity === "medium" ? "amber" : "green"} style={{ fontWeight: 900 }}>
                  {l.severity === "critical" ? "حرج" : l.severity === "medium" ? "متوسط" : "منخفض"}
                </td>
                <td>{l.subject}</td>
                <td>{l.location}</td>
                <td>{l.actor}</td>
                <td style={{ opacity: .9 }}>{l.note}</td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", opacity: .6, padding: 18 }}>
                  لا توجد بيانات.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
