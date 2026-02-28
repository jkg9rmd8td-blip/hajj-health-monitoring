"use client"

import { useEffect, useMemo, useRef, useState } from "react"

/**
 * AI-Ops Center (بدون AI خارجي) — مركز القرار الذكي
 * - سيناريوهات ماذا لو (What-if)
 * - محاكاة قرارات: فتح مسار / تأخير تدفق / تعزيز موارد / تبديل نوافذ تحرك
 * - أثر متوقع خلال 10/20/30 دقيقة
 * - يولّد "أمر تشغيلي" + "أثر متوقع" + "مخاطر" + "سجل قرار" (localStorage)
 */

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
      total: 0, critical: 0, medium: 0, low: 0,
      hrs: [], temps: [], hyds: []
    }

    e.total++
    e[risk]++

    if (hr != null) e.hrs.push(hr)
    if (temp != null) e.temps.push(temp)
    if (hyd != null) e.hyds.push(hyd)

    bySector.set(sector, e)
  }

  const fps = []
  for (const s of bySector.values()) {
    fps.push({
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
      criticalRate: s.total ? s.critical / s.total : 0,
      mediumRate: s.total ? s.medium / s.total : 0,
    })
  }

  fps.sort((a, b) => (a.readiness - b.readiness) || (b.critical - a.critical))
  return fps
}

function buildNational(fps) {
  const total = fps.reduce((s, x) => s + x.total, 0)
  const critical = fps.reduce((s, x) => s + x.critical, 0)
  const medium = fps.reduce((s, x) => s + x.medium, 0)
  const low = total - critical - medium
  const score = readinessIndex(total, critical, medium)
  return { total, critical, medium, low, score, band: band(score) }
}

// ---- Decision Memory ----
const DEC_KEY = "hhmo_decisions_v1"
function loadDecisions() {
  try {
    const raw = localStorage.getItem(DEC_KEY)
    const obj = raw ? JSON.parse(raw) : []
    return Array.isArray(obj) ? obj : []
  } catch {
    return []
  }
}
function saveDecisions(arr) {
  try { localStorage.setItem(DEC_KEY, JSON.stringify(arr.slice(0, 50))) } catch {}
}

function nowISO() { return new Date().toISOString() }

// ---- What-if Engine ----
// baseline = fingerprint(s) + national
// actions change risk envelope using simple operational assumptions.
function simulateImpact({ fps, national, selectedSector, action }) {
  const worst = fps[0]
  const sec = selectedSector ? fps.find(x => x.sector === selectedSector) : worst
  if (!sec) return null

  // Base "pressure score" (0..100): higher is worse
  const basePressure =
    (sec.tempP90 != null ? (sec.tempP90 - 36.8) * 18 : 0) +
    (sec.hrP90 != null ? (sec.hrP90 - 95) * 0.6 : 0) +
    (sec.hydP90 != null ? (sec.hydP90 - 55) * 0.9 : 0) +
    (sec.criticalRate * 240) +
    (sec.mediumRate * 110)

  // Convert to expected readiness delta
  // More pressure => lower readiness
  const baseDelta = Math.round(clamp(basePressure / 12, -30, 40) ?? 0)

  // Action knobs
  let coolGain = 0
  let routeGain = 0
  let emsGain = 0
  let scheduleGain = 0
  let riskNote = []

  if (action.type === "COOLING_BOOST") {
    coolGain = 10 + action.level * 6
    riskNote.push("يتطلب دعم لوجستي للتبريد/الطاقة/الصيانة.")
  }
  if (action.type === "EMS_RELOCATE") {
    emsGain = 8 + action.teams * 5
    riskNote.push("تأثيره أعلى على الحالات الحرجة إذا تم التمركز الصحيح.")
  }
  if (action.type === "OPEN_EXTRA_ROUTE") {
    routeGain = 12 + action.capacityBoost * 0.2
    riskNote.push("يحتاج تنسيق أمني/مروري وإشعار للحملات.")
  }
  if (action.type === "DELAY_FLOW") {
    scheduleGain = 10 + Math.min(20, Math.round(action.delayMin * 0.6))
    riskNote.push("قد يخلق ضغطاً لاحقاً إذا لم يُدار بفتحات زمنية بديلة.")
  }
  if (action.type === "CAMPAIGN_TIME_SLOTS") {
    scheduleGain = 12 + action.strictness * 6
    riskNote.push("يتطلب امتثال الحملات ومتابعة SLA.")
  }

  const totalGain = coolGain + routeGain + emsGain + scheduleGain
  const predictedImprovement = Math.round(clamp(totalGain - baseDelta, -25, 35) ?? 0)

  // translate improvement into readiness gain for the sector
  const nextReadiness = Math.max(0, Math.min(100, Math.round(sec.readiness + predictedImprovement)))
  const nextBand = band(nextReadiness)

  // expected prevention count (rough)
  const prevent = Math.max(0, Math.round((sec.critical * 0.35) + (sec.medium * 0.12) + (totalGain / 18)))
  const eta = Math.max(6, Math.min(30, Math.round(22 - (totalGain / 4))))

  // national effect small fraction
  const natGain = Math.round(clamp(totalGain / 18, 0, 8) ?? 0)
  const natNext = Math.max(0, Math.min(100, Math.round(national.score + natGain)))

  return {
    sector: sec.sector,
    baseReadiness: sec.readiness,
    nextReadiness,
    nextBand,
    etaMin: eta,
    prevent,
    natBase: national.score,
    natNext,
    why:
      `تقدير الأثر مبني على بصمة إجهاد (P90) + نسب المخاطر + وزن التدخلات التشغيلية.`,
    risks: riskNote.length ? riskNote.join(" ") : "لا مخاطر تشغيلية بارزة ضمن MVP.",
  }
}

