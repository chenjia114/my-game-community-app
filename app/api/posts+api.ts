import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import type { Post } from '@/lib/types'

function normalizeLimit(rawValue: string | null, fallback: number): number {
  const parsed = Number(rawValue)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.min(Math.floor(parsed), 100)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')?.trim() || ''
    const query = searchParams.get('query')?.trim() || ''
    const sourceType = searchParams.get('sourceType')?.trim() || 'all'
    const orderBy = searchParams.get('orderBy')?.trim() || 'created_at'
    const limit = normalizeLimit(searchParams.get('limit'), 20)
    const supabase = getSupabaseAdminClient()

    if (postId) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle()

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }

      return Response.json({ post: (data || null) as Post | null })
    }

    let requestBuilder = supabase.from('posts').select('*')

    if (query) {
      requestBuilder = requestBuilder.ilike('title', `%${query}%`)
    }

    if (sourceType === 'user' || sourceType === 'crawl') {
      requestBuilder = requestBuilder.eq('source_type', sourceType)
    }

    const safeOrderBy = orderBy === 'likes_count' || orderBy === 'comments_count'
      ? orderBy
      : 'created_at'

    const { data, error } = await requestBuilder
      .order(safeOrderBy, { ascending: false })
      .limit(limit)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ posts: (data || []) as Post[] })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '读取帖子失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string
      content?: string
      author_name?: string
      author_id?: string
      image_url?: string
    }

    const title = body.title?.trim() || ''
    const content = body.content?.trim() || ''
    const authorName = body.author_name?.trim() || ''
    const authorId = body.author_id?.trim() || ''
    const imageUrl = body.image_url?.trim() || ''

    if (!title) {
      return Response.json({ error: '标题不能为空' }, { status: 400 })
    }

    if (!authorName) {
      return Response.json({ error: '作者昵称不能为空' }, { status: 400 })
    }

    if (!authorId) {
      return Response.json({ error: '访客标识不能为空' }, { status: 400 })
    }

    if (!imageUrl) {
      return Response.json({ error: '封面图不能为空' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content,
          author_name: authorName,
          author_id: authorId,
          image_url: imageUrl,
          source_type: 'user',
          comments_count: 0,
          likes_count: 0,
        },
      ])
      .select('*')
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ post: data })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '创建帖子失败' }, { status: 500 })
  }
}
