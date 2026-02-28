"use client"

import { useEffect, useMemo, useRef, useState } from "react"

/* ===========================
   UTILITIES
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

function percentile(arr, p) {
  if (!arr.length) return null
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

/* ===========================
   MAPPING SECTOR → CLUSTER
=========================== */

function getCluster(sector) {
  if (!sector) return "غرفة وطنية"
  if (sector.includes("منى")) return "تجمع مكة"
  if (sector.includes("عرفات")) return "تجمع عرفات"
  if (sector.includes("مزدلفة")) return "تجمع مزدلفة"
  return "غرفة وطنية"
}

/* ===========================
   COMPONENT
=========================== */

const MEMORY_KEY = "sector_memory_v1"

export default function Sectors() {

  const [data, setData] = useState([])
  const [events, setEvents] = useState([])
  const memRef = useRef({})

  useEffect(() => {
    const m = localStorage.getItem(MEMORY_KEY)
    memRef.current = m ? JSON.parse(m) : {}
  }, [])

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setData([]))
  }, [])

  const sectors = useMemo(() => {

    const map = new Map()

    for (const p of data) {
      const sector = String(p.clinic_location ?? p.location ?? "غير محدد")
      const risk = normalizeRiskArabic(p.risk_level ?? p.risk)

      const hr = sanitizeHR(p.heartRate)
      const temp = sanitizeTemp(p.temperature)
      const hyd = sanitizeHyd(p.hydrationRisk)

      const e = map.get(sector) ?? {
        sector,
        total: 0,
        critical: 0,
        medium: 0,
        low: 0,
        hrs: [],
        temps: [],
        hyds: []
      }

      e.total++
      e[risk]++
      if (hr != null) e.hrs.push(hr)
      if (temp != null) e.temps.push(temp)
      if (hyd != null) e.hyds.push(hyd)

      map.set(sector, e)
    }

    const arr = []

    for (const s of map.values()) {

      const readiness = readinessIndex(s.total, s.critical, s.medium)
      const hrP90 = percentile(s.hrs, 90)
      const tempP90 = percentile(s.temps, 90)
      const hydP90 = percentile(s.hyds, 90)

      const prev = memRef.current[s.sector]?.readiness ?? readiness
      const trend = readiness - prev

      memRef.current[s.sector] = {
        readiness,
        lastUpdate: new Date().toISOString()
      }

      arr.push({
        sector: s.sector,
        cluster: getCluster(s.sector),
        readiness,
        trend,
        hrP90,
        tempP90,
        hydP90,
        critical: s.critical,
        medium: s.medium,
        total: s.total,
        band: band(readiness)
      })
    }

    localStorage.setItem(MEMORY_KEY, JSON.stringify(memRef.current))

    arr.sort((a,b)=>a.readiness-b.readiness)
    return arr

  }, [data])

  const worst = sectors[0]

  function predict(sector) {
    if (!sector) return null
    let risk = 0
    if ((sector.tempP90 ?? 0) > 38) risk += 2
    if ((sector.hrP90 ?? 0) > 115) risk += 2
    if (sector.critical > 0) risk += 2
    return risk
  }

  function applyIntervention(sector, type) {

    const impact = type === "cool" ? 8 :
                   type === "move" ? 6 :
                   type === "notify" ? 4 : 0

    alert(`تم تسجيل تدخل: ${type} في ${sector.sector} (تحسن متوقع +${impact})`)

  }

  return (
    <main>

      <div className="sectionTitle">غرفة عمليات القطاعات</div>

      {worst && (
        <div className="card" style={{marginBottom:20}}>
          <div style={{fontWeight:900}}>
            ⚠️ أكثر قطاع يحتاج تدخل الآن: {worst.sector}
          </div>
          <div style={{opacity:.8, marginTop:6}}>
            تابع لـ {worst.cluster} — جاهزية {worst.readiness}%
            {worst.trend < 0 && ` — اتجاه هابط ${worst.trend}`}
          </div>
        </div>
      )}

      <div style={{display:"grid", gap:16}}>

        {sectors.map((s,i)=>{

          const riskScore = predict(s)

          return (
            <div key={i} className="card">

              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:900,fontSize:18}}>
                    {s.sector}
                  </div>
                  <div style={{opacity:.6,fontSize:12}}>
                    {s.cluster}
                  </div>
                </div>

                <div className={s.band.cls} style={{fontWeight:900}}>
                  {s.readiness}%
                </div>
              </div>

              <div style={{marginTop:10, fontSize:13, opacity:.8}}>
                حرجة {s.critical} — متوسطة {s.medium} — إجمالي {s.total}
              </div>

              <div style={{marginTop:8, fontSize:13}}>
                HR90: {s.hrP90 ?? "—"} | Temp90: {s.tempP90 ?? "—"} | Hyd90: {s.hydP90 ?? "—"}
              </div>

              <div style={{marginTop:8}}>
                {riskScore >= 4 &&
                  <span className="red">توقع تصاعد خلال 20 دقيقة</span>}
                {riskScore >= 2 && riskScore < 4 &&
                  <span className="amber">مراقبة متقدمة</span>}
                {riskScore < 2 &&
                  <span className="green">مستقر حالياً</span>}
              </div>

              <div style={{display:"flex", gap:8, marginTop:12}}>
                <button className="btn" onClick={()=>applyIntervention(s,"cool")}>
                  تعزيز تبريد
                </button>
                <button className="btn" onClick={()=>applyIntervention(s,"move")}>
                  نقل فريق
                </button>
                <button className="btn" onClick={()=>applyIntervention(s,"notify")}>
                  تنبيه حملات
                </button>
              </div>

            </div>
          )
        })}

      </div>

    </main>
  )
}
