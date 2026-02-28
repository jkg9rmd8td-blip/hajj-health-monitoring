"use client"

import { useEffect, useState } from "react"

export default function VisionCommand() {

  const [data, setData] = useState([])
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch("/api/pilgrims")
      .then(res => res.json())
      .then(json => {
        setData(json)
        animateCounter(json.length)
      })
      .catch(() => setData([]))
  }, [])

  const total = data.length
  const critical = data.filter(p => p.risk === "critical").length
  const stability = total ? 100 - Math.round((critical / total) * 100) : 100

  function animateCounter(target) {
    let start = 0
    const interval = setInterval(() => {
      start += Math.ceil(target / 20)
      if (start >= target) {
        start = target
        clearInterval(interval)
      }
      setCount(start)
    }, 30)
  }

  return (
    <main className="min-h-screen p-16 relative">

      {/* Ambient Glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500 opacity-10 blur-[200px] rounded-full"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-20 relative z-10">

        <div>
          <h1 className="text-5xl font-semibold tracking-tight">
            Hajj Vision Command
          </h1>
          <div className="flex items-center gap-3 mt-3 opacity-60">
            <div className="status-orb"></div>
            System Online
          </div>
        </div>

        <div className="deep-glass px-8 py-6 soft-shadow glow float">
          <div className="opacity-60 text-sm">System Stability</div>
          <div className="kpi-number text-blue-400">{stability}%</div>
        </div>

      </div>

      {/* KPI Grid */}
      <div className="grid md:grid-cols-3 gap-12 relative z-10">

        <Card title="Total Pilgrims" value={count} />
        <Card title="Critical Cases" value={critical} highlight />
        <Card title="Monitored" value={total - critical} />

      </div>

      {/* Live Feed */}
      <div className="mt-24 deep-glass p-12 soft-shadow float relative z-10">
        <h2 className="text-2xl mb-8 opacity-70">
          Real-Time Critical Stream
        </h2>

        <div className="space-y-6">
          {data.filter(p => p.risk === "critical").map((p, i) => (
            <div
              key={i}
              className="glass px-8 py-6 flex justify-between items-center float"
            >
              <div>
                <div className="text-lg">{p.name}</div>
                <div className="opacity-50 text-sm">{p.location}</div>
              </div>
              <div className="text-red-400 text-xl font-semibold">
                {p.heartRate} BPM
              </div>
            </div>
          ))}

          {critical === 0 && (
            <div className="opacity-40 text-center py-16">
              All systems stable. No critical cases.
            </div>
          )}
        </div>
      </div>

    </main>
  )
}

function Card({ title, value, highlight }) {
  return (
    <div className="glass p-12 soft-shadow float">
      <div className="opacity-50 mb-3">{title}</div>
      <div className={`kpi-number ${highlight ? "text-red-400" : ""}`}>
        {value}
      </div>
    </div>
  )
}
