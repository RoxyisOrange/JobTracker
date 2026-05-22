'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Application,
  ApplicationFilters,
  CreateApplicationInput,
  StatusHistoryEntry,
  UpdateApplicationInput,
} from '@/lib/types'
import { hasInterviewStatusConflict, isInterviewStatus } from '@/lib/status'

const EMPTY_FILTERS: ApplicationFilters = {}

function matchesQuery(app: Application, query?: string) {
  const keyword = query?.trim().toLowerCase()
  if (!keyword) return true

  return [app.company, app.position, app.note, app.referral_code].some((value) =>
    value.toLowerCase().includes(keyword)
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeApplication(input: CreateApplicationInput, userId: string) {
  const now = new Date().toISOString()
  const history = input.status_history?.length
    ? input.status_history
    : [{ status: input.status || '已投递', date: now, note: '创建投递记录' }]

  return {
    ...input,
    user_id: userId,
    direction: input.direction ?? [],
    status: input.status || '已投递',
    status_history: history,
    applied_date: input.applied_date || today(),
    resume_id: input.resume_id ?? null,
    interview_time: input.interview_time || null,
    inbox_item_id: input.inbox_item_id ?? null,
    review_link: input.review_link ?? null,
    review_markdown: input.review_markdown ?? null,
  }
}

function appendStatusHistory(app: Application, nextStatus: string, note = '状态更新'): StatusHistoryEntry[] {
  if (app.status === nextStatus) return app.status_history ?? []
  return [
    ...(app.status_history ?? []),
    { status: nextStatus, date: new Date().toISOString(), note },
  ]
}

function validationError(message: string) {
  return { data: null, error: { message } }
}

export function useApplications(initialFilters: ApplicationFilters = EMPTY_FILTERS) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getApplications = useCallback(async (filters: ApplicationFilters = {}) => {
    const supabase = createClient()
    let query = supabase
      .from('applications')
      .select('*')
      .order('applied_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.direction) query = query.contains('direction', [filters.direction])
    if (filters.platform) query = query.eq('platform', filters.platform)
    if (filters.batch) query = query.eq('batch', filters.batch)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).filter((app) => matchesQuery(app, filters.query))
  }, [])

  const fetchApplications = useCallback(async (filters: ApplicationFilters = initialFilters) => {
    setLoading(true)
    setError(null)

    try {
      const next = await getApplications(filters)
      setApplications(next)
      return next
    } catch (err) {
      const message = err instanceof Error ? err.message : '投递记录读取失败'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [getApplications, initialFilters])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchApplications(initialFilters)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchApplications, initialFilters])

  const createApplication = async (item: CreateApplicationInput) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return validationError('请先登录')

    if (hasInterviewStatusConflict(item.status, item.interview_time)) {
      return validationError('已填写面试时间时，状态不能是已投递或笔试')
    }

    const { data, error } = await supabase
      .from('applications')
      .insert(normalizeApplication(item, user.id))
      .select()
      .single()

    if (!error) await fetchApplications()
    return { data, error }
  }

  const updateApplication = async (id: string, patch: UpdateApplicationInput) => {
    const current = applications.find((app) => app.id === id)
    const nextPatch = { ...patch }
    const nextStatus = patch.status ?? current?.status
    const hasInterviewTimePatch = Object.prototype.hasOwnProperty.call(patch, 'interview_time')
    const nextInterviewTime = hasInterviewTimePatch ? patch.interview_time : current?.interview_time

    if (nextStatus && hasInterviewStatusConflict(nextStatus, nextInterviewTime)) {
      return validationError('已填写面试时间时，状态不能是已投递或笔试')
    }

    if (current && patch.status && patch.status !== current.status) {
      nextPatch.status_history = appendStatusHistory(current, patch.status)

      if (
        !hasInterviewTimePatch &&
        isInterviewStatus(current.status) &&
        isInterviewStatus(patch.status)
      ) {
        nextPatch.interview_time = null
      }
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('applications')
      .update({ ...nextPatch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (!error) await fetchApplications()
    return { data, error }
  }

  const deleteApplication = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('applications').delete().eq('id', id)
    if (!error) await fetchApplications()
    return { error }
  }

  const batchUpdateStatus = async (ids: string[], newStatus: string) => {
    if (ids.length === 0) return { error: null }

    const supabase = createClient()
    const now = new Date().toISOString()

    for (const id of ids) {
      const current = applications.find((app) => app.id === id)
      if (current && hasInterviewStatusConflict(newStatus, current.interview_time)) {
        return {
          error: {
            message: `「${current.company} - ${current.position}」已填写面试时间，不能改为已投递或笔试`,
          },
        }
      }
      const status_history = current
        ? appendStatusHistory(current, newStatus, '批量状态更新')
        : [{ status: newStatus, date: now, note: '批量状态更新' }]
      const shouldClearInterviewTime = Boolean(
        current &&
        current.status !== newStatus &&
        isInterviewStatus(current.status) &&
        isInterviewStatus(newStatus)
      )
      const interviewPatch = shouldClearInterviewTime ? { interview_time: null } : {}

      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus, status_history, ...interviewPatch, updated_at: now })
        .eq('id', id)

      if (error) return { error }
    }

    await fetchApplications()
    return { error: null }
  }

  const batchDeleteApplications = async (ids: string[]) => {
    if (ids.length === 0) return { error: null }

    const supabase = createClient()
    const { error } = await supabase.from('applications').delete().in('id', ids)
    if (!error) await fetchApplications()
    return { error }
  }

  const findDuplicate = (company: string, position: string, excludeId?: string) => {
    const normalizedCompany = company.trim().toLowerCase()
    const normalizedPosition = position.trim().toLowerCase()
    if (!normalizedCompany || !normalizedPosition) return null

    return applications.find((app) =>
      app.id !== excludeId &&
      app.company.trim().toLowerCase() === normalizedCompany &&
      app.position.trim().toLowerCase() === normalizedPosition
    ) ?? null
  }

  return {
    applications,
    loading,
    error,
    getApplications,
    refetch: fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    batchUpdateStatus,
    batchDeleteApplications,
    findDuplicate,
    add: createApplication,
    update: updateApplication,
    remove: deleteApplication,
  }
}
