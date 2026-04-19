import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import type { Like } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')?.trim() || ''
    const visitorId = searchParams.get('visitorId')?.trim() || ''
    const supabase = getSupabaseAdminClient()

    if (!visitorId) {
      return Response.json({ error: '访客标识不能为空' }, { status: 400 })
    }

    if (postId) {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('visitor_id', visitorId)
        .maybeSingle()

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }

      return Response.json({ liked: !!data })
    }

    const { data, error } = await supabase
      .from('likes')
      .select('post_id')
      .eq('visitor_id', visitorId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ likes: (data || []) as Pick<Like, 'post_id'>[] })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '读取点赞状态失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      postId?: string
      visitorId?: string
    }

    const postId = body.postId?.trim() || ''
    const visitorId = body.visitorId?.trim() || ''

    if (!postId) {
      return Response.json({ error: '帖子 ID 不能为空' }, { status: 400 })
    }

    if (!visitorId) {
      return Response.json({ error: '访客标识不能为空' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: existingLike, error: existingLikeError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('visitor_id', visitorId)
      .maybeSingle()

    if (existingLikeError) {
      return Response.json({ error: existingLikeError.message }, { status: 500 })
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        return Response.json({ error: deleteError.message }, { status: 500 })
      }

      const { data: post } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single()

      if (post) {
        await supabase
          .from('posts')
          .update({ likes_count: Math.max((post.likes_count || 0) - 1, 0) })
          .eq('id', postId)
      }

      return Response.json({ liked: false })
    }

    const { error: insertError } = await supabase.from('likes').insert([
      {
        post_id: postId,
        visitor_id: visitorId,
      },
    ])

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 })
    }

    const { data: post } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single()

    if (post) {
      await supabase
        .from('posts')
        .update({ likes_count: (post.likes_count || 0) + 1 })
        .eq('id', postId)
    }

    return Response.json({ liked: true })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '切换点赞失败' }, { status: 500 })
  }
}
