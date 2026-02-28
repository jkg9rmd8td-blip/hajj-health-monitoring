import { NextResponse } from "next/server"

let healthRecords: any[] = []

export async function GET() {
  return NextResponse.json(healthRecords)
}

export async function POST(req: Request) {
  const body = await req.json()

  const record = {
    id: Date.now(),
    name: body.name,
    heartRate: body.heartRate,
    temperature: body.temperature,
    status:
      body.heartRate > 120 || body.temperature > 39
        ? "critical"
        : "normal",
    timestamp: new Date()
  }

  healthRecords.push(record)

  return NextResponse.json(record)
}
