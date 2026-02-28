"use client"

import { useEffect, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts"

export default function HomePage() {

  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/pilgrims")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  const total = data.length
  const critical = data.filter(p => p.risk === "critical").length
  const medium = data.filter(p => p.risk === "medium").length
  const low = data.filter(p => p.risk === "low").length

  const riskPercent = total ? Math.round((critical / total) * 100) : 0

  const chartData = [
    { name: "حرج", value: critical },
    { name: "متوسط", value: medium },
    { name: "منخفض", value: low }
  ]

  const COLORS = ["#ef4444", "#f59e0b", "#22c55e"]

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <h1 className="text-4xl font-bold mb-10">
        لوحة مراقبة صحة الحجاج
      </h1>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <KpiCard title="إجمالي الحالات" value={total} />
        <KpiCard title="حالات حرجة" value={critical} color="text-red-500" />
        <KpiCard title="حالات متوسطة" value={medium} color="text-yellow-400" />
        <KpiCard title="حالات منخفضة" value={low} color="text-green-500" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-10">

        <div className="bg-zinc-900 p-6 rounded-2xl">
          <h2 className="mb-4 text-xl font-semibold">توزيع مستويات الخطورة</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                outerRadius={120}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl">
          <h2 className="mb-4 text-xl font-semibold">نسبة الخطر العام</h2>
          <div className="text-6xl font-bold text-red-500 mb-4">
            {riskPercent}%
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-4">
            <div
              className="bg-red-500 h-4 rounded-full transition-all"
              style={{ width: `${riskPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* Critical Table */}
      <div className="mt-16">
        <h2 className="text-2xl mb-6 font-semibold">
          الحالات الحرجة
        </h2>

        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-zinc-800 text-gray-300">
              <tr>
                <th className="p-4">الاسم</th>
                <th className="p-4">العمر</th>
                <th className="p-4">الموقع</th>
                <th className="p-4">النبض</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(p => p.risk === "critical").map((p, i) => (
                <tr key={i} className="border-t border-zinc-800">
                  <td className="p-4">{p.name}</td>
                  <td className="p-4">{p.age}</td>
                  <td className="p-4">{p.location}</td>
                  <td className="p-4 text-red-500 font-bold">{p.heartRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  )
}

function KpiCard({ title, value, color = "text-white" }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg">
      <div className="text-gray-400 text-sm mb-2">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
