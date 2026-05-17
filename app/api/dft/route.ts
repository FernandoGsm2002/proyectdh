import { NextRequest, NextResponse } from 'next/server'

const API = process.env.PANEL_API_URL
const KEY = process.env.PANEL_SECRET

function err(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

// POST /api/dft  { action: 'preview'|'run', texto: string }
export async function POST(req: NextRequest) {
  if (!API || !KEY) return err('Missing env vars PANEL_API_URL / PANEL_SECRET')
  try {
    const body = await req.json()
    const action = body.action ?? 'run' // 'preview' | 'run'
    const endpoint = action === 'preview' ? `${API}/dft/preview` : `${API}/dft/run`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: body.texto }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: unknown) {
    return err(`Cannot reach panel-api: ${e}`)
  }
}
