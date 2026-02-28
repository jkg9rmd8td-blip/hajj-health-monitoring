export const metadata = {
  title: "Hajj National Health Command Center",
  description: "Real-time Pilgrim Health Monitoring System"
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen">
          
          {/* Sidebar */}
          <aside className="w-64 bg-[#111827] border-r border-gray-800 p-6">
            <h1 className="text-xl font-bold text-cyan-400 mb-8">
              HAJJ COMMAND
            </h1>

            <nav className="flex flex-col gap-4 text-sm">
              <a href="/" className="hover:text-cyan-400">Dashboard</a>
              <a href="/executive">Executive</a>
              <a href="/national">National</a>
              <a href="/operations">Operations</a>
              <a href="/analytics">Analytics</a>
              <a href="/alerts">Alerts</a>
              <a href="/ai-ops">AI Ops</a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto bg-[#0b1220]">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
