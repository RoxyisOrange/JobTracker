'use client'

import { useState } from 'react'
import TemperatureDot from '@/components/TemperatureDot'
import { STATUS_COLORS } from '@/lib/constants'
import { getTemperature } from '@/lib/temperature'
import type { Application, UserConfig } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'

interface PipelineCompanyViewProps {
  applications: Application[]
  config?: Pick<UserConfig, 'nudge_applied' | 'nudge_written' | 'nudge_interview'>
  onEdit: (application: Application) => void
}

export default function PipelineCompanyView({ applications, config, onEdit }: PipelineCompanyViewProps) {
  const [collapsed, setCollapsed] = useState<string[]>([])
  const groups = Array.from(
    applications.reduce((map, app) => {
      const list = map.get(app.company) ?? []
      list.push(app)
      map.set(app.company, list)
      return map
    }, new Map<string, Application[]>())
  ).sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500">
        暂无投递记录
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {groups.map(([company, apps]) => {
        const isCollapsed = collapsed.includes(company)

        return (
          <section key={company} className="rounded-lg border border-slate-100 bg-white">
            <button
              type="button"
              onClick={() => setCollapsed((current) =>
                current.includes(company)
                  ? current.filter((item) => item !== company)
                  : [...current, company]
              )}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-semibold text-slate-800">{company}</span>
              <span className="text-sm text-slate-400">{apps.length} 个岗位 {isCollapsed ? '+' : '-'}</span>
            </button>
            {!isCollapsed && (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {apps.map((application) => {
                  const temperature = getTemperature(application, config)

                  return (
                    <button
                      type="button"
                      key={application.id}
                      onClick={() => onEdit(application)}
                      className={cn(
                        'flex w-full items-center justify-between gap-4 border-l-4 px-4 py-3 text-left hover:bg-blue-50/40',
                        temperature.borderClass,
                        temperature.faded && 'opacity-55'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">{application.position}</p>
                        <p className="mt-1 text-xs text-slate-400">{application.platform} · {application.batch} · {formatDate(application.applied_date)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={cn('rounded-full px-2 py-1 text-xs font-medium', STATUS_COLORS[application.status] ?? 'bg-slate-100 text-slate-600')}>
                          {application.status}
                        </span>
                        <TemperatureDot temperature={temperature} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
