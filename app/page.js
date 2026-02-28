"use client"

import { useEffect, useState } from "react"

export default function CommandCenter() {

  const [data, setData] = useState([])
  const [alert, setAlert] = useState(false)

  const fetchData = async () => {
    try {
      const res = await fetch("/api/pilgrims")
      const json = await res.json()
      setData(json)

      const criticalCases = json.filter(p => p.risk === "critical")
      if (criticalCases.length > 5) {
        setAlert(true)
        playAlarm()
      } else {
        setAlert(false)
      }

    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const total = data.length
  const critical = data.filter(p => p.risk === "critical").length
  const avgTemp = total
    ? (data.reduce((sum, p) => sum + p.temperature, 0) / total).toFixed(1)
    : 0

  const stabilityIndex = total
    ? 100 - Math.round((critical / total) * 100)
    : 100

  function playAlarm() {
    const audio = new Audio("/alarm.mp3")
    audio.play()
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">
          🚨 غرفة عمليات الحج الذكية
        </h1>

        <div className="flex gap-6 text-sm">
          <span>إجمالي الحجاج: {total}</span>
          <span>متوسط الحرارة: {avgTemp}°</span>
          <span className="text-green-400">
            استقرار النظام: {stabilityIndex}%
          </span>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className="bg-red-600 text-center py-4 rounded-xl mb-8 animate-pulse">
          ⚠ ارتفاع عدد الحالات الحرجة – يلزم تدخل فوري
        </div>
      )}

      {/* Grid */}
      <div className="grid md:grid-cols-3 gap-6">

        <Card title="حالات حرجة" value={critical} color="text-red-500" />
        <Card title="إجهاد حراري متوقع" value={`${Math.round(critical * 1.3)}`} color="text-orange-400" />
        <Card title="معدل نبض مرتفع" value={data.filter(p => p.heartRate > 110).length} color="text-yellow-400" />

      </div>

      {/* Critical Live Feed */}
      <div className="mt-12">
        <h2 className="text-xl mb-4">البث الحي للحالات الحرجة</h2>

        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-zinc-800">
              <tr>
                <th className="p-3">الاسم</th>
                <th className="p-3">الموقع</th>
                <th className="p-3">الحرارة</th>
                <th className="p-3">النبض</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(p => p.risk === "critical").map((p, i) => (
                <tr key={i} className="border-t border-zinc-800">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.location}</td>
                  <td className="p-3 text-orange-400">{p.temperature}°</td>
                  <td className="p-3 text-red-500 font-bold">{p.heartRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  )
}

function Card({ title, value, color }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg">
      <div className="text-gray-400 mb-2">{title}</div>
      <div className={`text-4xl font-bold ${color}`}>
        {value}
      </div>
    </div>
  )
}
