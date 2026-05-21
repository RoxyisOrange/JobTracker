'use client'

import { useMemo, useState } from 'react'
import type { Application, Resume } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/utils'

interface ReviewModalProps {
  application: Application
  resumes?: Resume[]
  onClose: () => void
  onSave: (patch: { review_markdown: string; review_link: string | null }) => Promise<void> | void
}

function generateReviewMarkdown(application: Application, resume?: Resume) {
  const timeline = (application.status_history ?? [])
    .map((item) => `- ${formatDateTime(item.date)}：${item.status}${item.note ? `（${item.note}）` : ''}`)
    .join('\n') || '- 暂无状态时间线'

  return `# ${application.company} - ${application.position} 复盘

## 基本信息
- 公司：${application.company}
- 岗位：${application.position}
- 方向：${application.direction.join('、') || '未填写'}
- 关联简历：${resume?.name ?? '未关联'}
- 投递日期：${formatDate(application.applied_date)}
- 最终状态：${application.status}

## 面试/流程时间线
${timeline}

## 面试内容与复盘


## 关键收获


## 改进方向

`
}

export default function ReviewModal({
  application,
  resumes = [],
  onClose,
  onSave,
}: ReviewModalProps) {
  const resume = resumes.find((item) => item.id === application.resume_id)
  const initialMarkdown = useMemo(
    () => application.review_markdown || generateReviewMarkdown(application, resume),
    [application, resume]
  )
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [reviewLink, setReviewLink] = useState(application.review_link ?? '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = markdown
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
      setCopied(true)
    }
  }

  const save = async () => {
    setSaving(true)
    await onSave({
      review_markdown: markdown,
      review_link: reviewLink.trim() || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 py-6">
      <div className="flex max-h-full w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">复盘笔记</h2>
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

        <div className="grid min-h-0 gap-4 overflow-auto px-6 py-5">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">复盘文档链接</span>
            <input
              value={reviewLink}
              onChange={(event) => setReviewLink(event.target.value)}
              placeholder="飞书 / Notion / Google Docs 链接"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <textarea
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            className="min-h-[420px] rounded-lg border border-slate-200 px-3 py-3 font-mono text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => void copy()}
            className="rounded-lg border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            {copied ? '已复制' : '一键复制'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
