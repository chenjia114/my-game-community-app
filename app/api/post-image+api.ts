import { getSupabaseAdminClient } from '@/lib/supabase-admin'

type RequestFormData = {
  get(name: string): FormDataEntryValue | null
}

export async function POST(request: Request) {
  try {
    const formData = (await request.formData()) as unknown as RequestFormData
    const visitorId = String(formData.get('visitorId') || '').trim()
    const file = formData.get('file')

    if (!visitorId) {
      return Response.json({ error: 'visitorId 不能为空' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return Response.json({ error: '图片文件不能为空' }, { status: 400 })
    }

    const extensionMatch = file.name.match(/\.([a-zA-Z0-9]+)$/)
    const extension = extensionMatch?.[1]?.toLowerCase() || 'jpg'
    const filePath = `${visitorId}/${Date.now()}.${extension}`
    const contentType = file.type || 'image/jpeg'
    const fileBytes = await file.arrayBuffer()

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.storage.from('post-images').upload(filePath, fileBytes, {
      contentType,
      upsert: false,
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
    return Response.json({ publicUrl: data.publicUrl })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ error: '图片上传失败' }, { status: 500 })
  }
}
