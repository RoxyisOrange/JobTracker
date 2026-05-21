'use client'

import type { InboxItem } from '@/lib/types'
import { cn, formatDate, truncate } from '@/lib/utils'

interface InboxListProps {
  items: InboxItem[]
  loading?: boolean
  batchMode?: boolean
  selectedIds?: string[]
  onToggleSelected?: (id: string) => void
  onEdit: (item: InboxItem) => void
  onConvert: (item: InboxItem) => void
  onArchive: (item: InboxItem) => void
  onDelete: (item: InboxItem) => void
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  collected: { label: '待投递', className: 'bg-blue-50 text-blue-700' },
  applied: { label: '已投递', className: 'bg-emerald-50 text-emerald-700' },
  archived: { label: '已归档', className: 'bg-slate-100 text-slate-500' },
}

export default function InboxList({
  items,
  loading = false,
  batchMode = false,
  selectedIds = [],
  onToggleSelected,
  onEdit,
  onConvert,
  onArchive,
  onDelete,
}: InboxListProps) {
  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg border border-slate-100 bg-white" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <p className="text-sm font-medium text-slate-500">暂无收集记录</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const status = STATUS_META[item.status] ?? STATUS_META.collected
        const checked = selectedIds.includes(item.id)
        const primaryNote = item.raw_note || item.note

        return (
          <article
            key={item.id}
            className={cn(
              'rounded-lg border bg-white p-4 transition-colors',
              checked ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-100 hover:border-blue-100',
              item.status === 'archived' && 'opacity-70'
            )}
          >
            <div className="flex gap-3">
              {batchMode && (
                <label className="pt-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSelected?.(item.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-slate-800">
                    {item.company || '未填写公司'}
                  </h3>
                  {item.position && (
                    <span className="truncate text-sm text-slate-500">{item.position}</span>
                  )}
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.className)}>
                    {status.label}
                  </span>
                  {item.source && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {item.source}
                    </span>
                  )}
                  {item.batch && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {item.batch}
                    </span>
                  )}
                </div>

                {item.direction.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.direction.map((direction) => (
                      <span
                        key={direction}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {direction}
                      </span>
                    ))}
                  </div>
                )}

                {primaryNote && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {truncate(primaryNote, 180)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                  <span>{formatDate(item.created_at)}</span>
                  {item.link && (
                    <a
                      href={item.link.startsWith('http') ? item.link : undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="max-w-xs truncate text-blue-600 hover:text-blue-700"
                    >
                      {truncate(item.link, 72)}
                    </a>
                  )}
                </div>
              </div>

              {!batchMode && (
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onConvert(item)}
                    disabled={item.status === 'applied'}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200"
                  >
                    去投递
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchive(item)}
                    disabled={item.status === 'archived'}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    归档
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-lg border border-red-100 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
