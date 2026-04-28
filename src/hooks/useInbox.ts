'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InboxItem } from '@/lib/types'

export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inbox')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setItems(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const add = async (item: Omit<InboxItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const supabase = createClient()
    const { error } = await supabase.from('inbox').insert(item)
    if (!error) await fetch()
    return error
  }

  const update = async (id: string, patch: Partial<InboxItem>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('inbox')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) await fetch()
    return error
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('inbox').delete().eq('id', id)
    if (!error) await fetch()
    return error
  }

  return { items, loading, error, refetch: fetch, add, update, remove }
}
