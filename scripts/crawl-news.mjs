import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const TAVILY_DAILY_LIMIT = 20
const TAVILY_DAILY_USAGE_TABLE = 'tavily_daily_usage'
const TAVILY_SEARCH_API_URL = 'https://api.tavily.com/search'
const TAVILY_EXTRACT_API_URL = 'https://api.tavily.com/extract'
const MAX_EXTRACT_URLS_PER_RUN = 19

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const tavilyApiKey = process.env.TAVILY_API_KEY || process.env.EXPO_PUBLIC_TAVILY_API_KEY
const crawlKeyword = process.env.CRAWL_NEWS_KEYWORD || '游戏'
const crawlLimit = Number(process.env.CRAWL_NEWS_LIMIT || '10')
const defaultChineseNewsDomains = [
  '3dmgame.com',
  'gamersky.com',
  'ali213.net',
  '17173.com',
  'a9vg.com',
  'gcores.com',
  'tgbus.com',
  'duowan.com',
]

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

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function isAllowedChineseNewsDomain(url) {
  const domain = extractDomain(url)
  return defaultChineseNewsDomains.some((allowedDomain) => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`))
}

async function runTavilyRequest(url, body) {
  await assertTavilyDailyLimit()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage = data?.detail?.error || data?.error || `Tavily 请求失败: ${response.status}`
    throw new Error(errorMessage)
  }

  await incrementTavilyDailyUsage()

  return data
}

function pickArticleImage(images) {
  if (!Array.isArray(images)) {
    return null
  }

  for (const image of images) {
    if (typeof image === 'string' && image.trim()) {
      return image
    }
  }

  return null
}

async function fetchNews() {
  return runTavilyRequest(TAVILY_SEARCH_API_URL, {
    api_key: tavilyApiKey,
    query: `中国大陆 游戏资讯 ${crawlKeyword}`,
    max_results: crawlLimit,
    topic: 'news',
    time_range: 'week',
    include_images: true,
    include_answer: false,
    include_domains: defaultChineseNewsDomains,
  })
}

async function extractArticleImage(url) {
  const payload = await runTavilyRequest(TAVILY_EXTRACT_API_URL, {
    api_key: tavilyApiKey,
    urls: [url],
    include_images: true,
  })

  const firstResult = Array.isArray(payload.results) ? payload.results[0] : null
  return pickArticleImage(firstResult?.images)
}

async function run() {
  const payload = await fetchNews()
  const results = Array.isArray(payload.results) ? payload.results : []
  const filteredResults = results.filter((item) => isAllowedChineseNewsDomain(item.url))

  if (filteredResults.length === 0) {
    console.log('未抓到符合中文站点白名单的资讯')
    return
  }

  const articleCandidates = filteredResults.slice(0, MAX_EXTRACT_URLS_PER_RUN)
  const mappedPosts = []

  for (const item of articleCandidates) {
    const imageUrl = await extractArticleImage(item.url)

    if (!imageUrl) {
      continue
    }

    mappedPosts.push({
      title: item.title,
      content: item.content,
      author_name: '系统资讯',
      source_type: 'crawl',
      source_url: item.url,
      image_url: imageUrl,
    })
  }

  if (mappedPosts.length === 0) {
    console.log('候选资讯里没有拿到带图文章，已全部跳过')
    return
  }

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
    console.log('没有新的带图资讯需要入库')
    return
  }

  const { error: insertError } = await supabase.from('posts').insert(newPosts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  console.log(`成功入库 ${newPosts.length} 条带图资讯`)
}

run().catch((error) => {
  if (error instanceof Error && error.message.includes('public.tavily_daily_usage')) {
    console.error('资讯抓取失败: 请先在 Supabase 执行最新 schema，初始化 Tavily 每日额度表')
    process.exit(1)
  }

  console.error('资讯抓取失败:', error)
  process.exit(1)
})
