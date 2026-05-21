'use client'

import { APPLICATION_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface BatchStatusPickerProps {
  onPick: (status: string) => void
}

export default function BatchStatusPicker({ onPick }: BatchStatusPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {APPLICATION_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onPick(status)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            status === '已挂'
              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
          )}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
