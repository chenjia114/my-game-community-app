type UploadImageSource = string | File

async function normalizeImageFile(source: UploadImageSource): Promise<File> {
  if (typeof source !== 'string') {
    return source
  }

  const response = await fetch(source)

  if (!response.ok) {
    throw new Error(`图片读取失败：${response.status}`)
  }

  const blob = await response.blob()
  return new File([blob], 'post-image.jpg', {
    type: blob.type || 'image/jpeg',
  })
}

/**
 * 上传帖子封面图到服务端接口
 * 返回可直接写入 posts.image_url 的公开地址
 */
export async function uploadPostImage(source: UploadImageSource, visitorId: string): Promise<string> {
  const file = await normalizeImageFile(source)
  const formData = new FormData()
  formData.append('visitorId', visitorId)
  formData.append('file', file)

  const response = await fetch('/api/post-image', {
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
