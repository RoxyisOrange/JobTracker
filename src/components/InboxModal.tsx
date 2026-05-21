'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import SmartParseBox from '@/components/SmartParseBox'
import { BATCHES, DEFAULT_DIRECTIONS, SOURCES } from '@/lib/constants'
import type { CreateInboxItemInput, InboxItem, ParsedJobInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

type InboxFormData = CreateInboxItemInput

interface InboxModalProps {
  mode: 'quick' | 'full'
  item?: InboxItem | null
  directions?: readonly string[]
  onClose: () => void
  onSave: (data: InboxFormData) => Promise<void> | void
}

function emptyForm(mode: 'quick' | 'full'): InboxFormData {
  return {
    company: '',
    position: '',
    direction: [],
    source: mode === 'quick' ? '速记' : '',
    link: '',
    raw_note: '',
    note: '',
    batch: '',
    status: 'collected',
    pipeline_id: null,
  }
}

function formFromItem(item: InboxItem): InboxFormData {
  return {
    company: item.company,
    position: item.position,
    direction: item.direction ?? [],
    source: item.source,
    link: item.link,
    raw_note: item.raw_note,
    note: item.note,
    batch: item.batch,
    status: item.status,
    pipeline_id: item.pipeline_id,
  }
}

function mergeParsed(form: InboxFormData, data: ParsedJobInfo & { raw_note?: string }): InboxFormData {
  const nextDirections = data.direction?.length
    ? Array.from(new Set([...form.direction, ...data.direction]))
    : form.direction

  return {
    ...form,
    company: data.company || form.company,
    position: data.position || form.position,
    direction: nextDirections,
    source: data.source || form.source,
    link: data.link || form.link,
    raw_note: data.raw_note || form.raw_note,
    note: data.note || form.note,
  }
}

export default function InboxModal({
  mode,
  item,
  directions = DEFAULT_DIRECTIONS,
  onClose,
  onSave,
}: InboxModalProps) {
  const [form, setForm] = useState<InboxFormData>(() => item ? formFromItem(item) : emptyForm(mode))
  const [saving, setSaving] = useState(false)
  const [customDirection, setCustomDirection] = useState('')
  const allDirections = Array.from(new Set([...directions, ...form.direction]))

  const isQuick = mode === 'quick' && !item

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

    if (isQuick && !form.raw_note.trim()) {
      window.alert('请先填写速记内容')
      return
    }

    if (!isQuick && !form.company.trim()) {
      window.alert('公司名必填')
      return
    }

    setSaving(true)
    await onSave({
      ...form,
      company: form.company.trim() || '未填写公司',
      position: form.position.trim(),
      source: isQuick ? '速记' : form.source,
      raw_note: form.raw_note.trim(),
      note: form.note.trim(),
      link: form.link.trim(),
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6">
      <div className="flex max-h-full w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {item ? '编辑收集记录' : isQuick ? '速记' : '完整录入'}
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
          {!isQuick && (
            <div className="mb-5">
              <SmartParseBox
                directions={allDirections}
                onParsed={(parsed) => setForm((current) => mergeParsed(current, parsed))}
              />
            </div>
          )}

          {isQuick ? (
            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">速记内容</span>
                <textarea
                  value={form.raw_note}
                  onChange={(event) => setForm({ ...form, raw_note: event.target.value })}
                  className="min-h-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </label>

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
                  <span className="text-sm font-medium text-slate-700">投递批次</span>
                  <select
                    value={form.batch}
                    onChange={(event) => setForm({ ...form, batch: event.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">未选择</option>
                    {BATCHES.map((batch) => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : (
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

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">来源渠道</span>
                  <select
                    value={form.source}
                    onChange={(event) => setForm({ ...form, source: event.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">未选择</option>
                    {SOURCES.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                    {form.source === '速记' && <option value="速记">速记</option>}
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">投递批次</span>
                  <select
                    value={form.batch}
                    onChange={(event) => setForm({ ...form, batch: event.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">未选择</option>
                    {BATCHES.map((batch) => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">链接/内推码</span>
                <input
                  value={form.link}
                  onChange={(event) => setForm({ ...form, link: event.target.value })}
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
            </div>
          )}

          <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
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
