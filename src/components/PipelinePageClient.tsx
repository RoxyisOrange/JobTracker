'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ApplicationModal from '@/components/ApplicationModal'
import BatchEntryModal from '@/components/BatchEntryModal'
import BatchBar from '@/components/BatchBar'
import BatchStatusPicker from '@/components/BatchStatusPicker'
import PipelineCompanyView from '@/components/PipelineCompanyView'
import PipelineKanban from '@/components/PipelineKanban'
import PipelineTable from '@/components/PipelineTable'
import ReviewModal from '@/components/ReviewModal'
import { ACTIVE_STATUSES, APPLICATION_STATUSES, BATCHES, DEFAULT_DIRECTIONS, PLATFORMS } from '@/lib/constants'
import { getTemperature } from '@/lib/temperature'
import type { Application, CreateApplicationInput } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import { useConfig } from '@/hooks/useConfig'
import { useResumes } from '@/hooks/useResumes'

type ViewMode = 'table' | 'kanban' | 'company'

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: 'table', label: '表格' },
  { value: 'kanban', label: '看板' },
  { value: 'company', label: '按公司' },
]

const FILTER_LABELS: Record<string, string> = {
  active: '进行中',
  interviews: '近3天面试',
  interview: '近3天面试',
  offer: 'Offer',
  stale: '沉寂岗位',
  silent: '沉寂岗位',
}

function isUpcomingInterview(app: Application) {
  if (!app.interview_time) return false
  const time = new Date(app.interview_time).getTime()
  const now = Date.now()
  return time >= now && time <= now + 72 * 3_600_000
}

function applySpecialFilter(
  applications: Application[],
  filter: string | null,
  config?: Parameters<typeof getTemperature>[1]
) {
  if (!filter) return applications

  if (filter === 'active') {
    return applications.filter((app) => ACTIVE_STATUSES.includes(app.status))
  }

  if (filter === 'interviews' || filter === 'interview') {
    return applications.filter(isUpcomingInterview)
  }

  if (filter === 'offer') {
    return applications.filter((app) => app.status === 'Offer')
  }

  if (filter === 'stale' || filter === 'silent') {
    return applications.filter((app) => getTemperature(app, config).level === 'stale')
  }

  return applications
}

function filterApplications(
  applications: Application[],
  filters: {
    query: string
    status: string
    direction: string
    platform: string
    batch: string
  }
) {
  const keyword = filters.query.trim().toLowerCase()

  return applications.filter((app) => {
    if (filters.status && app.status !== filters.status) return false
    if (filters.direction && !app.direction.includes(filters.direction)) return false
    if (filters.platform && app.platform !== filters.platform) return false
    if (filters.batch && app.batch !== filters.batch) return false
    if (!keyword) return true

    return [app.company, app.position, app.note, app.referral_code].some((value) =>
      value.toLowerCase().includes(keyword)
    )
  })
}

