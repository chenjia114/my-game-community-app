import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const TAVILY_DAILY_LIMIT = 20
const TAVILY_DAILY_USAGE_TABLE = 'tavily_daily_usage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const tavilyApiKey = process.env.TAVILY_API_KEY || process.env.EXPO_PUBLIC_TAVILY_API_KEY
const crawlKeyword = process.env.CRAWL_NEWS_KEYWORD || '游戏'
const crawlLimit = Number(process.env.CRAWL_NEWS_LIMIT || '10')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 环境变量')
}

if (!tavilyApiKey) {
  throw new Error('缺少 Tavily API Key')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function getTodayUsageDate() {
  return new Date().toISOString().slice(0, 10)
}

async function getTavilyDailyUsage() {
  const usageDate = getTodayUsageDate()
  const { data, error } = await supabase
    .from(TAVILY_DAILY_USAGE_TABLE)
    .select('*')
    .eq('usage_date', usageDate)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data || {
    usage_date: usageDate,
    request_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

async function assertTavilyDailyLimit() {
  const usage = await getTavilyDailyUsage()

  if (usage.request_count >= TAVILY_DAILY_LIMIT) {
    throw new Error('今日资讯额度已用完，请明天再试')
  }

  return usage
}

async function incrementTavilyDailyUsage() {
  const usage = await getTavilyDailyUsage()
  const now = new Date().toISOString()
  const { error } = await supabase.from(TAVILY_DAILY_USAGE_TABLE).upsert(
    {
      usage_date: usage.usage_date,
      request_count: usage.request_count + 1,
      updated_at: now,
    },
    { onConflict: 'usage_date' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function fetchNews() {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: tavilyApiKey,
      query: `gaming ${crawlKeyword}`,
      max_results: crawlLimit,
      topic: 'news',
      time_range: 'week',
      include_images: true,
      include_answer: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Tavily 请求失败: ${response.status}`)
  }

  await incrementTavilyDailyUsage()

  return response.json()
}

async function run() {
  await assertTavilyDailyLimit()

  const payload = await fetchNews()
  const results = Array.isArray(payload.results) ? payload.results : []
  const images = Array.isArray(payload.images) ? payload.images : []

  if (results.length === 0) {
    console.log('未抓到资讯')
    return
  }

  const mappedPosts = results.map((item, index) => ({
    title: item.title,
    content: item.content,
    author_name: '系统资讯',
    source_type: 'crawl',
    source_url: item.url,
    image_url: images[index] || null,
  }))

  const sourceUrls = mappedPosts.map((item) => item.source_url).filter(Boolean)
  const { data: existingPosts, error: queryError } = await supabase
    .from('posts')
    .select('source_url')
    .in('source_url', sourceUrls)

  if (queryError) {
    throw new Error(queryError.message)
  }

  const existingUrls = new Set((existingPosts || []).map((item) => item.source_url))
  const newPosts = mappedPosts.filter((item) => !item.source_url || !existingUrls.has(item.source_url))

  if (newPosts.length === 0) {
    console.log('没有新的资讯需要入库')
    return
  }

  const { error: insertError } = await supabase.from('posts').insert(newPosts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  console.log(`成功入库 ${newPosts.length} 条资讯`)
}

run().catch((error) => {
  if (error instanceof Error && error.message.includes('public.tavily_daily_usage')) {
    console.error('资讯抓取失败: 请先在 Supabase 执行最新 schema，初始化 Tavily 每日额度表')
    process.exit(1)
  }

  console.error('资讯抓取失败:', error)
  process.exit(1)
})
