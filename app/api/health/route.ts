import { NextResponse } from "next/server"
import { classifyRisk } from "@/app/core/risk-engine"
import { readData, writeData } from "@/app/core/storage"
import { logEvent } from "@/app/core/logger"

export async function POST(req: Request) {
  const body = await req.json()

  const data = readData()

  const risk = classifyRisk(body)

  const record = {
    id: Date.now(),
    ...body,
    risk,
    timestamp: new Date().toISOString()
  }

  data.push(record)
  writeData(data)

  logEvent({
    type: "HEALTH_UPDATE",
    pilgrim: body.name,
    risk
  })

  return NextResponse.json(record)
}

export async function GET() {
  return NextResponse.json(readData())
}
