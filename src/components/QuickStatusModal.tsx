'use client'

import BatchStatusPicker from '@/components/BatchStatusPicker'

interface QuickStatusModalProps {
  title?: string
  onPick: (status: string) => void
  onClose: () => void
}

export default function QuickStatusModal({
  title = '选择状态',
  onPick,
  onClose,
}: QuickStatusModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="关闭"
            title="关闭"
          >
            ×
          </button>
        </div>
        <BatchStatusPicker onPick={onPick} />
      </div>
    </div>
  )
}
