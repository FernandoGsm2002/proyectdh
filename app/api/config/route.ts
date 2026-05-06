import { NextRequest, NextResponse } from 'next/server'

const API = process.env.PANEL_API_URL!
const KEY = process.env.PANEL_SECRET!

function headers() {
  return { 'x-api-key': KEY, 'Content-Type': 'application/json' }
}

export async function GET() {
  const res = await fetch(`${API}/config`, { headers: headers(), cache: 'no-store' })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${API}/config`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data)
}
