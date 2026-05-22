import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

async function removeResumeFiles(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: resumes, error: resumeError } = await supabase
    .from('resumes')
    .select('file_path')
    .eq('user_id', userId)

  if (resumeError) return resumeError

  const { data: listedFiles, error: listError } = await supabase
    .storage
    .from('resumes')
    .list(userId, { limit: 1000 })

  if (listError) return listError

  const paths = Array.from(new Set([
    ...(resumes ?? []).map((resume) => resume.file_path).filter((path): path is string => Boolean(path)),
    ...(listedFiles ?? []).map((file) => `${userId}/${file.name}`),
  ]))

  if (paths.length === 0) return null

  const { error } = await supabase.storage.from('resumes').remove(paths)
  return error
}

async function deleteAuthUserIfConfigured(userId: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) return false

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw error
  return true
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return jsonError('请先登录', 401)
  }

  const fileError = await removeResumeFiles(supabase, user.id)
  if (fileError) return jsonError(fileError.message)

  const deletions = await Promise.all([
    supabase.from('applications').delete().eq('user_id', user.id),
    supabase.from('inbox').delete().eq('user_id', user.id),
    supabase.from('resumes').delete().eq('user_id', user.id),
    supabase.from('user_config').delete().eq('user_id', user.id),
  ])

  const deleteError = deletions.find((result) => result.error)?.error
  if (deleteError) return jsonError(deleteError.message)

  let authUserDeleted = false
  try {
    authUserDeleted = await deleteAuthUserIfConfigured(user.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auth 用户删除失败'
    return jsonError(message)
  }

  return NextResponse.json({ ok: true, authUserDeleted })
}
