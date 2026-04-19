/**
 * 数据库类型定义
 * 与 Supabase 数据库表结构对应
 */

// 用户类型
export interface User {
  id: string
  visitor_id: string
  nickname: string
  nickname_locked: boolean
  avatar_url?: string
  created_at: string
  nickname_updated_at?: string
}

// 帖子类型
export interface Post {
  id: string
  title: string
  content?: string
  author_name: string
  author_id?: string
  image_url?: string
  source_url?: string
  source_type: 'user' | 'crawl'
  likes_count: number
  comments_count: number
  created_at: string
}

// 评论类型（与数据库 comments 表一致）
export interface Comment {
  id: string
  post_id: string
  author_name: string
  content: string
  created_at: string
}

export interface AdminCredentials {
  password: string
}

// 点赞类型
export interface Like {
  id: string
  post_id?: string
  comment_id?: string
  visitor_id: string
  created_at: string
}

export interface TavilyDailyUsage {
  usage_date: string
  request_count: number
  created_at: string
  updated_at: string
}

// Tavily 搜索结果类型（字段名与 Tavily API 响应一致）
export interface TavilyNews {
  title: string
  url: string
  content: string        // API 返回的是 content，不是 description
  score: number
  published_date?: string
}

// Tavily 搜索完整响应类型
export interface TavilySearchResponse {
  results: TavilyNews[]
  images?: string[]      // 图片 URL 在顶层，不在每条结果里
  query?: string
  response_time?: number
}

// 创建帖子请求
export interface CreatePostRequest {
  title: string
  content?: string
  author_name: string
  author_id?: string
  image_url?: string
}

// 创建评论请求
export interface CreateCommentRequest {
  post_id: string
  author_name: string
  content: string
}

// 统计数据
export interface Stats {
  totalPosts: number
  totalComments: number
  totalUsers: number
  todayPosts: number
  todayComments: number
}
