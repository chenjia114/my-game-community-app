/**
 * useLikes - 点赞功能 Hook
 */
import { useState, useCallback } from 'react'

export function useLikes() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 点赞帖子
  const likePost = useCallback(async function likePost(postId: string, visitorId: string): Promise<boolean> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, visitorId }),
      })

      const result = (await response.json().catch(() => null)) as {
        liked?: boolean
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '点赞失败')
      }

      return result?.liked === true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 取消点赞帖子
  const unlikePost = useCallback(async function unlikePost(postId: string, visitorId: string): Promise<boolean> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, visitorId }),
      })

      const result = (await response.json().catch(() => null)) as {
        liked?: boolean
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '取消点赞失败')
      }

      return result?.liked === false
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 切换点赞状态
  const checkIsLiked = useCallback(async function checkIsLiked(
    postId: string,
    visitorId: string
  ): Promise<boolean> {
    try {
      const params = new URLSearchParams({ postId, visitorId })
      const response = await fetch(`/api/likes?${params.toString()}`)
      const result = (await response.json().catch(() => null)) as {
        liked?: boolean
        error?: string
      } | null

      if (!response.ok) {
        return false
      }

      return result?.liked === true
    } catch {
      return false
    }
  }, [])

  const toggleLike = useCallback(async function toggleLike(postId: string, visitorId: string): Promise<boolean> {
    const isLiked = await checkIsLiked(postId, visitorId)

    if (isLiked) {
      return await unlikePost(postId, visitorId)
    }

    return await likePost(postId, visitorId)
  }, [checkIsLiked, likePost, unlikePost])

  // 批量检查是否已点赞（用于列表页面）
  const checkLikedPosts = useCallback(async function checkLikedPosts(
    postIds: string[],
    visitorId: string
  ): Promise<Set<string>> {
    try {
      const response = await fetch(`/api/likes?visitorId=${encodeURIComponent(visitorId)}`)
      const result = (await response.json().catch(() => null)) as {
        likes?: Array<{ post_id?: string }>
        error?: string
      } | null

      if (!response.ok) {
        return new Set()
      }

      return new Set(
        (result?.likes || [])
          .map((item) => item.post_id)
          .filter((postId): postId is string => !!postId && postIds.includes(postId))
      )
    } catch {
      return new Set()
    }
  }, [])

  return {
    isLoading,
    error,
    likePost,
    unlikePost,
    toggleLike,
    checkIsLiked,
    checkLikedPosts,
  }
}
