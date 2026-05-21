'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { APPLICATION_STATUSES, BATCHES, DEFAULT_DIRECTIONS, PLATFORMS } from '@/lib/constants'
import type { Application, CreateApplicationInput, Resume } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ApplicationModalProps {
  application?: Application | null
  directions?: readonly string[]
  resumes?: Resume[]
  onClose: () => void
  onSave: (data: CreateApplicationInput) => Promise<void> | void
  onReview?: (application: Application) => void
  checkDuplicate?: (company: string, position: string, excludeId?: string) => Application | null
}

type ApplicationForm = CreateApplicationInput

function today() {
  return new Date().toISOString().slice(0, 10)
}

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromDatetimeLocal(value: string) {
  if (!value) return null
  return new Date(value).toISOString()
}

function emptyForm(): ApplicationForm {
  return {
    company: '',
    position: '',
    direction: [],
    platform: '其他',
    batch: '日常实习',
    resume_id: null,
    status: '已投递',
    status_history: [],
    applied_date: today(),
    referral_code: '',
    interview_time: null,
    note: '',
    inbox_item_id: null,
    review_link: null,
    review_markdown: null,
  }
}

function formFromApplication(app: Application): ApplicationForm {
  return {
    company: app.company,
    position: app.position,
    direction: app.direction ?? [],
    platform: app.platform,
    batch: app.batch,
    resume_id: app.resume_id,
    status: app.status,
    status_history: app.status_history ?? [],
    applied_date: app.applied_date,
    referral_code: app.referral_code,
    interview_time: app.interview_time,
    note: app.note,
    inbox_item_id: app.inbox_item_id,
    review_link: app.review_link,
    review_markdown: app.review_markdown,
  }
}

export default function ApplicationModal({
  application,
  directions = DEFAULT_DIRECTIONS,
  resumes = [],
  onClose,
  onSave,
  onReview,
  checkDuplicate,
}: ApplicationModalProps) {
  const [form, setForm] = useState<ApplicationForm>(() =>
    application ? formFromApplication(application) : emptyForm()
  )
  const [saving, setSaving] = useState(false)
  const [customDirection, setCustomDirection] = useState('')
  const allDirections = Array.from(new Set([...directions, ...form.direction]))

  const duplicate = useMemo(
    () => checkDuplicate?.(form.company, form.position, application?.id) ?? null,
    [application?.id, checkDuplicate, form.company, form.position]
  )

  const toggleDirection = (direction: string) => {
    setForm((current) => ({
      ...current,
      direction: current.direction.includes(direction)
        ? current.direction.filter((item) => item !== direction)
        : [...current.direction, direction],
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.company.trim() || !form.position.trim()) {
      window.alert('公司名和岗位名称必填')
      return
    }

    setSaving(true)
    await onSave({
      ...form,
      company: form.company.trim(),
      position: form.position.trim(),
      platform: form.platform || '其他',
      batch: form.batch || '日常实习',
      referral_code: form.referral_code.trim(),
      note: form.note.trim(),
      interview_time: fromDatetimeLocal(toDatetimeLocal(form.interview_time)),
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6">
      <div className="flex max-h-full w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {application ? '编辑投递记录' : '新增投递'}
          </h2>
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

        <form onSubmit={(event) => void handleSubmit(event)} className="overflow-auto px-6 py-5">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">公司名</span>
                <input
                  value={form.company}
                  onChange={(event) => setForm({ ...form, company: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">岗位名称</span>
                <input
                  value={form.position}
                  onChange={(event) => setForm({ ...form, position: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            {duplicate && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                已存在同公司同岗位记录：{duplicate.company} - {duplicate.position}
              </div>
            )}

            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">职业方向</span>
              <div className="flex flex-wrap gap-2">
                {allDirections.map((direction) => {
                  const active = form.direction.includes(direction)
                  return (
                    <button
                      type="button"
                      key={direction}
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
              <div className="flex gap-2">
                <input
                  value={customDirection}
                  onChange={(event) => setCustomDirection(event.target.value)}
                  placeholder="添加方向"
                  className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = customDirection.trim()
                    if (!value) return
                    setForm((current) => ({
                      ...current,
                      direction: current.direction.includes(value) ? current.direction : [...current.direction, value],
                    }))
                    setCustomDirection('')
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  添加
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">投递平台</span>
                <select
                  value={form.platform}
                  onChange={(event) => setForm({ ...form, platform: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">投递批次</span>
                <select
                  value={form.batch}
                  onChange={(event) => setForm({ ...form, batch: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {BATCHES.map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">状态</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">关联简历</span>
              <select
                value={form.resume_id ?? ''}
                onChange={(event) => setForm({ ...form, resume_id: event.target.value || null })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">未关联</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>{resume.name}</option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">投递日期</span>
                <input
                  type="date"
                  value={form.applied_date}
                  onChange={(event) => setForm({ ...form, applied_date: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">面试时间</span>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(form.interview_time)}
                  onChange={(event) => setForm({ ...form, interview_time: fromDatetimeLocal(event.target.value) })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">内推码/内推人</span>
              <input
                value={form.referral_code}
                onChange={(event) => setForm({ ...form, referral_code: event.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">备注</span>
              <textarea
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">复盘文档链接</span>
              <input
                value={form.review_link ?? ''}
                onChange={(event) => setForm({ ...form, review_link: event.target.value || null })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="sticky bottom-0 -mx-6 mt-6 flex justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
            <div>
              {application && onReview && (
                <button
                  type="button"
                  onClick={() => onReview(application)}
                  className="rounded-lg border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  生成复盘
                </button>
              )}
            </div>
            <div className="flex gap-3">
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
          </div>
        </form>
      </div>
    </div>
  )
}
