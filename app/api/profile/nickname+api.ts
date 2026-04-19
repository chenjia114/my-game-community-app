import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import type { User } from '@/lib/types'

async function claimGuestNickname(visitorId: string): Promise<User | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc('claim_guest_nickname', {
    input_visitor_id: visitorId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return (data || null) as User | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const visitorId = searchParams.get('visitorId')?.trim() || ''

    if (!visitorId) {
      return Response.json({ error: '访客标识不能为空' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('visitor_id', visitorId)
      .maybeSingle()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ user: (data || null) as User | null })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '读取昵称资料失败' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      visitorId?: string
    }

    const visitorId = body.visitorId?.trim() || ''

    if (!visitorId) {
      return Response.json({ error: '访客标识不能为空' }, { status: 400 })
    }

    const user = await claimGuestNickname(visitorId)
    return Response.json({ user })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '初始化昵称失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      visitorId?: string
      nickname?: string
    }

    const visitorId = body.visitorId?.trim() || ''
    const nickname = body.nickname?.trim() || ''

    if (!visitorId) {
      return Response.json({ error: '访客标识不能为空' }, { status: 400 })
    }

    if (!nickname) {
      return Response.json({ error: '昵称不能为空' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('*')
      .eq('visitor_id', visitorId)
      .single()

    if (currentUserError || !currentUser) {
      return Response.json({ error: '用户不存在' }, { status: 404 })
    }

    if (currentUser.nickname_locked) {
      return Response.json({ error: '昵称已经锁定，不能再次修改' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        nickname,
        nickname_locked: true,
        nickname_updated_at: new Date().toISOString(),
      })
      .eq('visitor_id', visitorId)
      .eq('nickname_locked', false)
      .select('*')
      .single()

    if (error || !data) {
      return Response.json({ error: error?.message || '修改昵称失败' }, { status: 500 })
    }

    return Response.json({ user: data as User })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '修改昵称失败' }, { status: 500 })
  }
}
