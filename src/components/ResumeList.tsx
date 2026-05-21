'use client'

import type { Resume } from '@/lib/types'
import { fileSizeLabel, formatDate } from '@/lib/utils'

interface ResumeListProps {
  resumes: Resume[]
  loading?: boolean
  onEdit: (resume: Resume) => void
  onPreview: (resume: Resume) => void
  onDelete: (resume: Resume) => void
}

export default function ResumeList({
  resumes,
  loading = false,
  onEdit,
  onPreview,
  onDelete,
}: ResumeListProps) {
  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg border border-slate-100 bg-white" />
        ))}
      </div>
    )
  }

  if (resumes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500">
        暂无简历版本
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {resumes.map((resume) => (
        <article key={resume.id} className="rounded-lg border border-slate-100 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">{resume.name}</h3>
                {resume.file_path && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    PDF已上传
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {resume.direction.map((direction) => (
                  <span key={direction} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {direction}
                  </span>
                ))}
              </div>
              {resume.note && <p className="mt-3 text-sm text-slate-500">{resume.note}</p>}
              <p className="mt-3 text-xs text-slate-400">
                {formatDate(resume.created_at)}
                {resume.file_name ? ` · ${resume.file_name} · ${fileSizeLabel(resume.file_size)}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                onClick={() => onPreview(resume)}
                disabled={!resume.file_path}
                className="rounded-lg border border-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                预览PDF
              </button>
              <button
                type="button"
                onClick={() => onEdit(resume)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => onDelete(resume)}
                className="rounded-lg border border-red-100 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                删除
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
