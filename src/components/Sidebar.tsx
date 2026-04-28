'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: '数据看板', icon: '📊' },
  { href: '/inbox', label: '收集池', icon: '📥' },
  { href: '/pipeline', label: '投递管道', icon: '🚀' },
  { href: '/resume', label: '简历管理', icon: '📄' },
  { href: '/settings', label: '设置', icon: '⚙️' },
  { href: '/analytics', label: '数据分析', icon: '📈' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-100 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-slate-100">
        <span className="text-base font-bold text-slate-800">投递追踪器</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <span className="text-base leading-none">🚪</span>
          退出登录
        </button>
      </div>
    </aside>
  )
}
