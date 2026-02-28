"use client"
import { useEffect, useMemo, useState } from "react"

function norm(v){ const x=String(v??"").trim(); if(x.includes("حرج"))return"critical"; if(x.includes("متوسط"))return"medium"; return"low"; }

export default function Movement(){
  const [pilgrims,setPilgrims]=useState([])
  const [routes,setRoutes]=useState([])

  useEffect(()=>{
    fetch("/api/pilgrims",{cache:"no-store"}).then(r=>r.json()).then(x=>setPilgrims(Array.isArray(x)?x:[])).catch(()=>setPilgrims([]))
    fetch("/api/movement",{cache:"no-store"}).then(r=>r.json()).then(x=>setRoutes(Array.isArray(x)?x:[])).catch(()=>setRoutes([]))
  },[])

  const campaigns = useMemo(()=>{
    const map=new Map()
    for(const p of pilgrims){
      const cid=String(p.campaign_id ?? p.campaignId ?? "CAMP-UNKNOWN")
      const r=norm(p.risk_level??p.risk)
      const e=map.get(cid)??{campaign_id:cid,total:0,critical:0,medium:0,low:0}
      e.total++; e[r]++; map.set(cid,e)
    }
    const arr=Array.from(map.values()).map(c=>{
      // خطورة حملة = وزن للحرجة والمتوسطة
      const riskScore = c.critical*3 + c.medium*1
      return {...c, riskScore}
    })
    // الأكثر خطورة أولاً لتوزيع أفضل أوقات
    arr.sort((a,b)=> b.riskScore-a.riskScore)
    return arr
  },[pilgrims])

  // مولد Slots بسيط: 6 نوافذ زمنية ثابتة (تمثل اليوم التشغيلي)
  const slots = [
    { slot:"S1", window:"03:30–05:00", label:"فجر (أبرد)" },
    { slot:"S2", window:"05:00–07:00", label:"صباح مبكر" },
    { slot:"S3", window:"07:00–09:00", label:"صباح" },
    { slot:"S4", window:"18:00–20:00", label:"مساء" },
    { slot:"S5", window:"20:00–22:00", label:"ليل" },
    { slot:"S6", window:"22:00–00:00", label:"ليل متأخر" }
  ]

  const plan = useMemo(()=>{
    // توزيع: الحملات عالية الخطورة تأخذ S1/S2/S4
    const safe=[slots[2],slots[4],slots[5],slots[3],slots[1],slots[0]] // fallback order
    const preferred=[slots[0],slots[1],slots[3],slots[4],slots[5],slots[2]]

    const out=[]
    let i=0
    for(const c of campaigns){
      const s = (c.riskScore>=6 ? preferred : safe)[i % slots.length]
      // اختيار مسار افتراضي من routes
      const r = routes[i % (routes.length||1)] ?? {from:"منى 3", to:"الجمرات", capacity_per_hour:8000}
      const reason = c.riskScore>=6
        ? "حملة عالية الخطورة: تخصيص نافذة أبرد وتقليل إجهاد حراري."
        : "توزيع تشغيلي لتقليل التزامن ورفع الانسيابية."
      out.push({
        campaign_id: c.campaign_id,
        route: `${r.from} → ${r.to}`,
        slot: `${s.slot} (${s.window})`,
        why: reason,
        note: `سعة المسار: ${r.capacity_per_hour}/ساعة | تقدير حجم الحملة: ${c.total}`
      })
      i++
    }
    return out
  },[campaigns,routes])

  return (
    <main>
      <div className="sectionTitle">جدولة تحركات الحملات — إدارة الحشود (Time Slots)</div>

      <div className="card" style={{opacity:.85,fontSize:13,lineHeight:1.9}}>
        هذه الصفحة تُحوّل المنصة من “رصد” إلى “تحكم استباقي”. يتم توزيع الحملات على نوافذ زمنية لتقليل الذروة والإنهاك الحراري.
      </div>

      <div className="sectionTitle">خطة اليوم (Draft)</div>
      <div className="card" style={{padding:0}}>
        <table className="table">
          <thead>
            <tr><th>الحملة</th><th>المسار</th><th>النافذة الزمنية</th><th>سبب القرار</th><th>ملاحظة</th></tr>
          </thead>
          <tbody>
            {plan.map((p,i)=>(
              <tr key={i}>
                <td><b>{p.campaign_id}</b></td>
                <td>{p.route}</td>
                <td><b>{p.slot}</b></td>
                <td style={{opacity:.85}}>{p.why}</td>
                <td style={{opacity:.75}}>{p.note}</td>
              </tr>
            ))}
            {plan.length===0 && <tr><td colSpan={5} style={{opacity:.7,padding:14}}>لا توجد بيانات حملات. أضف campaign_id في data.json</td></tr>}
          </tbody>
        </table>
      </div>

      <button className="btn" style={{marginTop:12}} onClick={()=>{
        const text = `خطة تحركات الحملات (Draft)\n` + plan.map(p=>`${p.campaign_id} | ${p.route} | ${p.slot} | ${p.why}`).join("\n")
        navigator.clipboard?.writeText(text); alert("تم نسخ خطة التحركات ✅")
      }}>نسخ خطة التحركات</button>
    </main>
  )
}
