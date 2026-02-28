"use client"

import { useEffect, useMemo, useRef, useState } from "react"

/* =======================
   أدوات مساعدة
======================= */

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

function getCluster(sector) {
  if (!sector) return "غرفة وطنية"
  if (sector.includes("منى")) return "تجمع مكة"
  if (sector.includes("عرفات")) return "تجمع عرفات"
  if (sector.includes("مزدلفة")) return "تجمع مزدلفة"
  return "غرفة وطنية"
}

/* =======================
   الصفحة
======================= */

const MEMORY_KEY = "sector_memory_v2"

export default function Sectors() {

  const [data, setData] = useState([])
  const [memoryLoaded, setMemoryLoaded] = useState(false)
  const memRef = useRef({})

  // قراءة localStorage بأمان
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(MEMORY_KEY)
      memRef.current = stored ? JSON.parse(stored) : {}
      setMemoryLoaded(true)
    }
  }, [])

  // جلب البيانات
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

    const result = []

    for (const s of map.values()) {

      const readiness = readinessIndex(s.total, s.critical, s.medium)
      const prev = memRef.current[s.sector]?.readiness ?? readiness
      const trend = readiness - prev

      memRef.current[s.sector] = {
        readiness,
        lastUpdate: new Date().toISOString()
      }

      result.push({
        sector: s.sector,
        cluster: getCluster(s.sector),
        readiness,
        trend,
        hrP90: percentile(s.hrs, 90),
        tempP90: percentile(s.temps, 90),
        hydP90: percentile(s.hyds, 90),
        critical: s.critical,
        medium: s.medium,
        total: s.total,
        band: band(readiness)
      })
    }

    return result.sort((a, b) => a.readiness - b.readiness)

  }, [data])

  // حفظ localStorage بأمان
  useEffect(() => {
    if (memoryLoaded && typeof window !== "undefined") {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(memRef.current))
    }
  }, [sectors, memoryLoaded])

  const worst = sectors[0]

  return (
    <main>
      <div className="sectionTitle">غرفة عمليات القطاعات</div>

      {worst && (
        <div className="card" style={{ marginBottom: 20 }}>
          <b>⚠️ أكثر قطاع يحتاج تدخل:</b> {worst.sector} — {worst.readiness}%
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {sectors.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900 }}>{s.sector}</div>
                <div style={{ fontSize: 12, opacity: .6 }}>{s.cluster}</div>
              </div>
              <div className={s.band.cls} style={{ fontWeight: 900 }}>
                {s.readiness}%
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              حرجة {s.critical} — متوسطة {s.medium} — إجمالي {s.total}
            </div>

            <div style={{ marginTop: 6, fontSize: 13 }}>
              HR90: {s.hrP90 ?? "—"} |
              Temp90: {s.tempP90 ?? "—"} |
              Hyd90: {s.hydP90 ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
