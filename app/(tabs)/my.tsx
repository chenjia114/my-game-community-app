/**
 * 我的页面 - 查看自己发布的帖子
 * 基于 Vibrant & Block-based 暗色游戏风
 */
import { useState, useEffect, useCallback, memo } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import { PostCard } from '@/components/PostCard'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { usePosts } from '@/hooks/usePosts'
import { useVisitor } from '@/hooks/useVisitor'
import type { Post } from '@/lib/types'

interface ProfileHeaderProps {
  nickname: string | null
  visitorId: string | null
  isNicknameLocked: boolean
  editingNickname: string
  visitorLoading: boolean
  isSavingNickname: boolean
  myPosts: Post[]
  hasLoadedPosts: boolean
  showAdminEntry: boolean
  avatarTapCount: number
  onChangeNickname: (value: string) => void
  onSaveNickname: () => void
  onPressAdmin: () => void
  onPressAvatar: () => void
}

const ProfileHeader = memo(function ProfileHeader({
  nickname,
  visitorId,
  isNicknameLocked,
  editingNickname,
  visitorLoading,
  isSavingNickname,
  myPosts,
  hasLoadedPosts,
  showAdminEntry,
  avatarTapCount,
  onChangeNickname,
  onSaveNickname,
  onPressAdmin,
  onPressAvatar,
}: ProfileHeaderProps) {
  return (
    <View style={styles.profileSection}>
      {/* 头像 */}
      <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.9} onPress={onPressAvatar}>
        <View style={styles.avatar} pointerEvents="none">
          <ThemedText style={styles.avatarText}>
            {nickname?.charAt(0).toUpperCase() || '?'}
          </ThemedText>
          {!showAdminEntry ? (
            <ThemedText style={styles.avatarTapHint} pointerEvents="none">
              {avatarTapCount > 0 ? `${avatarTapCount}/10` : ''}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.avatarRing} pointerEvents="none" />
      </TouchableOpacity>

      {/* 用户名 */}
      <ThemedText style={styles.nickname}>
        {nickname || '匿名玩家'}
      </ThemedText>
      <ThemedText style={styles.userId}>
        ID: {visitorId?.slice(0, 8) || '--------'}
      </ThemedText>

      {showAdminEntry ? (
        <View style={styles.profileActions}>
          <TouchableOpacity
            style={styles.adminEntryButton}
            activeOpacity={0.8}
            onPress={onPressAdmin}
          >
            <MaterialIcons name="admin-panel-settings" size={18} color="#fff" />
            <ThemedText style={styles.adminEntryButtonText}>管理台</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.nicknameCard}>
        <View style={styles.nicknameHeader}>
          <ThemedText style={styles.nicknameCardTitle}>唯一昵称</ThemedText>
          <ThemedText style={styles.nicknameStatus}>
            {isNicknameLocked ? '已固定' : '可修改 1 次'}
          </ThemedText>
        </View>
        <TextInput
          style={[styles.nicknameInput, isNicknameLocked && styles.nicknameInputDisabled]}
          value={editingNickname}
          onChangeText={onChangeNickname}
          editable={!isNicknameLocked && !visitorLoading && !isSavingNickname}
          placeholder="输入你想使用的昵称"
          placeholderTextColor={Colors.light.textMuted}
          maxLength={20}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <ThemedText style={styles.nicknameHelpText}>
          {isNicknameLocked
            ? '你的昵称已经固定，发帖和评论都会直接使用这个昵称。'
            : '你现在可以把默认 guest 昵称改成自己的昵称，但只能手动修改这一次。'}
        </ThemedText>
        {!isNicknameLocked ? (
          <TouchableOpacity
            style={[styles.saveNicknameButton, isSavingNickname && styles.saveNicknameButtonDisabled]}
            activeOpacity={0.8}
            onPress={onSaveNickname}
            disabled={isSavingNickname || visitorLoading}
          >
            <MaterialIcons name="verified-user" size={18} color="#fff" />
            <ThemedText style={styles.saveNicknameButtonText}>
              {isSavingNickname ? '保存中...' : '确认并锁定昵称'}
            </ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 统计 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{hasLoadedPosts ? myPosts.length : '--'}</ThemedText>
          <ThemedText style={styles.statLabel}>发帖</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>
            {hasLoadedPosts ? myPosts.reduce((sum, p) => sum + p.likes_count, 0) : '--'}
          </ThemedText>
          <ThemedText style={styles.statLabel}>获赞</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>
            {hasLoadedPosts ? myPosts.reduce((sum, p) => sum + p.comments_count, 0) : '--'}
          </ThemedText>
          <ThemedText style={styles.statLabel}>评论</ThemedText>
        </View>
      </View>
    </View>
  )
})

// ==================== 主页面 ====================
export default function MyScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [hasLoadedPosts, setHasLoadedPosts] = useState(false)
  const [editingNickname, setEditingNickname] = useState('')
  const [isSavingNickname, setIsSavingNickname] = useState(false)
  const [avatarTapCount, setAvatarTapCount] = useState(0)
  const [showAdminEntry, setShowAdminEntry] = useState(false)

  const { fetchPosts } = usePosts()
  const {
    visitorId,
    nickname,
    isNicknameLocked,
    isLoading: visitorLoading,
    setVisitorNickname,
    initVisitor,
  } = useVisitor()

  // 加载我的帖子
  const loadMyPosts = useCallback(async () => {
    if (!visitorId) {
      setMyPosts([])
      setHasLoadedPosts(true)
      return
    }

    // 获取用户发布的帖子（不是爬取的）
    const allPosts = await fetchPosts({ sourceType: 'user', limit: 50 })

    const filtered = allPosts.filter(
      (p) => p.author_id === visitorId || p.author_name === nickname
    )
    setMyPosts(filtered)
    setHasLoadedPosts(true)
  }, [visitorId, nickname, fetchPosts])

  useEffect(() => {
    initVisitor()
  }, [initVisitor])

  useEffect(() => {
    setEditingNickname(nickname || '')
  }, [nickname])

  useEffect(() => {
    loadMyPosts()
  }, [loadMyPosts])

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await initVisitor()
    await loadMyPosts()
    setRefreshing(false)
  }, [initVisitor, loadMyPosts])

  const handleSaveNickname = useCallback(async () => {
    if (visitorLoading || !visitorId) {
      Alert.alert('访客初始化中', '请稍后再试')
      return
    }

    const trimmedNickname = editingNickname.trim()
    if (!trimmedNickname) {
      Alert.alert('请输入昵称', '昵称不能为空')
      return
    }

    if (trimmedNickname === nickname) {
      Alert.alert('无需修改', '你现在用的就是这个昵称')
      return
    }

    setIsSavingNickname(true)

    try {
      const saved = await setVisitorNickname(trimmedNickname)
      if (!saved) {
        Alert.alert('修改失败', '昵称可能已被占用，或你已经修改过一次')
        return
      }

      await initVisitor()
      await loadMyPosts()
      Alert.alert('修改成功', '昵称已经固定，之后不能再次修改')
    } finally {
      setIsSavingNickname(false)
    }
  }, [editingNickname, initVisitor, loadMyPosts, nickname, setVisitorNickname, visitorId, visitorLoading])

  const handleChangeNickname = useCallback((value: string) => {
    setEditingNickname(value)
  }, [])

  const handlePressAdmin = useCallback(() => {
    router.push('/admin' as any)
  }, [router])

  const handlePressAvatar = useCallback(() => {
    if (showAdminEntry) {
      handlePressAdmin()
      return
    }

    setAvatarTapCount((prev) => {
      const nextCount = prev + 1

      if (nextCount >= 10) {
        setShowAdminEntry(true)
        Alert.alert('已开启隐藏入口', '现在可以进入管理台了')
        return 0
      }

      return nextCount
    })
  }, [handlePressAdmin, showAdminEntry])

  // 渲染帖子
  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      variant="compact"
      showAuthor={false}
      onPress={() => router.push(`/post/${item.id}` as any)}
    />
  )

  // 空状态
  const renderEmpty = () => {
    if (!hasLoadedPosts) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="hourglass-empty" size={80} color={Colors.light.muted} />
          <ThemedText style={styles.emptyText}>正在加载我的帖子</ThemedText>
          <ThemedText style={styles.emptySubtext}>稍等一下，正在同步你的发帖记录</ThemedText>
        </View>
      )
    }

    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="person-outline" size={80} color={Colors.light.muted} />
        <ThemedText style={styles.emptyText}>还没有发帖</ThemedText>
        <ThemedText style={styles.emptySubtext}>去发布你的第一个帖子吧！</ThemedText>
        <TouchableOpacity
          style={styles.goPostButton}
          activeOpacity={0.8}
          onPress={() => router.push('/create' as any)}
        >
          <MaterialIcons name="edit" size={18} color="#fff" />
          <ThemedText style={styles.goPostButtonText}>去发帖</ThemedText>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={myPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <ProfileHeader
            nickname={nickname}
            visitorId={visitorId}
            isNicknameLocked={isNicknameLocked}
            editingNickname={editingNickname}
            visitorLoading={visitorLoading}
            isSavingNickname={isSavingNickname}
            myPosts={myPosts}
            hasLoadedPosts={hasLoadedPosts}
            showAdminEntry={showAdminEntry}
            avatarTapCount={avatarTapCount}
            onChangeNickname={handleChangeNickname}
            onSaveNickname={handleSaveNickname}
            onPressAdmin={handlePressAdmin}
            onPressAvatar={handlePressAvatar}
          />
        }
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? {
          userSelect: 'text',
        }
      : null),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  avatarTapHint: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  avatarRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    opacity: 0.3,
  },
  nickname: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.foreground,
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  nicknameCard: {
    width: '100%',
    backgroundColor: Colors.light.muted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  profileActions: {
    width: '100%',
    marginBottom: 16,
  },
  adminEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.accent,
    paddingVertical: 12,
    borderRadius: 12,
  },
  adminEntryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  nicknameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nicknameCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  nicknameStatus: {
    fontSize: 12,
    color: Colors.light.accent,
  },
  nicknameInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.foreground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  nicknameInputDisabled: {
    opacity: 0.7,
  },
  nicknameHelpText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  saveNicknameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveNicknameButtonDisabled: {
    opacity: 0.6,
  },
  saveNicknameButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.muted,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.border,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
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
    textAlign: 'center',
  },
  goPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
    boxShadow: '0px 4px 8px rgba(244, 63, 94, 0.4)',
    elevation: 4,
  },
  goPostButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
})

