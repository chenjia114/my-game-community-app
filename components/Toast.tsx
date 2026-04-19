import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

import { Colors } from '@/constants/theme'
import { ThemedText } from '@/components/themed-text'

export type ToastVariant = 'success' | 'error'

interface ToastProps {
  visible: boolean
  message: string
  variant?: ToastVariant
  onHide: () => void
  duration?: number
}

export function Toast({
  visible,
  message,
  variant = 'success',
  onHide,
  duration = 2200,
}: ToastProps) {
  useEffect(() => {
    if (!visible) {
      return
    }

    const timer = setTimeout(onHide, duration)
    return () => clearTimeout(timer)
  }, [duration, onHide, visible])

  if (!visible || !message) {
    return null
  }

  const isSuccess = variant === 'success'

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Pressable onPress={onHide} style={[styles.toast, isSuccess ? styles.successToast : styles.errorToast]}>
        <MaterialIcons
          name={isSuccess ? 'check-circle' : 'error-outline'}
          size={18}
          color="#fff"
        />
        <ThemedText style={styles.message}>{message}</ThemedText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  toast: {
    minHeight: 48,
    maxWidth: 520,
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  successToast: {
    backgroundColor: '#16A34A',
    borderColor: '#22C55E',
  },
  errorToast: {
    backgroundColor: Colors.light.destructive,
    borderColor: '#F87171',
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
})
