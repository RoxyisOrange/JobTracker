'use client'

import { useMemo, useState } from 'react'
import { BATCHES, PLATFORMS } from '@/lib/constants'
import type { CreateApplicationInput, Resume } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BatchEntryModalProps {
  directions?: readonly string[]
  resumes?: Resume[]
  onClose: () => void
  onSubmit: (items: CreateApplicationInput[]) => Promise<void> | void
}

interface DraftRow {
  id: string
  company: string
  position: string
}

type Mode = 'table' | 'text'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function newRow(): DraftRow {
  return { id: crypto.randomUUID(), company: '', position: '' }
}

function parseTextRows(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [company, ...rest] = line.split(/\s+/)
      return {
        company: company ?? '',
        position: rest.join(' '),
      }
    })
    .filter((row) => row.company && row.position)
}

export default function BatchEntryModal({
  directions = [],
  resumes = [],
  onClose,
  onSubmit,
}: BatchEntryModalProps) {
  const [mode, setMode] = useState<Mode>('table')
  const [platform, setPlatform] = useState('其他')
  const [batch, setBatch] = useState('日常实习')
  const [selectedDirections, setSelectedDirections] = useState<string[]>([])
  const [resumeId, setResumeId] = useState('')
  const [appliedDate, setAppliedDate] = useState(today())
  const [rows, setRows] = useState<DraftRow[]>(() => Array.from({ length: 5 }, newRow))
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const parsedRows = useMemo(() => {
    if (mode === 'text') return parseTextRows(text)
    return rows
      .map(({ company, position }) => ({ company: company.trim(), position: position.trim() }))
      .filter((row) => row.company && row.position)
  }, [mode, rows, text])

  const toggleDirection = (direction: string) => {
    setSelectedDirections((current) =>
      current.includes(direction)
        ? current.filter((item) => item !== direction)
        : [...current, direction]
    )
  }

  const submit = async () => {
    if (!platform || !batch || selectedDirections.length === 0) {
      window.alert('请先选择平台、批次和方向')
      return
    }

    if (parsedRows.length === 0) {
      window.alert('请至少填写一条有效记录')
      return
    }

    setSaving(true)
    await onSubmit(parsedRows.map((row) => ({
      company: row.company,
      position: row.position,
      direction: selectedDirections,
      platform,
      batch,
      resume_id: resumeId || null,
      status: '已投递',
      status_history: [],
      applied_date: appliedDate,
      referral_code: '',
      interview_time: null,
      note: '',
      inbox_item_id: null,
      review_link: null,
      review_markdown: null,
    })))
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6">
      <div className="flex max-h-full w-full max-w-5xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">批量录入</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
        </div>

        <div className="grid gap-5 overflow-auto px-6 py-5">
          <div className="grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-5">
            <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {PLATFORMS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={batch} onChange={(event) => setBatch(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {BATCHES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">未关联简历</option>
              {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}
            </select>
            <input type="date" value={appliedDate} onChange={(event) => setAppliedDate(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <span className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-600">将创建 {parsedRows.length} 条</span>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">职业方向</span>
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
                      active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600'
                    )}
                  >
                    {direction}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button type="button" onClick={() => setMode('table')} className={cn('rounded-md px-3 py-1.5 text-sm font-medium', mode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500')}>表格模式</button>
            <button type="button" onClick={() => setMode('text')} className={cn('rounded-md px-3 py-1.5 text-sm font-medium', mode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-500')}>文本模式</button>
          </div>

          {mode === 'table' ? (
            <div className="grid gap-2">
              {rows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-[1fr_1fr_40px] gap-2">
                  <input
                    value={row.company}
                    onChange={(event) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, company: event.target.value } : item))}
                    placeholder="公司名"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={row.position}
                    onChange={(event) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, position: event.target.value } : item))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && index === rows.length - 1) setRows((current) => [...current, newRow()])
                    }}
                    placeholder="岗位名"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className="rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setRows((current) => [...current, newRow()])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">添加更多行</button>
            </div>
          ) : (
            <div className="grid gap-3">
              <textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-56 rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
                已识别 {parsedRows.length} 条有效记录
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">取消</button>
          <button type="button" onClick={() => void submit()} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? '提交中...' : `确认提交 ${parsedRows.length} 条`}
          </button>
        </div>
      </div>
    </div>
  )
}
