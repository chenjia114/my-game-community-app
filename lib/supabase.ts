/**
 * Supabase 客户端配置
 * 文档: https://supabase.com/docs
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

// 从环境变量获取配置
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
const isNative = Platform.OS !== 'web'

// 创建 Supabase 客户端
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isNative ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// 导出数据库类型
export type { User, Post, Comment, Like, Stats } from './types'
export type { CreatePostRequest, CreateCommentRequest } from './types'
