import { Platform } from 'react-native'
import { getApiUrl } from '@/lib/api-base'

type UploadImageSource = string | File

type NativeUploadFile = {
  uri: string
  name: string
  type: string
}

function createNativeUploadFile(source: string): NativeUploadFile {
  const normalizedUri = source.startsWith('file://') || source.startsWith('content://') ? source : `file://${source}`
  const extensionMatch = normalizedUri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
  const extension = extensionMatch?.[1]?.toLowerCase() || 'jpg'
  const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'

  return {
    uri: normalizedUri,
    name: `post-image.${extension}`,
    type: mimeType,
  }
}

async function appendUploadFile(formData: FormData, source: UploadImageSource) {
  if (Platform.OS !== 'web' && typeof source === 'string') {
    formData.append('file', createNativeUploadFile(source) as unknown as Blob)
    return
  }

  if (typeof source !== 'string') {
    formData.append('file', source)
    return
  }

  const response = await fetch(source)

  if (!response.ok) {
    throw new Error(`图片读取失败：${response.status}`)
  }

  const blob = await response.blob()
  formData.append('file', new File([blob], 'post-image.jpg', {
    type: blob.type || 'image/jpeg',
  }))
}

/**
 * 上传帖子封面图到服务端接口
 * 返回可直接写入 posts.image_url 的公开地址
 */
export async function uploadPostImage(source: UploadImageSource, visitorId: string): Promise<string> {
  const formData = new FormData()
  formData.append('visitorId', visitorId)
  await appendUploadFile(formData, source)

  const response = await fetch(getApiUrl('/api/post-image'), {
    method: 'POST',
    body: formData,
  })

  const result = (await response.json().catch(() => null)) as {
    publicUrl?: string
    error?: string
  } | null

  if (!response.ok || !result?.publicUrl) {
    throw new Error(result?.error || '图片上传失败，请稍后重试')
  }

  return result.publicUrl
}
