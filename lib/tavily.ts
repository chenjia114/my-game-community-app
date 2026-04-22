/**
 * Tavily 数据转换工具
 * 用于标准化服务端返回的资讯数据
 */
import { getApiUrl } from './api-base'
import type { TavilyNews, TavilySearchResponse } from './types'

export const DEFAULT_CHINESE_NEWS_DOMAINS = [
  '3dmgame.com',
  'gamersky.com',
  'ali213.net',
  '17173.com',
  'a9vg.com',
  'gcores.com',
  'tgbus.com',
  'duowan.com',
] as const

const DEFAULT_EXTRACT_ARTICLE_LIMIT = 19

export interface SearchOptions {
  query: string
  maxResults?: number
  topic?: 'general' | 'news' | 'finance'
  timeRange?: 'day' | 'week' | 'month' | 'year'
  includeDomains?: string[]
  excludeDomains?: string[]
}

export interface ExtractImageOptions {
  urls: string[]
}

export interface ExtractedArticleImage {
  url: string
  imageUrl?: string
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function isAllowedChineseNewsDomain(url: string, includeDomains: readonly string[]): boolean {
  const domain = extractDomain(url)
  return includeDomains.some((allowedDomain) => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`))
}

// 搜索结果（包含图片列表）
export interface SearchResult {
  results: TavilyNews[]
  images: string[]
}

/**
 * 将服务端返回的数据标准化为前端可用格式
 * @param data 服务端返回的 Tavily 搜索结果
 * @returns 标准化后的搜索结果
 */
export function normalizeTavilyResponse(data: Partial<TavilySearchResponse>): SearchResult {
  return {
    results: data.results || [],
    images: data.images || [],
  }
}

/**
 * 通过项目 API route 搜索游戏新闻
 * @param options 搜索选项
 * @returns 搜索结果（包含资讯列表和图片列表）
 */
export async function searchGameNews(options: SearchOptions): Promise<SearchResult> {
  const {
    query,
    maxResults = 10,
    topic = 'news',
    timeRange = 'week',
    includeDomains,
    excludeDomains,
  } = options

  const response = await fetch(getApiUrl('/api/news'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      maxResults,
      topic,
      timeRange,
      includeDomains,
      excludeDomains,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `新闻接口请求失败：${response.status}`)
  }

  return normalizeTavilyResponse(data)
}

export async function extractArticleImages(options: ExtractImageOptions): Promise<ExtractedArticleImage[]> {
  const response = await fetch(getApiUrl('/api/news'), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  })

  const data = (await response.json().catch(() => null)) as {
    items?: ExtractedArticleImage[]
    error?: string
  } | null

  if (!response.ok) {
    throw new Error(data?.error || `资讯图片提取失败：${response.status}`)
  }

  return data?.items || []
}

/**
 * 爬取指定关键词的资讯并转换为帖子格式
 * @param keyword 搜索关键词
 * @param maxResults 最大结果数
 * @returns 帖子数据数组（可直接插入数据库）
 */
export async function crawlNews(
  keyword: string,
  maxResults: number = 20,
  includeDomains: string[] = [...DEFAULT_CHINESE_NEWS_DOMAINS]
): Promise<Omit<import('./types').Post, 'id' | 'created_at'>[]> {
  const { results } = await searchGameNews({
    query: keyword,
    maxResults,
    topic: 'news',
    timeRange: 'week',
    includeDomains,
  })

  const filteredResults = results.filter((news) => isAllowedChineseNewsDomain(news.url, includeDomains))

  if (filteredResults.length === 0) {
    return []
  }

  const articleCandidates = filteredResults.slice(0, DEFAULT_EXTRACT_ARTICLE_LIMIT)
  const extractedImages = await extractArticleImages({
    urls: articleCandidates.map((news) => news.url),
  })
  const imageMap = new Map(
    extractedImages
      .filter((item) => item.imageUrl)
      .map((item) => [item.url, item.imageUrl as string])
  )

  return articleCandidates
    .map((news) => ({
      title: news.title,
      content: news.content,
      author_name: '系统资讯',
      source_type: 'crawl' as const,
      source_url: news.url,
      image_url: imageMap.get(news.url),
      likes_count: 0,
      comments_count: 0,
    }))
    .filter((post) => !!post.image_url)
}
