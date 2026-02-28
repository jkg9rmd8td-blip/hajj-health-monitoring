"use client"
import { useEffect, useMemo, useState } from "react"

function norm(v){ const x=String(v??"").trim(); if(x.includes("حرج"))return"critical"; if(x.includes("متوسط"))return"medium"; return"low"; }
function idx(t,c,m){ if(!t)return 100; let s=100-Math.round((c/t)*100*1.25)-Math.round((m/t)*100*0.55); return Math.max(0,Math.min(100,s)); }
function band(s){ if(s>=85)return{t:"مستقر",cls:"green"}; if(s>=70)return{t:"مراقبة",cls:"amber"}; return{t:"تأهب",cls:"red"}; }

export default function Sectors(){
  const [data,setData]=useState([])
  const [resources,setResources]=useState([])
  const [pick,setPick]=useState(null)

  useEffect(()=>{
    fetch("/api/pilgrims",{cache:"no-store"}).then(r=>r.json()).then(x=>setData(Array.isArray(x)?x:[])).catch(()=>setData([]))
    fetch("/api/resources",{cache:"no-store"}).then(r=>r.json()).then(x=>setResources(Array.isArray(x)?x:[])).catch(()=>setResources([]))
  },[])

  const sectors = useMemo(()=>{
    const map=new Map()
    for(const p of data){
      const s=String(p.clinic_location??p.location??"غير محدد")
      const r=norm(p.risk_level??p.risk)
      const e=map.get(s)??{sector:s,total:0,critical:0,medium:0,low:0,sample:[]}
      e.total++; e[r]++; if(e.sample.length<4) e.sample.push(p)
      map.set(s,e)
    }
    const arr=Array.from(map.values()).map(x=>{
      const score=idx(x.total,x.critical,x.medium)
      const b=band(score)
      const needEMS = x.critical>=2 ? 2 : x.critical===1 ? 1 : 0
      const needCooling = (x.critical+x.medium)>=4 ? 2 : (x.critical+x.medium)>=2 ? 1 : 0
      return {...x, score, b, needEMS, needCooling}
    }).sort((a,b)=>a.score-b.score)
    return arr
  },[data])

  const current = pick ? sectors.find(s=>s.sector===pick) ?? sectors[0] : sectors[0]
  const sectorResources = useMemo(()=>{
    if(!current) return []
    return resources.filter(r=>String(r.sector)===String(current.sector))
  },[resources,current])

  return (
    <main>
      <div className="sectionTitle">القطاعات — الجاهزية واحتياج الموارد</div>

      <div className="grid2">
        <div className="card">
          <div className="split">
            <div style={{fontWeight:900}}>قائمة القطاعات</div>
            <span className="badge">الأقل جاهزية أولاً</span>
          </div>

          <div style={{display:"grid",gap:10,marginTop:12}}>
            {sectors.map((s,i)=>(
              <button key={i} className="tile" style={{textAlign:"right",cursor:"pointer",color:"white"}}
                onClick={()=>setPick(s.sector)}>
                <div className="split">
                  <b>{s.sector}</b>
                  <b className={s.b.cls}>{s.score}%</b>
                </div>
                <div style={{opacity:.85,fontSize:12,marginTop:8,lineHeight:1.8}}>
                  حرج <b className="red">{s.critical}</b> — متوسط <b className="amber">{s.medium}</b> — إجمالي {s.total}
                  <br/>
                  احتياج: إسعاف <b>{s.needEMS}</b> — تبريد <b>{s.needCooling}</b>
                </div>
              </button>
            ))}
            {sectors.length===0 && <div style={{opacity:.7}}>لا توجد بيانات.</div>}
          </div>
        </div>

        <div className="card">
          <div className="split">
            <div style={{fontWeight:900}}>تفاصيل القطاع</div>
            {current && <span className={"badge "+current.b.cls}>{current.b.t}</span>}
          </div>

          {!current && <div style={{opacity:.7,marginTop:12}}>اختر قطاعاً.</div>}

          {current && (
            <>
              <div className="grid3" style={{marginTop:12}}>
                <div className="card"><div className="kpiLabel">جاهزية</div><div className={"kpiValue "+current.b.cls}>{current.score}%</div></div>
                <div className="card"><div className="kpiLabel">حرجة</div><div className="kpiValue red">{current.critical}</div></div>
                <div className="card"><div className="kpiLabel">متوسطة</div><div className="kpiValue amber">{current.medium}</div></div>
              </div>

              <div className="sectionTitle">احتياج الموارد (Auto)</div>
              <div className="grid3">
                <div className="tile split"><span style={{opacity:.8}}>فرق إسعاف مطلوبة</span><b>{current.needEMS}</b></div>
                <div className="tile split"><span style={{opacity:.8}}>نقاط تبريد مطلوبة</span><b>{current.needCooling}</b></div>
                <div className="tile split"><span style={{opacity:.8}}>موارد موجودة</span><b>{sectorResources.length}</b></div>
              </div>

              <div className="sectionTitle">الموارد في القطاع</div>
              <div className="card" style={{padding:0}}>
                <table className="table">
                  <thead><tr><th>المعرف</th><th>النوع</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {sectorResources.map((r,i)=>(
                      <tr key={i}><td><b>{r.id}</b></td><td>{r.type}</td><td>{r.status}</td></tr>
                    ))}
                    {sectorResources.length===0 && <tr><td colSpan={3} style={{opacity:.7,padding:14}}>لا توجد موارد مسجلة لهذا القطاع.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="sectionTitle">عينات حالات</div>
              <div style={{display:"grid",gap:10}}>
                {current.sample.map((p,i)=>(
                  <div key={i} className="tile">
                    <div className="split">
                      <b>{p.id ?? "—"}</b>
                      <b className={norm(p.risk_level??p.risk)==="critical"?"red":norm(p.risk_level??p.risk)==="medium"?"amber":"green"}>
                        {p.risk_level ?? "—"}
                      </b>
                    </div>
                    <div style={{opacity:.8,fontSize:13,marginTop:6}}>{p.health_status ?? "—"} — عمر {p.age ?? "—"}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
