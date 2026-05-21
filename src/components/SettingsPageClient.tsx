'use client'

import { useEffect, useRef, useState } from 'react'
import SettingsLock from '@/components/SettingsLock'
import StorageManager from '@/components/StorageManager'
import { applyTheme, THEME_KEY } from '@/components/ThemeHydrator'
import { DEFAULT_DIRECTIONS, DEFAULT_TEXT_MODEL, DEFAULT_VISION_MODEL, NUDGE_DEFAULTS } from '@/lib/constants'
import type { Application, InboxItem, Resume, UserConfig } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useApplications } from '@/hooks/useApplications'
import { useConfig } from '@/hooks/useConfig'
import { useInbox } from '@/hooks/useInbox'
import { useResumes } from '@/hooks/useResumes'

function readOnlyClass(locked: boolean) {
  return `rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
    locked ? 'cursor-not-allowed bg-slate-50 text-slate-500' : 'bg-white text-slate-800'
  }`
}

async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mimeType = 'application/pdf') {
  const binary = atob(base64.includes(',') ? base64.split(',').pop() ?? '' : base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mimeType })
}

function stripRecord<T extends { id?: string; user_id?: string; created_at?: string; updated_at?: string }>(record: T) {
  const { id, user_id, created_at, updated_at, ...rest } = record
  void id
  void user_id
  void created_at
  void updated_at
  return rest
}

function csvEscape(value: unknown) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

