/**
 * 新闻 API Route
 * 由服务端代理 Tavily Search，避免在客户端暴露密钥
 */
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import type { Post, TavilySearchResponse } from '@/lib/types'
import { assertTavilyDailyLimit, incrementTavilyDailyUsage } from '@/lib/tavily-usage'
import {
  DEFAULT_CHINESE_NEWS_DOMAINS,
  isAllowedChineseNewsDomain,
  normalizeTavilyResponse,
  type SearchOptions,
} from '@/lib/tavily'

const TAVILY_SEARCH_API_URL = 'https://api.tavily.com/search'
const TAVILY_EXTRACT_API_URL = 'https://api.tavily.com/extract'
const MAX_EXTRACT_URLS_PER_REQUEST = 19

function getTavilyApiKey(): string {
  return process.env.TAVILY_API_KEY || ''
}

function buildTavilyPayload(options: SearchOptions, apiKey: string) {
  const {
    query,
    maxResults = 10,
    topic = 'news',
    timeRange = 'week',
    includeDomains = [...DEFAULT_CHINESE_NEWS_DOMAINS],
    excludeDomains = [],
  } = options

  return {
    api_key: apiKey,
    query: `中国大陆 游戏资讯 ${query}`,
    max_results: maxResults,
    topic,
    time_range: timeRange,
    include_images: true,
    include_answer: false,
    include_domains: includeDomains,
    exclude_domains: excludeDomains,
  }
}

async function runTavilyRequest(url: string, body: Record<string, unknown>) {
  await assertTavilyDailyLimit()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage = data?.detail?.error || data?.error || `Tavily 请求失败：${response.status}`
    return {
      ok: false as const,
      status: response.status,
      errorMessage,
      data,
    }
  }

  await incrementTavilyDailyUsage()

  return {
    ok: true as const,
    status: response.status,
    data,
  }
}

function pickArticleImage(images: unknown): string | undefined {
  if (!Array.isArray(images)) {
    return undefined
  }

  for (const image of images) {
    if (typeof image === 'string' && image.trim()) {
      return image
    }
  }

  return undefined
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
    const tavilyResponse = await runTavilyRequest(TAVILY_SEARCH_API_URL, buildTavilyPayload(body, apiKey))

    if (!tavilyResponse.ok) {
      return Response.json({ error: tavilyResponse.errorMessage }, { status: tavilyResponse.status })
    }

    const data = tavilyResponse.data as TavilySearchResponse
    const includeDomains = body.includeDomains?.length
      ? body.includeDomains
      : [...DEFAULT_CHINESE_NEWS_DOMAINS]
    const filteredResults = (data.results || []).filter((item) =>
      isAllowedChineseNewsDomain(item.url, includeDomains)
    )
    const filteredData = {
      ...data,
      results: filteredResults,
      images: Array.isArray(data.images) ? data.images.slice(0, filteredResults.length) : data.images,
    }

    return Response.json({
      ...normalizeTavilyResponse(filteredData),
      usage: {
        ...usage,
        requestCount: usage.requestCount + 1,
        remainingCount: Math.max(usage.remainingCount - 1, 0),
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

export async function PATCH(request: Request) {
  const apiKey = getTavilyApiKey()

  if (!apiKey) {
    return Response.json({ error: '服务端未配置 Tavily API Key' }, { status: 500 })
  }

  try {
    const body = (await request.json()) as {
      urls?: string[]
    }

    const urls = Array.isArray(body.urls)
      ? body.urls.map((url) => url.trim()).filter(Boolean)
      : []

    if (urls.length === 0) {
      return Response.json({ error: 'urls 不能为空' }, { status: 400 })
    }

    const safeUrls = urls.slice(0, MAX_EXTRACT_URLS_PER_REQUEST)
    const items: Array<{ url: string; imageUrl?: string }> = []

    for (const url of safeUrls) {
      const tavilyResponse = await runTavilyRequest(TAVILY_EXTRACT_API_URL, {
        api_key: apiKey,
        urls: [url],
        include_images: true,
      })

      if (!tavilyResponse.ok) {
        if (tavilyResponse.status === 429 || tavilyResponse.status === 432 || tavilyResponse.status === 433) {
          return Response.json({ error: tavilyResponse.errorMessage }, { status: tavilyResponse.status })
        }

        items.push({ url })
        continue
      }

      const data = tavilyResponse.data as {
        results?: Array<{ url?: string; images?: string[] }>
      }
      const firstResult = Array.isArray(data.results) ? data.results[0] : null
      items.push({
        url,
        imageUrl: pickArticleImage(firstResult?.images),
      })
    }

    return Response.json({ items })
  } catch (error) {
    console.error('资讯图片提取失败:', error)

    if (error instanceof Error) {
      if (error.message === '今日资讯额度已用完，请明天再试') {
        return Response.json({ error: error.message }, { status: 429 })
      }

      if (error.message.includes("public.tavily_daily_usage")) {
        return Response.json({ error: '请先在 Supabase 执行最新 schema，初始化 Tavily 每日额度表' }, { status: 500 })
      }

      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '资讯图片提取失败' }, { status: 500 })
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
