export default function Dashboard() {
  return (
    <div>
      <h2 className="section-title mb-6">
        National Health Overview
      </h2>

      <div className="grid grid-cols-4 gap-6">

        <div className="card">
          <p className="text-sm text-gray-400">Total Pilgrims</p>
          <h3 className="text-3xl font-bold mt-2">1,845,000</h3>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400">Active Alerts</p>
          <h3 className="text-3xl font-bold text-red-400 mt-2">32</h3>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400">Critical Cases</p>
          <h3 className="text-3xl font-bold text-yellow-400 mt-2">8</h3>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400">System Status</p>
          <h3 className="text-3xl font-bold text-green-400 mt-2">
            Operational
          </h3>
        </div>

      </div>
    </div>
  )
}
