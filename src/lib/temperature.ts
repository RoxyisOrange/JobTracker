import type { Application, TemperatureInfo } from './types'
import type { UserConfig } from './types'
import { NUDGE_DEFAULTS, TERMINAL_STATUSES } from './constants'
import { daysSince } from './utils'

export function getTemperature(
  app: Application,
  config?: Pick<UserConfig, 'nudge_applied' | 'nudge_written' | 'nudge_interview'>
): TemperatureInfo {
  const isTerminal = TERMINAL_STATUSES.includes(app.status)

  if (isTerminal) {
    return { level: 'frozen', daysSinceUpdate: 0, label: '已结束' }
  }

  const days = daysSince(app.updated_at)

  const thresholdApplied = config?.nudge_applied ?? NUDGE_DEFAULTS.applied
  const thresholdWritten = config?.nudge_written ?? NUDGE_DEFAULTS.written
  const thresholdInterview = config?.nudge_interview ?? NUDGE_DEFAULTS.interview

  let threshold: number
  if (app.status === '已投递') {
    threshold = thresholdApplied
  } else if (app.status === '笔试') {
    threshold = thresholdWritten
  } else {
    threshold = thresholdInterview
  }

  const ratio = days / threshold

  let level: TemperatureInfo['level']
  if (ratio < 0.5) {
    level = 'hot'
  } else if (ratio < 1) {
    level = 'warm'
  } else {
    level = 'cold'
  }

  return {
    level,
    daysSinceUpdate: days,
    label: days === 0 ? '今天' : `${days}天前`,
  }
}
