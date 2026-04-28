'use client'

import { useApplications } from '@/hooks/useApplications'
import { useInbox } from '@/hooks/useInbox'
import { ACTIVE_STATUSES } from '@/lib/constants'

export default function StatsGrid() {
  const { applications, loading: appLoading } = useApplications()
  const { items: inboxItems, loading: inboxLoading } = useInbox()

  const loading = appLoading || inboxLoading

  const total = applications.length
  const active = applications.filter((a) => ACTIVE_STATUSES.includes(a.status)).length
  const interviews = applications.filter((a) =>
    ['一面', '二面', '三面', 'HR面'].includes(a.status)
  ).length
  const offers = applications.filter((a) => a.status === 'offer').length
  const inbox = inboxItems.filter((i) => i.status === 'collected').length

  const stats = [
    { label: '总投递数', value: total, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '进行中', value: active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '面试中', value: interviews, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Offer', value: offers, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '收集池待处理', value: inbox, color: 'text-slate-600', bg: 'bg-slate-50' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map(({ label, value, color, bg }) => (
        <div key={label} className="bg-white rounded-xl p-5 border border-slate-100">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} mb-3`}>
            <span className={`text-xl font-bold ${color}`}>{value}</span>
          </div>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  )
}
