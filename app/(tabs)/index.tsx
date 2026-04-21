/**
 * 首页 - 资讯+帖子混合信息流
 * 按 Pencil 首页方案改成更轻、更像产品首页的浅色展示，不改现有功能与跳转逻辑
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
      activeOpacity={0.88}
    >
      <View style={styles.searchIconWrap}>
        <MaterialIcons name="search" size={18} color={Colors.light.textMuted} />
      </View>
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
            <ThemedText style={styles.sectionTitle}>今日资讯</ThemedText>
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
        <View style={styles.feedCardWrap}>
          <PostCard
            post={item.post}
            variant="feed"
            onPress={() => router.push(`/news/${item.post.id}` as any)}
          />
        </View>
      )
    }

    return (
      <View style={styles.feedCardWrap}>
        <PostCard
          post={item.post}
          variant="feed"
          onPress={() => router.push(`/post/${item.post.id}` as any)}
        />
      </View>
    )
  }

  // 空状态
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <MaterialIcons name="insert-drive-file" size={42} color={Colors.light.textMuted} />
      </View>
      <ThemedText style={styles.emptyText}>暂无内容</ThemedText>
      <ThemedText style={styles.emptySubtext}>稍后再来看看新的资讯和帖子吧</ThemedText>
    </View>
  )

  const renderFeedHeader = () => (
    <View style={styles.feedHeader}>
      <ThemedText style={styles.sectionTitle}>大家在聊</ThemedText>
    </View>
  )

  return (
    <ThemedView style={styles.container}>
      {/* 信息流 */}
      <FlatList
        data={mixedFeed}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {renderTopNewsSection()}
            {renderFeedHeader()}
          </>
        )}
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

// ==================== 样式 - Pencil 浅色产品首页 ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    paddingBottom: 28,
  },
  searchEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    boxShadow: '0px 10px 24px rgba(15, 23, 42, 0.06)',
    elevation: 4,
    gap: 10,
  },
  searchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  searchEntryText: {
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  newsSection: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  feedHeader: {
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.foreground,
    letterSpacing: 0.2,
  },
  newsHorizontalList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  feedCardWrap: {
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
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
