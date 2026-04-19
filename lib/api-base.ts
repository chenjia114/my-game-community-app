/**
 * API 基础地址工具
 * Web 环境用相对路径，Expo 原生环境用完整 URL
 */

const IS_WEB = typeof window !== 'undefined'

/**
 * 获取 API 基础地址
 * Web: 使用相对路径 /
 * Native (Expo): 使用环境变量中的完整 URL
 */
export function getApiBaseUrl(): string {
  if (IS_WEB) {
    return ''
  }

  // Expo 原生环境使用配置的 API 地址
  return process.env.EXPO_PUBLIC_API_BASE_URL || ''
}

/**
 * 拼接完整 API URL
 * Web: /api/xxx -> /api/xxx
 * Native: /api/xxx -> https://xxx.vercel.app/api/xxx
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl()
  // 确保 path 以 / 开头
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${cleanPath}` : cleanPath
}
