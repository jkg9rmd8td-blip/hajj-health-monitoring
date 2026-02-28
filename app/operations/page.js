"use client"
import { useEffect, useMemo, useState } from "react"

function norm(v){ const x=String(v??"").trim(); if(x.includes("حرج"))return"critical"; if(x.includes("متوسط"))return"medium"; return"low"; }
function idx(t,c,m){ if(!t)return 100; let s=100-Math.round((c/t)*100*1.25)-Math.round((m/t)*100*0.55); return Math.max(0,Math.min(100,s)); }

export default function Operations(){
  const [data,setData]=useState([])
  const [rules,setRules]=useState({
    readinessRed: 70,
    tempHigh: 38.5,
    hydrationHigh: 60,
    pulseHigh: 120
  })

  useEffect(()=>{
    fetch("/api/pilgrims",{cache:"no-store"}).then(r=>r.json()).then(x=>setData(Array.isArray(x)?x:[])).catch(()=>setData([]))
  },[])

  const metrics = useMemo(()=>{
    const t=data.length
    const c=data.filter(p=>norm(p.risk_level??p.risk)==="critical").length
    const m=data.filter(p=>norm(p.risk_level??p.risk)==="medium").length
    const readiness=idx(t,c,m)
    const highTemp=data.filter(p=>Number(p.temperature)>=rules.tempHigh).length
    const highHyd=data.filter(p=>Number(p.hydrationRisk)>=rules.hydrationHigh).length
    const highPulse=data.filter(p=>Number(p.heartRate)>=rules.pulseHigh).length
    return {t,c,m,readiness,highTemp,highHyd,highPulse}
  },[data,rules])

  const decisions = useMemo(()=>{
    const d=[]
    if(metrics.readiness < rules.readinessRed){
      d.push({level:"أحمر", title:"رفع التأهب", why:`الجاهزية ${metrics.readiness}% أقل من ${rules.readinessRed}%`, action:"تعزيز الإسعاف/الفرز + إعادة توزيع الموارد + تنبيه الحملات"})
    }else{
      d.push({level:"مراقبة", title:"استمرار الرصد", why:`الجاهزية ${metrics.readiness}%`, action:"متابعة بؤر القطاعات وتحديث الخطة كل 30 دقيقة"})
    }

    if(metrics.highTemp>0){
      d.push({level:"بيئي", title:"تفعيل تدخلات تبريد", why:`رصد حرارة مرتفعة لدى ${metrics.highTemp} حالة`, action:"رفع التبريد/الرش + توجيه تقليل جهد للمشاة"})
    }
    if(metrics.highHyd>0){
      d.push({level:"وقائي", title:"حملة سوائل استباقية", why:`مخاطر جفاف لدى ${metrics.highHyd} حالة`, action:"رسائل للحملات + نقاط توزيع مياه + راحة"})
    }
    if(metrics.highPulse>0){
      d.push({level:"طبي", title:"فرز قلبي سريع", why:`نبض مرتفع لدى ${metrics.highPulse} حالة`, action:"رفع حساسية الفرز القلبي في النقاط الطبية"})
    }
    return d
  },[metrics,rules])

  return (
    <main>
      <div className="sectionTitle">التشغيل — محرك القرار (Policy Engine)</div>

      <div className="grid2">
        <div className="card">
          <div style={{fontWeight:900}}>قواعد التشغيل (MVP)</div>
          <div style={{opacity:.75,fontSize:13,lineHeight:1.9,marginTop:8}}>يمكن تعديل العتبات لتغيير قرارات النظام دون كود.</div>

          <div style={{display:"grid",gap:10,marginTop:12}}>
            {[
              ["جاهزية أحمر أقل من", "readinessRed"],
              ["حرارة مرتفعة ≥", "tempHigh"],
              ["مخاطر جفاف ≥", "hydrationHigh"],
              ["نبض مرتفع ≥", "pulseHigh"]
            ].map(([label,key])=>(
              <div key={key} className="tile split">
                <span style={{opacity:.85}}>{label}</span>
                <input className="input" style={{maxWidth:140,textAlign:"center"}} value={rules[key]}
                  onChange={(e)=>setRules({...rules,[key]: Number(e.target.value)})}/>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:900}}>قرارات النظام (Auto)</div>
          <div style={{display:"grid",gap:10,marginTop:12}}>
            {decisions.map((x,i)=>(
              <div key={i} className="tile">
                <div className="split">
                  <b>{x.title}</b>
                  <span className="badge">{x.level}</span>
                </div>
                <div style={{opacity:.8,fontSize:13,lineHeight:1.8,marginTop:8}}>
                  <b>السبب:</b> {x.why}<br/>
                  <b>الإجراء:</b> {x.action}
                </div>
              </div>
            ))}
          </div>

          <button className="btn" style={{marginTop:12}} onClick={()=>{
            const text = `قرارات تشغيلية — محرك القرار
جاهزية: ${metrics.readiness}%
حرارة مرتفعة: ${metrics.highTemp}
مخاطر جفاف: ${metrics.highHyd}
نبض مرتفع: ${metrics.highPulse}

القرارات:
- ${decisions.map(d=>`${d.title} | السبب: ${d.why} | الإجراء: ${d.action}`).join("\n- ")}`
            navigator.clipboard?.writeText(text); alert("تم نسخ التقرير ✅")
          }}>نسخ تقرير تشغيل</button>
        </div>
      </div>
    </main>
  )
}
