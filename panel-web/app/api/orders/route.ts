import { NextResponse } from 'next/server'

const API = process.env.PANEL_API_URL
const KEY = process.env.PANEL_SECRET

export async function GET() {
  if (!API || !KEY) {
    return NextResponse.json(
      { error: `Missing env vars: PANEL_API_URL=${API} PANEL_SECRET=${KEY ? 'set' : 'missing'}` },
      { status: 500 }
    )
  }
  try {
    const res = await fetch(`${API}/orders?limit=80`, {
      headers: { 'x-api-key': KEY },
      cache: 'no-store',
    })
    return NextResponse.json(await res.json())
  } catch (e: unknown) {
    return NextResponse.json({ error: `Cannot reach panel-api at ${API}: ${e}` }, { status: 500 })
  }
}
