/**
 * 首页 - 资讯+帖子混合信息流
 * 基于 Vibrant & Block-based 暗色游戏风设计
 */
import { useEffect, useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import { NewsCard } from '@/components/NewsCard'
import { PostCard } from '@/components/PostCard'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { useNews } from '@/hooks/useNews'
import { usePosts } from '@/hooks/usePosts'
import { useVisitor } from '@/hooks/useVisitor'
import type { Post } from '@/lib/types'

type FeedItem =
  | { id: string; type: 'post'; post: Post }
  | { id: string; type: 'news'; post: Post }

// 打乱数组顺序，用于首页随机展示资讯
function shufflePosts(items: Post[]): Post[] {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

// ==================== 主页面 ====================
export default function HomeScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const { fetchCrawledPosts } = useNews()
  const { fetchPosts, posts } = usePosts()
  const { status, initVisitor } = useVisitor()
  const [topNewsPosts, setTopNewsPosts] = useState<Post[]>([])
  const [feedNewsPosts, setFeedNewsPosts] = useState<Post[]>([])

  const loadHomeData = useCallback(async () => {
    const [crawledPosts, userPosts] = await Promise.all([
      fetchCrawledPosts(30),
      fetchPosts({ sourceType: 'user', limit: 20 }),
    ])

    const shuffledNewsPosts = shufflePosts(crawledPosts)
    setTopNewsPosts(shuffledNewsPosts.slice(0, 5))
    setFeedNewsPosts(shuffledNewsPosts.slice(5))

    return { crawledPosts, userPosts }
  }, [fetchCrawledPosts, fetchPosts])

  useEffect(() => {
    if (status === 'idle') {
      void initVisitor()
    }
  }, [initVisitor, status])

  useFocusEffect(
    useCallback(() => {
      void loadHomeData()
    }, [loadHomeData])
  )

  // 加载数据
  useEffect(() => {
    loadHomeData()
  }, [loadHomeData])

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadHomeData()
    setRefreshing(false)
  }, [loadHomeData])

  const mixedFeed = useMemo<FeedItem[]>(() => {
    const userFeedItems = posts.map((post) => ({
      id: `post-${post.id}`,
      type: 'post' as const,
      post,
    }))

    const newsFeedItems = feedNewsPosts.map((post) => ({
      id: `news-${post.id}`,
      type: 'news' as const,
      post,
    }))

    const mergedItems: FeedItem[] = []
    const maxLength = Math.max(userFeedItems.length, newsFeedItems.length)

    for (let index = 0; index < maxLength; index += 1) {
      if (newsFeedItems[index]) {
        mergedItems.push(newsFeedItems[index])
      }

      if (userFeedItems[index]) {
        mergedItems.push(userFeedItems[index])
      }
    }

    return mergedItems
  }, [feedNewsPosts, posts])

  const renderSearchEntry = () => (
    <TouchableOpacity
      style={styles.searchEntry}
      onPress={() => router.push('/search' as any)}
      activeOpacity={0.8}
    >
      <MaterialIcons name="search" size={20} color={Colors.light.textMuted} />
      <ThemedText style={styles.searchEntryText}>搜索帖子标题</ThemedText>
    </TouchableOpacity>
  )

  // 渲染顶部随机资讯区域
  const renderTopNewsSection = () => {
    if (topNewsPosts.length === 0) return renderSearchEntry()

    return (
      <>
        {renderSearchEntry()}
        <View style={styles.newsSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-fire-department" size={24} color={Colors.light.accent} />
            <ThemedText style={styles.sectionTitle}>今日随机资讯</ThemedText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsHorizontalList}
          >
            {topNewsPosts.map((item) => (
              <NewsCard
                key={`top-news-${item.id}`}
                news={{
                  title: item.title,
                  url: item.source_url || '',
                  content: item.content || '',
                  score: 0,
                }}
                imageUrl={item.image_url}
                onPress={() => router.push(`/news/${item.id}` as any)}
              />
            ))}
          </ScrollView>
        </View>
      </>
    )
  }

  // 渲染混合信息流
  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'news') {
      return (
        <View style={styles.newsFeedCard}>
          <View style={styles.newsFeedBadge}>
            <ThemedText style={styles.newsFeedBadgeText}>资讯</ThemedText>
          </View>
          <PostCard
            post={item.post}
            variant="feed"
            onPress={() => router.push(`/news/${item.post.id}` as any)}
          />
        </View>
      )
    }

    return (
      <PostCard
        post={item.post}
        variant="feed"
        onPress={() => router.push(`/post/${item.post.id}` as any)}
      />
    )
  }

  // 空状态
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="sports-esports" size={80} color={Colors.light.muted} />
      <ThemedText style={styles.emptyText}>暂无内容</ThemedText>
      <ThemedText style={styles.emptySubtext}>稍后再来看看新的资讯和帖子吧！</ThemedText>
    </View>
  )

  return (
    <ThemedView style={styles.container}>
      {/* 信息流 */}
      <FlatList
        data={mixedFeed}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderTopNewsSection}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        onEndReachedThreshold={0.5}
      />
    </ThemedView>
  )
}

// ==================== 样式 - Vibrant & Block-based 暗色游戏风 ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    paddingBottom: 24,
  },
  searchEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 10,
  },
  searchEntryText: {
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  newsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  newsHorizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  newsFeedCard: {
    position: 'relative',
  },
  newsFeedBadge: {
    position: 'absolute',
    top: 18,
    left: 28,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.light.accent,
  },
  newsFeedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 8,
  },
})



