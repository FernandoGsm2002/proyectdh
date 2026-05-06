'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        localStorage.setItem('panel_key', password)
        router.push('/dashboard')
      } else {
        setError('Credenciales incorrectas')
      }
    } catch {
      setError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808]">
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-sm px-4">
        {/* Card */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="LeoPe-Gsm"
              width={140}
              height={60}
              className="object-contain"
              priority
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Contrasena de acceso"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#333] transition-colors"
              autoFocus
              required
            />

            {error && (
              <p className="text-red-400 text-xs font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-all duration-150"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>

          <p className="text-center text-[#333] text-xs mt-6 font-medium tracking-wider uppercase">
            Powered by Torocell
          </p>
        </div>
      </div>
    </div>
  )
}
