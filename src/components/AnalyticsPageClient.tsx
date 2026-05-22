'use client'

import { useMemo, useState } from 'react'
import { BATCHES, PLATFORMS } from '@/lib/constants'
import { directionsFromRecords, uniqueDirections } from '@/lib/directions'
import type { Application } from '@/lib/types'
import { useApplications } from '@/hooks/useApplications'
import { useConfig } from '@/hooks/useConfig'

const FUNNEL_STAGES = ['已投递', '笔试', '一面', '二面', '三面', 'HR面', 'Offer']
const DIRECTION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316']
const FUNNEL_COLORS = ['#2563eb', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#f59e0b']

function getReachedStageIndex(app: Application) {
  const statuses = [app.status, ...(app.status_history ?? []).map((item) => item.status)]
  return statuses.reduce((highest, status) => {
    const index = FUNNEL_STAGES.indexOf(status)
    return index > highest ? index : highest
  }, 0)
}

function formatRate(count: number, total: number) {
  if (total === 0) return '0%'
  return `${Math.round((count / total) * 100)}%`
}

function funnelWidth(count: number, total: number) {
  const maxWidth = 620
  const minWidth = count === 0 ? 72 : 130
  return Math.max(minWidth, (count / Math.max(1, total)) * maxWidth)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function getMonthDays(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: days }, (_, index) => new Date(year, month, index + 1))
}

function colorForCount(count: number) {
  if (count === 0) return 'bg-slate-100'
  if (count <= 2) return 'bg-blue-100'
  if (count <= 5) return 'bg-blue-400'
  return 'bg-blue-600'
}

function getGapSummary(days: Date[], appCounts: Map<string, number>) {
  const gaps: string[] = []
  let start: Date | null = null
  let end: Date | null = null

  for (const day of days) {
    if ((appCounts.get(dateKey(day)) ?? 0) === 0) {
      start ??= day
      end = day
    } else if (start && end) {
      if (end.getTime() - start.getTime() >= 2 * 86_400_000) {
        gaps.push(`${start.getDate()}-${end.getDate()}`)
      }
      start = null
      end = null
    }
  }

  if (start && end && end.getTime() - start.getTime() >= 2 * 86_400_000) {
    gaps.push(`${start.getDate()}-${end.getDate()}`)
  }

  return gaps[0] ?? '无明显空窗'
}

