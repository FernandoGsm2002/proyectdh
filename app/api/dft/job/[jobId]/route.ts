import { NextRequest, NextResponse } from 'next/server'

const API = process.env.PANEL_API_URL
const KEY = process.env.PANEL_SECRET

// GET /api/dft/job/[jobId]
export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  if (!API || !KEY) return NextResponse.json({ error: 'Missing env' }, { status: 500 })
  try {
    const res = await fetch(`${API}/dft/job/${params.jobId}`, {
      headers: { 'x-api-key': KEY },
      cache: 'no-store',
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e: unknown) {
    return NextResponse.json({ error: `Cannot reach panel-api: ${e}` }, { status: 502 })
  }
}
