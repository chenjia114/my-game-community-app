/**
 * NewsCard - 资讯卡片组件
 * 统一首页横向资讯卡片的展示风格
 */
import { Image } from 'expo-image'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { Colors } from '@/constants/theme'
import { extractDomain } from '@/lib/tavily'
import type { TavilyNews } from '@/lib/types'

import { ThemedText } from './themed-text'

interface NewsCardProps {
  news: TavilyNews
  imageUrl?: string
  onPress?: () => void
}

export function NewsCard({ news, imageUrl, onPress }: NewsCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={styles.imageFallback} />
      )}

      <View style={styles.overlay}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>热门</ThemedText>
        </View>

        <ThemedText style={styles.title} numberOfLines={2}>
          {news.title}
        </ThemedText>

        <ThemedText style={styles.source} numberOfLines={1}>
          {extractDomain(news.url)}
        </ThemedText>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: '#1A1A2E',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    backgroundColor: 'rgba(15, 15, 35, 0.85)',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: Colors.light.accent,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
  },
  source: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.light.secondary,
  },
})

