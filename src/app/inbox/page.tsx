import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">收集池</h1>
        <p className="text-slate-400 text-sm">投递机会收集区域，即将实现...</p>
      </main>
    </div>
  )
}
