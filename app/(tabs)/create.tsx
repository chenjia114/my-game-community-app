/**
 * 发布页面 - 发布新帖子
 * 强制封面图，图片必填
 * 基于 Vibrant & Block-based 暗色游戏风
 */
import { useEffect, useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native'
import { Image } from 'expo-image'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'

import { Toast } from '@/components/Toast'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { usePosts } from '@/hooks/usePosts'
import { useVisitor } from '@/hooks/useVisitor'
import { uploadPostImage } from '@/lib/storage'

type SelectedImage = {
  previewUrl: string
  uploadSource: string | File
}

declare global {
  interface Window {
    __createDebugSetSelectedImage?: (previewUrl: string, uploadSource: string | File) => void
    __createDebugSubmit?: () => void
  }
}

type ToastState = {
  visible: boolean
  message: string
}

export default function CreateScreen() {
  const router = useRouter()
  const { createPost } = usePosts()
  const { visitorId, nickname, isLoading: visitorLoading } = useVisitor()

  // 表单状态
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' })

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return
    }

    window.__createDebugSetSelectedImage = (previewUrl, uploadSource) => {
      console.log('[create-debug] setSelectedImage', previewUrl)
      setSelectedImage({ previewUrl, uploadSource })
    }

    return () => {
      delete window.__createDebugSetSelectedImage
    }
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return
    }

    ;(window as any).__createDebugCurrent = {
      title,
      content,
      hasSelectedImage: Boolean(selectedImage),
      nickname,
      visitorId,
      isSubmitting,
    }
  }, [content, isSubmitting, nickname, selectedImage, title, visitorId])

  // 选择图片
  const pickImage = useCallback(async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) {
          return
        }

        setSelectedImage({
          previewUrl: URL.createObjectURL(file),
          uploadSource: file,
        })
      }
      input.click()
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0] as ImagePicker.ImagePickerAsset & { file?: File }

      if (Platform.OS === 'web' && asset.file) {
        setSelectedImage({
          previewUrl: URL.createObjectURL(asset.file),
          uploadSource: asset.file,
        })
        return
      }

      setSelectedImage({
        previewUrl: asset.uri,
        uploadSource: asset.uri,
      })
    }
  }, [])

  // 提交帖子
  const handleSubmit = useCallback(async () => {
    const trimmedNickname = nickname?.trim() || ''

    // 验证
    if (visitorLoading || !visitorId) {
      Alert.alert('访客初始化中', '请稍后再试')
      return
    }
    if (!trimmedNickname) {
      Alert.alert('昵称未准备好', '请先到“我的”页面确认昵称后再发帖')
      return
    }
    if (!title.trim()) {
      Alert.alert('请输入标题', '标题不能为空')
      return
    }
    if (title.trim().length > 50) {
      Alert.alert('标题过长', '标题最多50个字')
      return
    }
    if (!selectedImage) {
      Alert.alert('请上传封面图', '封面图是必填的')
      return
    }
    if (!visitorId) {
      Alert.alert('访客初始化中', '请稍后再试')
      return
    }

    setIsSubmitting(true)

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        ;(window as any).__createDebugState = {
          title: title.trim(),
          nickname: trimmedNickname,
          hasSelectedImage: Boolean(selectedImage),
          visitorId,
          step: 'before-upload',
        }
      }

      // 先上传图片，再创建帖子
      const uploadedImageUrl = await uploadPostImage(selectedImage.uploadSource, visitorId)

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        ;(window as any).__createDebugState = {
          title: title.trim(),
          nickname: trimmedNickname,
          hasSelectedImage: Boolean(selectedImage),
          visitorId,
          step: 'after-upload',
          uploadedImageUrl,
        }
      }
      const newPost = await createPost({
        title: title.trim(),
        content: content.trim(),
        author_name: trimmedNickname,
        author_id: visitorId,
        image_url: uploadedImageUrl,
      })

      if (newPost) {
        // 先清空表单，避免返回时看到旧内容
        setTitle('')
        setContent('')
        setSelectedImage(null)
        setToast({
          visible: true,
          message: '发帖成功，正在返回首页',
        })

        setTimeout(() => {
          router.replace('/' as any)
        }, 450)
        return
      } else {
        Alert.alert('发布失败', '帖子保存失败，请稍后重试')
      }
    } catch (error) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        ;(window as any).__createDebugState = {
          title: title.trim(),
          nickname: trimmedNickname,
          hasSelectedImage: Boolean(selectedImage),
          visitorId,
          step: 'error',
          errorMessage: error instanceof Error ? error.message : 'unknown',
        }
      }

      const message = error instanceof Error ? error.message : '图片上传或帖子保存失败，请稍后重试'
      Alert.alert('发布失败', message)
    } finally {
      setIsSubmitting(false)
    }
  }, [content, createPost, nickname, router, selectedImage, title, visitorId, visitorLoading])

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return
    }

    window.__createDebugSubmit = () => {
      console.log('[create-debug] submit called')
      void handleSubmit()
    }

    return () => {
      delete window.__createDebugSubmit
    }
  }, [handleSubmit])

  return (
    <ThemedView style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        onHide={() => setToast({ visible: false, message: '' })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.identityCard}>
            <ThemedText style={styles.identityLabel}>当前发布身份</ThemedText>
            <ThemedText style={styles.identityValue}>{nickname || '正在准备昵称...'}</ThemedText>
            <ThemedText style={styles.identityHint}>昵称请到“我的”页面设置，这里只负责发帖</ThemedText>
          </View>

          {/* 标题 */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>标题</ThemedText>
              <ThemedText style={styles.labelHint}>*必填，不超过50字</ThemedText>
            </View>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="输入帖子标题"
              placeholderTextColor={Colors.light.textMuted}
              maxLength={50}
            />
            <ThemedText style={styles.charCount}>{title.length}/50</ThemedText>
          </View>

          {/* 内容 */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>内容</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="输入帖子内容（可选）"
              placeholderTextColor={Colors.light.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* 封面图 */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>封面图片</ThemedText>
              <ThemedText style={styles.labelHint}>*必填</ThemedText>
            </View>

            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage.previewUrl }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.imagePicker, pressed && styles.imagePickerPressed]}
                onPress={() => {
                  void pickImage()
                }}
                testID="create-image-picker"
              >
                <MaterialIcons name="add-photo-alternate" size={48} color={Colors.light.textMuted} />
                <ThemedText style={styles.imagePickerText}>点击上传封面图</ThemedText>
                <ThemedText style={styles.imagePickerHint}>推荐 16:9 比例的图片</ThemedText>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* 发布按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
            testID="create-submit-button"
          >
            <MaterialIcons name="send" size={20} color="#fff" />
            <ThemedText style={styles.submitButtonText}>
              {isSubmitting ? '发布中...' : '发布帖子'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

// ==================== 样式 - Vibrant & Block-based 暗色游戏风 ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 24,
  },
  identityCard: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  identityLabel: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  identityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.foreground,
  },
  identityHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.foreground,
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.muted,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.foreground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  imagePicker: {
    backgroundColor: Colors.light.muted,
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    cursor: 'pointer',
  },
  imagePickerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  imagePickerHint: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.accent,
    paddingVertical: 16,
    borderRadius: 16,
    boxShadow: '0px 4px 12px rgba(244, 63, 94, 0.4)',
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
})
