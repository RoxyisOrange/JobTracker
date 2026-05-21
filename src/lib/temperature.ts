import type { Application, TemperatureInfo, UserConfig } from './types'
import { NUDGE_DEFAULTS, TERMINAL_STATUSES } from './constants'

const INTERVIEW_STATUSES = ['一面', '二面', '三面', 'HR面']

function daysBetween(from: Date, to = new Date()) {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000))
}

function hoursUntil(dateStr: string | null | undefined) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target.getTime() - Date.now()) / 3_600_000)
}

function lastStatusDate(app: Application) {
  if (app.status === '已投递') return app.applied_date

  const history = app.status_history ?? []
  const sameStatusHistory = history.filter((item) => item.status === app.status)
  return sameStatusHistory.at(-1)?.date ?? history.at(-1)?.date ?? app.updated_at
}

function baseInfo(partial: Omit<TemperatureInfo, 'daysSinceUpdate'> & { daysSinceUpdate?: number }): TemperatureInfo {
  return {
    daysSinceUpdate: partial.daysSinceUpdate ?? 0,
    ...partial,
  }
}

export function getTemperature(
  app: Application,
  config?: Pick<UserConfig, 'nudge_applied' | 'nudge_written' | 'nudge_interview'>
): TemperatureInfo {
  if (app.status === 'Offer') {
    return baseInfo({
      level: 'success',
      label: 'Offer',
      dotClass: 'bg-emerald-500',
      borderClass: 'border-l-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-700',
      faded: false,
    })
  }

  if (TERMINAL_STATUSES.includes(app.status)) {
    return baseInfo({
      level: 'terminal',
      label: '已结束',
      dotClass: 'bg-gray-400',
      borderClass: 'border-l-gray-300',
      badgeClass: 'bg-gray-100 text-gray-500',
      faded: true,
    })
  }

  const dueHours = hoursUntil(app.interview_time)
  if (
    INTERVIEW_STATUSES.includes(app.status) &&
    dueHours !== null &&
    dueHours >= 0 &&
    dueHours <= 24
  ) {
    return baseInfo({
      level: 'urgent',
      label: `${Math.max(dueHours, 1)}h`,
      dotClass: 'bg-red-500',
      borderClass: 'border-l-red-500',
      badgeClass: 'bg-red-50 text-red-700',
      faded: false,
    })
  }

  const baseDate = new Date(lastStatusDate(app))
  const days = Number.isNaN(baseDate.getTime()) ? 0 : daysBetween(baseDate)
  const threshold =
    app.status === '已投递'
      ? config?.nudge_applied ?? NUDGE_DEFAULTS.applied
      : app.status === '笔试'
        ? config?.nudge_written ?? NUDGE_DEFAULTS.written
        : config?.nudge_interview ?? NUDGE_DEFAULTS.interview

  if (days > threshold) {
    return baseInfo({
      level: 'stale',
      daysSinceUpdate: days,
      label: `${days}d`,
      dotClass: 'bg-gray-400',
      borderClass: 'border-l-gray-300',
      badgeClass: 'bg-gray-100 text-gray-500',
      faded: true,
    })
  }

  return baseInfo({
    level: 'normal',
    daysSinceUpdate: days,
    label: '',
    dotClass: 'bg-blue-500',
    borderClass: 'border-l-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700',
    faded: false,
  })
}
