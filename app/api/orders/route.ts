import { NextResponse } from 'next/server'

const API = process.env.PANEL_API_URL!
const KEY = process.env.PANEL_SECRET!

export async function GET() {
  const res = await fetch(`${API}/orders?limit=80`, {
    headers: { 'x-api-key': KEY },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data)
}
