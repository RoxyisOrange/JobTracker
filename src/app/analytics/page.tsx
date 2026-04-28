import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">数据分析</h1>
        <p className="text-slate-400 text-sm">投递数据统计与分析，v0.4 实现...</p>
      </main>
    </div>
  )
}
