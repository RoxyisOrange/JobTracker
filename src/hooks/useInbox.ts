'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Application,
  CreateInboxItemInput,
  InboxFilters,
  InboxItem,
  UpdateInboxItemInput,
} from '@/lib/types'

const EMPTY_FILTERS: InboxFilters = {}

function matchesQuery(item: InboxItem, query?: string) {
  const keyword = query?.trim().toLowerCase()
  if (!keyword) return true

  return [
    item.company,
    item.position,
    item.raw_note,
    item.note,
    item.link,
  ].some((value) => value.toLowerCase().includes(keyword))
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function useInbox(initialFilters: InboxFilters = EMPTY_FILTERS) {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getInboxItems = useCallback(async (filters: InboxFilters = {}) => {
    const supabase = createClient()
    let query = supabase.from('inbox').select('*').order('created_at', { ascending: false })

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.direction) {
      query = query.contains('direction', [filters.direction])
    }

    if (filters.batch) {
      query = query.eq('batch', filters.batch)
    }

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).filter((item) => matchesQuery(item, filters.query))
  }, [])

  const fetchItems = useCallback(async (filters: InboxFilters = initialFilters) => {
    setLoading(true)
    setError(null)

    try {
      const nextItems = await getInboxItems(filters)
      setItems(nextItems)
      return nextItems
    } catch (err) {
      const message = err instanceof Error ? err.message : '收集池读取失败'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [getInboxItems, initialFilters])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchItems(initialFilters)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchItems, initialFilters])

  const createInboxItem = async (item: CreateInboxItemInput) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: '请先登录' } }

    const { data, error } = await supabase
      .from('inbox')
      .insert({
        ...item,
        user_id: user.id,
        pipeline_id: item.pipeline_id ?? null,
      })
      .select()
      .single()

    if (!error) await fetchItems()
    return { data, error }
  }

  const updateInboxItem = async (id: string, patch: UpdateInboxItemInput) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inbox')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (!error) await fetchItems()
    return { data, error }
  }

  const deleteInboxItem = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('inbox').delete().eq('id', id)
    if (!error) await fetchItems()
    return { error }
  }

  const batchArchiveInboxItems = async (ids: string[]) => {
    if (ids.length === 0) return { error: null }

    const supabase = createClient()
    const { error } = await supabase
      .from('inbox')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .in('id', ids)

    if (!error) await fetchItems()
    return { error }
  }

  const batchDeleteInboxItems = async (ids: string[]) => {
    if (ids.length === 0) return { error: null }

    const supabase = createClient()
    const { error } = await supabase.from('inbox').delete().in('id', ids)
    if (!error) await fetchItems()
    return { error }
  }

  const convertToApplication = async (inboxId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: '请先登录' } }

    const { data: inboxItem, error: inboxError } = await supabase
      .from('inbox')
      .select('*')
      .eq('id', inboxId)
      .single()

    if (inboxError || !inboxItem) {
      return { error: inboxError ?? { message: '收集池记录不存在' } }
    }

    const now = new Date().toISOString()
    const application: Omit<Application, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      company: inboxItem.company || '未填写公司',
      position: inboxItem.position || '待确认岗位',
      direction: inboxItem.direction ?? [],
      platform: inboxItem.source && inboxItem.source !== '速记' ? inboxItem.source : '其他',
      batch: inboxItem.batch || '日常实习',
      resume_id: null,
      status: '已投递',
      status_history: [{ status: '已投递', date: now, note: '从收集池转入投递管道' }],
      applied_date: today(),
      referral_code: inboxItem.link ?? '',
      interview_time: null,
      note: [inboxItem.note, inboxItem.raw_note].filter(Boolean).join('\n\n'),
      inbox_item_id: inboxItem.id,
      review_link: null,
      review_markdown: null,
    }

    const { data: created, error: createError } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single()

    if (createError || !created) {
      return { error: createError ?? { message: '投递记录创建失败' } }
    }

    const { error: updateError } = await supabase
      .from('inbox')
      .update({
        status: 'applied',
        pipeline_id: created.id,
        updated_at: now,
      })
      .eq('id', inboxItem.id)

    if (!updateError) await fetchItems()
    return { data: created, error: updateError }
  }

  return {
    items,
    loading,
    error,
    getInboxItems,
    refetch: fetchItems,
    createInboxItem,
    updateInboxItem,
    deleteInboxItem,
    batchArchiveInboxItems,
    batchDeleteInboxItems,
    convertToApplication,
    add: createInboxItem,
    update: updateInboxItem,
    remove: deleteInboxItem,
  }
}
