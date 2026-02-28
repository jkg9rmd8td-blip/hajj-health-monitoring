"use client"

import { useEffect, useMemo, useRef, useState } from "react"

/**
 * منصة المسار الصحي التنبؤية — تحويل الصفحة الرئيسية من Dashboard إلى "عقل تشغيلي"
 * - تنظيف قيم الحساسات غير المنطقية (مثل HR=1203)
 * - بناء "بصمة صحية جماعية" لكل قطاع
 * - توليد أحداث تشغيلية تلقائيًا (بدون الاعتماد على events.json)
 * - تنبؤ 15–30 دقيقة (Heuristic + اتجاهات)
 * - ذاكرة تشغيلية (localStorage) لتعلم موسمي/يومي
 * - توصية تنفيذية مكتوبة بلغة قيادية
 */

// -------------------- Helpers: Sanitization --------------------
function clamp(n, a, b) {
  if (!isFinite(n)) return null
  return Math.max(a, Math.min(b, n))
}

function num(v) {
  const x = Number(v)
  return isFinite(x) ? x : null
}

function sanitizeHR(v) {
  // منطقيًا للحشود: 35–200
  const x = clamp(num(v), 35, 200)
  return x
}

function sanitizeTemp(v) {
  // حرارة جلد/جسم منطقية 34–41.5
  const x = clamp(num(v), 34, 41.5)
  return x
}

function sanitizeHyd(v) {
  // مخاطر جفاف 0–100
  const x = clamp(num(v), 0, 100)
  return x
}

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

// -------------------- Memory (Operational Brain) --------------------
const MEM_KEY = "hhmo_ops_memory_v1"

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEM_KEY)
    if (!raw) return { sectors: {}, lastTick: null }
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== "object") return { sectors: {}, lastTick: null }
    return { sectors: obj.sectors || {}, lastTick: obj.lastTick || null }
  } catch {
    return { sectors: {}, lastTick: null }
  }
}

function saveMemory(mem) {
  try {
    localStorage.setItem(MEM_KEY, JSON.stringify(mem))
  } catch {}
}

function nowISO() {
  return new Date().toISOString()
}

function minutesBetween(aISO, bISO) {
  const a = new Date(aISO).getTime()
  const b = new Date(bISO).getTime()
  if (!isFinite(a) || !isFinite(b)) return null
  return Math.max(0, Math.round((b - a) / 60000))
}

// -------------------- Event Generator (No events.json dependency) --------------------
function makeEvent(type, payload = {}) {
  // event_id deterministically-ish
  const id = "EVT-" + Math.random().toString(16).slice(2, 10).toUpperCase()
  return {
    event_id: id,
    ts: nowISO(),
    type,
    ...payload,
  }
}

// -------------------- Prediction Engine (Heuristic) --------------------
function predictSector(next, prev, dtMin) {
  // next/prev: fingerprints {hrP90, tempP90, hydP90, criticalRate, mediumRate, total}
  // dtMin: minutes
  // Output: {riskDelta, etaMin, narrative}

  const safeDt = dtMin && dtMin > 0 ? dtMin : 10

  const hrDelta = (next.hrP90 ?? 0) - (prev.hrP90 ?? next.hrP90 ?? 0)
  const tDelta = (next.tempP90 ?? 0) - (prev.tempP90 ?? next.tempP90 ?? 0)
  const hDelta = (next.hydP90 ?? 0) - (prev.hydP90 ?? next.hydP90 ?? 0)

  // الاتجاه/السرعة لكل 10 دقائق
  const hrRate = (hrDelta / safeDt) * 10
  const tRate = (tDelta / safeDt) * 10
  const hRate = (hDelta / safeDt) * 10

  // تقدير إجهاد حراري مركب
  const stress =
    (next.tempP90 != null ? (next.tempP90 - 36.8) * 18 : 0) +
    (next.hrP90 != null ? (next.hrP90 - 95) * 0.6 : 0) +
    (next.hydP90 != null ? (next.hydP90 - 55) * 0.9 : 0)

  // اتجاه الخطر
  const trend =
    (tRate * 25) +
    (hrRate * 3.5) +
    (hRate * 4.0) +
    ((next.criticalRate ?? 0) * 220) +
    ((next.mediumRate ?? 0) * 90)

  // riskDelta: -100..+100
  let riskDelta = Math.round(clamp(trend, -100, 100) ?? 0)

  // ETA: إذا الخطر يتصاعد، متى نتوقع انتقال الحالة إلى "تأهب"
  // نستخدم عتبة بسيطة
  let etaMin = null
  if (riskDelta > 10) {
    etaMin = Math.max(7, Math.min(35, Math.round(30 - riskDelta * 0.18)))
  }

  let narrative = "الاتجاه مستقر."
  if (riskDelta > 35) narrative = "تصاعد سريع — احتمالية تدهور حراري/إجهاد قريب."
  else if (riskDelta > 15) narrative = "تصاعد متوسط — يوصى بتدخل وقائي قبل الذروة."
  else if (riskDelta < -15) narrative = "تحسن ملحوظ — التدخلات الحالية فعّالة."

  return { riskDelta, etaMin, stress: Math.round(stress), narrative }
}

