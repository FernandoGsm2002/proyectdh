import { NextRequest, NextResponse } from 'next/server'

const API = process.env.PANEL_API_URL
const KEY = process.env.PANEL_SECRET

function err(msg: string) {
  return NextResponse.json({ error: msg }, { status: 500 })
}

export async function GET() {
  if (!API || !KEY) return err(`Missing env vars: PANEL_API_URL=${API} PANEL_SECRET=${KEY ? 'set' : 'missing'}`)
  try {
    const res = await fetch(`${API}/services`, {
      headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    return NextResponse.json(await res.json())
  } catch (e: unknown) {
    return err(`Cannot reach panel-api at ${API}: ${e}`)
  }
}

export async function PUT(req: NextRequest) {
  if (!API || !KEY) return err(`Missing env vars`)
  try {
    const body = await req.json()
    const res = await fetch(`${API}/services`, {
      method: 'PUT',
      headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await res.json())
  } catch (e: unknown) {
    return err(`Cannot reach panel-api: ${e}`)
  }
}
