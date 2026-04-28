import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imageBase64, mimeType, model } = await request.json() as {
    imageBase64: string
    mimeType: string
    model?: string
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
  }

  const { data: config } = await supabase
    .from('user_config')
    .select('api_key_encrypted, vision_model')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!config?.api_key_encrypted) {
    return NextResponse.json({ error: '请先在设置中配置 API Key' }, { status: 400 })
  }

  const targetModel = model ?? config.vision_model ?? 'qwen3-vl-flash'

  const systemPrompt = `你是一个求职信息解析助手。从截图中提取公司名、岗位名、职业方向、来源渠道、内推码或链接，输出纯JSON，格式：
{
  "company": "",
  "position": "",
  "direction": [],
  "source": "",
  "link": "",
  "note": ""
}`

  const response = await fetch(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key_encrypted}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              { type: 'text', text: '请解析这张截图中的求职信息' },
            ],
          },
        ],
        temperature: 0.1,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `AI 调用失败: ${err}` }, { status: 502 })
  }

  const result = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
  const content = result.choices[0]?.message?.content ?? '{}'

  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ''))
    return NextResponse.json({ data: parsed })
  } catch {
    return NextResponse.json({ error: '解析结果格式错误', raw: content }, { status: 500 })
  }
}
