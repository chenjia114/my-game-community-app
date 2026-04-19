import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getRequiredEnv(name: 'EXPO_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name] || ''

  if (!value) {
    throw new Error(`${name} 未配置，当前无法执行服务端管理操作`)
  }

  return value
}

export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = getRequiredEnv('EXPO_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
