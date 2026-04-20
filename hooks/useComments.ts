/**
 * useComments - 评论 CRUD Hook
 */
import { useState, useCallback } from 'react'
import type { Comment, CreateCommentRequest } from '@/lib/types'
import { getApiUrl } from '@/lib/api-base'

interface FetchRecentCommentsOptions {
  limit?: number
}

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取帖子的评论列表
  const fetchComments = useCallback(async function fetchComments(postId: string): Promise<Comment[]> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`/api/comments?postId=${encodeURIComponent(postId)}`))
      const result = (await response.json().catch(() => null)) as {
        comments?: Comment[]
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '读取评论失败')
      }

      const commentsData = result?.comments || []
      setComments(commentsData)
      return commentsData
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 获取最新评论列表
  const fetchRecentComments = useCallback(async function fetchRecentComments(
    options?: FetchRecentCommentsOptions
  ): Promise<Comment[]> {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (options?.limit) {
        params.set('limit', String(options.limit))
      }

      const queryString = params.toString()
      const response = await fetch(getApiUrl(`/api/comments${queryString ? `?${queryString}` : ''}`))
      const result = (await response.json().catch(() => null)) as {
        comments?: Comment[]
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '读取最新评论失败')
      }

      const commentsData = result?.comments || []
      setComments(commentsData)
      return commentsData
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 创建评论
  const createComment = useCallback(async function createComment(
    comment: CreateCommentRequest
  ): Promise<Comment | null> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/api/comments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comment),
      })

      const result = (await response.json().catch(() => null)) as {
        comment?: Comment
        error?: string
      } | null

      if (!response.ok || !result?.comment) {
        throw new Error(result?.error || '创建评论失败')
      }

      const newComment = result.comment as Comment

      setComments((prev) => {
        if (prev.some((item) => item.id === newComment.id)) {
          return prev
        }

        return [...prev, newComment]
      })
      return newComment
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 删除评论
  const deleteComment = useCallback(async function deleteComment(commentId: string): Promise<boolean> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/api/admin/comments'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId }),
      })
      const result = (await response.json().catch(() => null)) as {
        success?: boolean
        error?: string
      } | null

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || '删除评论失败')
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 获取评论数量
  const getCommentCount = useCallback(async function getCommentCount(postId: string): Promise<number> {
    try {
      const response = await fetch(getApiUrl(`/api/comments?postId=${encodeURIComponent(postId)}`))
      const result = (await response.json().catch(() => null)) as {
        comments?: Comment[]
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(result?.error || '读取评论数量失败')
      }

      return result?.comments?.length || 0
    } catch (err: any) {
      setError(err.message)
      return 0
    }
  }, [])

  return {
    comments,
    isLoading,
    error,
    fetchComments,
    fetchRecentComments,
    createComment,
    deleteComment,
    getCommentCount,
  }
}
