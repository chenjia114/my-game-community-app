/**
 * useVisitor - 匿名用户管理 Hook
 * 把 visitorId 初始化和 profile 同步拆成可区分的状态
 */
import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { v4 as uuidv4 } from 'uuid'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User } from '@/lib/types'
import { getApiUrl } from '@/lib/api-base'

const VISITOR_ID_KEY = '@visitor_id'
const NICKNAME_KEY = '@visitor_nickname'
const IS_WEB = Platform.OS === 'web'

type VisitorStatus = 'idle' | 'initializing' | 'ready' | 'degraded' | 'failed'

type VisitorState = {
  visitorId: string | null
  nickname: string | null
  userInfo: User | null
  status: VisitorStatus
  error: string | null
}

const visitorState: VisitorState = {
  visitorId: null,
  nickname: null,
  userInfo: null,
  status: 'idle',
  error: null,
}

const listeners = new Set<(state: VisitorState) => void>()
let initPromise: Promise<string | null> | null = null

function emitVisitorState() {
  listeners.forEach((listener) => listener({ ...visitorState }))
}

function updateVisitorState(patch: Partial<VisitorState>) {
  Object.assign(visitorState, patch)
  emitVisitorState()
}

async function persistNickname(nextNickname: string) {
  if (IS_WEB) {
    window.localStorage.setItem(NICKNAME_KEY, nextNickname)
    return
  }

  await AsyncStorage.setItem(NICKNAME_KEY, nextNickname)
}

async function loadStoredVisitorId() {
  if (IS_WEB) {
    const storedId = window.localStorage.getItem(VISITOR_ID_KEY)
    const nextId = storedId || uuidv4()

    if (!storedId) {
      window.localStorage.setItem(VISITOR_ID_KEY, nextId)
    }

    return nextId
  }

  const storedId = await AsyncStorage.getItem(VISITOR_ID_KEY)
  if (storedId) {
    return storedId
  }

  const nextId = uuidv4()
  await AsyncStorage.setItem(VISITOR_ID_KEY, nextId)
  return nextId
}

async function syncVisitorProfile(currentVisitorId: string): Promise<User | null> {
  try {
    updateVisitorState({ error: null })

    const response = await fetch(getApiUrl('/api/profile/nickname'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitorId: currentVisitorId }),
    })

    const result = (await response.json().catch(() => null)) as {
      user?: User | null
      error?: string
    } | null

    if (!response.ok) {
      const message = result?.error || '访客昵称初始化失败'
      updateVisitorState({ error: message, nickname: null, userInfo: null, status: 'degraded' })
      console.error('Failed to claim guest nickname:', message)
      return null
    }

    const profile = result?.user || null
    if (!profile) {
      updateVisitorState({ error: '访客昵称初始化失败', nickname: null, userInfo: null, status: 'degraded' })
      return null
    }

    updateVisitorState({
      userInfo: profile,
      nickname: profile.nickname,
      error: null,
      status: 'ready',
    })
    await persistNickname(profile.nickname)
    return profile
  } catch (error) {
    const message = error instanceof Error ? error.message : '访客昵称初始化失败'
    updateVisitorState({ error: message, nickname: null, userInfo: null, status: 'degraded' })
    console.error('Failed to sync visitor profile:', error)
    return null
  }
}

async function initVisitorInternal(force = false): Promise<string | null> {
  if (initPromise && !force) {
    return initPromise
  }

  initPromise = (async () => {
    updateVisitorState({ status: 'initializing', error: null })

    try {
      const currentVisitorId = await loadStoredVisitorId()
      updateVisitorState({ visitorId: currentVisitorId })
      await syncVisitorProfile(currentVisitorId)
      return currentVisitorId
    } catch (error) {
      const message = error instanceof Error ? error.message : '访客初始化失败'
      updateVisitorState({
        visitorId: null,
        nickname: null,
        userInfo: null,
        error: message,
        status: 'failed',
      })
      console.error('Failed to init visitor:', error)
      return null
    } finally {
      initPromise = null
    }
  })()

  return initPromise
}

export function useVisitor() {
  const [state, setState] = useState<VisitorState>({ ...visitorState })

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  const initVisitor = useCallback(async (force = false) => {
    return initVisitorInternal(force)
  }, [])

  const retryProfileSync = useCallback(async () => {
    if (!visitorState.visitorId) {
      return initVisitorInternal(true)
    }

    updateVisitorState({ status: 'initializing', error: null })
    await syncVisitorProfile(visitorState.visitorId)
    return visitorState.visitorId
  }, [])

  const setVisitorNickname = useCallback(async (newNickname: string): Promise<boolean> => {
    if (!visitorState.visitorId) return false
    if (visitorState.userInfo?.nickname_locked) return false

    updateVisitorState({ error: null })

    const trimmedNickname = newNickname.trim()
    if (!trimmedNickname) return false

    try {
      const response = await fetch(getApiUrl('/api/profile/nickname'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorId: visitorState.visitorId,
          nickname: trimmedNickname,
        }),
      })

      const result = (await response.json().catch(() => null)) as {
        user?: User
        error?: string
      } | null

      if (!response.ok || !result?.user) {
        const message = result?.error || '昵称保存失败'
        updateVisitorState({ error: message })
        console.error('Failed to save nickname:', message)
        return false
      }

      const profile = result.user as User
      updateVisitorState({
        userInfo: profile,
        nickname: profile.nickname,
        error: null,
        status: 'ready',
      })
      await persistNickname(profile.nickname)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '昵称保存失败'
      updateVisitorState({ error: message })
      console.error('Failed to set nickname:', error)
      return false
    }
  }, [])

  const fetchUserInfo = useCallback(async (): Promise<User | null> => {
    if (!visitorState.visitorId) return null

    try {
      const response = await fetch(getApiUrl(`/api/profile/nickname?visitorId=${encodeURIComponent(visitorState.visitorId)}`))
      const result = (await response.json().catch(() => null)) as {
        user?: User | null
        error?: string
      } | null

      if (!response.ok) {
        const message = result?.error || '读取访客信息失败'
        updateVisitorState({ error: message })
        console.error('Failed to fetch user:', message)
        return null
      }

      const profile = result?.user || null
      if (!profile) {
        updateVisitorState({ error: '读取访客信息失败' })
        return null
      }

      updateVisitorState({
        userInfo: profile,
        nickname: profile.nickname,
        error: null,
        status: 'ready',
      })
      await persistNickname(profile.nickname)
      return profile
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取访客信息失败'
      updateVisitorState({ error: message })
      console.error('Failed to fetch user:', error)
      return null
    }
  }, [])

  return {
    visitorId: state.visitorId,
    nickname: state.nickname,
    userInfo: state.userInfo,
    isNicknameLocked: state.userInfo?.nickname_locked ?? false,
    isLoading: state.status === 'initializing' || state.status === 'idle',
    status: state.status,
    error: state.error,
    canRetry: state.status === 'degraded' || state.status === 'failed',
    initVisitor,
    retryProfileSync,
    syncVisitorProfile,
    setVisitorNickname,
    fetchUserInfo,
  }
}