export default function PipelinePageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const specialFilter = searchParams.get('filter')
  const {
    applications,
    loading,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
    batchUpdateStatus,
    batchDeleteApplications,
    findDuplicate,
  } = useApplications()
  const { config } = useConfig()
  const { resumes } = useResumes()

  const [view, setView] = useState<ViewMode>('table')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [direction, setDirection] = useState('')
  const [platform, setPlatform] = useState('')
  const [batch, setBatch] = useState('')
  const [modalApp, setModalApp] = useState<Application | null | undefined>()
  const [reviewApp, setReviewApp] = useState<Application | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [showBatchEntry, setShowBatchEntry] = useState(false)

  const directions = config?.directions?.length ? config.directions : DEFAULT_DIRECTIONS
  const nudgeConfig = useMemo(() => (
    config
      ? {
          nudge_applied: config.nudge_applied,
          nudge_written: config.nudge_written,
          nudge_interview: config.nudge_interview,
        }
      : undefined
  ), [config])

  const filteredApplications = useMemo(() => {
    const special = applySpecialFilter(applications, specialFilter, nudgeConfig)
    return filterApplications(special, { query, status, direction, platform, batch })
  }, [applications, batch, direction, nudgeConfig, platform, query, specialFilter, status])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (showStatusPicker) {
        setShowStatusPicker(false)
        return
      }
      if (showBatchEntry) {
        setShowBatchEntry(false)
        return
      }
      if (reviewApp) {
        setReviewApp(null)
        return
      }
      if (modalApp !== undefined) {
        setModalApp(undefined)
        return
      }
      if (batchMode) {
        setBatchMode(false)
        setSelectedIds([])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [batchMode, modalApp, reviewApp, showBatchEntry, showStatusPicker])

  const closeBatchMode = () => {
    setBatchMode(false)
    setSelectedIds([])
    setShowStatusPicker(false)
  }

  const setViewMode = (next: ViewMode) => {
    setView(next)
    closeBatchMode()
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  const toggleAllVisible = () => {
    const visibleIds = filteredApplications.map((app) => app.id)
    setSelectedIds((current) => {
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id))
      }
      return Array.from(new Set([...current, ...visibleIds]))
    })
  }

  const saveApplication = async (data: CreateApplicationInput) => {
    const result = modalApp
      ? await updateApplication(modalApp.id, data)
      : await createApplication(data)

    if (result.error) {
      window.alert(result.error.message)
      return
    }

    setModalApp(undefined)
  }

  const removeApplication = async (application: Application) => {
    if (!window.confirm(`删除「${application.company} - ${application.position}」？`)) return
    const result = await deleteApplication(application.id)
    if (result.error) window.alert(result.error.message)
  }

  const updateStatus = async (id: string, nextStatus: string) => {
    const current = applications.find((app) => app.id === id)
    if (!current || current.status === nextStatus) return

    const result = await updateApplication(id, { status: nextStatus })
    if (result.error) window.alert(result.error.message)
  }

  const pickBatchStatus = async (nextStatus: string) => {
    const result = await batchUpdateStatus(selectedIds, nextStatus)
    if (result.error) {
      window.alert(result.error.message)
      return
    }
    closeBatchMode()
  }

  const deleteSelected = async () => {
    if (!window.confirm(`删除已选的 ${selectedIds.length} 条投递记录？`)) return
    const result = await batchDeleteApplications(selectedIds)
    if (result.error) {
      window.alert(result.error.message)
      return
    }
    closeBatchMode()
  }

  const createBatchApplications = async (items: CreateApplicationInput[]) => {
    for (const item of items) {
      const result = await createApplication(item)
      if (result.error) {
        window.alert(result.error.message)
        return
      }
    }
    setShowBatchEntry(false)
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">投递管道</h1>
          <p className="mt-1 text-sm text-slate-500">{applications.length} 条投递记录</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            {VIEW_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setViewMode(option.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  view === option.value ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModalApp(null)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新增投递
          </button>
          <button
            type="button"
            onClick={() => setShowBatchEntry(true)}
            className="rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            批量录入
          </button>
          {view === 'table' && (
            <button
              type="button"
              onClick={() => {
                setBatchMode(true)
                setSelectedIds([])
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              批量编辑
            </button>
          )}
        </div>
      </div>

      {specialFilter && FILTER_LABELS[specialFilter] && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span>正在筛选：{FILTER_LABELS[specialFilter]} · {filteredApplications.length} 条记录</span>
          <button
            type="button"
            onClick={() => router.push('/pipeline')}
            className="rounded-md bg-white px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100"
          >
            清除
          </button>
        </div>
      )}

      <div className="grid gap-3 rounded-lg border border-slate-100 bg-white p-4 xl:grid-cols-[minmax(220px,1fr)_150px_180px_150px_150px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索公司、岗位"
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部状态</option>
          {APPLICATION_STATUSES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部方向</option>
          {directions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部平台</option>
          {PLATFORMS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={batch}
          onChange={(event) => setBatch(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部批次</option>
          {BATCHES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {batchMode && view === 'table' && (
        <BatchBar
          count={selectedIds.length}
          onStatus={() => setShowStatusPicker(true)}
          onDelete={() => void deleteSelected()}
          onCancel={closeBatchMode}
        />
      )}

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {view === 'table' && (
        <PipelineTable
          applications={filteredApplications}
          loading={loading}
          batchMode={batchMode}
          selectedIds={selectedIds}
          config={nudgeConfig}
          onToggleSelected={toggleSelected}
          onToggleAll={toggleAllVisible}
          onEdit={(application) => setModalApp(application)}
          onDelete={(application) => void removeApplication(application)}
        />
      )}

      {view === 'kanban' && (
        <PipelineKanban
          applications={filteredApplications}
          config={nudgeConfig}
          onStatusChange={(id, nextStatus) => void updateStatus(id, nextStatus)}
          onEdit={(application) => setModalApp(application)}
        />
      )}

      {view === 'company' && (
        <PipelineCompanyView
          applications={filteredApplications}
          config={nudgeConfig}
          onEdit={(application) => setModalApp(application)}
        />
      )}

      {showStatusPicker && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">批量改状态</h2>
              <button
                type="button"
                onClick={() => setShowStatusPicker(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="关闭"
                title="关闭"
              >
                ×
              </button>
            </div>
            <BatchStatusPicker onPick={(nextStatus) => void pickBatchStatus(nextStatus)} />
          </div>
        </div>
      )}

      {modalApp !== undefined && (
        <ApplicationModal
          application={modalApp}
          directions={directions}
          resumes={resumes}
          onClose={() => setModalApp(undefined)}
          onSave={saveApplication}
          onReview={(application) => setReviewApp(application)}
          checkDuplicate={findDuplicate}
        />
      )}

      {showBatchEntry && (
        <BatchEntryModal
          directions={directions}
          resumes={resumes}
          onClose={() => setShowBatchEntry(false)}
          onSubmit={createBatchApplications}
        />
      )}

      {reviewApp && (
        <ReviewModal
          application={reviewApp}
          resumes={resumes}
          onClose={() => setReviewApp(null)}
          onSave={async (patch) => {
            const result = await updateApplication(reviewApp.id, patch)
            if (result.error) {
              window.alert(result.error.message)
              return
            }
            setReviewApp(null)
          }}
        />
      )}
    </div>
  )
}
