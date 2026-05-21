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

  const { text } = await request.json() as { text?: string }

  if (!text?.trim()) {
    return jsonError('TEXT_REQUIRED', 'text is required', 400)
  }

  const { data: config, error: configError } = await supabase
    .from('user_config')
    .select('api_key_encrypted, text_model')
    .eq('user_id', user.id)
    .maybeSingle()

  if (configError) {
    return jsonError('CONFIG_READ_FAILED', configError.message, 500)
  }

  if (!config?.api_key_encrypted) {
    return jsonError('API_KEY_MISSING', '请先在设置中配置 API Key', 400)
  }

  const systemPrompt = `你是一个求职信息解析助手。请从用户提供的文本中提取求职投递信息，不要输出思考过程，只输出纯JSON：
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
        model: config.text_model ?? 'qwen-turbo-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
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
