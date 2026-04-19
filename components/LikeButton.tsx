/**
 * LikeButton - 点赞按钮组件
 * 支持点击切换点赞状态
 */
import { useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

import { Colors } from '@/constants/theme'
import { useLikes } from '@/hooks/useLikes'

import { ThemedText } from './themed-text'

interface LikeButtonProps {
  postId: string
  visitorId: string
  initialLiked?: boolean
  initialCount?: number
  onToggle?: (isLiked: boolean) => void
  showCount?: boolean
  size?: 'small' | 'normal'
}

export function LikeButton({
  postId,
  visitorId,
  initialLiked = false,
  initialCount = 0,
  onToggle,
  showCount = true,
  size = 'normal',
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const { toggleLike } = useLikes()

  useEffect(() => {
    setIsLiked(initialLiked)
    setCount(initialCount)
  }, [initialLiked, initialCount])

  const handlePress = async () => {
    if (isLoading) return

    setIsLoading(true)
    const nextLiked = !isLiked

    setIsLiked(nextLiked)
    setCount((current) => (nextLiked ? current + 1 : Math.max(0, current - 1)))

    const success = await toggleLike(postId, visitorId)

    if (!success) {
      setIsLiked(!nextLiked)
      setCount((current) => (nextLiked ? Math.max(0, current - 1) : current + 1))
      setIsLoading(false)
      return
    }

    onToggle?.(nextLiked)
    setIsLoading(false)
  }

  const iconSize = size === 'small' ? 18 : 22
  const textStyle = size === 'small' ? styles.countSmall : styles.countNormal
  const activeColor = Colors.light.accent
  const inactiveColor = Colors.light.textMuted

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={isLiked ? 'favorite' : 'favorite-border'}
        size={iconSize}
        color={isLiked ? activeColor : inactiveColor}
      />
      {showCount && (
        <ThemedText
          type="default"
          style={[textStyle, { color: isLiked ? activeColor : inactiveColor }]}
        >
          {count}
        </ThemedText>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countNormal: {
    fontSize: 14,
    fontWeight: '600',
  },
  countSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
})

