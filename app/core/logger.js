import fs from "fs"
import path from "path"

const logPath = path.join(process.cwd(), "app/events.json")

export function logEvent(event) {
  const raw = fs.readFileSync(logPath)
  const logs = JSON.parse(raw)

  logs.push({
    ...event,
    timestamp: new Date().toISOString()
  })

  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2))
}
