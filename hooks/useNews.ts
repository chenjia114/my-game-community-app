/**
 * useNews - 资讯获取与管理 Hook
 * 通过项目自己的新闻接口获取和发布资讯
 */
import { useState, useCallback } from 'react'
import { searchGameNews, crawlNews } from '@/lib/tavily'
import type { Post, TavilyNews } from '@/lib/types'
import { getApiUrl } from '@/lib/api-base'

export function useNews() {
  const [news, setNews] = useState<TavilyNews[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 搜索游戏资讯
   * @param keyword 搜索关键词
   * @param maxResults 最大结果数，默认 20
   */
  const fetchNews = useCallback(async function fetchNews(
    keyword: string,
    maxResults: number = 20
  ): Promise<TavilyNews[]> {
    setIsLoading(true)
    setError(null)

    try {
      const { results } = await searchGameNews({
        query: keyword,
        maxResults,
        topic: 'news',
        timeRange: 'week',
      })

      setNews(results)
      return results
    } catch (err: any) {
      const message = err?.message || '资讯获取失败'
      setError(message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 爬取资讯并发布为帖子
   * 用于管理后台手动爬取，或每日自动爬取
   * @param keyword 搜索关键词
   * @param maxResults 最大结果数，默认 20
   * @returns 成功插入的帖子数量
   */
  const crawlAndPublish = useCallback(async function crawlAndPublish(
    keyword: string,
    maxResults: number = 20
  ): Promise<number> {
    setIsLoading(true)
    setError(null)

    try {
      const posts = await crawlNews(keyword, maxResults)

      if (posts.length === 0) {
        setError('未找到相关资讯')
        return 0
      }

      const response = await fetch(getApiUrl('/api/news'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          posts,
        }),
      })

      const result = (await response.json().catch(() => null)) as {
        insertedCount?: number
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '资讯发布失败')
      }

      return result?.insertedCount || 0
    } catch (err: any) {
      const message = err?.message || '资讯发布失败'
      setError(message)
      return 0
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 获取最新的爬取资讯帖子
   * @param limit 获取数量，默认 20
   */
  const fetchCrawledPosts = useCallback(async function fetchCrawledPosts(
    limit: number = 20
  ): Promise<Post[]> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts?sourceType=crawl&limit=${encodeURIComponent(String(limit))}`)
      const result = (await response.json().catch(() => null)) as {
        posts?: Post[]
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '资讯读取失败')
      }

      return result?.posts || []
    } catch (err: any) {
      const message = err?.message || '资讯读取失败'
      setError(message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    news,
    isLoading,
    error,
    fetchNews,
    crawlAndPublish,
    fetchCrawledPosts,
  }
}
