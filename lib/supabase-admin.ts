import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getRequiredSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || ''

  if (!value) {
    throw new Error('SUPABASE_URL / EXPO_PUBLIC_SUPABASE_URL 未配置，当前无法执行服务端管理操作')
  }

  return value
}

function getRequiredServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!value) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 未配置，当前无法执行服务端管理操作')
  }

  return value
}

export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = getRequiredSupabaseUrl()
  const serviceRoleKey = getRequiredServiceRoleKey()

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
