'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomField {
  fieldname: string
  description: string
  required: number
}

interface Service {
  name: string
  group: string | null
  info: string
  time: string
  credit: number
  qnt?: number
  custom_fields: CustomField[]
}

interface ServicesData {
  imei: Record<string, Service>
  server: Record<string, Service>
}

interface WhatsAppSettings {
  provider: string
  evolution_url: string
  evolution_api_key: string
  instance_name: string
  default_group_jid: string
}

interface Order {
  id: string
  imei?: string
  service?: string
  status: number
  status_label: string
  created_at: number
  custom_fields?: Record<string, string>
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-2xl text-sm font-medium transition-all
      ${type === 'ok' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
      {type === 'ok' ? '✅' : '❌'} {msg}
    </div>
  )
}

// ─── Service Form Modal ───────────────────────────────────────────────────────

function ServiceModal({
  sid, service, onSave, onClose,
}: {
  sid: string
  service: Service | null
  onSave: (sid: string, s: Service) => void
  onClose: () => void
}) {
  const blank: Service = { name: '', group: '', info: '', time: '1-24 Hours', credit: 0, custom_fields: [] }
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">{sid === '__new__' ? 'Nuevo Servicio' : `Editando #${sid}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {sid === '__new__' && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">ID del servicio (ej: 314)</label>
            <input value={newId} onChange={e => setNewId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
              placeholder="314" />
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Nombre</label>
          <input value={form.name} onChange={e => setField('name', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm" />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Grupo WhatsApp destino</label>
          <input value={form.group ?? ''} onChange={e => setField('group', e.target.value || null)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            placeholder="Nombre exacto del grupo" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Info / descripción</label>
            <input value={form.info} onChange={e => setField('info', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tiempo estimado</label>
            <input value={form.time} onChange={e => setField('time', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">Campos personalizados</label>
            <button onClick={addCf} className="text-xs text-blue-400 hover:text-blue-300">+ Agregar campo</button>
          </div>
          {form.custom_fields.map((cf, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 mb-2 space-y-2">
              <div className="flex gap-2">
                <input value={cf.fieldname} onChange={e => updateCf(i, 'fieldname', e.target.value)}
                  placeholder="Nombre del campo (ej: IP)"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-xs" />
                <select value={cf.required} onChange={e => updateCf(i, 'required', Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-xs">
                  <option value={1}>Requerido</option>
                  <option value={0}>Opcional</option>
                </select>
                <button onClick={() => removeCf(i)} className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
              </div>
              <input value={cf.description} onChange={e => updateCf(i, 'description', e.target.value)}
                placeholder="Descripción (ej: TeamViewer ID)"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-xs" />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">
            Cancelar
          </button>
          <button onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold">
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
    sid.includes(filter) || s.name.toLowerCase().includes(filter.toLowerCase()) ||
    (s.group ?? '').toLowerCase().includes(filter.toLowerCase())
  )

  async function handleSave(sid: string, svc: Service) {
    const updated = { ...services, [sid]: svc }
    await onSave(updated)
    setEditing(null)
  }

  async function handleDelete(sid: string) {
    if (!confirm(`¿Eliminar servicio #${sid}?`)) return
    const updated = { ...services }
    delete updated[sid]
    await onSave(updated)
  }

  return (
    <div>
      {editing && (
        <ServiceModal
          sid={editing.sid}
          service={editing.svc}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="flex gap-3 mb-4">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar por ID, nombre o grupo..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500"
        />
        <button
          onClick={() => setEditing({ sid: '__new__', svc: null })}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
        >
          + Nuevo servicio
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-400 text-left">
              <th className="px-4 py-3 font-medium w-16">ID</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Grupo WhatsApp</th>
              <th className="px-4 py-3 font-medium w-16 text-center">Campos</th>
              <th className="px-4 py-3 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.sort(([a], [b]) => Number(a) - Number(b)).map(([sid, s]) => (
              <tr key={sid} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono font-bold">{sid}</td>
                <td className="px-4 py-3 text-white">{s.name}</td>
                <td className="px-4 py-3">
                  {s.group
                    ? <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded text-xs border border-blue-800">{s.group}</span>
                    : <span className="text-gray-600 text-xs italic">sin grupo</span>}
                </td>
                <td className="px-4 py-3 text-center text-gray-400">{s.custom_fields.length}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditing({ sid, svc: s })}
                      className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-900/30"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(sid)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/30"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay servicios</div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">{Object.keys(services).length} servicios totales</p>
    </div>
  )
}

// ─── Config Tab ───────────────────────────────────────────────────────────────

function ConfigTab({ config, onSave }: { config: WhatsAppSettings; onSave: (c: WhatsAppSettings) => Promise<void> }) {
  const [form, setForm] = useState<WhatsAppSettings>({ ...config })

  useEffect(() => { setForm({ ...config }) }, [config])

  function set(k: keyof WhatsAppSettings, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  return (
    <div className="max-w-lg space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">WhatsApp Settings</h3>

      {([
        ['provider', 'Provider', 'ej: evolution_api'],
        ['evolution_url', 'Evolution URL', 'ej: http://evolution-api:8080'],
        ['evolution_api_key', 'API Key Evolution', ''],
        ['instance_name', 'Nombre de instancia', 'ej: leo-bot'],
        ['default_group_jid', 'Grupo JID por defecto', '120363...@g.us'],
      ] as [keyof WhatsAppSettings, string, string][]).map(([k, label, ph]) => (
        <div key={k}>
          <label className="text-xs text-gray-400 mb-1 block">{label}</label>
          <input
            value={form[k] ?? ''}
            onChange={e => set(k, e.target.value)}
            placeholder={ph}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      ))}

      <button
        onClick={() => onSave(form)}
        className="bg-green-700 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold mt-2"
      >
        Guardar configuración
      </button>
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders }: { orders: Order[] }) {
  const statusColor: Record<number, string> = {
    2: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
    3: 'bg-red-900/40 text-red-300 border-red-800',
    4: 'bg-green-900/40 text-green-300 border-green-800',
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">Ref ID</th>
              <th className="px-4 py-3 font-medium">Servicio</th>
              <th className="px-4 py-3 font-medium">IMEI</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Hora</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 font-mono text-gray-400 text-xs">{o.id}</td>
                <td className="px-4 py-3 text-white">{o.service ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-300">{o.imei ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusColor[o.status] ?? 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                    {o.status_label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {o.created_at ? new Date(o.created_at * 1000).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay pedidos registrados</div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">{orders.length} pedidos más recientes</p>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type Tab = 'imei' | 'server' | 'config' | 'orders'

export default function Dashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('imei')
  const [services, setServices] = useState<ServicesData>({ imei: {}, server: {} })
  const [config, setConfig] = useState<WhatsAppSettings>({
    provider: '', evolution_url: '', evolution_api_key: '', instance_name: '', default_group_jid: '',
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
      if (sRes.status === 401 || cRes.status === 401) {
        router.push('/')
        return
      }
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
      if (res.ok) {
        setServices(body)
        showToast('Servicios guardados', 'ok')
      } else {
        showToast('Error al guardar', 'err')
      }
    } catch {
      showToast('Error de conexión', 'err')
    }
  }

  async function saveConfig(ws: WhatsAppSettings) {
    const body = { ...config, whatsapp_settings: ws }
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setConfig(ws)
        showToast('Configuración guardada', 'ok')
      } else {
        showToast('Error al guardar', 'err')
      }
    } catch {
      showToast('Error de conexión', 'err')
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'imei',   label: 'IMEI Services',   count: Object.keys(services.imei).length },
    { id: 'server', label: 'Server Services',  count: Object.keys(services.server).length },
    { id: 'config', label: 'WhatsApp Config' },
    { id: 'orders', label: 'Pedidos',          count: orders.length },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <h1 className="font-bold text-white leading-none">LeoPe-Gsm Panel</h1>
            <p className="text-xs text-gray-500 mt-0.5">Gestión de servicios</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadAll}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ↻ Recargar
          </button>
          <button
            onClick={() => { localStorage.removeItem('panel_key'); router.push('/') }}
            className="text-sm text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
                ${tab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full
                  ${tab === t.id ? 'bg-blue-900 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-pulse">⚙️</div>
              <p>Cargando...</p>
            </div>
          </div>
        ) : (
          <>
            {tab === 'imei' && (
              <ServicesTab
                type="imei"
                services={services.imei}
                onSave={updated => saveServices('imei', updated)}
              />
            )}
            {tab === 'server' && (
              <ServicesTab
                type="server"
                services={services.server}
                onSave={updated => saveServices('server', updated)}
              />
            )}
            {tab === 'config' && (
              <ConfigTab config={config} onSave={saveConfig} />
            )}
            {tab === 'orders' && (
              <OrdersTab orders={orders} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
