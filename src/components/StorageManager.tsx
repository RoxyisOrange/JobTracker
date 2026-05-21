'use client'

import type { Resume } from '@/lib/types'
import { fileSizeLabel } from '@/lib/utils'

interface StorageManagerProps {
  resumes: Resume[]
  onClearPdf: (resume: Resume) => void
}

export default function StorageManager({ resumes, onClearPdf }: StorageManagerProps) {
  const withPdf = resumes.filter((resume) => resume.file_path)
  const total = withPdf.reduce((sum, resume) => sum + (resume.file_size ?? 0), 0)

  return (
    <section className="rounded-lg border border-slate-100 bg-white">
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">简历库存储管理</h2>
        <p className="mt-1 text-sm text-slate-500">{withPdf.length} 份 PDF · {fileSizeLabel(total) || '0 B'}</p>
      </header>
      {withPdf.length === 0 ? (
        <div className="px-5 py-6 text-sm text-slate-400">暂无已上传 PDF</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {withPdf.map((resume) => (
            <div key={resume.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{resume.name}</p>
                <p className="mt-1 text-xs text-slate-400">{resume.file_name} · {fileSizeLabel(resume.file_size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onClearPdf(resume)}
                className="rounded-lg border border-red-100 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                清除PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
