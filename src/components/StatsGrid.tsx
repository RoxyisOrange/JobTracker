'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useApplications } from '@/hooks/useApplications'
import { useConfig } from '@/hooks/useConfig'
import { useResumes } from '@/hooks/useResumes'
import { ACTIVE_STATUSES } from '@/lib/constants'
import { getTemperature } from '@/lib/temperature'
import { formatDateTime } from '@/lib/utils'

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function isSameDate(dateStr: string) {
  const today = startOfToday()
  const date = new Date(`${dateStr}T00:00:00`)
  return date.getTime() === today.getTime()
}

function inLast7Days(dateStr: string) {
  const today = startOfToday()
  const date = new Date(`${dateStr}T00:00:00`)
  const diff = today.getTime() - date.getTime()
  return diff >= 0 && diff <= 6 * 86_400_000
}

function inNext72Hours(dateStr: string | null) {
  if (!dateStr) return false
  const time = new Date(dateStr).getTime()
  const now = Date.now()
  return time >= now && time <= now + 72 * 3_600_000
}

export default function StatsGrid() {
  const router = useRouter()
  const { applications, loading: appLoading } = useApplications()
  const { resumes, loading: resumeLoading } = useResumes()
  const { config, loading: configLoading } = useConfig()
  const loading = appLoading || resumeLoading || configLoading

  const nudgeConfig = useMemo(() => (
    config
      ? {
          nudge_applied: config.nudge_applied,
          nudge_written: config.nudge_written,
          nudge_interview: config.nudge_interview,
        }
      : undefined
  ), [config])

  const upcomingInterviews = useMemo(
    () =>
      applications
        .filter((app) => inNext72Hours(app.interview_time))
        .sort((a, b) => new Date(a.interview_time ?? '').getTime() - new Date(b.interview_time ?? '').getTime()),
    [applications]
  )

  const stats = [
    { label: '总投递', value: applications.length },
    {
      label: '进行中（笔/面试）',
      value: applications.filter((app) => ACTIVE_STATUSES.includes(app.status)).length,
      href: '/pipeline?filter=active',
    },
    {
      label: '沉寂岗位',
      value: applications.filter((app) => getTemperature(app, nudgeConfig).level === 'stale').length,
      href: '/pipeline?filter=stale',
    },
    { label: '今日投递', value: applications.filter((app) => isSameDate(app.applied_date)).length },
    {
      label: '近3天面试',
      value: upcomingInterviews.length,
      href: '/pipeline?filter=interviews',
    },
    { label: '已挂', value: applications.filter((app) => app.status === '已挂').length },
    { label: '近7天投递', value: applications.filter((app) => inLast7Days(app.applied_date)).length },
    {
      label: 'Offer',
      value: applications.filter((app) => app.status === 'Offer').length,
      href: '/pipeline?filter=offer',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-slate-100 bg-white" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, href }) => (
          <button
            key={label}
            type="button"
            onClick={() => href && router.push(href)}
            className={`rounded-lg border border-slate-100 bg-white p-5 text-left transition ${
              href ? 'hover:border-blue-200 hover:shadow-sm' : 'cursor-default'
            }`}
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-800">{value}</p>
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">未来3天面试</h2>
        </div>
        {upcomingInterviews.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-400">暂无未来3天面试</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingInterviews.map((app) => {
              const resume = resumes.find((item) => item.id === app.resume_id)
              return (
                <button
                  type="button"
                  key={app.id}
                  onClick={() => router.push('/pipeline?filter=interviews')}
                  className="grid w-full grid-cols-[160px_1fr_140px_180px] gap-4 px-5 py-4 text-left text-sm hover:bg-blue-50/40"
                >
                  <span className="font-medium text-amber-600">{formatDateTime(app.interview_time)}</span>
                  <span className="text-slate-800">{app.company} - {app.position}</span>
                  <span className="text-slate-500">{app.status}</span>
                  <span className="text-slate-500">{resume?.name ?? '未关联简历'}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
