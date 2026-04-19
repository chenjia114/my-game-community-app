/**
 * Supabase 连接测试页面
 * 用于验证 Supabase 配置是否正确
 */
import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('正在连接 Supabase...')

  useEffect(() => {
    testConnection()
  }, [])

  async function testConnection() {
    try {
      // 测试连接 - 尝试获取项目信息
      const { error } = await supabase.auth.getSession()

      if (error && error.message !== 'No session found') {
        throw error
      }

      // 连接成功
      setStatus('success')
      setMessage('✅ Supabase 连接成功！\n\n已成功连接到 Supabase 服务器。\n\n您现在可以：\n• 使用 supabase.auth 进行用户认证\n• 使用 supabase.from() 查询数据表\n• 使用 supabase.storage() 操作文件存储')
    } catch (err: any) {
      setStatus('error')
      setMessage(`❌ 连接失败：\n\n${err.message || '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase 连接测试</Text>

      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#3ECF8E" />
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[
            styles.statusBox,
            status === 'success' ? styles.successBox : styles.errorBox
          ]}>
            <Text style={styles.message}>{message}</Text>
          </View>

          <Text style={styles.info}>
            📝 配置信息：
          </Text>
          <Text style={styles.info}>URL: 已从环境变量读取</Text>
          <Text style={styles.info}>Key: 已从环境变量读取</Text>

          <Text style={styles.hint}>
            💡 提示：Anon Key 是公开的，适用于客户端使用。如需更安全的访问，请使用 service_role key（但绝不能在客户端代码中使用）。
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    marginTop: 60,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBox: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  successBox: {
    backgroundColor: '#1a3d2e',
    borderColor: '#3ECF8E',
    borderWidth: 1,
  },
  errorBox: {
    backgroundColor: '#3d1a1a',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  info: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
})
