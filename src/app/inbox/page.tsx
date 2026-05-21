import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import InboxPageClient from '@/components/InboxPageClient'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <InboxPageClient />
      </main>
    </div>
  )
}
