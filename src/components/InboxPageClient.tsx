'use client'

import { useEffect, useMemo, useState } from 'react'
import InboxList from '@/components/InboxList'
import InboxModal from '@/components/InboxModal'
import { BATCHES, DEFAULT_DIRECTIONS } from '@/lib/constants'
import { useConfig } from '@/hooks/useConfig'
import { useInbox } from '@/hooks/useInbox'
import type { CreateInboxItemInput, InboxItem, InboxStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type ModalState = {
  mode: 'quick' | 'full'
  item?: InboxItem | null
}

const STATUS_FILTERS: Array<{ value: InboxStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'collected', label: '待投递' },
  { value: 'applied', label: '已投递' },
  { value: 'archived', label: '已归档' },
]

function filterItems(
  items: InboxItem[],
  filters: {
    query: string
    status: InboxStatus | 'all'
    direction: string
    batch: string
  }
) {
  const keyword = filters.query.trim().toLowerCase()

  return items.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.direction && !item.direction.includes(filters.direction)) return false
    if (filters.batch && item.batch !== filters.batch) return false

    if (!keyword) return true
    return [
      item.company,
      item.position,
      item.raw_note,
      item.note,
      item.link,
    ].some((value) => value.toLowerCase().includes(keyword))
  })
}

export default function InboxPageClient() {
  const {
    items,
    loading,
    error,
    createInboxItem,
    updateInboxItem,
    deleteInboxItem,
    batchArchiveInboxItems,
    batchDeleteInboxItems,
    convertToApplication,
  } = useInbox()
  const { config } = useConfig()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<InboxStatus | 'all'>('collected')
  const [direction, setDirection] = useState('')
  const [batch, setBatch] = useState('')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const directions = config?.directions?.length ? config.directions : DEFAULT_DIRECTIONS

  const visibleItems = useMemo(() => filterItems(items, {
    query,
    status,
    direction,
    batch,
  }), [items, query, status, direction, batch])

  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((item) => selectedIds.includes(item.id))

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (modal) {
        setModal(null)
        return
      }
      if (batchMode) {
        setBatchMode(false)
        setSelectedIds([])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [batchMode, modal])

  const closeBatchMode = () => {
    setBatchMode(false)
    setSelectedIds([])
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const visibleIds = visibleItems.map((item) => item.id)
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id))
      }
      return Array.from(new Set([...current, ...visibleIds]))
    })
  }

  const saveItem = async (data: CreateInboxItemInput) => {
    const result = modal?.item
      ? await updateInboxItem(modal.item.id, data)
      : await createInboxItem(data)

    if (result.error) {
      window.alert(result.error.message)
      return
    }

    setModal(null)
  }

  const archiveItem = async (item: InboxItem) => {
    const result = await updateInboxItem(item.id, { status: 'archived' })
    if (result.error) window.alert(result.error.message)
  }

  const removeItem = async (item: InboxItem) => {
    if (!window.confirm(`删除「${item.company || '未填写公司'}」这条记录？`)) return
    const result = await deleteInboxItem(item.id)
    if (result.error) window.alert(result.error.message)
  }

  const convertItem = async (item: InboxItem) => {
    const result = await convertToApplication(item.id)
    if (result.error) {
      window.alert(result.error.message)
      return
    }
    window.alert('已转入投递管道')
  }

  const batchArchive = async () => {
    const result = await batchArchiveInboxItems(selectedIds)
    if (result.error) {
      window.alert(result.error.message)
      return
    }
    closeBatchMode()
  }

  const batchDelete = async () => {
    if (!window.confirm(`删除已选的 ${selectedIds.length} 条记录？`)) return
    const result = await batchDeleteInboxItems(selectedIds)
    if (result.error) {
      window.alert(result.error.message)
      return
    }
    closeBatchMode()
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">收集池</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.filter((item) => item.status === 'collected').length} 条待投递
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModal({ mode: 'quick' })}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            速记
          </button>
          <button
            type="button"
            onClick={() => setModal({ mode: 'full' })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            完整录入
          </button>
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
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-100 bg-white p-4 lg:grid-cols-[minmax(220px,1fr)_160px_180px_150px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索公司、岗位、速记内容"
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as InboxStatus | 'all')}
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          {STATUS_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
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

      {batchMode && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-600 px-4 py-3 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                className="h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-100"
              />
              已选 {selectedIds.length} 项
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void batchArchive()}
              disabled={selectedIds.length === 0}
              className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              归档
            </button>
            <button
              type="button"
              onClick={() => void batchDelete()}
              disabled={selectedIds.length === 0}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              删除
            </button>
            <button
              type="button"
              onClick={closeBatchMode}
              className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
            >
              取消 Esc
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className={cn(batchMode && 'pb-20')}>
        <InboxList
          items={visibleItems}
          loading={loading}
          batchMode={batchMode}
          selectedIds={selectedIds}
          onToggleSelected={toggleSelected}
          onEdit={(item) => setModal({ mode: 'full', item })}
          onConvert={(item) => void convertItem(item)}
          onArchive={(item) => void archiveItem(item)}
          onDelete={(item) => void removeItem(item)}
        />
      </div>

      {modal && (
        <InboxModal
          key={modal.item?.id ?? modal.mode}
          mode={modal.mode}
          item={modal.item}
          directions={directions}
          onClose={() => setModal(null)}
          onSave={saveItem}
        />
      )}
    </div>
  )
}
