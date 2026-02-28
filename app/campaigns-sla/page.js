"use client"
import { useEffect, useMemo, useState } from "react"

function mins(a,b){ const x=new Date(a).getTime(), y=new Date(b).getTime(); if(!isFinite(x)||!isFinite(y))return null; return Math.max(0,Math.round((y-x)/60000)); }
function grade(s){ if(s>=90)return"A+"; if(s>=80)return"A"; if(s>=70)return"B"; if(s>=55)return"C"; return"D"; }

export default function SLABoard(){
  const [events,setEvents]=useState([])
  useEffect(()=>{ fetch("/api/events",{cache:"no-store"}).then(r=>r.json()).then(x=>setEvents(Array.isArray(x)?x:[])).catch(()=>setEvents([])) },[])

  const rows = useMemo(()=>{
    const map=new Map()
    for(const e of events){
      const cid=String(e.campaign_id ?? "CAMP-UNKNOWN")
      const arr=map.get(cid)??[]
      arr.push(e); map.set(cid,arr)
    }

    const out=[]
    for(const [cid,arr] of map.entries()){
      const raised=arr.filter(e=>e.type==="ALERT_RAISED")
      const ack=arr.filter(e=>e.type==="ALERT_ACK")
      const dispatch=arr.filter(e=>e.type==="DISPATCH")
      const closed=arr.filter(e=>e.type==="CASE_CLOSED")
      const rec=arr.filter(e=>e.type==="RECOMMENDATION_SENT")

      const resp=[], disp=[], clo=[]
      for(const r of raised){
        const a=ack.find(x=>x.pilgrim_id===r.pilgrim_id && x.sector===r.sector && new Date(x.ts)>=new Date(r.ts))
        const d=dispatch.find(x=>x.pilgrim_id===r.pilgrim_id && x.sector===r.sector && new Date(x.ts)>=new Date(r.ts))
        const c=closed.find(x=>x.pilgrim_id===r.pilgrim_id && x.sector===r.sector && new Date(x.ts)>=new Date(r.ts))
        if(a) resp.push(mins(r.ts,a.ts))
        if(d) disp.push(mins(r.ts,d.ts))
        if(c) clo.push(mins(r.ts,c.ts))
      }
      const avg = xs => xs.length? Math.round(xs.reduce((s,v)=>s+(v??0),0)/xs.length) : null

      let recAck=0
      for(const rr of rec){
        const a=ack.find(x=>x.pilgrim_id===rr.pilgrim_id && x.sector===rr.sector && new Date(x.ts)>=new Date(rr.ts))
        if(a) recAck++
      }
      const recExec = rec.length ? Math.round((recAck/rec.length)*100) : 0

      // score
      let score=100
      const r=avg(resp), d=avg(disp), c=avg(clo)
      if(r!=null) score -= Math.max(0,r-8)*2
      if(d!=null) score -= Math.max(0,d-15)*1
      if(c!=null) score -= Math.max(0,c-45)*1
      score += Math.round((recExec-70)*0.4)
      score=Math.max(0,Math.min(100,score))

      out.push({campaign_id:cid, alerts:raised.length, responseMin:r, dispatchMin:d, closeMin:c, recExec, score, grade:grade(score)})
    }

    out.sort((a,b)=> a.score-b.score)
    return out
  },[events])

  return (
    <main>
      <div className="sectionTitle">امتثال الحملات — لوحة مقارنة (SLA Leaderboard)</div>

      <div className="card" style={{opacity:.82,fontSize:13,lineHeight:1.9}}>
        ترتيب الحملات حسب الامتثال التشغيلي (SLA): استجابة/إرسال/إغلاق + تنفيذ توصيات.
      </div>

      <div className="card" style={{padding:0, marginTop:12}}>
        <table className="table">
          <thead>
            <tr>
              <th>الحملة</th><th>الامتثال</th><th>تصنيف</th><th>تنبيهات</th>
              <th>استجابة</th><th>إرسال</th><th>إغلاق</th><th>تنفيذ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c,i)=>(
              <tr key={i}>
                <td><b>{c.campaign_id}</b></td>
                <td className={c.score<55?"red":c.score<70?"amber":"green"} style={{fontWeight:900}}>{c.score}%</td>
                <td style={{fontWeight:900}}>{c.grade}</td>
                <td>{c.alerts}</td>
                <td>{c.responseMin==null?"—":`${c.responseMin}د`}</td>
                <td>{c.dispatchMin==null?"—":`${c.dispatchMin}د`}</td>
                <td>{c.closeMin==null?"—":`${c.closeMin}د`}</td>
                <td className={c.recExec<70?"amber":"green"} style={{fontWeight:900}}>{c.recExec}%</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={8} style={{opacity:.7,padding:14}}>لا توجد بيانات SLA. أضف events.json</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}
