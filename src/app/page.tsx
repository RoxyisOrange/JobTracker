import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import StatsGrid from '@/components/StatsGrid'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">数据看板</h1>
        <StatsGrid />
      </main>
    </div>
  )
}
