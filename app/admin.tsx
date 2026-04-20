import { useMemo, useState, useCallback } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import { CommentItem } from '@/components/CommentItem'
import { PostCard } from '@/components/PostCard'
import { Toast } from '@/components/Toast'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { useComments } from '@/hooks/useComments'
import { useNews } from '@/hooks/useNews'
import { usePosts } from '@/hooks/usePosts'
import { getApiUrl } from '@/lib/api-base'
import type { Comment, Post } from '@/lib/types'

type AdminApiError = {
  error?: string
}

type AdminDeleteCommentSuccess = {
  success?: boolean
  deletedCommentId?: string
  postId?: string
}

type ToastState = {
  visible: boolean
  message: string
  variant?: 'success' | 'error'
}

export default function AdminScreen() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [isCrawling, setIsCrawling] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', variant: 'success' })

  const { fetchPosts, isLoading: postsLoading } = usePosts()
  const { fetchRecentComments, isLoading: commentsLoading } = useComments()
  const { crawlAndPublish } = useNews()

  const isBusy = postsLoading || commentsLoading || isAuthenticating || isLoadingDashboard || isRefreshingDashboard || isMutating || isCrawling

  const userPosts = useMemo(
    () => posts.filter((post) => post.source_type === 'user'),
    [posts]
  )
  const crawlPosts = useMemo(
    () => posts.filter((post) => post.source_type === 'crawl'),
    [posts]
  )

  const recentCommentsWithPost = useMemo(() => {
    const postTitleMap = new Map(posts.map((post) => [post.id, post.title]))

    return comments.map((comment) => ({
      comment,
      postTitle: postTitleMap.get(comment.post_id) || '原帖可能已删除',
    }))
  }, [comments, posts])

  const handleUnlock = async () => {
    const trimmedPassword = password.trim()

    if (!trimmedPassword) {
      showToast('请输入管理员密码', 'error')
      return
    }

    setIsAuthenticating(true)
    setDashboardError(null)
    showToast('正在验证管理员密码...')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(getApiUrl('/api/admin/posts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: trimmedPassword,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const rawText = await response.text()
      let result: AdminApiError = {}

      if (rawText) {
        try {
          result = JSON.parse(rawText) as AdminApiError
        } catch {
          result = { error: rawText }
        }
      }

      if (response.status === 401) {
        showToast(result.error || '管理员密码不对，请重新输入', 'error')
        return
      }

      if (!response.ok) {
        showToast(result.error || '管理员验证接口异常，请稍后再试', 'error')
        return
      }

      setIsUnlocked(true)
      showToast('管理员验证成功，正在加载管理数据...')
      await loadAdminData('initial')
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? '管理员验证超时，请检查网络或接口地址'
          : error instanceof Error
            ? error.message
            : '管理员验证失败，请稍后再试'
      showToast(message, 'error')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const loadAdminData = async (mode: 'initial' | 'refresh' = 'refresh') => {
    if (mode === 'initial') {
      setIsLoadingDashboard(true)
    } else {
      setIsRefreshingDashboard(true)
    }
    setDashboardError(null)

    try {
      const [allPosts, recentComments] = await Promise.all([
        fetchPosts({ sourceType: 'all', limit: 50 }),
        fetchRecentComments({ limit: 50 }),
      ])

      setPosts(allPosts)
      setComments(recentComments)
    } catch (error) {
      const message = error instanceof Error ? error.message : '管理数据加载失败，请稍后再试'
      setDashboardError(message)
      showToast(message, 'error')
    } finally {
      if (mode === 'initial') {
        setIsLoadingDashboard(false)
      } else {
        setIsRefreshingDashboard(false)
      }
    }
  }

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: '', variant: 'success' })
  }, [])

  const showToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, variant })
  }, [])

  const deletePostDirectly = useCallback(async (post: Post) => {
    setIsMutating(true)

    try {
      const response = await fetch(getApiUrl('/api/admin/posts'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          password: password.trim(),
        }),
      })

      const rawText = await response.text()
      let result: AdminApiError = {}

      if (rawText) {
        try {
          result = JSON.parse(rawText) as AdminApiError
        } catch {
          result = { error: rawText }
        }
      }

      if (!response.ok) {
        const message = result.error || `接口返回 ${response.status}${rawText ? `\n${rawText}` : ''}`
        showToast(message, 'error')
        return
      }

      setPosts((prev) => prev.filter((item) => item.id !== post.id))
      setComments((prev) => prev.filter((item) => item.post_id !== post.id))
      showToast('帖子已删除')
      await loadAdminData('refresh')
    } catch (error) {
      const message = error instanceof Error ? error.message : '帖子删除失败，请稍后再试'
      showToast(message, 'error')
    } finally {
      setIsMutating(false)
    }
  }, [loadAdminData, password, showToast])

  const handleDeletePost = useCallback((post: Post) => {
    if (isBusy) {
      return
    }

    void deletePostDirectly(post)
  }, [deletePostDirectly, isBusy])

  const handleDeleteComment = (comment: Comment) => {
    if (isBusy) {
      return
    }

    Alert.alert('删除评论', '确定要删除这条评论吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setIsMutating(true)
          showToast(`正在删除评论：${comment.content.slice(0, 12) || comment.id}`, 'success')

          try {
            const response = await fetch(getApiUrl('/api/admin/comments'), {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                commentId: comment.id,
                password: password.trim(),
              }),
            })

            const rawText = await response.text()
            let errorResult: AdminApiError = {}
            let successResult: AdminDeleteCommentSuccess = {}

            if (rawText) {
              try {
                const parsed = JSON.parse(rawText) as AdminApiError & AdminDeleteCommentSuccess
                errorResult = parsed
                successResult = parsed
              } catch {
                errorResult = { error: rawText }
              }
            }

            if (!response.ok || !successResult.success) {
              const message = errorResult.error || `接口返回 ${response.status}${rawText ? `\n${rawText}` : ''}`
              showToast(message, 'error')
              return
            }

            showToast('评论已删除')
            setComments((prev) => prev.filter((item) => item.id !== comment.id))
            setPosts((prev) => prev.map((post) => {
              if (post.id !== comment.post_id) {
                return post
              }

              return {
                ...post,
                comments_count: Math.max(post.comments_count - 1, 0),
              }
            }))
            await loadAdminData('refresh')
          } catch (error) {
            const message = error instanceof Error ? error.message : '评论删除失败，请稍后再试'
            showToast(message, 'error')
          } finally {
            setIsMutating(false)
          }
        },
      },
    ])
  }

  const handleCrawlNews = async () => {
    setIsCrawling(true)
    showToast('正在抓取资讯...')

    try {
      const insertedCount = await crawlAndPublish('游戏', 10)
      if (insertedCount === 0) {
        showToast('本次没有新的资讯内容可发布', 'error')
        return
      }

      await loadAdminData('refresh')
      showToast(`抓取成功，本次新增 ${insertedCount} 条资讯`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '资讯抓取失败，请稍后再试'
      showToast(message, 'error')
    } finally {
      setIsCrawling(false)
    }
  }

  if (!isUnlocked) {
    return (
      <ThemedView style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          variant={toast.variant}
          onHide={hideToast}
        />
        <View style={styles.authCard}>
          <MaterialIcons name="admin-panel-settings" size={56} color={Colors.light.primary} />
          <ThemedText style={styles.title}>管理员入口</ThemedText>
          <ThemedText style={styles.subtitle}>输入管理员密码后，才能管理帖子、评论和资讯</ThemedText>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="输入管理员密码"
            placeholderTextColor={Colors.light.textMuted}
            secureTextEntry
          />
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              isAuthenticating && styles.buttonDisabled,
              pressed && !isAuthenticating && styles.pressablePressed,
            ]}
            onPress={handleUnlock}
            disabled={isAuthenticating}
          >
            <MaterialIcons name="lock-open" size={18} color="#fff" />
            <ThemedText style={styles.primaryButtonText}>
              {isAuthenticating ? '验证中...' : '进入管理台'}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={hideToast}
      />
      <FlatList
        data={recentCommentsWithPost}
        keyExtractor={({ comment }) => comment.id}
        ListHeaderComponent={
          <View style={styles.content}>
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>管理操作</ThemedText>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
                  onPress={() => {
                    void loadAdminData('refresh')
                  }}
                  disabled={isBusy}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="refresh" size={18} color="#fff" />
                  <ThemedText style={styles.primaryButtonText}>
                    {isRefreshingDashboard ? '刷新中...' : '刷新数据'}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, isBusy && styles.buttonDisabled]}
                  onPress={handleCrawlNews}
                  disabled={isBusy}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="travel-explore" size={18} color="#fff" />
                  <ThemedText style={styles.secondaryButtonText}>抓取资讯</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>内容概览</ThemedText>
              {dashboardError ? (
                <ThemedText style={styles.dashboardErrorText}>{dashboardError}</ThemedText>
              ) : null}
              {isLoadingDashboard ? (
                <ThemedText style={styles.dashboardLoadingText}>管理员验证已通过，正在加载管理数据...</ThemedText>
              ) : null}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>{posts.length}</ThemedText>
                  <ThemedText style={styles.statLabel}>全部帖子</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>{userPosts.length}</ThemedText>
                  <ThemedText style={styles.statLabel}>用户帖子</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>{crawlPosts.length}</ThemedText>
                  <ThemedText style={styles.statLabel}>抓取资讯</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>{comments.length}</ThemedText>
                  <ThemedText style={styles.statLabel}>最新评论</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>最近用户帖子</ThemedText>
              <ThemedText style={styles.sectionHint}>可直接删除明显违规或测试内容，也能进入详情核对上下文</ThemedText>
              {userPosts.length === 0 ? (
                <ThemedText style={styles.emptyText}>暂时还没有用户帖子</ThemedText>
              ) : (
                userPosts.map((post) => (
                  <View key={post.id} style={styles.postRow}>
                    <PostCard
                      post={post}
                      variant="compact"
                      showAuthor={false}
                      onPress={() => router.push(`/post/${post.id}` as any)}
                    />
                    <View style={styles.postActions}>
                      <TouchableOpacity
                        style={[styles.viewDetailButton, styles.actionButton]}
                        onPress={() => router.push(`/post/${post.id}` as any)}
                        activeOpacity={0.8}
                        disabled={isBusy}
                      >
                        <MaterialIcons name="open-in-new" size={18} color="#fff" />
                        <ThemedText style={styles.viewDetailButtonText}>查看详情</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deleteButton, styles.actionButton, isBusy && styles.buttonDisabled]}
                        onPress={() => handleDeletePost(post)}
                        activeOpacity={0.8}
                        disabled={isBusy}
                      >
                        <MaterialIcons name={isBusy ? 'hourglass-top' : 'delete-outline'} size={18} color="#fff" />
                        <ThemedText style={styles.deleteButtonText}>
                          {isBusy ? '删除中...' : '删除帖子'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>最近抓取资讯</ThemedText>
              <ThemedText style={styles.sectionHint}>系统抓取的资讯也可以像用户帖子一样直接查看和删除</ThemedText>
              {crawlPosts.length === 0 ? (
                <ThemedText style={styles.emptyText}>暂时还没有抓取资讯</ThemedText>
              ) : (
                crawlPosts.map((post) => (
                  <View key={post.id} style={styles.postRow}>
                    <PostCard
                      post={post}
                      variant="compact"
                      showAuthor={false}
                      onPress={() => router.push(`/post/${post.id}` as any)}
                    />
                    <View style={styles.postActions}>
                      <TouchableOpacity
                        style={[styles.viewDetailButton, styles.actionButton]}
                        onPress={() => router.push(`/post/${post.id}` as any)}
                        activeOpacity={0.8}
                        disabled={isBusy}
                      >
                        <MaterialIcons name="open-in-new" size={18} color="#fff" />
                        <ThemedText style={styles.viewDetailButtonText}>查看详情</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deleteButton, styles.actionButton, isBusy && styles.buttonDisabled]}
                        onPress={() => handleDeletePost(post)}
                        activeOpacity={0.8}
                        disabled={isBusy}
                      >
                        <MaterialIcons name={isBusy ? 'hourglass-top' : 'delete-outline'} size={18} color="#fff" />
                        <ThemedText style={styles.deleteButtonText}>
                          {isBusy ? '删除中...' : '删除帖子'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>最新评论</ThemedText>
              <ThemedText style={styles.sectionHint}>这里会直接展示全站最近评论，方便上线后快速治理</ThemedText>
            </View>

            {isAuthenticating || isLoadingDashboard || isRefreshingDashboard || isMutating || isCrawling ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <ThemedText style={styles.loadingText}>
                  {isAuthenticating
                    ? '正在验证管理员密码...'
                    : isLoadingDashboard
                      ? '正在加载管理数据...'
                      : isRefreshingDashboard
                        ? '正在刷新管理数据...'
                        : isMutating
                          ? '正在执行管理操作，请稍候...'
                          : '正在抓取资讯...'}
                </ThemedText>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <View style={styles.commentContextCard}>
              <ThemedText style={styles.commentContextLabel}>所属帖子</ThemedText>
              <ThemedText style={styles.commentContextTitle}>{item.postTitle}</ThemedText>
              <TouchableOpacity
                style={[styles.commentDetailButton, styles.actionButton, isBusy && styles.buttonDisabled]}
                onPress={() => router.push(`/post/${item.comment.post_id}` as any)}
                activeOpacity={0.8}
                disabled={isBusy}
              >
                <MaterialIcons name="open-in-new" size={16} color="#fff" />
                <ThemedText style={styles.commentDetailButtonText}>查看原帖</ThemedText>
              </TouchableOpacity>
            </View>
            <CommentItem comment={item.comment} showDelete onDelete={handleDeleteComment} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <MaterialIcons name="chat-bubble-outline" size={44} color={Colors.light.textMuted} />
            <ThemedText style={styles.emptyText}>当前没有可管理的评论</ThemedText>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  actionButton: {
    position: 'relative',
    zIndex: 2,
  },
  authCard: {
    margin: 16,
    marginTop: 32,
    padding: 24,
    borderRadius: 20,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: Colors.light.textSecondary,
  },
  input: {
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.foreground,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pressablePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  postRow: {
    marginTop: 12,
  },
  postActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    gap: 10,
  },
  commentRow: {
    marginBottom: 12,
  },
  commentContextCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  commentContextLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  commentContextTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  commentDetailButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  commentDetailButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  viewDetailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewDetailButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.destructive,
    paddingVertical: 12,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 16,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  dashboardLoadingText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  dashboardErrorText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.destructive,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    color: Colors.light.textSecondary,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingHorizontal: 24,
  },
})