export default function SettingsPageClient() {
  const importRef = useRef<HTMLInputElement>(null)
  const { config, loading: configLoading, update: updateConfig, refetch: refetchConfig } = useConfig()
  const { items: inboxItems, refetch: refetchInbox } = useInbox()
  const { applications, refetch: refetchApplications } = useApplications()
  const { resumes, clearResumePdf, refetch: refetchResumes } = useResumes()

  const [apiKey, setApiKey] = useState('')
  const [textModel, setTextModel] = useState(DEFAULT_TEXT_MODEL)
  const [visionModel, setVisionModel] = useState(DEFAULT_VISION_MODEL)
  const [nudgeApplied, setNudgeApplied] = useState(NUDGE_DEFAULTS.applied)
  const [nudgeWritten, setNudgeWritten] = useState(NUDGE_DEFAULTS.written)
  const [nudgeInterview, setNudgeInterview] = useState(NUDGE_DEFAULTS.interview)
  const [directionInput, setDirectionInput] = useState('')
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentTheme = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
      setTheme(currentTheme)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!config) return
    const timer = window.setTimeout(() => {
      setApiKey(config.api_key_encrypted ?? '')
      setTextModel(config.text_model)
      setVisionModel(config.vision_model)
      setNudgeApplied(config.nudge_applied)
      setNudgeWritten(config.nudge_written)
      setNudgeInterview(config.nudge_interview)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [config])

  const directions = config?.directions?.length ? config.directions : [...DEFAULT_DIRECTIONS]

  const saveAi = async () => {
    const error = await updateConfig({
      api_key_encrypted: apiKey.trim() || null,
      text_model: textModel.trim() || DEFAULT_TEXT_MODEL,
      vision_model: visionModel.trim() || DEFAULT_VISION_MODEL,
    })
    if (error) window.alert(error.message)
  }

  const saveNudge = async () => {
    const error = await updateConfig({
      nudge_applied: Number(nudgeApplied) || NUDGE_DEFAULTS.applied,
      nudge_written: Number(nudgeWritten) || NUDGE_DEFAULTS.written,
      nudge_interview: Number(nudgeInterview) || NUDGE_DEFAULTS.interview,
    })
    if (error) window.alert(error.message)
  }

  const addDirection = async () => {
    const value = directionInput.trim()
    if (!value || directions.includes(value)) return
    const error = await updateConfig({ directions: [...directions, value] })
    if (error) window.alert(error.message)
    else setDirectionInput('')
  }

  const removeDirection = async (direction: string) => {
    const error = await updateConfig({ directions: directions.filter((item) => item !== direction) })
    if (error) window.alert(error.message)
  }

  const exportJson = async () => {
    const supabase = createClient()
    const resumesWithFiles = await Promise.all(
      resumes.map(async (resume) => {
        if (!resume.file_path) return resume
        const { data } = await supabase.storage.from('resumes').download(resume.file_path)
        if (!data) return resume
        return {
          ...resume,
          fileData: await blobToBase64(data),
        }
      })
    )
    const payload = {
      version: 'job-tracker-web-v1',
      exportedAt: new Date().toISOString(),
      inbox: inboxItems,
      applications,
      resumes: resumesWithFiles,
      user_config: config,
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportCsv = () => {
    const fields: Array<keyof Application> = [
      'company',
      'position',
      'direction',
      'platform',
      'batch',
      'status',
      'applied_date',
      'interview_time',
      'referral_code',
      'note',
    ]
    const rows = [fields.join(','), ...applications.map((app) => fields.map((field) => csvEscape(app[field])).join(','))]
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearExistingData = async () => {
    const supabase = createClient()
    const resumePaths = resumes.map((resume) => resume.file_path).filter((path): path is string => Boolean(path))
    if (resumePaths.length > 0) await supabase.storage.from('resumes').remove(resumePaths)
    if (applications.length > 0) await supabase.from('applications').delete().in('id', applications.map((app) => app.id))
    if (inboxItems.length > 0) await supabase.from('inbox').delete().in('id', inboxItems.map((item) => item.id))
    if (resumes.length > 0) await supabase.from('resumes').delete().in('id', resumes.map((resume) => resume.id))
  }

  const importJson = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    const payload = JSON.parse(text) as {
      inbox?: InboxItem[]
      inboxItems?: InboxItem[]
      applications?: Application[]
      resumes?: Array<Resume & { fileData?: string }>
      user_config?: UserConfig
      config?: UserConfig
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (importMode === 'overwrite') {
      if (!window.confirm('覆盖导入会清空当前数据，确认继续？')) return
      await clearExistingData()
    }

    const importedDirections = new Set(directions)
    const importedInbox = payload.inbox ?? payload.inboxItems ?? []
    const importedApplications = payload.applications ?? []
    const importedResumes = payload.resumes ?? []
    importedInbox.forEach((item) => item.direction?.forEach((direction) => importedDirections.add(direction)))
    importedApplications.forEach((app) => app.direction?.forEach((direction) => importedDirections.add(direction)))
    importedResumes.forEach((resume) => resume.direction?.forEach((direction) => importedDirections.add(direction)))

    if (importedInbox.length > 0) {
      await supabase.from('inbox').insert(importedInbox.map((item) => ({
        ...stripRecord(item),
        user_id: user.id,
        pipeline_id: null,
        status: item.status ?? 'collected',
      })))
    }

    if (importedApplications.length > 0) {
      await supabase.from('applications').insert(importedApplications.map((app) => ({
        ...stripRecord(app),
        user_id: user.id,
        resume_id: null,
        inbox_item_id: null,
        status_history: app.status_history ?? [],
      })))
    }

    for (const resume of importedResumes) {
      const { fileData, ...resumeWithoutFileData } = resume
      const { data: created } = await supabase
        .from('resumes')
        .insert({
          ...stripRecord(resumeWithoutFileData),
          user_id: user.id,
          file_path: null,
          file_name: resume.file_name ?? null,
          file_size: resume.file_size ?? null,
        })
        .select()
        .single()

      if (created && fileData) {
        const blob = base64ToBlob(fileData)
        const path = `${user.id}/${created.id}-${Date.now()}.pdf`
        await supabase.storage.from('resumes').upload(path, blob, { upsert: true, contentType: 'application/pdf' })
        await supabase.from('resumes').update({ file_path: path }).eq('id', created.id)
      }
    }

    await updateConfig({ directions: Array.from(importedDirections) })
    await Promise.all([refetchInbox(), refetchApplications(), refetchResumes(), refetchConfig()])
    window.alert('导入完成')
  }

  const clearAll = async () => {
    if (!window.confirm('确认清空所有投递、收集池和简历数据？')) return
    await clearExistingData()
    await Promise.all([refetchInbox(), refetchApplications(), refetchResumes()])
  }

  if (configLoading) {
    return <div className="rounded-lg border border-slate-100 bg-white p-8 text-sm text-slate-500">设置加载中...</div>
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">设置</h1>
        <p className="mt-1 text-sm text-slate-500">AI 配置、温度阈值、方向和数据管理</p>
      </div>

      <SettingsLock title="AI智能识别配置" onSave={saveAi}>
        {(locked) => (
          <>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">DashScope API Key</span>
              <input type="password" readOnly={locked} value={apiKey} onChange={(event) => setApiKey(event.target.value)} className={readOnlyClass(locked)} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">文字识别模型</span>
                <input readOnly={locked} value={textModel} onChange={(event) => setTextModel(event.target.value)} className={readOnlyClass(locked)} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">图片识别模型</span>
                <input readOnly={locked} value={visionModel} onChange={(event) => setVisionModel(event.target.value)} className={readOnlyClass(locked)} />
              </label>
            </div>
          </>
        )}
      </SettingsLock>

      <SettingsLock title="温度计阈值配置" onSave={saveNudge}>
        {(locked) => (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">已投递沉寂天数</span>
              <input type="number" readOnly={locked} value={nudgeApplied} onChange={(event) => setNudgeApplied(Number(event.target.value))} className={readOnlyClass(locked)} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">笔试沉寂天数</span>
              <input type="number" readOnly={locked} value={nudgeWritten} onChange={(event) => setNudgeWritten(Number(event.target.value))} className={readOnlyClass(locked)} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">面试沉寂天数</span>
              <input type="number" readOnly={locked} value={nudgeInterview} onChange={(event) => setNudgeInterview(Number(event.target.value))} className={readOnlyClass(locked)} />
            </label>
          </div>
        )}
      </SettingsLock>

      <section className="rounded-lg border border-slate-100 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-800">主题</h2>
        <div className="mt-4 flex rounded-lg border border-slate-200 bg-white p-1 w-fit">
          {(['light', 'dark'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setTheme(item)
                applyTheme(item)
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium ${theme === item ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {item === 'light' ? '浅色' : '深色'}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-100 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-800">职业方向管理</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {directions.map((direction) => (
            <span key={direction} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700">
              {direction}
              <button type="button" onClick={() => void removeDirection(direction)} className="text-blue-400 hover:text-red-600">×</button>
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input value={directionInput} onChange={(event) => setDirectionInput(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          <button type="button" onClick={() => void addDirection()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">添加</button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-100 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-800">数据管理</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void exportJson()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">导出JSON</button>
          <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">导出CSV</button>
          <select value={importMode} onChange={(event) => setImportMode(event.target.value as 'merge' | 'overwrite')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="merge">合并导入</option>
            <option value="overwrite">覆盖导入</option>
          </select>
          <button type="button" onClick={() => importRef.current?.click()} className="rounded-lg border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">导入JSON</button>
          <button type="button" onClick={() => void clearAll()} className="rounded-lg border border-red-100 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">清空所有数据</button>
        </div>
        <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(event) => void importJson(event.target.files?.[0])} />
      </section>

      <StorageManager
        resumes={resumes}
        onClearPdf={(resume) => {
          void clearResumePdf(resume)
        }}
      />
    </div>
  )
}
