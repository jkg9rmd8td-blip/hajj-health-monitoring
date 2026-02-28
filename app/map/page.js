"use client"
import { useEffect, useMemo, useState } from "react"

function norm(v){ const x=String(v??"").trim(); if(x.includes("حرج"))return"critical"; if(x.includes("متوسط"))return"medium"; return"low"; }
function idx(t,c,m){ if(!t)return 100; let s=100-Math.round((c/t)*100*1.25)-Math.round((m/t)*100*0.55); return Math.max(0,Math.min(100,s)); }
function band(s){ if(s>=85)return{t:"مستقر",cls:"green"}; if(s>=70)return{t:"مراقبة",cls:"amber"}; return{t:"تأهب",cls:"red"}; }
function bg(s){ if(s>=85)return"rgba(34,197,94,.16)"; if(s>=70)return"rgba(245,158,11,.16)"; return"rgba(239,68,68,.16)"; }
function bd(s){ if(s>=85)return"rgba(34,197,94,.35)"; if(s>=70)return"rgba(245,158,11,.35)"; return"rgba(239,68,68,.35)"; }

export default function Map(){
  const [data,setData]=useState([])
  const [resources,setResources]=useState([])
  const [pick,setPick]=useState(null)
  const [mode,setMode]=useState("hybrid") // hybrid | heat

  useEffect(()=>{
    fetch("/api/pilgrims",{cache:"no-store"}).then(r=>r.json()).then(x=>setData(Array.isArray(x)?x:[])).catch(()=>setData([]))
    fetch("/api/resources",{cache:"no-store"}).then(r=>r.json()).then(x=>setResources(Array.isArray(x)?x:[])).catch(()=>setResources([]))
  },[])

  const sectors = useMemo(()=>{
    const map=new Map()
    for(const p of data){
      const s=String(p.clinic_location??p.location??"غير محدد")
      const r=norm(p.risk_level??p.risk)
      const e=map.get(s)??{sector:s,total:0,critical:0,medium:0,low:0}
      e.total++; e[r]++; map.set(s,e)
    }
    const arr=Array.from(map.values()).map(x=>{
      const score=idx(x.total,x.critical,x.medium)
      return {...x, score, b:band(score)}
    }).sort((a,b)=>a.score-b.score)
    return arr
  },[data])

  const current = pick ? sectors.find(s=>s.sector===pick) ?? sectors[0] : sectors[0]

  const suggestion = useMemo(()=>{
    if(!current) return null
    const sectorRes = resources.filter(r=>String(r.sector)===String(current.sector))
    const emsAvail = sectorRes.filter(r=>r.type==="إسعاف" && r.status==="متاح").length
    const need = current.critical>=2 ? 2 : current.critical===1 ? 1 : 0
    if(need>emsAvail){
      return `اقتراح: نقل ${need-emsAvail} فريق إسعاف إلى "${current.sector}" بسبب ${current.critical} حالة حرجة و جاهزية ${current.score}%.`
    }
    return `الوضع مقبول: الموارد الحالية في "${current.sector}" كافية مبدئيًا.`
  },[current,resources])

  return (
    <main>
      <div className="sectionTitle">الخريطة التشغيلية — طبقات المخاطر والموارد</div>

      <div className="card split">
        <div style={{opacity:.85,fontSize:13,lineHeight:1.9}}>
          عرض خريطة مرجعية (OSM) + طبقة Heatmap للقطاعات + طبقة موارد (إسعاف/تبريد/نقاط طبية).
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn" onClick={()=>setMode("hybrid")} aria-pressed={mode==="hybrid"}>هجيني</button>
          <button className="btn" onClick={()=>setMode("heat")} aria-pressed={mode==="heat"}>Heatmap</button>
        </div>
      </div>

      {mode==="hybrid" && (
        <div className="card" style={{padding:0, overflow:"hidden", marginTop:12}}>
          <div className="tile split" style={{borderRadius:0}}>
            <b>خريطة مكة والمشاعر (OSM)</b>
            <span className="badge">بدون مفاتيح</span>
          </div>
          <iframe
            title="Makkah Map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=39.70%2C21.28%2C40.05%2C21.52&layer=mapnik&marker=21.3891%2C39.8579"
            style={{width:"100%", height:420, border:0}}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className="grid2" style={{marginTop:12}}>
        <div className="card">
          <div className="split">
            <b>Heatmap القطاعات</b>
            <span className="badge">اضغط قطاع</span>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10,marginTop:12}}>
            {sectors.map((s,i)=>(
              <button key={i} onClick={()=>setPick(s.sector)} style={{
                textAlign:"right", cursor:"pointer", color:"#fff",
                background:bg(s.score), border:`1px solid ${bd(s.score)}`, borderRadius:14, padding:12
              }}>
                <div className="split"><b>{s.sector}</b><b className={s.b.cls}>{s.score}%</b></div>
                <div style={{opacity:.8,fontSize:12,marginTop:8}}>
                  حرج <b className="red">{s.critical}</b> — متوسط <b className="amber">{s.medium}</b>
                </div>
              </button>
            ))}
            {sectors.length===0 && <div style={{opacity:.7}}>لا توجد بيانات.</div>}
          </div>
        </div>

        <div className="card">
          <div className="split">
            <b>تفاصيل القطاع والموارد</b>
            {current && <span className={"badge "+current.b.cls}>{current.b.t}</span>}
          </div>

          {!current && <div style={{opacity:.7,marginTop:12}}>اختر قطاعاً.</div>}

          {current && (
            <>
              <div className="tile" style={{marginTop:12, opacity:.9, fontSize:13, lineHeight:1.9}}>
                القطاع: <b>{current.sector}</b><br/>
                الجاهزية: <b className={current.b.cls}>{current.score}%</b> — حرج <b className="red">{current.critical}</b> — متوسط <b className="amber">{current.medium}</b>
              </div>

              <div className="sectionTitle">اقتراح توزيع الموارد</div>
              <div className="tile" style={{opacity:.85,fontSize:13,lineHeight:1.9}}>{suggestion}</div>

              <div className="sectionTitle">الموارد</div>
              <div className="card" style={{padding:0}}>
                <table className="table">
                  <thead><tr><th>المعرف</th><th>النوع</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {resources.filter(r=>String(r.sector)===String(current.sector)).map((r,i)=>(
                      <tr key={i}><td><b>{r.id}</b></td><td>{r.type}</td><td>{r.status}</td></tr>
                    ))}
                    {resources.filter(r=>String(r.sector)===String(current.sector)).length===0 &&
                      <tr><td colSpan={3} style={{opacity:.7,padding:14}}>لا توجد موارد مسجلة.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
