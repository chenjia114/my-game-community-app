import { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import { PostCard } from '@/components/PostCard'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { usePosts } from '@/hooks/usePosts'
import type { Post } from '@/lib/types'

/**
 * 搜索页面
 * 当前版本只支持按帖子标题搜索
 */
export default function SearchScreen() {
  const router = useRouter()
  const { searchPosts, isLoading } = usePosts()

  const [keyword, setKeyword] = useState('')
  const [searchedKeyword, setSearchedKeyword] = useState('')
  const [results, setResults] = useState<Post[]>([])

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim()

    if (!trimmedKeyword) {
      setSearchedKeyword('')
      setResults([])
      return
    }

    Keyboard.dismiss()
    setSearchedKeyword(trimmedKeyword)

    const posts = await searchPosts(trimmedKeyword)
    setResults(posts)
  }

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      variant="compact"
      onPress={() => router.push(`/post/${item.id}` as any)}
    />
  )

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.stateTitle}>正在搜索</ThemedText>
          <ThemedText style={styles.stateText}>小星正在帮你找标题相关的帖子</ThemedText>
        </View>
      )
    }

    if (!searchedKeyword) {
      return (
        <View style={styles.stateContainer}>
          <MaterialIcons name="manage-search" size={72} color={Colors.light.textMuted} />
          <ThemedText style={styles.stateTitle}>搜索帖子标题</ThemedText>
          <ThemedText style={styles.stateText}>输入关键词后，点右侧按钮开始搜索</ThemedText>
        </View>
      )
    }

    if (results.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <MaterialIcons name="search-off" size={72} color={Colors.light.textMuted} />
          <ThemedText style={styles.stateTitle}>没有找到结果</ThemedText>
          <ThemedText style={styles.stateText}>
            没有找到标题里包含“{searchedKeyword}”的帖子
          </ThemedText>
        </View>
      )
    }

    return (
      <FlatList
        data={results}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ThemedText style={styles.resultHint}>
            找到 {results.length} 条标题相关结果
          </ThemedText>
        }
      />
    )
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="search" size={20} color={Colors.light.textMuted} />
          <TextInput
            style={styles.input}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="输入帖子标题关键词"
            placeholderTextColor={Colors.light.textMuted}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderContent()}
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.foreground,
    paddingVertical: 0,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.accent,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  stateTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: Colors.light.textMuted,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  resultHint: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
})