// percentile helper
function percentile(arr, p) {
  if (!arr.length) return null
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

// Build sector fingerprint from pilgrims
function buildFingerprints(rows) {
  const bySector = new Map()

  for (const p of rows) {
    const sector = String(p.clinic_location ?? p.location ?? "غير محدد")
    const risk = normalizeRiskArabic(p.risk_level ?? p.risk)

    const hr = sanitizeHR(p.heartRate ?? p.hr)
    const temp = sanitizeTemp(p.temperature ?? p.temp)
    const hyd = sanitizeHyd(p.hydrationRisk ?? p.hyd)

    const e = bySector.get(sector) ?? {
      sector,
      total: 0,
      critical: 0,
      medium: 0,
      low: 0,
      hrs: [],
      temps: [],
      hyds: [],
      samples: [],
    }

    e.total++
    e[risk]++

    if (hr != null) e.hrs.push(hr)
    if (temp != null) e.temps.push(temp)
    if (hyd != null) e.hyds.push(hyd)

    if (e.samples.length < 5) e.samples.push(p)

    bySector.set(sector, e)
  }

  const fingerprints = []
  for (const s of bySector.values()) {
    const criticalRate = s.total ? s.critical / s.total : 0
    const mediumRate = s.total ? s.medium / s.total : 0

    fingerprints.push({
      sector: s.sector,
      total: s.total,
      critical: s.critical,
      medium: s.medium,
      low: s.low,
      readiness: readinessIndex(s.total, s.critical, s.medium),
      band: band(readinessIndex(s.total, s.critical, s.medium)),
      hrP90: percentile(s.hrs, 90),
      tempP90: percentile(s.temps, 90),
      hydP90: percentile(s.hyds, 90),
      criticalRate,
      mediumRate,
      samples: s.samples,
    })
  }

  fingerprints.sort((a, b) => (a.readiness - b.readiness) || (b.critical - a.critical))
  return fingerprints
}

// Build national summary
function buildNational(fps) {
  const total = fps.reduce((s, x) => s + x.total, 0)
  const critical = fps.reduce((s, x) => s + x.critical, 0)
  const medium = fps.reduce((s, x) => s + x.medium, 0)
  const low = total - critical - medium
  const score = readinessIndex(total, critical, medium)
  return { total, critical, medium, low, score, band: band(score) }
}

// -------------------- Component --------------------
export default function Home() {
  const [pilgrims, setPilgrims] = useState([])
  const [events, setEvents] = useState([]) // generated operational events
  const [lastSync, setLastSync] = useState(null)
  const [selectedSector, setSelectedSector] = useState(null)

  const memRef = useRef(null)

  // Load data
  const load = () => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => {
        setPilgrims(Array.isArray(rows) ? rows : [])
        setLastSync(new Date())
      })
      .catch(() => setPilgrims([]))
  }

  useEffect(() => {
    // init memory
    memRef.current = typeof window !== "undefined" ? loadMemory() : { sectors: {}, lastTick: null }
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  const fingerprints = useMemo(() => buildFingerprints(pilgrims), [pilgrims])
  const national = useMemo(() => buildNational(fingerprints), [fingerprints])

  // Operational Brain tick: generate events + update memory
  useEffect(() => {
    if (!fingerprints.length) return
    if (!memRef.current) memRef.current = loadMemory()

    const mem = memRef.current
    const now = nowISO()
    const lastTick = mem.lastTick
    const dtMin = lastTick ? minutesBetween(lastTick, now) : 10

    const newEvents = []

    // Evaluate each sector vs last fingerprint stored
    for (const fp of fingerprints.slice(0, 10)) {
      const prev = mem.sectors[fp.sector]?.fp ?? fp
      const pred = predictSector(fp, prev, dtMin)

      // Save latest
      mem.sectors[fp.sector] = {
        fp: {
          hrP90: fp.hrP90,
          tempP90: fp.tempP90,
          hydP90: fp.hydP90,
          criticalRate: fp.criticalRate,
          mediumRate: fp.mediumRate,
          total: fp.total,
        },
        lastPred: pred,
        updatedAt: now,
      }

      // Auto-generate operational events
      // 1) Risk trending up fast
      if (pred.riskDelta >= 35) {
        newEvents.push(makeEvent("OP_RISK_TREND", {
          severity: "CRITICAL",
          sector: fp.sector,
          message: `تصاعد سريع للخطر في "${fp.sector}" — توقّع تدهور خلال ${pred.etaMin ?? 20} دقيقة.`,
          rationale: pred.narrative,
        }))
      } else if (pred.riskDelta >= 18) {
        newEvents.push(makeEvent("OP_RISK_TREND", {
          severity: "WARNING",
          sector: fp.sector,
          message: `تصاعد متوسط للخطر في "${fp.sector}" — يوصى بتدخل وقائي.`,
          rationale: pred.narrative,
        }))
      }

      // 2) Heat stress envelope
      if ((fp.tempP90 ?? 0) >= 38.2 && (fp.hrP90 ?? 0) >= 115) {
        newEvents.push(makeEvent("OP_HEAT_ENVELOPE", {
          severity: "WARNING",
          sector: fp.sector,
          message: `بصمة إجهاد حراري مرتفعة في "${fp.sector}" (T≈${fp.tempP90?.toFixed(1)} / HR≈${Math.round(fp.hrP90)}).`,
        }))
      }

      // 3) Operational trigger by readiness
      if (fp.readiness < 70 && fp.critical >= 1) {
        newEvents.push(makeEvent("OP_RESOURCE_SUGGESTION", {
          severity: "CRITICAL",
          sector: fp.sector,
          message: `اقتراح فوري: تعزيز الموارد/الفرز في "${fp.sector}" (جاهزية ${fp.readiness}%).`,
        }))
      }
    }

    mem.lastTick = now
    saveMemory(mem)
    memRef.current = mem

    // Merge with existing events (keep last 30)
    if (newEvents.length) {
      setEvents(prev => [...newEvents, ...prev].slice(0, 30))
    }
  }, [fingerprints])

  const hotspots = useMemo(() => fingerprints.slice(0, 6), [fingerprints])

  const selected = useMemo(() => {
    const sec = selectedSector
    if (sec) return fingerprints.find(f => f.sector === sec) ?? hotspots[0] ?? null
    return hotspots[0] ?? null
  }, [selectedSector, fingerprints, hotspots])

  const executiveNarrative = useMemo(() => {
    // Executive language: one paragraph recommendation
    const worst = hotspots[0]
    const second = hotspots[1]
    const mood = national.band.label

    const mem = memRef.current || { sectors: {} }
    const predWorst = worst ? mem.sectors[worst.sector]?.lastPred : null

    if (!worst) return "لا توجد بيانات كافية لبناء توصية تنفيذية حالياً."

    if (mood === "تأهب") {
      return `الوضع في حالة تأهب. تشير البؤر التشغيلية إلى ضغط متصاعد في "${worst.sector}" مع جاهزية ${worst.readiness}% ووجود ${worst.critical} حالات حرجة. ${predWorst?.etaMin ? `التوقع يشير إلى تفاقم خلال ${predWorst.etaMin} دقيقة.` : ""} التوصية التنفيذية: إعادة تموضع فرق الإسعاف والفرز نحو القطاع الأقل جاهزية، وتفعيل تدخلات تبريد وقائية، وإعادة جدولة جزء من تحركات الحملات لتقليل التعرض الحراري خلال الذروة.`
    }

    if (mood === "مراقبة") {
      return `الوضع تحت المراقبة المعززة. البؤرة الأكثر حساسية حالياً هي "${worst.sector}" (جاهزية ${worst.readiness}%) تليها "${second?.sector ?? "—"}". التوصية التنفيذية: تفعيل إجراءات وقائية للحملات في القطاعات الأقل جاهزية، وتجهيز فريق متنقل احتياطي قريب، وتكثيف التوعية بالسوائل والراحة لتجنب انتقال الحالات إلى مستوى حرج.`
    }

    return `الوضع مستقر تشغيلياً. ومع ذلك، تُظهر الاتجاهات أن "${worst.sector}" هو القطاع الأكثر حساسية (جاهزية ${worst.readiness}%). التوصية التنفيذية: استمرار الرصد وتحديث خطة التوزيع كل 30 دقيقة، مع جاهزية تدخل وقائي سريع عند ظهور مؤشرات تصاعد.`
  }, [hotspots, national])

  const copyExecutive = () => {
    const text =
`مذكرة تنفيذية — منصة المسار الصحي التنبؤية
الجاهزية الوطنية: ${national.score}% (${national.band.label})
إجمالي تحت الرصد: ${national.total}
حرجة: ${national.critical} | متوسطة: ${national.medium}

التوصية التنفيذية:
${executiveNarrative}

آخر إشارات تشغيلية:
- ${events.slice(0, 8).map(e => `${e.type} | ${e.sector ?? "—"} | ${e.message ?? ""}`).join("\n- ")}
`
    navigator.clipboard?.writeText(text)
    alert("تم نسخ المذكرة ✅")
  }

  return (
    <main>
      <div className="split" style={{ marginTop: 10 }}>
        <div>
          <div className="sectionTitle" style={{ margin: 0 }}>غرفة العمليات الوطنية — عقل تشغيلي ذاتي</div>
          <div style={{ opacity: .75, fontSize: 13, lineHeight: 1.8 }}>
            ليست لوحة عرض… بل نظام يفسّر ويستنتج ويتنبأ ويولّد أحداثاً تشغيلية تلقائياً.
          </div>
        </div>
        <span className="badge">آخر تحديث: {lastSync ? lastSync.toLocaleTimeString("ar-SA") : "—"}</span>
      </div>

      {/* KPIs */}
      <div className="grid4" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="kpiLabel">الجاهزية الوطنية</div>
          <div className={"kpiValue " + national.band.cls}>{national.score}%</div>
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
          <div className="kpiLabel">أحداث تشغيلية مولّدة</div>
          <div className="kpiValue">{events.length}</div>
        </div>
      </div>

      {/* Executive Recommendation */}
      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="split">
            <div style={{ fontWeight: 900 }}>توصية تنفيذية</div>
            <span className={"badge " + national.band.cls}>{national.band.label}</span>
          </div>
          <div style={{ marginTop: 10, opacity: .88, fontSize: 13, lineHeight: 2 }}>
            {executiveNarrative}
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={copyExecutive}>نسخ مذكرة للقيادة</button>
        </div>

        <div className="card">
          <div className="split">
            <div style={{ fontWeight: 900 }}>خريطة النوايا — البؤر المتجهة للخطر</div>
            <span className="badge">تنبؤ 15–30 دقيقة</span>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {hotspots.map((h, i) => {
              const mem = memRef.current || { sectors: {} }
              const pred = mem.sectors[h.sector]?.lastPred
              const eta = pred?.etaMin
              const delta = pred?.riskDelta ?? 0
              const cls = delta >= 35 ? "red" : delta >= 18 ? "amber" : "green"

              return (
                <button
                  key={i}
                  className="tile"
                  style={{ textAlign: "right", cursor: "pointer", color: "white" }}
                  onClick={() => setSelectedSector(h.sector)}
                >
                  <div className="split">
                    <b>{h.sector}</b>
                    <b className={h.band.cls}>{h.readiness}%</b>
                  </div>

                  <div style={{ marginTop: 8, opacity: .85, fontSize: 13, lineHeight: 1.8 }}>
                    الاتجاه: <b className={cls}>{delta > 0 ? `+${delta}` : `${delta}`}</b>
                    {eta ? ` — توقّع تدهور خلال ${eta} دقيقة` : ""}
                    <br />
                    حرجة <b className="red">{h.critical}</b> — متوسطة <b className="amber">{h.medium}</b> — إجمالي {h.total}
                  </div>
                </button>
              )
            })}
            {!hotspots.length && <div style={{ opacity: .7 }}>لا توجد بيانات قطاعات.</div>}
          </div>
        </div>
      </div>

      {/* Selected Sector Intelligence */}
      <div className="sectionTitle">ذكاء القطاع المختار</div>
      <div className="grid3">
        <div className="card">
          <div className="kpiLabel">القطاع</div>
          <div className="kpiValue" style={{ fontSize: 26 }}>{selected?.sector ?? "—"}</div>
          <div style={{ opacity: .75, fontSize: 13, lineHeight: 1.9, marginTop: 8 }}>
            جاهزية <b className={selected?.band?.cls ?? ""}>{selected?.readiness ?? "—"}%</b> — حرج <b className="red">{selected?.critical ?? 0}</b> — متوسط <b className="amber">{selected?.medium ?? 0}</b>
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">البصمة الصحية الجماعية (P90)</div>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <div className="tile split"><span style={{ opacity: .8 }}>نبض (P90)</span><b>{selected?.hrP90 == null ? "—" : Math.round(selected.hrP90)}</b></div>
            <div className="tile split"><span style={{ opacity: .8 }}>حرارة (P90)</span><b>{selected?.tempP90 == null ? "—" : selected.tempP90.toFixed(1)}</b></div>
            <div className="tile split"><span style={{ opacity: .8 }}>جفاف (P90)</span><b>{selected?.hydP90 == null ? "—" : Math.round(selected.hydP90)}%</b></div>
          </div>
          <div style={{ opacity: .6, fontSize: 12, marginTop: 10 }}>
            تم تنظيف القيم غير المنطقية تلقائياً لضمان موثوقية القراءة.
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">أحداث تشغيلية مولّدة</div>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {events
              .filter(e => (selected?.sector ? e.sector === selected.sector : true))
              .slice(0, 4)
              .map((e, i) => (
                <div key={i} className="tile">
                  <div className="split">
                    <b style={{ fontSize: 13 }}>{e.type}</b>
                    <span className={"badge " + (String(e.severity).includes("CRIT") ? "red" : "amber")}>
                      {String(e.severity).includes("CRIT") ? "حرج" : "وقائي"}
                    </span>
                  </div>
                  <div style={{ opacity: .82, fontSize: 13, marginTop: 8, lineHeight: 1.8 }}>
                    {e.message}
                  </div>
                </div>
              ))}
            {events.length === 0 && <div style={{ opacity: .7 }}>لا توجد أحداث مولدة بعد.</div>}
          </div>
        </div>
      </div>
    </main>
  )
}
