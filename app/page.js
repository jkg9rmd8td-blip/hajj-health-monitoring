import KPI from "./components/KPI"
import dynamic from "next/dynamic"

const LiveMap = dynamic(() => import("./components/LiveMap"), {
  ssr: false
})

export default function Dashboard() {
  return (
    <div>
      <h2 className="section-title mb-6">
        National Health Command Overview
      </h2>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <KPI label="Total Pilgrims" value={1845000} color="text-cyan-400" />
        <KPI label="Active Alerts" value={32} color="text-red-400" />
        <KPI label="Critical Cases" value={8} color="text-yellow-400" />
        <KPI label="Medical Teams Active" value={245} color="text-green-400" />
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold text-cyan-400">
          Live Risk Map
        </h3>
        <LiveMap />
      </div>
    </div>
  )
}
