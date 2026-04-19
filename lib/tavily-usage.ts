/**
 * Tavily 每日额度工具
 * 用于在服务端统一检查和记录每日请求次数
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { TavilyDailyUsage } from './types'

export const TAVILY_DAILY_LIMIT = 20
const TAVILY_DAILY_USAGE_TABLE = 'tavily_daily_usage'

function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('缺少 Supabase 环境变量')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export function getTodayUsageDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function getTavilyDailyUsage() {
  const supabase = getSupabaseAdminClient()
  const usageDate = getTodayUsageDate()

  const { data, error } = await supabase
    .from(TAVILY_DAILY_USAGE_TABLE)
    .select('*')
    .eq('usage_date', usageDate)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const usage = (data || {
    usage_date: usageDate,
    request_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }) as TavilyDailyUsage

  return {
    usageDate: usage.usage_date,
    requestCount: usage.request_count,
    remainingCount: Math.max(TAVILY_DAILY_LIMIT - usage.request_count, 0),
    limit: TAVILY_DAILY_LIMIT,
  }
}

export async function assertTavilyDailyLimit() {
  const usage = await getTavilyDailyUsage()

  if (usage.requestCount >= usage.limit) {
    throw new Error('今日资讯额度已用完，请明天再试')
  }

  return usage
}

export async function incrementTavilyDailyUsage() {
  const supabase = getSupabaseAdminClient()
  const usageDate = getTodayUsageDate()
  const currentUsage = await getTavilyDailyUsage()
  const nextRequestCount = currentUsage.requestCount + 1
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from(TAVILY_DAILY_USAGE_TABLE)
    .upsert(
      {
        usage_date: usageDate,
        request_count: nextRequestCount,
        updated_at: now,
      },
      { onConflict: 'usage_date' }
    )
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const usage = data as TavilyDailyUsage

  return {
    usageDate: usage.usage_date,
    requestCount: usage.request_count,
    remainingCount: Math.max(TAVILY_DAILY_LIMIT - usage.request_count, 0),
    limit: TAVILY_DAILY_LIMIT,
  }
}
