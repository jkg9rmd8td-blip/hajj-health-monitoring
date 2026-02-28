import fs from "fs"
import path from "path"

const filePath = path.join(process.cwd(), "app/data.json")

export function readData() {
  const raw = fs.readFileSync(filePath)
  return JSON.parse(raw)
}

export function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}
