'use client'

import TemperatureDot from '@/components/TemperatureDot'
import { APPLICATION_STATUSES, STATUS_COLORS } from '@/lib/constants'
import { getTemperature } from '@/lib/temperature'
import type { Application, UserConfig } from '@/lib/types'
import { cn, formatDate, formatDateTime } from '@/lib/utils'

interface PipelineKanbanProps {
  applications: Application[]
  config?: Pick<UserConfig, 'nudge_applied' | 'nudge_written' | 'nudge_interview'>
  onStatusChange: (id: string, status: string) => void
  onEdit: (application: Application) => void
}

export default function PipelineKanban({
  applications,
  config,
  onStatusChange,
  onEdit,
}: PipelineKanbanProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {APPLICATION_STATUSES.map((status) => {
        const columnApps = applications.filter((app) => app.status === status)

        return (
          <section
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const id = event.dataTransfer.getData('text/application-id')
              if (id) onStatusChange(id, status)
            }}
            className="min-w-[180px] flex-1 basis-[200px] rounded-lg border border-slate-100 bg-white"
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
              <span className={cn('rounded-full px-2 py-1 text-xs font-medium', STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600')}>
                {status}
              </span>
              <span className="text-xs text-slate-400">{columnApps.length}</span>
            </header>
            <div className="grid max-h-[60vh] gap-2 overflow-auto p-2">
              {columnApps.map((application) => {
                const temperature = getTemperature(application, config)

                return (
                  <article
                    key={application.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/application-id', application.id)
                    }}
                    onDoubleClick={() => onEdit(application)}
                    className={cn(
                      'cursor-grab rounded-lg border border-slate-100 border-l-4 bg-white p-3 shadow-sm transition hover:border-blue-100',
                      temperature.borderClass,
                      temperature.faded && 'opacity-55'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{application.company}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{application.position}</p>
                      </div>
                      <TemperatureDot temperature={temperature} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {application.direction.slice(0, 2).map((direction) => (
                        <span key={direction} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                          {direction}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {formatDate(application.applied_date)}
                      {application.interview_time ? ` · ${formatDateTime(application.interview_time)}` : ''}
                    </p>
                    {(application.review_link || application.review_markdown) && (
                      <button
                        type="button"
                        className="mt-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                      >
                        复盘笔记
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
