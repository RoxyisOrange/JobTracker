import type { Application, TemperatureInfo } from './types'
import type { UserConfig } from './types'
import { ACTIVE_STATUSES, NUDGE_DEFAULTS } from './constants'
import { daysSince } from './utils'

export function getTemperature(
  app: Application,
  config?: Pick<UserConfig, 'nudge_applied' | 'nudge_written' | 'nudge_interview'>
): TemperatureInfo {
  const nudge = config ?? NUDGE_DEFAULTS
  const isTerminal = !ACTIVE_STATUSES.includes(app.status)

  if (isTerminal) {
    return { level: 'frozen', daysSinceUpdate: 0, label: '已结束' }
  }

  const days = daysSince(app.updated_at)

  let threshold: number
  if (app.status === '已投递') {
    threshold = (nudge as any).nudge_applied
  } else if (app.status === '笔试') {
    threshold = (nudge as any).nudge_written
  } else {
    threshold = (nudge as any).nudge_interview
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
