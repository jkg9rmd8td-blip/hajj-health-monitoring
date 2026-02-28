"use client"
import { useEffect, useMemo, useState } from "react"

function norm(v){ const x=String(v??"").trim(); if(x.includes("حرج"))return"critical"; if(x.includes("متوسط"))return"medium"; return"low"; }
function idx(t,c,m){ if(!t)return 100; let s=100-Math.round((c/t)*100*1.25)-Math.round((m/t)*100*0.55); return Math.max(0,Math.min(100,s)); }
function band(s){ if(s>=85)return{t:"مستقر",cls:"green"}; if(s>=70)return{t:"مراقبة",cls:"amber"}; return{t:"تأهب",cls:"red"}; }

export default function National(){
  const [data,setData]=useState([])
  const [events,setEvents]=useState([])

  useEffect(()=>{
    fetch("/api/pilgrims",{cache:"no-store"}).then(r=>r.json()).then(x=>setData(Array.isArray(x)?x:[])).catch(()=>setData([]))
    fetch("/api/events",{cache:"no-store"}).then(r=>r.json()).then(x=>setEvents(Array.isArray(x)?x:[])).catch(()=>setEvents([]))
  },[])

  const k = useMemo(()=>{
    const t=data.length
    const c=data.filter(p=>norm(p.risk_level??p.risk)==="critical").length
    const m=data.filter(p=>norm(p.risk_level??p.risk)==="medium").length
    const s=idx(t,c,m)
    return {t,c,m,s,b:band(s)}
  },[data])

  const ops = useMemo(()=>{
    const raised=events.filter(e=>e.type==="ALERT_RAISED")
    const open = (()=> {
      // open = raised without CASE_CLOSED for same pilgrim+sector after it
      const closed=events.filter(e=>e.type==="CASE_CLOSED")
      let n=0
      for (const r of raised){
        const cl = closed.find(c=>c.pilgrim_id===r.pilgrim_id && c.sector===r.sector && new Date(c.ts)>=new Date(r.ts))
        if(!cl) n++
      }
      return n
    })()
    return {raised: raised.length, open}
  },[events])

  const actions = useMemo(()=>{
    const a=[]
    if(k.s<70){
      a.push({t:"رفع التأهب الوطني", d:"تعزيز فرق الإسعاف والفرز في القطاعات الأقل جاهزية خلال الذروة."})
      a.push({t:"إجراءات بيئية", d:"تكثيف التبريد/الرش وتعديل نقاط التموضع وفق بؤر الخطر."})
      a.push({t:"إدارة الحشود", d:"اقتراح إعادة جدولة بعض تحركات الحملات لتقليل الضغط والإنهاك."})
    }else if(k.s<85){
      a.push({t:"مراقبة معززة", d:"تهيئة فرق متنقلة احتياطية ورسائل وقائية للحملات."})
      a.push({t:"رفع كفاءة التوزيع", d:"تحسين توزيع الموارد حسب اتجاهات القطاعات كل 30 دقيقة."})
    }else{
      a.push({t:"استقرار", d:"استمرار الرصد والتحسينات التشغيلية دون تصعيد."})
    }
    return a
  },[k])

  return (
    <main>
      <div className="split" style={{marginTop:10}}>
        <div>
          <div className="sectionTitle" style={{margin:0}}>المؤشر الوطني للجاهزية الصحية</div>
          <div style={{opacity:.75,fontSize:13,lineHeight:1.8}}>ملخص سيادي لحالة اليوم + قرارات تشغيلية فورية.</div>
        </div>
        <span className="badge">قضايا مفتوحة: <b className={ops.open? "amber":"green"}>{ops.open}</b></span>
      </div>

      <div className="grid4" style={{marginTop:14}}>
        <div className="card"><div className="kpiLabel">الجاهزية الوطنية</div><div className={"kpiValue "+k.b.cls}>{k.s}%</div></div>
        <div className="card"><div className="kpiLabel">حالات حرجة</div><div className="kpiValue red">{k.c}</div></div>
        <div className="card"><div className="kpiLabel">حالات متوسطة</div><div className="kpiValue amber">{k.m}</div></div>
        <div className="card"><div className="kpiLabel">تنبيهات مرفوعة</div><div className="kpiValue">{ops.raised}</div></div>
      </div>

      <div className="grid3" style={{marginTop:12}}>
        <div className="card">
          <div className="kpiLabel">حالة اليوم</div>
          <div className={"kpiValue "+k.b.cls}>{k.b.t}</div>
          <div style={{opacity:.75,fontSize:13,lineHeight:1.8,marginTop:8}}>
            هذا التقييم مبني على توزيع المخاطر (حرج/متوسط) على مستوى المنظومة.
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">قرارات تنفيذية (Auto)</div>
          <div style={{display:"grid",gap:10,marginTop:10}}>
            {actions.map((x,i)=>(
              <div key={i} className="tile">
                <div style={{fontWeight:900}}>{x.t}</div>
                <div style={{opacity:.8,fontSize:13,lineHeight:1.8,marginTop:6}}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">تقرير سريع</div>
          <div className="tile" style={{marginTop:10,opacity:.85,fontSize:13,lineHeight:1.9}}>
            الجاهزية الوطنية: <b className={k.b.cls}>{k.s}%</b> ({k.b.t})<br/>
            حرجة: <b className="red">{k.c}</b> — متوسطة: <b className="amber">{k.m}</b><br/>
            قضايا مفتوحة: <b className={ops.open? "amber":"green"}>{ops.open}</b>
          </div>
          <button className="btn" style={{marginTop:10}} onClick={()=>{
            const text =
`تقرير قيادي — الجاهزية الوطنية
الجاهزية: ${k.s}% (${k.b.t})
حرجة: ${k.c} | متوسطة: ${k.m}
تنبيهات: ${ops.raised} | قضايا مفتوحة: ${ops.open}
قرارات فورية:
- ${actions.map(a=>a.t+": "+a.d).join("\n- ")}`
            navigator.clipboard?.writeText(text); alert("تم نسخ التقرير ✅")
          }}>نسخ تقرير قيادي</button>
        </div>
      </div>
    </main>
  )
}
