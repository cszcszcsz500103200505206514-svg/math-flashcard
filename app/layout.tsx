import type { Metadata, Viewport } from 'next'
import './globals.css'
import SWRegister from './components/SWRegister'

export const metadata: Metadata = {
  title: '数学闪卡 - 题型复习',
  description: '考研数学题型间隔重复复习工具',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '数学闪卡',
  },
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4F46E5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-slate-50">
        {children}
        <SWRegister />
      </body>
    </html>
  )
}
