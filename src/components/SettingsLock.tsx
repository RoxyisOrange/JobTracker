'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

interface SettingsLockProps {
  title: string
  children: (locked: boolean) => ReactNode
  onSave: () => Promise<void> | void
}

export default function SettingsLock({ title, children, onSave }: SettingsLockProps) {
  const [locked, setLocked] = useState(true)
  const [saving, setSaving] = useState(false)

  const toggle = async () => {
    if (locked) {
      setLocked(false)
      return
    }

    setSaving(true)
    await onSave()
    setSaving(false)
    setLocked(true)
  }

  return (
    <section className="rounded-lg border border-slate-100 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={saving}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            locked
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {locked ? '已锁定' : saving ? '保存中...' : '编辑中 · 确认保存'}
        </button>
      </header>
      <div className="grid gap-4 p-5">{children(locked)}</div>
    </section>
  )
}
