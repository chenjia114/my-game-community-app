import { getSupabaseAdminClient } from '@/lib/supabase-admin'

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || process.env.EXPO_PUBLIC_ADMIN_PASSWORD || ''
}

function isAdminAuthorized(requestPassword: string): boolean {
  const adminPassword = getAdminPassword()
  return !!adminPassword && requestPassword === adminPassword
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      password?: string
    }

    const password = body.password?.trim() || ''

    if (!isAdminAuthorized(password)) {
      return Response.json({ error: '管理员验证失败' }, { status: 401 })
    }

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '管理员验证失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      postId?: string
      password?: string
    }

    const postId = body.postId?.trim() || ''
    const password = body.password?.trim() || ''

    if (!postId) {
      return Response.json({ error: 'postId 不能为空' }, { status: 400 })
    }

    if (!isAdminAuthorized(password)) {
      return Response.json({ error: '管理员验证失败' }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '删除帖子失败' }, { status: 500 })
  }
}
