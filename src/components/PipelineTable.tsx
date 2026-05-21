'use client'

import TemperatureDot from '@/components/TemperatureDot'
import { STATUS_COLORS } from '@/lib/constants'
import { getTemperature } from '@/lib/temperature'
import type { Application, UserConfig } from '@/lib/types'
import { cn, formatDate, formatDateTime, truncate } from '@/lib/utils'

interface PipelineTableProps {
  applications: Application[]
  loading?: boolean
  batchMode?: boolean
  selectedIds?: string[]
  config?: Pick<UserConfig, 'nudge_applied' | 'nudge_written' | 'nudge_interview'>
  onToggleSelected?: (id: string) => void
  onToggleAll?: () => void
  onEdit: (application: Application) => void
  onDelete: (application: Application) => void
}

export default function PipelineTable({
  applications,
  loading = false,
  batchMode = false,
  selectedIds = [],
  config,
  onToggleSelected,
  onToggleAll,
  onEdit,
  onDelete,
}: PipelineTableProps) {
  const allSelected = applications.length > 0 && applications.every((app) => selectedIds.includes(app.id))

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-lg border border-slate-100 bg-white" />
        ))}
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500">
        暂无投递记录
      </div>
    )
  }

  return (
    <div className="max-h-[calc(100vh-240px)] overflow-auto rounded-lg border border-slate-100 bg-white">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            {batchMode && (
              <th className="w-10 border-b border-slate-100 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            <th className="border-b border-slate-100 px-4 py-3">温度</th>
            <th className="border-b border-slate-100 px-4 py-3">公司/岗位</th>
            <th className="border-b border-slate-100 px-4 py-3">方向</th>
            <th className="border-b border-slate-100 px-4 py-3">状态</th>
            <th className="border-b border-slate-100 px-4 py-3">批次/平台</th>
            <th className="border-b border-slate-100 px-4 py-3">投递/面试</th>
            <th className="border-b border-slate-100 px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const temperature = getTemperature(application, config)
            const selected = selectedIds.includes(application.id)

            return (
              <tr
                key={application.id}
                className={cn(
                  'border-l-4 align-top transition-colors hover:bg-blue-50/30',
                  temperature.borderClass,
                  temperature.faded && 'opacity-55',
                  selected && 'bg-blue-50'
                )}
              >
                {batchMode && (
                  <td className="border-b border-slate-100 px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelected?.(application.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                <td className="border-b border-slate-100 px-4 py-4">
                  <TemperatureDot temperature={temperature} />
                </td>
                <td className="border-b border-slate-100 px-4 py-4">
                  <p className="font-semibold text-slate-800">{application.company}</p>
                  <p className="mt-1 text-slate-500">{application.position}</p>
                  {application.note && (
                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                      {truncate(application.note, 72)}
                    </p>
                  )}
                </td>
                <td className="border-b border-slate-100 px-4 py-4">
                  <div className="flex max-w-56 flex-wrap gap-1.5">
                    {application.direction.map((direction) => (
                      <span key={direction} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        {direction}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="border-b border-slate-100 px-4 py-4">
                  <span className={cn('rounded-full px-2 py-1 text-xs font-medium', STATUS_COLORS[application.status] ?? 'bg-slate-100 text-slate-600')}>
                    {application.status}
                  </span>
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                  <p>{application.batch}</p>
                  <p className="mt-1 text-xs text-slate-400">{application.platform}</p>
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                  <p>{formatDate(application.applied_date)}</p>
                  {application.interview_time && (
                    <p className="mt-1 text-xs text-amber-600">{formatDateTime(application.interview_time)}</p>
                  )}
                </td>
                <td className="border-b border-slate-100 px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(application)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(application)}
                      className="rounded-lg border border-red-100 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
