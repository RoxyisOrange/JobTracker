'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Application } from '@/lib/types'

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('applied_date', { ascending: false })

    if (error) setError(error.message)
    else setApplications(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetch])

  const add = async (
    item: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    const supabase = createClient()
    const { error } = await supabase.from('applications').insert(item)
    if (!error) await fetch()
    return error
  }

  const update = async (id: string, patch: Partial<Application>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('applications')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) await fetch()
    return error
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('applications').delete().eq('id', id)
    if (!error) await fetch()
    return error
  }

  return { applications, loading, error, refetch: fetch, add, update, remove }
}
