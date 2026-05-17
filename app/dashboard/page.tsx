'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomField {
  fieldname: string
  description: string
  required: number
}

interface Service {
  name: string
  group: string | null
  credit: number
  qnt?: number
  custom_fields: CustomField[]
}

interface ServicesData {
  imei: Record<string, Service>
  server: Record<string, Service>
}

interface WhatsAppSettings {
  service_url: string
  phone: string
  default_group_jid: string
  admin_phones: string
}

interface ServiceStatus {
  name: string
  online: boolean
  ms?: number
  error?: string
  status_code?: number
}

interface Order {
  id: string
  imei?: string
  service?: string
  status: number
  status_label: string
  created_at: number
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-medium shadow-2xl border
      ${type === 'ok'
        ? 'bg-[#0f1a0f] border-[#1a3a1a] text-green-400'
        : 'bg-[#1a0f0f] border-[#3a1a1a] text-red-400'}`}>
      {msg}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function ServiceModal({
  sid, service, onSave, onClose,
}: {
  sid: string
  service: Service | null
  onSave: (sid: string, s: Service) => void
  onClose: () => void
}) {
  const blank: Service = { name: '', group: '', credit: 0, custom_fields: [] }
  const [form, setForm] = useState<Service>(service ? { ...service } : blank)
  const [newId, setNewId] = useState(sid === '__new__' ? '' : sid)

  function setField(k: keyof Service, v: unknown) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function updateCf(i: number, k: keyof CustomField, v: string | number) {
    const cfs = [...form.custom_fields]
    cfs[i] = { ...cfs[i], [k]: v }
    setField('custom_fields', cfs)
  }

  function addCf() {
    setField('custom_fields', [...form.custom_fields, { fieldname: '', description: '', required: 1 }])
  }

  function removeCf(i: number) {
    setField('custom_fields', form.custom_fields.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    const id = sid === '__new__' ? newId.trim() : sid
    if (!id || !form.name.trim()) return
    onSave(id, form)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {sid === '__new__' ? 'Nuevo servicio' : `Servicio #${sid}`}
            </h2>
            <p className="text-xs text-[#444] mt-0.5">
              {sid === '__new__' ? 'Completa los datos del servicio' : 'Editar datos del servicio'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#444] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1a1a1a]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {sid === '__new__' && (
            <div>
              <label className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">ID del servicio</label>
              <input value={newId} onChange={e => setNewId(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#222] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#333]"
                placeholder="ej: 314" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">Nombre</label>
            <input value={form.name} onChange={e => setField('name', e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#222] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#333]"
              placeholder="Nombre del servicio" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">Grupo WhatsApp</label>
            <input value={form.group ?? ''} onChange={e => setField('group', e.target.value || null)}
              className="w-full bg-[#0d0d0d] border border-[#222] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#333]"
              placeholder="Nombre exacto del grupo" />
          </div>

          {/* Custom fields */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-medium text-[#555] uppercase tracking-wider">Campos del formulario</label>
              <button onClick={addCf}
                className="text-xs text-white bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] px-3 py-1.5 rounded-lg transition-colors">
                + Agregar campo
              </button>
            </div>
            <div className="space-y-2">
              {form.custom_fields.map((cf, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={cf.fieldname} onChange={e => updateCf(i, 'fieldname', e.target.value)}
                      placeholder="Nombre del campo"
                      className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-xs placeholder-[#333] focus:outline-none" />
                    <select value={cf.required} onChange={e => updateCf(i, 'required', Number(e.target.value))}
                      className="bg-[#111] border border-[#222] rounded-lg px-2 py-2 text-white text-xs focus:outline-none">
                      <option value={1}>Requerido</option>
                      <option value={0}>Opcional</option>
                    </select>
                    <button onClick={() => removeCf(i)}
                      className="text-[#444] hover:text-red-400 transition-colors px-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                  <input value={cf.description} onChange={e => updateCf(i, 'description', e.target.value)}
                    placeholder="Descripcion para el usuario"
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-xs placeholder-[#333] focus:outline-none" />
                </div>
              ))}
              {form.custom_fields.length === 0 && (
                <p className="text-xs text-[#333] py-2">Sin campos adicionales</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-5 border-t border-[#1a1a1a]">
          <button onClick={onClose}
            className="flex-1 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-[#888] hover:text-white py-2.5 rounded-xl text-sm transition-all">
            Cancelar
          </button>
          <button onClick={handleSave}
            className="flex-1 bg-white hover:bg-gray-100 text-black py-2.5 rounded-xl text-sm font-semibold transition-all">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Services Tab ─────────────────────────────────────────────────────────────

function ServicesTab({
  type, services, onSave,
}: {
  type: 'imei' | 'server'
  services: Record<string, Service>
  onSave: (updated: Record<string, Service>) => Promise<void>
}) {
  const [editing, setEditing] = useState<{ sid: string; svc: Service | null } | null>(null)
  const [filter, setFilter] = useState('')

  const filtered = Object.entries(services).filter(([sid, s]) =>
    sid.includes(filter) ||
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    (s.group ?? '').toLowerCase().includes(filter.toLowerCase())
  )

  async function handleSave(sid: string, svc: Service) {
    const updated = { ...services, [sid]: svc }
    await onSave(updated)
    setEditing(null)
  }

  async function handleDelete(sid: string) {
    if (!confirm(`Eliminar servicio #${sid}?`)) return
    const updated = { ...services }
    delete updated[sid]
    await onSave(updated)
  }

  return (
    <div>
      {editing && (
        <ServiceModal sid={editing.sid} service={editing.svc} onSave={handleSave} onClose={() => setEditing(null)} />
      )}

      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#333]" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Buscar por ID, nombre o grupo..."
            className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#2a2a2a] transition-colors"
          />
        </div>
        <button
          onClick={() => setEditing({ sid: '__new__', svc: null })}
          className="bg-white hover:bg-gray-100 text-black text-sm font-semibold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          + Nuevo
        </button>
      </div>

      <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0f0f0f] border-b border-[#1a1a1a]">
              <th className="px-5 py-3.5 text-left text-xs font-medium text-[#444] uppercase tracking-wider w-16">ID</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-[#444] uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-[#444] uppercase tracking-wider">Grupo WhatsApp</th>
              <th className="px-5 py-3.5 text-center text-xs font-medium text-[#444] uppercase tracking-wider w-20">Campos</th>
              <th className="px-5 py-3.5 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111]">
            {filtered
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([sid, s]) => (
                <tr key={sid} className="hover:bg-[#0f0f0f] transition-colors group">
                  <td className="px-5 py-4 font-mono text-xs text-[#555] font-bold">{sid}</td>
                  <td className="px-5 py-4 text-[#ccc] text-sm font-medium">{s.name}</td>
                  <td className="px-5 py-4">
                    {s.group
                      ? <span className="text-xs text-[#888] bg-[#111] border border-[#1e1e1e] px-2.5 py-1 rounded-lg">{s.group}</span>
                      : <span className="text-xs text-[#2a2a2a]">—</span>}
                  </td>
                  <td className="px-5 py-4 text-center text-xs text-[#444]">
                    {s.custom_fields.length > 0 ? s.custom_fields.length : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing({ sid, svc: s })}
                        className="text-xs text-[#888] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(sid)}
                        className="text-xs text-[#444] hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-all"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#2a2a2a] text-sm">
            {filter ? 'Sin resultados' : 'Sin servicios registrados'}
          </div>
        )}
      </div>

      <p className="text-xs text-[#2a2a2a] mt-3">{Object.keys(services).length} servicios</p>
    </div>
  )
}

// ─── Config Tab ───────────────────────────────────────────────────────────────

function ConfigTab({ config, onSave }: { config: WhatsAppSettings; onSave: (c: WhatsAppSettings) => Promise<void> }) {
  const [form, setForm] = useState<WhatsAppSettings>({ ...config })
  useEffect(() => { setForm({ ...config }) }, [config])

  const fields: [keyof WhatsAppSettings, string, string][] = [
    ['service_url',      'URL del bot',          'http://whatsapp-bot:3001'],
    ['phone',            'Numero de telefono',    '+16088955372'],
    ['default_group_jid','Grupo JID por defecto', '120363...@g.us'],
    ['admin_phones',     'Admins (separados por coma)', '51932504098,573001234567'],
  ]

  return (
    <div className="max-w-md">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#1a1a1a]">
          <h3 className="text-sm font-semibold text-white">WhatsApp</h3>
          <p className="text-xs text-[#444] mt-0.5">Configuracion del cliente Selenium</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {fields.map(([k, label, ph]) => (
            <div key={k}>
              <label className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">{label}</label>
              <input
                value={form[k] ?? ''}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                placeholder={ph}
                className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#2a2a2a] focus:outline-none focus:border-[#2e2e2e] transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="px-6 py-5 border-t border-[#1a1a1a]">
          <button
            onClick={() => onSave(form)}
            className="bg-white hover:bg-gray-100 text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status Tab ──────────────────────────────────────────────────────────────

function StatusTab() {
  const [data, setData] = useState<Record<string, ServiceStatus> | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  async function check() {
    setLoading(true)
    try {
      const res = await fetch('/api/status')
      setData(await res.json())
      setLastCheck(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { check() }, [])

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Estado de servicios</h3>
          {lastCheck && (
            <p className="text-xs text-[#333] mt-0.5">
              Ultima verificacion: {lastCheck.toLocaleTimeString('es-CO', { hour12: false })}
            </p>
          )}
        </div>
        <button
          onClick={check}
          disabled={loading}
          className="text-xs text-[#555] hover:text-[#888] border border-[#1a1a1a] hover:border-[#2a2a2a] px-3 py-2 rounded-lg transition-all disabled:opacity-40 flex items-center gap-1.5"
        >
          <svg className={loading ? 'animate-spin' : ''} width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M10.5 1.5v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Verificar
        </button>
      </div>

      <div className="space-y-2">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl px-5 py-4 animate-pulse">
              <div className="h-3 bg-[#1a1a1a] rounded w-32" />
            </div>
          ))
        ) : data && Object.values(data).map((svc) => (
          <div
            key={svc.name}
            className={`border rounded-xl px-5 py-4 flex items-center justify-between transition-colors
              ${svc.online ? 'bg-[#0a110a] border-[#1a2e1a]' : 'bg-[#110a0a] border-[#2e1a1a]'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${svc.online ? 'bg-green-500' : 'bg-red-500'}`}
                style={svc.online ? { boxShadow: '0 0 6px #22c55e' } : { boxShadow: '0 0 6px #ef4444' }}
              />
              <div>
                <p className="text-sm font-medium text-[#ccc]">{svc.name}</p>
                {!svc.online && svc.error && (
                  <p className="text-xs text-[#444] mt-0.5 font-mono">{svc.error}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-semibold ${svc.online ? 'text-green-500' : 'text-red-400'}`}>
                {svc.online ? 'Online' : 'Offline'}
              </span>
              {svc.online && svc.ms !== undefined && (
                <p className="text-xs text-[#333] font-mono mt-0.5">{svc.ms}ms</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders }: { orders: Order[] }) {
  const badge: Record<number, string> = {
    2: 'text-yellow-500 bg-yellow-500/8 border-yellow-500/20',
    3: 'text-red-400 bg-red-500/8 border-red-500/20',
    4: 'text-green-400 bg-green-500/8 border-green-500/20',
  }

  return (
    <div>
      <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0f0f0f] border-b border-[#1a1a1a]">
              <th className="px-5 py-3.5 text-left text-xs font-medium text-[#444] uppercase tracking-wider">Ref</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-[#444] uppercase tracking-wider">Servicio</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-[#444] uppercase tracking-wider">IMEI</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-[#444] uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-[#444] uppercase tracking-wider">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0f0f0f]">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-[#0f0f0f] transition-colors">
                <td className="px-5 py-4 font-mono text-xs text-[#444]">{o.id}</td>
                <td className="px-5 py-4 text-[#ccc] text-sm">{o.service ?? '—'}</td>
                <td className="px-5 py-4 font-mono text-xs text-[#666]">{o.imei ?? '—'}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${badge[o.status] ?? 'text-[#444] bg-[#111] border-[#1a1a1a]'}`}>
                    {o.status_label}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-[#444]">
                  {o.created_at
                    ? new Date(o.created_at * 1000).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour12: false })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-12 text-[#2a2a2a] text-sm">Sin pedidos registrados</div>
        )}
      </div>
      <p className="text-xs text-[#2a2a2a] mt-3">{orders.length} pedidos recientes</p>
    </div>
  )
}

// ─── DFT Tab ──────────────────────────────────────────────────────────────────

type DftJobStatus = 'idle' | 'previewing' | 'ready' | 'running' | 'done' | 'error'

interface DftCuenta { username: string; email: string }
interface DftDetail { username: string; status: 'ok' | 'warning' | 'error'; msg?: string }
interface DftJob {
  id: string
  status: string
  total: number
  started_at: string
  finished_at: string | null
  result: { ok: number; err: number; detalles: DftDetail[] } | null
}

function DftTab() {
  const [texto, setTexto] = useState('')
  const [phase, setPhase] = useState<DftJobStatus>('idle')
  const [preview, setPreview] = useState<DftCuenta[]>([])
  const [job, setJob] = useState<DftJob | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  async function handlePreview() {
    if (!texto.trim()) return
    setPhase('previewing')
    setErrMsg('')
    try {
      const res = await fetch('/api/dft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', texto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? data.detail ?? 'Error desconocido')
      setPreview(data.cuentas ?? [])
      setPhase('ready')
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : 'Error')
      setPhase('error')
    }
  }

  async function handleRun() {
    setPhase('running')
    setErrMsg('')
    setJob(null)
    try {
      const res = await fetch('/api/dft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', texto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? data.detail ?? 'Error desconocido')
      const jobId = data.job_id
      // Poll every 5s
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/dft/job/${jobId}`, { cache: 'no-store' })
          const j: DftJob = await r.json()
          setJob(j)
          if (j.status === 'done' || j.status === 'error') {
            stopPoll()
            setPhase(j.status === 'done' ? 'done' : 'error')
          }
        } catch { /* keep polling */ }
      }, 5000)
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : 'Error')
      setPhase('error')
    }
  }

  function reset() {
    stopPoll()
    setTexto('')
    setPreview([])
    setJob(null)
    setErrMsg('')
    setPhase('idle')
  }

  const statusIcon: Record<string, string> = { ok: '✅', warning: '⚠️', error: '❌' }

  return (
    <div className="max-w-2xl space-y-5">

      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-white">DFTPro — Cambio de contraseñas</h3>
        <p className="text-xs text-[#444] mt-0.5">Pega el texto con las cuentas en formato DFTPro. El parser detectará username y email automáticamente.</p>
      </div>

      {/* Textarea — solo visible en idle/ready */}
      {(phase === 'idle' || phase === 'ready' || phase === 'previewing') && (
        <div>
          <label className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">Texto de cuentas</label>
          <textarea
            id="dft-texto"
            value={texto}
            onChange={e => { setTexto(e.target.value); if (phase === 'ready') setPhase('idle') }}
            placeholder={`DFT\nusername=>MiUser password=>1234\nemail=>user@mail.com\n\nDFT\nusername=>OtroUser ...`}
            rows={10}
            className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-3 text-white text-xs font-mono placeholder-[#2a2a2a] focus:outline-none focus:border-[#2e2e2e] transition-colors resize-y"
          />
          <p className="text-xs text-[#2a2a2a] mt-1.5">El texto puede incluir passwords, fechas y emojis — solo se extraen username y email.</p>
        </div>
      )}

      {/* Preview list */}
      {phase === 'ready' && preview.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#555] uppercase tracking-wider">
              {preview.length} cuenta{preview.length !== 1 ? 's' : ''} detectadas
            </p>
            <span className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">Listo para ejecutar</span>
          </div>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0f0f0f] border-b border-[#1a1a1a]">
                  <th className="px-4 py-2.5 text-left text-[#444] font-medium">#</th>
                  <th className="px-4 py-2.5 text-left text-[#444] font-medium">Username</th>
                  <th className="px-4 py-2.5 text-left text-[#444] font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111]">
                {preview.map((c, i) => (
                  <tr key={i} className="hover:bg-[#111] transition-colors">
                    <td className="px-4 py-2.5 text-[#333] font-mono">{i + 1}</td>
                    <td className="px-4 py-2.5 text-[#ccc] font-mono">{c.username}</td>
                    <td className="px-4 py-2.5 text-[#666] font-mono">{c.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Job progress */}
      {(phase === 'running' || phase === 'done') && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {phase === 'running' && (
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" style={{ boxShadow: '0 0 8px #eab308' }} />
              )}
              {phase === 'done' && (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 8px #22c55e' }} />
              )}
              <span className="text-sm font-medium text-white">
                {phase === 'running' ? 'Procesando...' : 'Completado'}
              </span>
            </div>
            {job && (
              <span className="text-xs text-[#444] font-mono">job: {job.id}</span>
            )}
          </div>

          {phase === 'running' && !job && (
            <div className="px-5 py-8 text-center">
              <div className="w-5 h-5 border border-[#333] border-t-[#666] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#444]">Esperando confirmación del servidor...</p>
            </div>
          )}

          {job?.result && (
            <div className="px-5 py-4 space-y-4">
              {/* Summary */}
              <div className="flex gap-3">
                <div className="flex-1 bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{job.result.ok}</p>
                  <p className="text-xs text-[#444] mt-0.5">Exitosas</p>
                </div>
                <div className="flex-1 bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{job.result.err}</p>
                  <p className="text-xs text-[#444] mt-0.5">Errores</p>
                </div>
              </div>
              {/* Detail rows */}
              {job.result.detalles.length > 0 && (
                <div className="space-y-1">
                  {job.result.detalles.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#111]">
                      <span className="font-mono text-[#888]">{d.username}</span>
                      <span>{statusIcon[d.status] ?? '?'} {d.msg ? <span className="text-[#444]">{d.msg.slice(0, 60)}</span> : null}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {phase === 'error' && errMsg && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-5 py-4">
          <p className="text-xs text-red-400">{errMsg}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {phase === 'idle' && (
          <button
            id="dft-preview-btn"
            onClick={handlePreview}
            disabled={!texto.trim()}
            className="bg-white hover:bg-gray-100 text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Verificar cuentas
          </button>
        )}
        {phase === 'ready' && (
          <>
            <button
              id="dft-run-btn"
              onClick={handleRun}
              className="bg-white hover:bg-gray-100 text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              Ejecutar ({preview.length})
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="text-sm text-[#555] hover:text-[#888] border border-[#1a1a1a] hover:border-[#2a2a2a] px-4 py-2.5 rounded-xl transition-all"
            >
              Editar texto
            </button>
          </>
        )}
        {phase === 'running' && (
          <button disabled className="text-sm text-[#444] border border-[#1a1a1a] px-5 py-2.5 rounded-xl opacity-50 cursor-not-allowed flex items-center gap-2">
            <div className="w-3 h-3 border border-[#444] border-t-[#888] rounded-full animate-spin" />
            Ejecutando...
          </button>
        )}
        {(phase === 'done' || phase === 'error') && (
          <button
            id="dft-reset-btn"
            onClick={reset}
            className="bg-white hover:bg-gray-100 text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
          >
            Nueva ejecución
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type Tab = 'imei' | 'server' | 'config' | 'status' | 'orders' | 'dft'

export default function Dashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('imei')
  const [services, setServices] = useState<ServicesData>({ imei: {}, server: {} })
  const [config, setConfig] = useState<WhatsAppSettings>({
    service_url: '', phone: '', default_group_jid: '', admin_phones: '',
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [loading, setLoading] = useState(true)

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, cRes, oRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/config'),
        fetch('/api/orders'),
      ])
      if (sRes.status === 401 || cRes.status === 401) { router.push('/'); return }
      const [s, c, o] = await Promise.all([sRes.json(), cRes.json(), oRes.json()])
      setServices(s)
      setConfig(c?.whatsapp_settings ?? c)
      setOrders(Array.isArray(o) ? o : [])
    } catch {
      showToast('Error cargando datos', 'err')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadAll() }, [loadAll])

  async function saveServices(type: 'imei' | 'server', updated: Record<string, Service>) {
    const body = { ...services, [type]: updated }
    try {
      const res = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { setServices(body); showToast('Cambios guardados', 'ok') }
      else showToast('Error al guardar', 'err')
    } catch { showToast('Error de conexion', 'err') }
  }

  async function saveConfig(ws: WhatsAppSettings) {
    const body = { ...config, whatsapp_settings: ws }
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { setConfig(ws); showToast('Configuracion guardada', 'ok') }
      else showToast('Error al guardar', 'err')
    } catch { showToast('Error de conexion', 'err') }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'imei',   label: 'IMEI',    count: Object.keys(services.imei).length },
    { id: 'server', label: 'Server',  count: Object.keys(services.server).length },
    { id: 'config', label: 'WhatsApp' },
    { id: 'status', label: 'Servidores' },
    { id: 'orders', label: 'Pedidos', count: orders.length },
    { id: 'dft',    label: 'DFT Pro' },
  ]

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#141414] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="LeoPe-Gsm" width={100} height={36} className="object-contain" />
          <div className="w-px h-5 bg-[#1a1a1a]" />
          <span className="text-xs text-[#333] font-medium tracking-wider uppercase">Powered by Torocell</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="text-xs text-[#444] hover:text-[#888] px-3 py-2 rounded-lg hover:bg-[#111] transition-all flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M10.5 1.5v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Actualizar
          </button>
          <button
            onClick={() => { localStorage.removeItem('panel_key'); router.push('/') }}
            className="text-xs text-[#333] hover:text-[#888] px-3 py-2 rounded-lg hover:bg-[#111] transition-all"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[#111] px-6 shrink-0">
        <div className="flex">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px
                ${tab === t.id
                  ? 'border-white text-white'
                  : 'border-transparent text-[#444] hover:text-[#777]'}`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono
                  ${tab === t.id ? 'text-[#888] bg-[#1a1a1a]' : 'text-[#333] bg-[#111]'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-[#333]">
              <div className="w-4 h-4 border border-[#333] border-t-[#666] rounded-full animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          </div>
        ) : (
          <>
            {tab === 'imei'   && <ServicesTab type="imei"   services={services.imei}   onSave={u => saveServices('imei', u)} />}
            {tab === 'server' && <ServicesTab type="server" services={services.server} onSave={u => saveServices('server', u)} />}
            {tab === 'config' && <ConfigTab config={config} onSave={saveConfig} />}
            {tab === 'status' && <StatusTab />}
            {tab === 'orders' && <OrdersTab orders={orders} />}
            {tab === 'dft'    && <DftTab />}
          </>
        )}
      </main>
    </div>
  )
}
