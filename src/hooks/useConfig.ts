'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserConfig } from '@/lib/types'
import { DEFAULT_TEXT_MODEL, DEFAULT_VISION_MODEL, NUDGE_DEFAULTS } from '@/lib/constants'

const DEFAULT_CONFIG: Omit<UserConfig, 'user_id' | 'created_at' | 'updated_at'> = {
  api_key_encrypted: null,
  text_model: DEFAULT_TEXT_MODEL,
  vision_model: DEFAULT_VISION_MODEL,
  directions: [],
  nudge_applied: NUDGE_DEFAULTS.applied,
  nudge_written: NUDGE_DEFAULTS.written,
  nudge_interview: NUDGE_DEFAULTS.interview,
}

export function useConfig() {
  const [config, setConfig] = useState<UserConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!data) {
      const { data: created } = await supabase
        .from('user_config')
        .insert({ user_id: user.id, ...DEFAULT_CONFIG })
        .select()
        .single()
      setConfig(created)
    } else {
      setConfig(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetch])

  const update = async (patch: Partial<Omit<UserConfig, 'user_id' | 'created_at' | 'updated_at'>>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !config) return

    const { error } = await supabase
      .from('user_config')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (!error) setConfig({ ...config, ...patch })
    return error
  }

  return { config, loading, update, refetch: fetch }
}
