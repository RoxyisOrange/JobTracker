import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '投递追踪器',
  description: '求职投递追踪与管理',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
