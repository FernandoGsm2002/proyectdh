import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LeoPe-Gsm Panel',
  description: 'Panel de administracion LeoPe-Gsm',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#080808] text-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