export default function AnalyticsPageClient() {
  const { applications, loading, error } = useApplications()
  const { config } = useConfig()
  const [direction, setDirection] = useState('')
  const [batch, setBatch] = useState('')
  const [month, setMonth] = useState(() => new Date())
  const directions = uniqueDirections(config?.directions, directionsFromRecords(applications))

  const filtered = useMemo(() => applications.filter((app) => {
    if (direction && !app.direction.includes(direction)) return false
    if (batch && app.batch !== batch) return false
    return true
  }), [applications, batch, direction])

  const reachedIndexes = filtered.map(getReachedStageIndex)
  const funnel = FUNNEL_STAGES.map((stage, index) => {
    const count = index === 0
      ? filtered.length
      : reachedIndexes.filter((highest) => highest >= index).length
    return { stage, count }
  }).map((item, index, list) => ({
    ...item,
    stepRate: index === 0 ? '100%' : formatRate(item.count, list[index - 1].count),
    totalRate: formatRate(item.count, filtered.length),
  }))
  const maxFunnel = Math.max(1, filtered.length)
  const funnelHeight = FUNNEL_STAGES.length * 78 + 16

  const directionCounts = directions.map((item, index) => ({
    label: item,
    count: filtered.filter((app) => app.direction.includes(item)).length,
    color: DIRECTION_COLORS[index % DIRECTION_COLORS.length],
  })).filter((item) => item.count > 0)
  const directionTotal = Math.max(1, directionCounts.reduce((sum, item) => sum + item.count, 0))
  const conic = directionCounts.map((item, index) => {
    const start = directionCounts
      .slice(0, index)
      .reduce((sum, segment) => sum + (segment.count / directionTotal) * 100, 0)
    const end = start + (item.count / directionTotal) * 100
    return `${item.color} ${start}% ${end}%`
  }).join(', ')

  const platformCounts = PLATFORMS.map((platform) => ({
    platform,
    count: filtered.filter((app) => app.platform === platform).length,
  })).filter((item) => item.count > 0)
  const maxPlatform = Math.max(1, ...platformCounts.map((item) => item.count))

  const days = getMonthDays(month)
  const appCounts = new Map<string, number>()
  const interviewDays = new Set<string>()
  filtered.forEach((app) => {
    if (app.applied_date?.startsWith(monthKey(month))) {
      appCounts.set(app.applied_date, (appCounts.get(app.applied_date) ?? 0) + 1)
    }
    if (app.interview_time) {
      const key = app.interview_time.slice(0, 10)
      if (key.startsWith(monthKey(month))) interviewDays.add(key)
    }
  })
  const activeDays = days.filter((day) => (appCounts.get(dateKey(day)) ?? 0) > 0).length
  const monthApps = days.reduce((sum, day) => sum + (appCounts.get(dateKey(day)) ?? 0), 0)
  const peak = days.reduce((best, day) => {
    const count = appCounts.get(dateKey(day)) ?? 0
    return count > best.count ? { day, count } : best
  }, { day: days[0], count: 0 })

  if (loading) {
    return <div className="rounded-lg border border-slate-100 bg-white p-8 text-sm text-slate-500">数据分析加载中...</div>
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">数据分析</h1>
        <p className="mt-1 text-sm text-slate-500">投递转化、节奏和分布</p>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-100 bg-white p-4 md:grid-cols-2">
        <select value={direction} onChange={(event) => setDirection(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          <option value="">全部方向</option>
          {directions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={batch} onChange={(event) => setBatch(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          <option value="">全部批次</option>
          {BATCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-lg border border-slate-100 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">投递转化漏斗</h2>
            <p className="mt-1 text-xs text-slate-400">已投递按全部记录计算，后续阶段按达到过的最高阶段累计</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-slate-800">{filtered.length}</p>
            <p className="text-xs text-slate-400">筛选后投递数</p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <svg
            viewBox={`0 0 1000 ${funnelHeight}`}
            role="img"
            aria-label="投递转化漏斗"
            className="min-w-[760px] w-full"
          >
            {funnel.map((item, index) => {
              const y = 8 + index * 78
              const centerY = y + 36
              const topWidth = funnelWidth(item.count, maxFunnel)
              const bottomWidth = funnelWidth(funnel[index + 1]?.count ?? item.count, maxFunnel)
              const topLeft = 500 - topWidth / 2
              const topRight = 500 + topWidth / 2
              const bottomLeft = 500 - bottomWidth / 2
              const bottomRight = 500 + bottomWidth / 2

              return (
                <g key={item.stage}>
                  <text x="120" y={centerY + 6} textAnchor="end" className="text-sm font-medium text-slate-500" fill="currentColor">
                    {item.stage}
                  </text>
                  <polygon
                    points={`${topLeft},${y} ${topRight},${y} ${bottomRight},${y + 72} ${bottomLeft},${y + 72}`}
                    fill={FUNNEL_COLORS[index]}
                  />
                  <text x="500" y={centerY + 7} textAnchor="middle" className="text-lg font-semibold" fill="white">
                    {item.count}
                  </text>
                  <text x="850" y={centerY - 2} className="text-base font-semibold text-slate-800" fill="currentColor">
                    {item.stepRate}
                  </text>
                  <text x="850" y={centerY + 20} className="text-xs text-slate-400" fill="currentColor">
                    {index === 0 ? '基准' : '上一阶段'}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {funnel.slice(1).map((item) => (
            <div key={item.stage} className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">{item.stage} / 总转化</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{item.totalRate}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">投递热力图</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600">‹</button>
            <span className="w-24 text-center text-sm font-medium text-slate-700">{monthLabel(month)}</span>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600">›</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-100" />0</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-100" />1-2</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-400" />3-5</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-600" />6+</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />有面试</span>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day} className="text-center text-xs text-slate-400">{day}</span>)}
          {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, index) => <span key={`blank-${index}`} />)}
          {days.map((day) => {
            const key = dateKey(day)
            const count = appCounts.get(key) ?? 0
            return (
              <div key={key} title={`${key}: ${count} apps`} className={`relative aspect-square rounded-md ${colorForCount(count)}`}>
                <span className="absolute bottom-1 left-1 text-[10px] text-slate-500">{day.getDate()}</span>
                {interviewDays.has(key) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />}
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          {monthLabel(month)}: {monthApps} apps / {activeDays} active days / {interviewDays.size} interviews · Peak: {peak.count > 0 ? `${peak.day.getDate()} (${peak.count})` : '无'} · Gap: {getGapSummary(days, appCounts)}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-100 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-800">方向分布</h2>
          {directionCounts.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">暂无方向数据</p>
          ) : (
            <div className="mt-5 grid grid-cols-[160px_1fr] items-center gap-6">
              <div className="h-36 w-36 rounded-full" style={{ background: `conic-gradient(${conic})` }}>
                <div className="m-auto mt-[30px] h-20 w-20 rounded-full bg-white" />
              </div>
              <div className="grid gap-2">
                {directionCounts.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
                    <span className="font-medium text-slate-800">{Math.round((item.count / directionTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-800">平台分布</h2>
          <div className="mt-5 grid gap-3">
            {platformCounts.length === 0 ? (
              <p className="text-sm text-slate-400">暂无平台数据</p>
            ) : platformCounts.map((item) => (
              <div key={item.platform} className="grid grid-cols-[80px_1fr_36px] items-center gap-3 text-sm">
                <span className="text-slate-500">{item.platform}</span>
                <div className="h-7 rounded-md bg-slate-100">
                  <div className="h-7 rounded-md bg-blue-500" style={{ width: `${(item.count / maxPlatform) * 100}%` }} />
                </div>
                <span className="font-semibold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
