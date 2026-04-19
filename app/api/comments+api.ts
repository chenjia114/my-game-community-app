import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import type { Comment } from '@/lib/types'

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
    const postId = searchParams.get('postId')?.trim() || ''
    const limit = normalizeLimit(searchParams.get('limit'), 50)
    const supabase = getSupabaseAdminClient()

    let requestBuilder = supabase.from('comments').select('*')

    if (postId) {
      requestBuilder = requestBuilder.eq('post_id', postId).order('created_at', { ascending: true })
    } else {
      requestBuilder = requestBuilder.order('created_at', { ascending: false }).limit(limit)
    }

    const { data, error } = await requestBuilder

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ comments: (data || []) as Comment[] })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '读取评论失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      post_id?: string
      author_name?: string
      content?: string
    }

    const postId = body.post_id?.trim() || ''
    const authorName = body.author_name?.trim() || ''
    const content = body.content?.trim() || ''

    if (!postId) {
      return Response.json({ error: '帖子 ID 不能为空' }, { status: 400 })
    }

    if (!authorName) {
      return Response.json({ error: '作者昵称不能为空' }, { status: 400 })
    }

    if (!content) {
      return Response.json({ error: '评论内容不能为空' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          author_name: authorName,
          content,
        },
      ])
      .select('*')
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('comments_count')
      .eq('id', postId)
      .single()

    if (!postError && post) {
      await supabase
        .from('posts')
        .update({ comments_count: (post.comments_count || 0) + 1 })
        .eq('id', postId)
    }

    return Response.json({ comment: data })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '创建评论失败' }, { status: 500 })
  }
}