// ---- UI presets ----
const ACTIONS = [
  { id: "a1", type: "COOLING_BOOST", title: "تعزيز التبريد الذكي", subtitle: "رفع التبريد في بؤر الخطر", defaults: { level: 1 } },
  { id: "a2", type: "EMS_RELOCATE", title: "إعادة تموضع الإسعاف", subtitle: "نقل فرق إسعاف/فرز", defaults: { teams: 1 } },
  { id: "a3", type: "OPEN_EXTRA_ROUTE", title: "فتح مسار إضافي", subtitle: "رفع سعة المسار/تخفيف الازدحام", defaults: { capacityBoost: 2000 } },
  { id: "a4", type: "DELAY_FLOW", title: "تأخير تدفق الحافلات", subtitle: "إزاحة الذروة الحرارية", defaults: { delayMin: 12 } },
  { id: "a5", type: "CAMPAIGN_TIME_SLOTS", title: "جدولة تحركات الحملات", subtitle: "Time Slots إلزامية", defaults: { strictness: 1 } },
]

export default function AIOps() {
  const [pilgrims, setPilgrims] = useState([])
  const [selectedSector, setSelectedSector] = useState(null)
  const [pickedAction, setPickedAction] = useState(ACTIONS[0])
  const [params, setParams] = useState(ACTIONS[0].defaults)
  const [decisions, setDecisions] = useState([])
  const first = useRef(true)

  useEffect(() => {
    fetch("/api/pilgrims", { cache: "no-store" })
      .then(r => r.json())
      .then(rows => setPilgrims(Array.isArray(rows) ? rows : []))
      .catch(() => setPilgrims([]))
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    setDecisions(loadDecisions())
  }, [])

  const fps = useMemo(() => buildFingerprints(pilgrims), [pilgrims])
  const national = useMemo(() => buildNational(fps), [fps])

  useEffect(() => {
    if (!fps.length || !first.current) return
    first.current = false
    setSelectedSector(fps[0]?.sector ?? null)
  }, [fps])

  useEffect(() => {
    setParams(pickedAction.defaults)
  }, [pickedAction])

  const sim = useMemo(() => {
    return simulateImpact({
      fps,
      national,
      selectedSector,
      action: { type: pickedAction.type, ...params },
    })
  }, [fps, national, selectedSector, pickedAction, params])

  const orderText = useMemo(() => {
    if (!sim) return ""
    const lines = []
    lines.push(`أمر تشغيلي — مركز القرار الذكي`)
    lines.push(`الوقت: ${new Date().toLocaleString("ar-SA")}`)
    lines.push(`القطاع المستهدف: ${sim.sector}`)
    lines.push(`القرار: ${pickedAction.title}`)
    lines.push(`الأثر المتوقع خلال ~${sim.etaMin} دقيقة:`)
    lines.push(`- جاهزية القطاع: ${sim.baseReadiness}% → ${sim.nextReadiness}% (${sim.nextBand.label})`)
    lines.push(`- أثر وطني تقديري: ${sim.natBase}% → ${sim.natNext}%`)
    lines.push(`- منع حالات محتملة: ${sim.prevent}`)
    lines.push(`المخاطر/الاشتراطات: ${sim.risks}`)
    lines.push(`ملاحظة: ${sim.why}`)
    return lines.join("\n")
  }, [sim, pickedAction])

  const approveDecision = () => {
    if (!sim) return
    const rec = {
      id: "DEC-" + Math.random().toString(16).slice(2, 9).toUpperCase(),
      ts: nowISO(),
      sector: sim.sector,
      action: pickedAction.title,
      params,
      effect: {
        etaMin: sim.etaMin,
        sectorFrom: sim.baseReadiness,
        sectorTo: sim.nextReadiness,
        natFrom: sim.natBase,
        natTo: sim.natNext,
        prevent: sim.prevent,
      },
    }
    const next = [rec, ...decisions].slice(0, 50)
    setDecisions(next)
    saveDecisions(next)
    alert("تم اعتماد القرار وحفظه في سجل التدقيق ✅")
  }

  const copyOrder = () => {
    navigator.clipboard?.writeText(orderText)
    alert("تم نسخ الأمر التشغيلي ✅")
  }

  const chip = (v) => (
    <span className="badge" style={{ opacity: .95 }}>{v}</span>
  )

  return (
    <main>
      <div className="split" style={{ marginTop: 10 }}>
        <div>
          <div className="sectionTitle" style={{ margin: 0 }}>مركز القرار الذكي (AI-Ops)</div>
          <div style={{ opacity: .75, fontSize: 13, lineHeight: 1.8 }}>
            محاكاة قرارات سيادية “ماذا لو” مع أثر متوقع خلال دقائق — دون اعتماد على خدمات خارجية.
          </div>
        </div>
        {chip(`الجاهزية الوطنية: ${national.score}% (${national.band.label})`)}
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        {/* Left: Scenario builder */}
        <div className="card">
          <div className="split">
            <b>صانع السيناريو</b>
            {chip("What-If")}
          </div>

          <div className="sectionTitle" style={{ marginTop: 14 }}>اختيار القطاع</div>
          <div style={{ display: "grid", gap: 10 }}>
            <select
              className="input"
              value={selectedSector ?? ""}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              {fps.map((s, i) => (
                <option key={i} value={s.sector}>
                  {s.sector} — جاهزية {s.readiness}% — حرج {s.critical}
                </option>
              ))}
            </select>
          </div>

          <div className="sectionTitle">نوع القرار</div>
          <div style={{ display: "grid", gap: 10 }}>
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                className="tile"
                onClick={() => setPickedAction(a)}
                style={{
                  textAlign: "right",
                  cursor: "pointer",
                  color: "white",
                  outline: pickedAction.id === a.id ? "2px solid rgba(255,255,255,.22)" : "none",
                }}
              >
                <div className="split">
                  <b>{a.title}</b>
                  <span className="badge">{a.type}</span>
                </div>
                <div style={{ opacity: .8, fontSize: 13, marginTop: 6, lineHeight: 1.8 }}>
                  {a.subtitle}
                </div>
              </button>
            ))}
          </div>

          <div className="sectionTitle">معلمات القرار</div>

          {pickedAction.type === "COOLING_BOOST" && (
            <div className="tile split">
              <span style={{ opacity: .85 }}>مستوى التعزيز (1–3)</span>
              <input
                className="input"
                style={{ maxWidth: 140, textAlign: "center" }}
                value={params.level ?? 1}
                onChange={(e) => setParams({ ...params, level: Number(e.target.value) })}
              />
            </div>
          )}

          {pickedAction.type === "EMS_RELOCATE" && (
            <div className="tile split">
              <span style={{ opacity: .85 }}>عدد الفرق المنقولة</span>
              <input
                className="input"
                style={{ maxWidth: 140, textAlign: "center" }}
                value={params.teams ?? 1}
                onChange={(e) => setParams({ ...params, teams: Number(e.target.value) })}
              />
            </div>
          )}

          {pickedAction.type === "OPEN_EXTRA_ROUTE" && (
            <div className="tile split">
              <span style={{ opacity: .85 }}>رفع السعة (بالساعة)</span>
              <input
                className="input"
                style={{ maxWidth: 140, textAlign: "center" }}
                value={params.capacityBoost ?? 2000}
                onChange={(e) => setParams({ ...params, capacityBoost: Number(e.target.value) })}
              />
            </div>
          )}

          {pickedAction.type === "DELAY_FLOW" && (
            <div className="tile split">
              <span style={{ opacity: .85 }}>تأخير التدفق (دقيقة)</span>
              <input
                className="input"
                style={{ maxWidth: 140, textAlign: "center" }}
                value={params.delayMin ?? 12}
                onChange={(e) => setParams({ ...params, delayMin: Number(e.target.value) })}
              />
            </div>
          )}

          {pickedAction.type === "CAMPAIGN_TIME_SLOTS" && (
            <div className="tile split">
              <span style={{ opacity: .85 }}>صرامة الالتزام (1–3)</span>
              <input
                className="input"
                style={{ maxWidth: 140, textAlign: "center" }}
                value={params.strictness ?? 1}
                onChange={(e) => setParams({ ...params, strictness: Number(e.target.value) })}
              />
            </div>
          )}
        </div>

        {/* Right: Impact report */}
        <div className="card">
          <div className="split">
            <b>الأثر المتوقع</b>
            {sim ? chip(`ETA ~ ${sim.etaMin} دقيقة`) : chip("—")}
          </div>

          {!sim && (
            <div style={{ opacity: .75, marginTop: 12 }}>
              لا توجد بيانات كافية لمحاكاة الأثر.
            </div>
          )}

          {sim && (
            <>
              <div className="grid3" style={{ marginTop: 12 }}>
                <div className="card">
                  <div className="kpiLabel">جاهزية القطاع</div>
                  <div className="kpiValue">{sim.baseReadiness}%</div>
                  <div style={{ opacity: .75, marginTop: 6, fontSize: 12 }}>
                    بعد القرار: <b className={sim.nextBand.cls}>{sim.nextReadiness}%</b> ({sim.nextBand.label})
                  </div>
                </div>

                <div className="card">
                  <div className="kpiLabel">الأثر الوطني (تقديري)</div>
                  <div className="kpiValue">{sim.natBase}%</div>
                  <div style={{ opacity: .75, marginTop: 6, fontSize: 12 }}>
                    بعد القرار: <b className={sim.natNext >= sim.natBase ? "green" : "amber"}>{sim.natNext}%</b>
                  </div>
                </div>

                <div className="card">
                  <div className="kpiLabel">منع حالات محتملة</div>
                  <div className="kpiValue green">{sim.prevent}</div>
                  <div style={{ opacity: .7, marginTop: 6, fontSize: 12 }}>
                    تقدير تشغيلي مبني على اتجاهات القطاع.
                  </div>
                </div>
              </div>

              <div className="sectionTitle">أمر تشغيلي جاهز</div>
              <div className="tile" style={{ whiteSpace: "pre-wrap", lineHeight: 1.9, opacity: .9 }}>
                {orderText}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <button className="btn" onClick={copyOrder}>نسخ الأمر</button>
                <button className="btn" onClick={approveDecision}>اعتماد القرار (سجل)</button>
              </div>

              <div className="sectionTitle">مخاطر واشتراطات</div>
              <div className="tile" style={{ opacity: .9, lineHeight: 1.9 }}>
                {sim.risks}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="sectionTitle">سجل القرارات المعتمدة (محلي)</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>الوقت</th>
              <th>القطاع</th>
              <th>القرار</th>
              <th>ETA</th>
              <th>جاهزية</th>
              <th>أثر وطني</th>
              <th>منع</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((d, i) => (
              <tr key={i}>
                <td style={{ opacity: .85 }}>{new Date(d.ts).toLocaleString("ar-SA")}</td>
                <td><b>{d.sector}</b></td>
                <td style={{ fontWeight: 900 }}>{d.action}</td>
                <td>{d.effect?.etaMin ?? "—"}د</td>
                <td>{d.effect?.sectorFrom ?? "—"}% → <b className="green">{d.effect?.sectorTo ?? "—"}%</b></td>
                <td>{d.effect?.natFrom ?? "—"}% → <b className="green">{d.effect?.natTo ?? "—"}%</b></td>
                <td className="green" style={{ fontWeight: 900 }}>{d.effect?.prevent ?? 0}</td>
              </tr>
            ))}
            {decisions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ opacity: .7, padding: 14 }}>
                  لا توجد قرارات محفوظة بعد. اضغط "اعتماد القرار (سجل)".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ opacity: .6, fontSize: 12, marginTop: 12, lineHeight: 1.9 }}>
        ملاحظة: هذه محاكاة تشغيلية (MVP) قابلة للربط لاحقاً ببيانات الطقس/السعة/الازدحام الرسمية ونماذج تنبؤية متقدمة.
      </div>
    </main>
  )
}
