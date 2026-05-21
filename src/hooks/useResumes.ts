'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Resume } from '@/lib/types'

const BUCKET = 'resumes'

export interface ResumeInput {
  name: string
  direction: string[]
  note: string
  file?: File | null
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\-\u4e00-\u9fa5]+/g, '_')
}

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResumes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setResumes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchResumes()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchResumes])

  const uploadPdf = async (resumeId: string, file: File) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: '请先登录' } }

    const filePath = `${user.id}/${resumeId}_${safeFileName(file.name)}`
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
      contentType: file.type || 'application/pdf',
      upsert: true,
    })

    if (error) return { data: null, error }

    return {
      data: {
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
      },
      error: null,
    }
  }

  const createResume = async (input: ResumeInput) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: '请先登录' } }

    const { data: created, error: createError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        name: input.name,
        direction: input.direction,
        note: input.note,
        file_path: null,
        file_name: null,
        file_size: null,
      })
      .select()
      .single()

    if (createError || !created) return { data: created, error: createError }

    if (input.file) {
      const uploaded = await uploadPdf(created.id, input.file)
      if (uploaded.error) return { data: created, error: uploaded.error }

      const { data, error } = await supabase
        .from('resumes')
        .update({ ...uploaded.data, updated_at: new Date().toISOString() })
        .eq('id', created.id)
        .select()
        .single()

      await fetchResumes()
      return { data, error }
    }

    await fetchResumes()
    return { data: created, error: null }
  }

  const updateResume = async (id: string, input: Partial<ResumeInput>) => {
    const supabase = createClient()
    const current = resumes.find((resume) => resume.id === id)
    const patch: Partial<Resume> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) patch.name = input.name
    if (input.direction !== undefined) patch.direction = input.direction
    if (input.note !== undefined) patch.note = input.note

    if (input.file) {
      if (current?.file_path) {
        await supabase.storage.from(BUCKET).remove([current.file_path])
      }

      const uploaded = await uploadPdf(id, input.file)
      if (uploaded.error) return { data: null, error: uploaded.error }
      Object.assign(patch, uploaded.data)
    }

    const { data, error } = await supabase
      .from('resumes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (!error) await fetchResumes()
    return { data, error }
  }

  const deleteResume = async (resume: Resume) => {
    const supabase = createClient()
    if (resume.file_path) {
      await supabase.storage.from(BUCKET).remove([resume.file_path])
    }

    const { error } = await supabase.from('resumes').delete().eq('id', resume.id)
    if (!error) await fetchResumes()
    return { error }
  }

  const clearResumePdf = async (resume: Resume) => {
    const supabase = createClient()
    if (resume.file_path) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([resume.file_path])
      if (removeError) return { error: removeError }
    }

    const { error } = await supabase
      .from('resumes')
      .update({
        file_path: null,
        file_name: null,
        file_size: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resume.id)

    if (!error) await fetchResumes()
    return { error }
  }

  const getDownloadUrl = async (filePath: string) => {
    const supabase = createClient()
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 60)
    return data?.signedUrl ?? null
  }

  const previewResume = async (resume: Resume) => {
    if (!resume.file_path) return
    const url = await getDownloadUrl(resume.file_path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return {
    resumes,
    loading,
    error,
    refetch: fetchResumes,
    createResume,
    updateResume,
    deleteResume,
    clearResumePdf,
    getDownloadUrl,
    previewResume,
    add: createResume,
    update: updateResume,
    remove: deleteResume,
  }
}
