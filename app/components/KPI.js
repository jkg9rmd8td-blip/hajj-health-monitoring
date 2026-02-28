"use client"

import { useEffect, useState } from "react"

export default function KPI({ label, value, color }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 1000
    const step = value / (duration / 16)

    const counter = setInterval(() => {
      start += step
      if (start >= value) {
        setCount(value)
        clearInterval(counter)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(counter)
  }, [value])

  return (
    <div className="card">
      <p className="text-gray-400 text-sm">{label}</p>
      <h3 className={`text-3xl font-bold mt-2 ${color}`}>
        {count.toLocaleString()}
      </h3>
    </div>
  )
}
