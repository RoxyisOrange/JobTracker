'use client'

interface BatchBarProps {
  count: number
  onStatus: () => void
  onDelete: () => void
  onCancel: () => void
}

export default function BatchBar({ count, onStatus, onDelete, onCancel }: BatchBarProps) {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-600 px-4 py-3 text-white shadow-sm">
      <span className="text-sm font-medium">已选 {count} 项</span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStatus}
          disabled={count === 0}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          改状态
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={count === 0}
          className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          删除
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
        >
          取消 Esc
        </button>
      </div>
    </div>
  )
}
