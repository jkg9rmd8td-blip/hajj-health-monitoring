export const metadata = {
  title: "Hajj National Health Command Center",
  description: "Real-time Pilgrim Health Monitoring"
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-[#0b1220] via-[#0f1b2e] to-[#0a1628] text-white">
        <div className="flex h-screen">

          {/* Sidebar */}
          <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-cyan-900/30 p-6">
            <h1 className="text-xl font-bold text-cyan-400 mb-10 tracking-wider">
              HAJJ COMMAND
            </h1>

            <nav className="flex flex-col gap-4 text-sm">
              <a href="/" className="hover:text-cyan-400 transition">Dashboard</a>
              <a href="/executive" className="hover:text-cyan-400 transition">Executive</a>
              <a href="/national" className="hover:text-cyan-400 transition">National</a>
              <a href="/operations" className="hover:text-cyan-400 transition">Operations</a>
              <a href="/analytics" className="hover:text-cyan-400 transition">Analytics</a>
              <a href="/alerts" className="hover:text-cyan-400 transition">Alerts</a>
              <a href="/ai-ops" className="hover:text-cyan-400 transition">AI Ops</a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto relative">

            {/* Live Status Bar */}
            <div className="absolute top-6 right-8 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm text-green-400 font-medium">
                System Operational
              </span>
            </div>

            {children}
          </main>

        </div>
      </body>
    </html>
  )
}
