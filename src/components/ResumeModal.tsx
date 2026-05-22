'use client'

import type { FormEvent } from 'react'
import { useRef, useState } from 'react'
import type { Resume } from '@/lib/types'
import { cn, fileSizeLabel } from '@/lib/utils'
import type { ResumeInput } from '@/hooks/useResumes'

interface ResumeModalProps {
  resume?: Resume | null
  directions?: readonly string[]
  onClose: () => void
  onSave: (input: ResumeInput) => Promise<void> | void
}

export default function ResumeModal({
  resume,
  directions = [],
  onClose,
  onSave,
}: ResumeModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(resume?.name ?? '')
  const [selectedDirections, setSelectedDirections] = useState<string[]>(resume?.direction ?? [])
  const [note, setNote] = useState(resume?.note ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const toggleDirection = (direction: string) => {
    setSelectedDirections((current) =>
      current.includes(direction)
        ? current.filter((item) => item !== direction)
        : [...current, direction]
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      window.alert('请填写简历名称')
      return
    }

    setSaving(true)
    await onSave({
      name: name.trim(),
      direction: selectedDirections,
      note: note.trim(),
      file,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{resume ? '编辑简历' : '新增简历'}</h2>
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

        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-5 px-6 py-5">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">简历名称</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">对应方向</span>
            <div className="flex flex-wrap gap-2">
              {directions.map((direction) => {
                const active = selectedDirections.includes(direction)
                return (
                  <button
                    key={direction}
                    type="button"
                    onClick={() => toggleDirection(direction)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600'
                    )}
                  >
                    {direction}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const nextFile = event.dataTransfer.files[0]
              if (nextFile?.type === 'application/pdf') setFile(nextFile)
            }}
            className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-left hover:border-blue-300 hover:bg-blue-50/40"
          >
            <p className="text-sm font-medium text-slate-700">上传 PDF</p>
            <p className="mt-1 text-xs text-slate-400">
              {file
                ? `${file.name} · ${fileSizeLabel(file.size)}`
                : resume?.file_name
                  ? `已上传：${resume.file_name} · ${fileSizeLabel(resume.file_size)}`
                  : '点击或拖拽 PDF 到这里'}
            </p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">备注</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="-mx-6 flex justify-end gap-3 border-t border-slate-100 px-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
