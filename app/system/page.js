"use client"

import { useEffect, useMemo, useState } from "react"

export default function النظام() {
  const [data, setData] = useState([])
  const [err, setErr] = useState(null)
  const [ts, setTs] = useState(null)

  useEffect(() => {
    fetch("/api/pilgrims")
      .then(r => r.json())
      .then((j) => {
        setData(j)
        setTs(new Date().toISOString())
        setErr(null)
      })
      .catch((e) => setErr("تعذر الاتصال بواجهة البيانات"))
  }, [])

  const health = useMemo(() => {
    const total = data.length
    const hasFields = total
      ? ["name", "location", "risk"].every(k => k in data[0])
      : false

    const risksOk = total
      ? data.every(p => ["critical", "medium", "low"].includes(p.risk))
      : true

    return {
      api: err ? "متوقف" : "يعمل",
      total,
      schema: hasFields ? "سليم" : "غير مكتمل",
      risks: risksOk ? "سليم" : "غير متوافق",
      ts
    }
  }, [data, err, ts])

  return (
    <main>
      <div className="sectionTitle">مراقبة النظام</div>

      <div className="grid2">
        <div className="card">
          <div className="kpiLabel">حالة واجهة البيانات (API)</div>
          <div className={"kpiValue " + (health.api === "يعمل" ? "green" : "red")}>{health.api}</div>
          <div style={{ marginTop: 10, opacity: .7, fontSize: 13 }}>
            آخر تحديث: {health.ts ?? "—"}
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">سلامة البيانات</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            <Pill tone={health.schema === "سليم" ? "green" : "amber"} label="هيكل الحقول" value={health.schema} />
            <Pill tone={health.risks === "سليم" ? "green" : "amber"} label="مستويات الخطورة" value={health.risks} />
            <Pill tone="green" label="عدد السجلات" value={health.total} />
          </div>
        </div>
      </div>

      <div className="sectionTitle">عينة من البيانات</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الموقع</th>
              <th>المستوى</th>
              <th>الحرارة</th>
              <th>النبض</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 8).map((p, i) => (
              <tr key={i}>
                <td>{p.name ?? "—"}</td>
                <td>{p.location ?? "—"}</td>
                <td style={{ fontWeight: 900 }} className={p.risk === "critical" ? "red" : p.risk === "medium" ? "amber" : "green"}>
                  {p.risk === "critical" ? "حرج" : p.risk === "medium" ? "متوسط" : "منخفض"}
                </td>
                <td>{p.temperature ?? "—"}</td>
                <td>{p.heartRate ?? "—"}</td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", opacity: .6, padding: 18 }}>
                  لا توجد بيانات للعرض. تحقق من data.json
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
