'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Resume } from '@/lib/types'

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setResumes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const add = async (
    item: Omit<Resume, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    const supabase = createClient()
    const { error } = await supabase.from('resumes').insert(item)
    if (!error) await fetch()
    return error
  }

  const update = async (id: string, patch: Partial<Resume>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('resumes')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) await fetch()
    return error
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('resumes').delete().eq('id', id)
    if (!error) await fetch()
    return error
  }

  const getDownloadUrl = async (filePath: string) => {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filePath, 60)
    return data?.signedUrl ?? null
  }

  return { resumes, loading, error, refetch: fetch, add, update, remove, getDownloadUrl }
}
