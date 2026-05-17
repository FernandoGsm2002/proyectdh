import { NextResponse } from 'next/server'

const API = process.env.PANEL_API_URL
const KEY = process.env.PANEL_SECRET

export async function GET() {
  if (!API || !KEY) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }
  try {
    const res = await fetch(`${API}/status`, {
      headers: { 'x-api-key': KEY },
      cache: 'no-store',
    })
    return NextResponse.json(await res.json())
  } catch (e: unknown) {
    return NextResponse.json({ error: `Cannot reach panel-api: ${e}` }, { status: 500 })
  }
}
