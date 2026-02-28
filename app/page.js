"use client"

import { useEffect, useState } from "react"

export default function CommandCenter() {

  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims")
      .then(res => res.json())
      .then(setData)
      .catch(() => setData([]))
  }, [])

  const total = data.length
  const critical = data.filter(p => p.risk === "critical").length
  const stability = total ? 100 - Math.round((critical / total) * 100) : 100

  return (
    <main className="min-h-screen p-12">

      {/* Header */}
      <div className="flex justify-between items-center mb-16">
        <h1 className="title-hero">
          Hajj Health Command Center
        </h1>

        <div className="glass px-6 py-3 soft-shadow smooth">
          <span className="text-sm opacity-70">System Stability</span>
          <div className="kpi-value">{stability}%</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid md:grid-cols-3 gap-10">

        <GlassCard title="Total Pilgrims" value={total} />
        <GlassCard title="Critical Cases" value={critical} highlight />
        <GlassCard title="Active Monitoring" value={total - critical} />

      </div>

      {/* Live Section */}
      <div className="mt-20 glass p-10 soft-shadow smooth">
        <h2 className="text-xl mb-6 opacity-80">
          Live Critical Feed
        </h2>

        <div className="space-y-4">
          {data.filter(p => p.risk === "critical").map((p, i) => (
            <div
              key={i}
              className="flex justify-between items-center glass px-6 py-4 smooth hover:scale-[1.01]"
            >
              <span>{p.name}</span>
              <span className="opacity-60">{p.location}</span>
              <span className="text-red-400 font-semibold">
                {p.heartRate} BPM
              </span>
            </div>
          ))}

          {critical === 0 && (
            <div className="opacity-50 text-center py-10">
              All systems stable.
            </div>
          )}
        </div>
      </div>

    </main>
  )
}

function GlassCard({ title, value, highlight }) {
  return (
    <div className={`glass p-10 soft-shadow smooth hover:scale-[1.02]`}>
      <div className="opacity-60 mb-2">{title}</div>
      <div className={`kpi-value ${highlight ? "text-red-400" : ""}`}>
        {value}
      </div>
    </div>
  )
}
