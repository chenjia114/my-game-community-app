/**
 * usePosts - 帖子 CRUD Hook
 */
import { useState, useCallback } from 'react'
import type { Post, CreatePostRequest } from '@/lib/types'
import { getApiUrl } from '@/lib/api-base'

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取帖子列表
  const fetchPosts = useCallback(async function fetchPosts(options?: {
    sourceType?: 'user' | 'crawl' | 'all'
    limit?: number
    orderBy?: 'created_at' | 'likes_count' | 'comments_count'
  }): Promise<Post[]> {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (options?.sourceType) {
        params.set('sourceType', options.sourceType)
      }

      if (options?.limit) {
        params.set('limit', String(options.limit))
      }

      if (options?.orderBy) {
        params.set('orderBy', options.orderBy)
      }

      const response = await fetch(getApiUrl(`/api/posts${params.toString() ? `?${params.toString()}` : ''}`))
      const result = (await response.json().catch(() => null)) as {
        posts?: Post[]
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '读取帖子失败')
      }

      const postsData = result?.posts || []
      setPosts(postsData)
      return postsData
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 获取单个帖子
  const fetchPost = useCallback(async function fetchPost(postId: string): Promise<Post | null> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`/api/posts?id=${encodeURIComponent(postId)}`))
      const result = (await response.json().catch(() => null)) as {
        post?: Post | null
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '读取帖子失败')
      }

      return result?.post || null
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 获取单条资讯帖子
  const fetchNewsPost = useCallback(async function fetchNewsPost(postId: string): Promise<Post | null> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`/api/posts?id=${encodeURIComponent(postId)}`))
      const result = (await response.json().catch(() => null)) as {
        post?: Post | null
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '读取资讯失败')
      }

      const post = result?.post || null

      if (!post || post.source_type !== 'crawl') {
        return null
      }

      return post
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createPost = useCallback(async function createPost(post: CreatePostRequest): Promise<Post | null> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/api/posts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      })

      const result = (await response.json().catch(() => null)) as {
        post?: Post
        error?: string
      } | null

      if (!response.ok || !result?.post) {
        throw new Error(result?.error || '创建帖子失败')
      }

      setPosts((prev) => [result.post as Post, ...prev])
      return result.post as Post
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 删除帖子
  const deletePost = useCallback(async function deletePost(postId: string): Promise<boolean> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/api/admin/posts'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      })
      const result = (await response.json().catch(() => null)) as {
        success?: boolean
        error?: string
      } | null

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || '删除帖子失败')
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 搜索帖子
  const searchPosts = useCallback(async function searchPosts(keyword: string): Promise<Post[]> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`/api/posts?query=${encodeURIComponent(keyword)}&limit=50`))
      const result = (await response.json().catch(() => null)) as {
        posts?: Post[]
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '搜索帖子失败')
      }

      return result?.posts || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 批量插入帖子（用于爬取结果）
  const insertPosts = useCallback(async function insertPosts(
    posts: Omit<Post, 'id' | 'created_at' | 'likes_count' | 'comments_count'>[]
  ): Promise<boolean> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/api/news'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: posts[0]?.title || '游戏',
          maxResults: posts.length || 10,
          topic: 'news',
          timeRange: 'week',
        }),
      })

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(result?.error || '批量插入帖子失败')
      }

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    fetchPost,
    fetchNewsPost,
    createPost,
    deletePost,
    searchPosts,
    insertPosts,
  }
}
