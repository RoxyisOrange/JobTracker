'use client'

import { useMemo, useState } from 'react'
import { useApplications } from '@/hooks/useApplications'
import { useResumes } from '@/hooks/useResumes'
import { formatDateTime } from '@/lib/utils'

function inNext2Hours(dateStr: string | null) {
  if (!dateStr) return false
  const time = new Date(dateStr).getTime()
  const now = Date.now()
  return time >= now && time <= now + 2 * 3_600_000
}

export default function InterviewReminderBanner() {
  const { applications } = useApplications()
  const { resumes } = useResumes()
  const [dismissed, setDismissed] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(sessionStorage.getItem('dismissed-interviews') ?? '[]') as string[]
    } catch {
      return []
    }
  })

  const interview = useMemo(
    () =>
      applications
        .filter((app) => inNext2Hours(app.interview_time) && !dismissed.includes(app.id))
        .sort((a, b) => new Date(a.interview_time ?? '').getTime() - new Date(b.interview_time ?? '').getTime())[0],
    [applications, dismissed]
  )

  if (!interview) return null

  const resume = resumes.find((item) => item.id === interview.resume_id)

  const dismiss = () => {
    const next = [...dismissed, interview.id]
    setDismissed(next)
    sessionStorage.setItem('dismissed-interviews', JSON.stringify(next))
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>
        你有一场面试在 {formatDateTime(interview.interview_time)}（{interview.company} - {interview.position}），使用简历：{resume?.name ?? '未关联'}
      </span>
      <button type="button" onClick={dismiss} className="rounded-md bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100">
        关闭
      </button>
    </div>
  )
}
