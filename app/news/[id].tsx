import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { usePosts } from '@/hooks/usePosts'
import { extractDomain } from '@/lib/tavily'
import type { Post } from '@/lib/types'

/**
 * 资讯详情页
 * 展示爬取资讯的标题、正文和来源链接
 */
export default function NewsDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { fetchNewsPost, isLoading } = usePosts()
  const [newsPost, setNewsPost] = useState<Post | null>(null)

  useEffect(() => {
    if (!id) return

    fetchNewsPost(id).then(setNewsPost)
  }, [fetchNewsPost, id])

  const sourceDomain = useMemo(() => {
    if (!newsPost?.source_url) return ''
    return extractDomain(newsPost.source_url)
  }, [newsPost?.source_url])

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>正在加载资讯详情...</ThemedText>
      </ThemedView>
    )
  }

  if (!newsPost) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <MaterialIcons name="article" size={72} color={Colors.light.textMuted} />
        <ThemedText style={styles.emptyTitle}>这条资讯不存在</ThemedText>
        <ThemedText style={styles.emptyText}>可能已经被删除，或者链接地址不对</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>系统资讯</ThemedText>
        </View>

        <ThemedText style={styles.title}>{newsPost.title}</ThemedText>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <MaterialIcons name="schedule" size={16} color={Colors.light.textMuted} />
            <ThemedText style={styles.metaText}>
              {new Date(newsPost.created_at).toLocaleString('zh-CN')}
            </ThemedText>
          </View>

          <View style={styles.metaRow}>
            <MaterialIcons name="public" size={16} color={Colors.light.textMuted} />
            <ThemedText style={styles.metaText}>{sourceDomain || '外部来源'}</ThemedText>
          </View>
        </View>

        <View style={styles.bodyCard}>
          <ThemedText style={styles.bodyText}>
            {newsPost.content?.trim() || '这条资讯暂时没有正文内容。'}
          </ThemedText>
        </View>

        {newsPost.source_url && (
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(newsPost.source_url as string)}
          >
            <MaterialIcons name="open-in-new" size={18} color="#fff" />
            <ThemedText style={styles.linkButtonText}>打开原文链接</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.accent,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 38,
    color: Colors.light.foreground,
  },
  metaCard: {
    marginTop: 20,
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
  linkButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
})
