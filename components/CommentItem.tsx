/**
 * CommentItem - 评论项组件
 * 展示单条评论
 */
import { Pressable, StyleSheet, View } from 'react-native'

import { Colors } from '@/constants/theme'
import type { Comment } from '@/lib/types'

import { ThemedText } from './themed-text'

// 时间格式化
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

interface CommentItemProps {
  comment: Comment
  onDelete?: (comment: Comment) => void
  showDelete?: boolean
}

export function CommentItem({ comment, onDelete, showDelete = false }: CommentItemProps) {
  const handleDelete = () => {
    onDelete?.(comment)
  }

  return (
    <View style={styles.container}>
      {/* 头部：作者 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {comment.author_name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.authorInfo}>
          <ThemedText type="defaultSemiBold" style={styles.authorName}>
            {comment.author_name}
          </ThemedText>
          <ThemedText type="default" style={styles.time}>
            {formatTime(comment.created_at)}
          </ThemedText>
        </View>

        {/* 删除按钮 */}
        {showDelete && onDelete && (
          <Pressable onPress={handleDelete} style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}>
            <ThemedText style={styles.deleteText}>删除</ThemedText>
          </Pressable>
        )}
      </View>

      {/* 评论内容 */}
      <ThemedText type="default" style={styles.content}>
        {comment.content}
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontSize: 14,
    color: Colors.light.foreground,
  },
  time: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  deleteBtnPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteText: {
    fontSize: 13,
    color: Colors.light.destructive,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.foreground,
  },
})

