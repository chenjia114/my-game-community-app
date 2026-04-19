import { getSupabaseAdminClient } from '@/lib/supabase-admin'

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || process.env.EXPO_PUBLIC_ADMIN_PASSWORD || ''
}

function isAdminAuthorized(requestPassword: string): boolean {
  const adminPassword = getAdminPassword()
  return !!adminPassword && requestPassword === adminPassword
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      commentId?: string
      password?: string
    }

    const commentId = body.commentId?.trim() || ''
    const password = body.password?.trim() || ''

    if (!commentId) {
      return Response.json({ error: 'commentId 不能为空' }, { status: 400 })
    }

    if (!isAdminAuthorized(password)) {
      return Response.json({ error: '管理员验证失败' }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: comment, error: commentQueryError } = await supabase
      .from('comments')
      .select('id, post_id')
      .eq('id', commentId)
      .maybeSingle()

    if (commentQueryError) {
      return Response.json({ error: commentQueryError.message }, { status: 500 })
    }

    if (!comment) {
      return Response.json({ error: '评论不存在或已删除' }, { status: 404 })
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('comments_count')
      .eq('id', comment.post_id)
      .maybeSingle()

    if (!postError && post) {
      await supabase
        .from('posts')
        .update({ comments_count: Math.max((post.comments_count || 0) - 1, 0) })
        .eq('id', comment.post_id)
    }

    return Response.json({ success: true, deletedCommentId: commentId, postId: comment.post_id })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '删除评论失败' }, { status: 500 })
  }
}
