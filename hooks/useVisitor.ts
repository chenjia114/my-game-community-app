/**
 * useVisitor - 匿名用户管理 Hook
 * 使用设备 ID 作为访客标识
 */
import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User } from '@/lib/types'

const VISITOR_ID_KEY = '@visitor_id'
const NICKNAME_KEY = '@visitor_nickname'
const IS_WEB = typeof window !== 'undefined'

export function useVisitor() {
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const persistNickname = useCallback(async (nextNickname: string) => {
    if (IS_WEB) {
      window.localStorage.setItem(NICKNAME_KEY, nextNickname)
      return
    }

    await AsyncStorage.setItem(NICKNAME_KEY, nextNickname)
  }, [])

  const loadStoredVisitorId = useCallback(async () => {
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
  }, [])

  const syncVisitorProfile = useCallback(async (currentVisitorId: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/profile/nickname', {
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
        console.error('Failed to claim guest nickname:', result?.error)
        return null
      }

      const profile = result?.user || null
      if (!profile) {
        return null
      }

      setUserInfo(profile)
      setNickname(profile.nickname)
      await persistNickname(profile.nickname)
      return profile
    } catch (error) {
      console.error('Failed to sync visitor profile:', error)
      return null
    }
  }, [persistNickname])

  const initVisitor = useCallback(async () => {
    setIsLoading(true)

    try {
      const currentVisitorId = await loadStoredVisitorId()
      setVisitorId(currentVisitorId)
      await syncVisitorProfile(currentVisitorId)
    } catch (error) {
      console.error('Failed to init visitor:', error)
    } finally {
      setIsLoading(false)
    }
  }, [loadStoredVisitorId, syncVisitorProfile])

  useEffect(() => {
    initVisitor()
  }, [initVisitor])

  const setVisitorNickname = useCallback(async (newNickname: string): Promise<boolean> => {
    if (!visitorId) return false
    if (userInfo?.nickname_locked) return false

    const trimmedNickname = newNickname.trim()
    if (!trimmedNickname) return false

    try {
      const response = await fetch('/api/profile/nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorId,
          nickname: trimmedNickname,
        }),
      })

      const result = (await response.json().catch(() => null)) as {
        user?: User
        error?: string
      } | null

      if (!response.ok || !result?.user) {
        console.error('Failed to save nickname:', result?.error)
        return false
      }

      const profile = result.user as User
      setUserInfo(profile)
      setNickname(profile.nickname)
      await persistNickname(profile.nickname)
      return true
    } catch (error) {
      console.error('Failed to set nickname:', error)
      return false
    }
  }, [persistNickname, userInfo?.nickname_locked, visitorId])

  const fetchUserInfo = useCallback(async (): Promise<User | null> => {
    if (!visitorId) return null

    try {
      const response = await fetch(`/api/profile/nickname?visitorId=${encodeURIComponent(visitorId)}`)
      const result = (await response.json().catch(() => null)) as {
        user?: User | null
        error?: string
      } | null

      if (!response.ok) {
        console.error('Failed to fetch user:', result?.error)
        return null
      }

      const profile = result?.user || null
      if (!profile) {
        return null
      }

      setUserInfo(profile)
      setNickname(profile.nickname)
      await persistNickname(profile.nickname)
      return profile
    } catch (error) {
      console.error('Failed to fetch user:', error)
      return null
    }
  }, [persistNickname, visitorId])

  return {
    visitorId,
    nickname,
    userInfo,
    isNicknameLocked: userInfo?.nickname_locked ?? false,
    isLoading,
    initVisitor,
    syncVisitorProfile,
    setVisitorNickname,
    fetchUserInfo,
  }
}
