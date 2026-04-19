/**
 * PostCard - 用户帖子卡片组件
 * 统一首页与我的页的帖子卡片展示
 */
import { MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { Colors } from '@/constants/theme'
import type { Post } from '@/lib/types'

import { ThemedText } from './themed-text'

type PostCardVariant = 'feed' | 'compact'

interface PostCardProps {
  post: Post
  variant?: PostCardVariant
  onPress?: () => void
  showAuthor?: boolean
}

// 将创建时间转换成更容易读懂的相对时间
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

export function PostCard({
  post,
  variant = 'feed',
  onPress,
  showAuthor = true,
}: PostCardProps) {
  const isCompact = variant === 'compact'
  const hasImage = !!post.image_url

  return (
    <TouchableOpacity
      style={[styles.container, isCompact && styles.containerCompact]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {isCompact ? (
        <>
          <View style={styles.compactImageWrapper}>
            {hasImage ? (
              <Image source={{ uri: post.image_url }} style={styles.compactImage} contentFit="cover" transition={200} />
            ) : (
              <View style={styles.compactImagePlaceholder} />
            )}
          </View>

          <View style={styles.compactContent}>
            <ThemedText style={styles.compactTitle} numberOfLines={2}>
              {post.title}
            </ThemedText>
            <View style={styles.compactMeta}>
              <ThemedText style={styles.metaText}>{formatTime(post.created_at)}</ThemedText>
              <View style={styles.statsRow}>
                <MaterialIcons name="favorite-border" size={14} color={Colors.light.textMuted} />
                <ThemedText style={styles.metaText}>{post.likes_count}</ThemedText>
                <MaterialIcons name="chat-bubble-outline" size={14} color={Colors.light.textMuted} />
                <ThemedText style={styles.metaText}>{post.comments_count}</ThemedText>
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.feedImageWrapper}>
            {hasImage ? (
              <Image source={{ uri: post.image_url }} style={styles.feedImage} contentFit="cover" transition={200} />
            ) : (
              <View style={styles.feedImagePlaceholder} />
            )}
          </View>

          <View style={styles.feedContent}>
            <ThemedText style={styles.feedTitle} numberOfLines={2}>
              {post.title}
            </ThemedText>
          </View>

          <View style={styles.feedFooter}>
            <View style={styles.authorRow}>
              {showAuthor && (
                <>
                  <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>
                      {post.author_name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.authorName} numberOfLines={1}>
                    {post.author_name}
                  </ThemedText>
                </>
              )}
            </View>

            <ThemedText style={styles.metaText}>{formatTime(post.created_at)}</ThemedText>

            <View style={styles.statsRow}>
              <MaterialIcons name="favorite-border" size={16} color={Colors.light.textMuted} />
              <ThemedText style={styles.metaText}>{post.likes_count}</ThemedText>
              <MaterialIcons name="chat-bubble-outline" size={16} color={Colors.light.textMuted} />
              <ThemedText style={styles.metaText}>{post.comments_count}</ThemedText>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    boxShadow: `0px 4px 12px ${Colors.light.primary}33`,
    elevation: 6,
  },
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    marginVertical: 6,
  },
  feedImageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1A1A2E',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedImagePlaceholder: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.foreground,
    lineHeight: 24,
  },
  feedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    maxWidth: 70,
  },
  compactImageWrapper: {
    width: 100,
    height: 80,
    backgroundColor: '#1A1A2E',
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactImagePlaceholder: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  compactContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.foreground,
    lineHeight: 20,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
})

