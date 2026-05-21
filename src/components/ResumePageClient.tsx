'use client'

import { useState } from 'react'
import ResumeList from '@/components/ResumeList'
import ResumeModal from '@/components/ResumeModal'
import { DEFAULT_DIRECTIONS } from '@/lib/constants'
import type { Resume } from '@/lib/types'
import { useConfig } from '@/hooks/useConfig'
import { useResumes, type ResumeInput } from '@/hooks/useResumes'

export default function ResumePageClient() {
  const { resumes, loading, error, createResume, updateResume, deleteResume, previewResume } = useResumes()
  const { config } = useConfig()
  const [modalResume, setModalResume] = useState<Resume | null | undefined>()
  const directions = config?.directions?.length ? config.directions : DEFAULT_DIRECTIONS

  const saveResume = async (input: ResumeInput) => {
    const result = modalResume
      ? await updateResume(modalResume.id, input)
      : await createResume(input)

    if (result.error) {
      window.alert(result.error.message)
      return
    }
    setModalResume(undefined)
  }

  const removeResume = async (resume: Resume) => {
    if (!window.confirm(`删除简历「${resume.name}」？`)) return
    const result = await deleteResume(resume)
    if (result.error) window.alert(result.error.message)
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">简历管理</h1>
          <p className="mt-1 text-sm text-slate-500">{resumes.length} 个简历版本</p>
        </div>
        <button
          type="button"
          onClick={() => setModalResume(null)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新增简历
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ResumeList
        resumes={resumes}
        loading={loading}
        onEdit={(resume) => setModalResume(resume)}
        onPreview={(resume) => void previewResume(resume)}
        onDelete={(resume) => void removeResume(resume)}
      />

      {modalResume !== undefined && (
        <ResumeModal
          resume={modalResume}
          directions={directions}
          onClose={() => setModalResume(undefined)}
          onSave={saveResume}
        />
      )}
    </div>
  )
}
