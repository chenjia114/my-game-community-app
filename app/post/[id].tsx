/**
 * 帖子详情页
 * 展示帖子内容、评论列表，以及点赞和评论发布交互
 */
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { MaterialIcons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'

import { CommentItem } from '@/components/CommentItem'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { usePosts } from '@/hooks/usePosts'
import { useComments } from '@/hooks/useComments'
import { useLikes } from '@/hooks/useLikes'
import { useVisitor } from '@/hooks/useVisitor'
import type { Comment, Post } from '@/lib/types'

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { fetchPost } = usePosts()
  const { comments, fetchComments, createComment, isLoading: commentsLoading } = useComments()
  const { toggleLike, checkIsLiked, error: likeError } = useLikes()
  const { visitorId, nickname, status: visitorStatus, initVisitor } = useVisitor()

  const postId = useMemo(() => {
    if (!id) return ''
    return Array.isArray(id) ? id[0] || '' : id
  }, [id])

  const [hasMounted, setHasMounted] = useState(false)
  const [post, setPost] = useState<Post | null>(null)
  const [isScreenLoading, setIsScreenLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isTogglingLike, setIsTogglingLike] = useState(false)
  const [displayLikesCount, setDisplayLikesCount] = useState(0)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted) return

    if (!postId) {
      setPost(null)
      setIsScreenLoading(false)
      return
    }

    let isMounted = true

    async function loadPostDetail() {
      setPost(null)
      setIsScreenLoading(true)

      try {
        const currentPost = await fetchPost(postId)

        if (!isMounted) return

        setPost(currentPost)
        setDisplayLikesCount(currentPost?.likes_count || 0)
        setIsLiked(false)
      } catch {
        if (isMounted) {
          setPost(null)
          setDisplayLikesCount(0)
        }
      } finally {
        if (isMounted) {
          setIsScreenLoading(false)
        }
      }
    }

    loadPostDetail()

    return () => {
      isMounted = false
    }
  }, [fetchPost, hasMounted, postId])

  useEffect(() => {
    if (!postId) return

    let isMounted = true

    async function loadComments() {
      await fetchComments(postId)
      if (!isMounted) return
    }

    loadComments()

    return () => {
      isMounted = false
    }
  }, [fetchComments, postId])

  useEffect(() => {
    if (visitorStatus === 'idle') {
      void initVisitor()
    }
  }, [initVisitor, visitorStatus])

  useEffect(() => {
    if (!post || !visitorId) {
      setIsLiked(false)
      return
    }

    let isMounted = true

    checkIsLiked(post.id, visitorId).then((liked) => {
      if (isMounted) {
        setIsLiked(liked)
      }
    })

    return () => {
      isMounted = false
    }
  }, [checkIsLiked, post, visitorId])

  const formattedCreatedAt = useMemo(() => {
    if (!post?.created_at) return ''
    return new Date(post.created_at).toLocaleString('zh-CN')
  }, [post?.created_at])

  const normalizedComments = useMemo(() => {
    const commentMap = new Map<string, Comment>()

    comments.forEach((comment) => {
      commentMap.set(comment.id, comment)
    })

    return Array.from(commentMap.values())
  }, [comments])

  const commentsCount = normalizedComments.length
  const commentIdentityText =
    visitorStatus === 'idle' || visitorStatus === 'initializing'
      ? '正在准备昵称...'
      : visitorStatus === 'degraded'
        ? '昵称同步失败，请先去“我的”页面重试'
        : visitorStatus === 'failed'
          ? '访客身份初始化失败，请先重试'
          : nickname || '请先去“我的”页面设置昵称'

  const handleSubmitComment = async () => {
    if (!post) return

    const trimmedNickname = nickname?.trim() || ''
    const trimmedContent = commentContent.trim()

    if (visitorStatus === 'idle' || visitorStatus === 'initializing') {
      Alert.alert('访客信息仍在加载', '请稍后再试')
      return
    }

    if (!visitorId || visitorStatus === 'failed') {
      Alert.alert('访客初始化失败', '请先去“我的”页面重新同步访客信息')
      return
    }

    if (visitorStatus === 'degraded' || !trimmedNickname) {
      Alert.alert('昵称未准备好', '请先到“我的”页面确认昵称后再评论')
      return
    }

    if (!trimmedContent) {
      Alert.alert('请输入评论内容', '评论内容不能为空')
      return
    }

    setIsSubmittingComment(true)

    try {
      const newComment = await createComment({
        post_id: post.id,
        author_name: trimmedNickname,
        content: trimmedContent,
      })

      if (!newComment) {
        Alert.alert('评论失败', '请稍后再试')
        return
      }

      setCommentContent('')
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          comments_count: commentsCount + 1,
        }
      })
      Alert.alert('评论成功', '您的评论已发布')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleToggleLike = async () => {
    if (!post) return

    if (visitorStatus === 'idle' || visitorStatus === 'initializing') {
      Alert.alert('访客信息仍在加载', '请稍后再试')
      return
    }

    if (!visitorId || visitorStatus === 'failed') {
      Alert.alert('访客初始化失败', '请先去“我的”页面重新同步访客信息')
      return
    }

    setIsTogglingLike(true)

    const nextLiked = !isLiked
    const nextLikesCount = Math.max(displayLikesCount + (nextLiked ? 1 : -1), 0)

    setIsLiked(nextLiked)
    setDisplayLikesCount(nextLikesCount)

    try {
      const success = await toggleLike(post.id, visitorId)

      if (!success) {
        setIsLiked(!nextLiked)
        setDisplayLikesCount(displayLikesCount)
        Alert.alert('点赞失败', likeError || '请稍后再试')
        return
      }

      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          likes_count: nextLikesCount,
        }
      })
    } finally {
      setIsTogglingLike(false)
    }
  }

  const renderCommentItem = (comment: Comment) => (
    <CommentItem key={comment.id} comment={comment} />
  )

  if (!hasMounted || typeof window === 'undefined') {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>正在打开帖子详情...</ThemedText>
      </ThemedView>
    )
  }

  if (isScreenLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>正在加载帖子详情...</ThemedText>
      </ThemedView>
    )
  }

  if (!post) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <MaterialIcons name="forum" size={72} color={Colors.light.textMuted} />
        <ThemedText style={styles.emptyTitle}>这条帖子不存在</ThemedText>
        <ThemedText style={styles.emptyText}>可能已经被删除，或者链接地址不对</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {post.image_url ? (
            <Image source={{ uri: post.image_url }} style={styles.coverImage} contentFit="cover" />
          ) : null}

          <ThemedText style={styles.title}>{post.title}</ThemedText>

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <MaterialIcons name="person-outline" size={16} color={Colors.light.textMuted} />
              <ThemedText style={styles.metaText}>{post.author_name}</ThemedText>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={16} color={Colors.light.textMuted} />
              <ThemedText style={styles.metaText}>{formattedCreatedAt}</ThemedText>
            </View>
          </View>

          <View style={styles.bodyCard}>
            <ThemedText style={styles.bodyText}>
              {post.content?.trim() || '这条帖子暂时没有正文内容。'}
            </ThemedText>
          </View>

          <View style={styles.actionCard}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.actionButtonActive]}
              onPress={handleToggleLike}
              activeOpacity={0.8}
              disabled={isTogglingLike}
            >
              <MaterialIcons
                name={isLiked ? 'favorite' : 'favorite-border'}
                size={18}
                color={isLiked ? '#fff' : Colors.light.textSecondary}
              />
              <ThemedText style={[styles.actionButtonText, isLiked && styles.actionButtonTextActive]}>
                {isTogglingLike ? '处理中...' : `点赞 ${displayLikesCount}`}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.commentCountBadge}>
              <MaterialIcons name="chat-bubble-outline" size={18} color={Colors.light.textSecondary} />
              <ThemedText style={styles.commentCountText}>评论 {commentsCount}</ThemedText>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>发表评论</ThemedText>
            <ThemedText style={styles.sectionHint}>当前身份：{commentIdentityText}</ThemedText>
          </View>

          <View style={styles.inputCard}>
            <View style={styles.identityNotice}>
              <MaterialIcons name="person-outline" size={16} color={Colors.light.textMuted} />
              <ThemedText style={styles.identityNoticeText}>
                评论会直接使用你的唯一昵称，如需修改请去“我的”页面。
              </ThemedText>
            </View>
            <TextInput
              style={[styles.input, styles.commentInput]}
              value={commentContent}
              onChangeText={setCommentContent}
              placeholder="写下你的评论"
              placeholderTextColor={Colors.light.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.submitButton, isSubmittingComment && styles.submitButtonDisabled]}
              onPress={handleSubmitComment}
              activeOpacity={0.8}
              disabled={isSubmittingComment}
            >
              <MaterialIcons name="send" size={18} color="#fff" />
              <ThemedText style={styles.submitButtonText}>
                {isSubmittingComment ? '发布中...' : '发布评论'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>全部评论</ThemedText>
            <ThemedText style={styles.sectionHint}>{commentsCount} 条</ThemedText>
          </View>

          {commentsLoading && normalizedComments.length === 0 ? (
            <View style={styles.commentsLoading}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <ThemedText style={styles.commentsLoadingText}>正在加载评论...</ThemedText>
            </View>
          ) : normalizedComments.length === 0 ? (
            <View style={styles.emptyCommentsCard}>
              <MaterialIcons name="chat-bubble-outline" size={40} color={Colors.light.textMuted} />
              <ThemedText style={styles.emptyCommentsTitle}>还没有评论</ThemedText>
              <ThemedText style={styles.emptyCommentsText}>来抢第一个发言吧</ThemedText>
            </View>
          ) : (
            normalizedComments.map(renderCommentItem)
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: Colors.light.textMuted,
  },
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 38,
    color: Colors.light.foreground,
  },
  metaCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  bodyCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 28,
    color: Colors.light.foreground,
  },
  actionCard: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionButtonActive: {
    backgroundColor: Colors.light.accent,
    borderColor: Colors.light.accent,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  commentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentCountText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  sectionHint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  inputCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  identityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  identityNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.foreground,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentInput: {
    minHeight: 110,
    paddingTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  commentsLoadingText: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  emptyCommentsCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyCommentsTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  emptyCommentsText: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  commentCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  commentTime: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.foreground,
  },
})
