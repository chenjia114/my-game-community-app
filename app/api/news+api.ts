/**
 * 新闻 API Route
 * 由服务端代理 Tavily Search，避免在客户端暴露密钥
 */
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import type { Post, TavilySearchResponse } from '@/lib/types'
import { assertTavilyDailyLimit, incrementTavilyDailyUsage } from '@/lib/tavily-usage'
import { normalizeTavilyResponse, type SearchOptions } from '@/lib/tavily'

const TAVILY_API_URL = 'https://api.tavily.com/search'

function getTavilyApiKey(): string {
  return process.env.TAVILY_API_KEY || ''
}

function buildTavilyPayload(options: SearchOptions, apiKey: string) {
  const { query, maxResults = 10, topic = 'news', timeRange = 'week' } = options

  return {
    api_key: apiKey,
    query: `gaming ${query}`,
    max_results: maxResults,
    topic,
    time_range: timeRange,
    include_images: true,
    include_answer: false,
  }
}

export async function POST(request: Request) {
  const apiKey = getTavilyApiKey()

  if (!apiKey) {
    return Response.json({ error: '服务端未配置 Tavily API Key' }, { status: 500 })
  }

  try {
    const body = (await request.json()) as SearchOptions

    if (!body.query || !body.query.trim()) {
      return Response.json({ error: 'query 不能为空' }, { status: 400 })
    }

    const usage = await assertTavilyDailyLimit()

    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildTavilyPayload(body, apiKey)),
    })

    const data = (await response.json()) as TavilySearchResponse & {
      detail?: { error?: string }
      error?: string
    }

    if (!response.ok) {
      return Response.json(
        {
          error: data.detail?.error || data.error || `Tavily 请求失败：${response.status}`,
        },
        { status: response.status }
      )
    }

    const updatedUsage = await incrementTavilyDailyUsage()

    return Response.json({
      ...normalizeTavilyResponse(data),
      usage: {
        ...usage,
        requestCount: updatedUsage.requestCount,
        remainingCount: updatedUsage.remainingCount,
      },
    })
  } catch (error) {
    console.error('新闻 API route 错误:', error)

    if (error instanceof Error) {
      if (error.message === '今日资讯额度已用完，请明天再试') {
        return Response.json({ error: error.message }, { status: 429 })
      }

      if (error.message.includes("public.tavily_daily_usage")) {
        return Response.json({ error: '请先在 Supabase 执行最新 schema，初始化 Tavily 每日额度表' }, { status: 500 })
      }
    }

    return Response.json({ error: '新闻接口内部错误' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      posts?: Array<Omit<Post, 'id' | 'created_at'>>
    }

    const posts = body.posts || []

    if (posts.length === 0) {
      return Response.json({ error: 'posts 不能为空' }, { status: 400 })
    }

    const sourceUrls = posts
      .map((post) => post.source_url)
      .filter((url): url is string => !!url)

    const supabase = getSupabaseAdminClient()
    const { data: existingPosts, error: existingPostsError } = sourceUrls.length > 0
      ? await supabase
          .from('posts')
          .select('source_url')
          .in('source_url', sourceUrls)
      : { data: [], error: null }

    if (existingPostsError) {
      return Response.json({ error: existingPostsError.message }, { status: 500 })
    }

    const existingUrls = new Set((existingPosts || []).map((post: { source_url?: string | null }) => post.source_url))
    const newPosts = posts.filter((post) => !post.source_url || !existingUrls.has(post.source_url))

    if (newPosts.length === 0) {
      return Response.json({ insertedCount: 0 })
    }

    const { error } = await supabase.from('posts').insert(newPosts)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ insertedCount: newPosts.length })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '资讯发布失败' }, { status: 500 })
  }
}
