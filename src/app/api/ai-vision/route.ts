import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ code, message, error: message }, { status })
}

function parseJsonContent(content: string) {
  const cleaned = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const candidate = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned

  return JSON.parse(candidate)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return jsonError('UNAUTHORIZED', '请先登录', 401)
  }

  const body = await request.json() as {
    image_base64?: string
    imageBase64?: string
    mime_type?: string
    mimeType?: string
  }
  const imageBase64 = body.image_base64 ?? body.imageBase64
  const mimeType = body.mime_type ?? body.mimeType ?? 'image/jpeg'

  if (!imageBase64) {
    return jsonError('IMAGE_REQUIRED', 'image_base64 is required', 400)
  }

  const { data: config, error: configError } = await supabase
    .from('user_config')
    .select('api_key_encrypted, vision_model')
    .eq('user_id', user.id)
    .maybeSingle()

  if (configError) {
    return jsonError('CONFIG_READ_FAILED', configError.message, 500)
  }

  if (!config?.api_key_encrypted) {
    return jsonError('API_KEY_MISSING', '请先在设置中配置 API Key', 400)
  }

  const systemPrompt = `你是一个求职信息解析助手。请从截图中提取求职投递信息，不要输出思考过程，只输出纯JSON：
{
  "company": "",
  "position": "",
  "direction": [],
  "source": "",
  "link": "",
  "note": ""
}
无法判断的字段留空。direction 必须是字符串数组。`

  const response = await fetch(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key_encrypted}`,
      },
      body: JSON.stringify({
        model: config.vision_model ?? 'qwen3-vl-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              { type: 'text', text: '请解析这张截图中的求职信息。' },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    }
  )

  if (!response.ok) {
    const detail = await response.text()
    return jsonError('DASHSCOPE_FAILED', `AI 调用失败: ${detail}`, 502)
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = result.choices?.[0]?.message?.content ?? '{}'

  try {
    return NextResponse.json({ data: parseJsonContent(content) })
  } catch {
    return NextResponse.json(
      { code: 'AI_JSON_INVALID', message: '解析结果格式错误', raw: content },
      { status: 502 }
    )
  }
}
