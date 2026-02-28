"use client"
import { useEffect, useMemo, useState } from "react"

export default function Audit(){
  const [events,setEvents]=useState([])
  useEffect(()=>{
    fetch("/api/events",{cache:"no-store"}).then(r=>r.json()).then(x=>setEvents(Array.isArray(x)?x:[])).catch(()=>setEvents([]))
  },[])

  const cases = useMemo(()=>{
    const raised=events.filter(e=>e.type==="ALERT_RAISED")
    const ack=events.filter(e=>e.type==="ALERT_ACK")
    const dispatch=events.filter(e=>e.type==="DISPATCH")
    const closed=events.filter(e=>e.type==="CASE_CLOSED")

    const rows=[]
    for(const r of raised){
      const a=ack.find(x=>x.pilgrim_id===r.pilgrim_id && x.sector===r.sector && new Date(x.ts)>=new Date(r.ts))
      const d=dispatch.find(x=>x.pilgrim_id===r.pilgrim_id && x.sector===r.sector && new Date(x.ts)>=new Date(r.ts))
      const c=closed.find(x=>x.pilgrim_id===r.pilgrim_id && x.sector===r.sector && new Date(x.ts)>=new Date(r.ts))
      rows.push({
        pilgrim_id:r.pilgrim_id, campaign_id:r.campaign_id, sector:r.sector, severity:r.severity,
        raised:r.ts, ack:a?.ts ?? null, dispatch:d?.ts ?? null, closed:c?.ts ?? null
      })
    }
    rows.sort((a,b)=> new Date(b.raised)-new Date(a.raised))
    return rows
  },[events])

  const open = cases.filter(c=>!c.closed)

  return (
    <main>
      <div className="split" style={{marginTop:10}}>
        <div>
          <div className="sectionTitle" style={{margin:0}}>التدقيق — سجل سيادي (Audit)</div>
          <div style={{opacity:.75,fontSize:13,lineHeight:1.8}}>سجل قابل للمراجعة: تنبيه → استلام → إرسال → إغلاق.</div>
        </div>
        <span className="badge">قضايا مفتوحة: <b className={open.length? "amber":"green"}>{open.length}</b></span>
      </div>

      <div className="sectionTitle">قضايا مفتوحة الآن</div>
      <div className="card" style={{padding:0}}>
        <table className="table">
          <thead><tr><th>الحاج</th><th>الحملة</th><th>القطاع</th><th>الشدة</th><th>وقت التنبيه</th><th>استلام</th><th>إرسال</th></tr></thead>
          <tbody>
            {open.slice(0,12).map((c,i)=>(
              <tr key={i}>
                <td><b>{c.pilgrim_id}</b></td><td>{c.campaign_id}</td><td>{c.sector}</td>
                <td className={String(c.severity).includes("CRIT") ? "red":"amber"} style={{fontWeight:900}}>
                  {String(c.severity).includes("CRIT") ? "حرج":"وقائي"}
                </td>
                <td>{new Date(c.raised).toLocaleTimeString("ar-SA")}</td>
                <td>{c.ack ? new Date(c.ack).toLocaleTimeString("ar-SA") : "—"}</td>
                <td>{c.dispatch ? new Date(c.dispatch).toLocaleTimeString("ar-SA") : "—"}</td>
              </tr>
            ))}
            {open.length===0 && <tr><td colSpan={7} style={{opacity:.7,padding:14}}>لا توجد قضايا مفتوحة.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="sectionTitle">آخر السجل (Timeline)</div>
      <div className="card" style={{padding:0}}>
        <table className="table">
          <thead><tr><th>الحاج</th><th>الحملة</th><th>القطاع</th><th>تنبيه</th><th>استلام</th><th>إرسال</th><th>إغلاق</th></tr></thead>
          <tbody>
            {cases.slice(0,20).map((c,i)=>(
              <tr key={i}>
                <td><b>{c.pilgrim_id}</b></td><td>{c.campaign_id}</td><td>{c.sector}</td>
                <td>{new Date(c.raised).toLocaleTimeString("ar-SA")}</td>
                <td>{c.ack ? new Date(c.ack).toLocaleTimeString("ar-SA") : "—"}</td>
                <td>{c.dispatch ? new Date(c.dispatch).toLocaleTimeString("ar-SA") : "—"}</td>
                <td>{c.closed ? new Date(c.closed).toLocaleTimeString("ar-SA") : "—"}</td>
              </tr>
            ))}
            {cases.length===0 && <tr><td colSpan={7} style={{opacity:.7,padding:14}}>لا توجد أحداث بعد. أضف events.json</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}
