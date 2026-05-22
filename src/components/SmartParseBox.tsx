'use client'

import { useRef, useState } from 'react'
import { SOURCES } from '@/lib/constants'
import type { ParsedJobInfo } from '@/lib/types'
import { cn, fileSizeLabel } from '@/lib/utils'

interface SmartParseBoxProps {
  directions?: readonly string[]
  onParsed: (data: ParsedJobInfo & { raw_note?: string }) => void
}

interface ImagePayload {
  base64: string
  mimeType: string
  fileName: string
  originalSize: number
  compressedSize: number
}

const LINK_RE = /(https?:\/\/[^\s，。；;,]+)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i

function normalizeParsedInfo(data: unknown): ParsedJobInfo {
  if (!data || typeof data !== 'object') return {}
  const record = data as Record<string, unknown>

  return {
    company: typeof record.company === 'string' ? record.company.trim() : '',
    position: typeof record.position === 'string' ? record.position.trim() : '',
    direction: Array.isArray(record.direction)
      ? record.direction.filter((item): item is string => typeof item === 'string')
      : [],
    source: typeof record.source === 'string' ? record.source.trim() : '',
    link: typeof record.link === 'string' ? record.link.trim() : '',
    note: typeof record.note === 'string' ? record.note.trim() : '',
  }
}

function fallbackParse(text: string, directions: readonly string[]): ParsedJobInfo {
  const company =
    text.match(/(?:公司|公司名)[:：\s]+([^\n，。；;]{2,30})/)?.[1]?.trim() ??
    text.match(/([^\s，。；;]{2,30})(?:招聘|内推|校招|实习)/)?.[1]?.trim() ??
    ''
  const position =
    text.match(/(?:岗位|职位|岗位名)[:：\s]+([^\n，。；;]{2,40})/)?.[1]?.trim() ??
    text.match(/招聘[：:\s]?([^\n，。；;]{2,40})/)?.[1]?.trim() ??
    ''
  const link = text.match(LINK_RE)?.[0] ?? ''
  const inferredDirection = directions.filter((direction) => text.includes(direction))
  const source = SOURCES.find((item) => text.includes(item)) ?? ''

  return {
    company,
    position,
    direction: inferredDirection,
    source,
    link,
    note: text.trim().slice(0, 180),
  }
}

function dataUrlToBase64(dataUrl: string) {
  return dataUrl.split(',')[1] ?? ''
}

async function compressImage(file: File): Promise<ImagePayload> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })

  const maxSide = 800
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('浏览器不支持图片压缩')

  ctx.drawImage(image, 0, 0, width, height)
  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5)
  const base64 = dataUrlToBase64(compressedDataUrl)
  const compressedSize = Math.round((base64.length * 3) / 4)

  return {
    base64,
    mimeType: 'image/jpeg',
    fileName: file.name,
    originalSize: file.size,
    compressedSize,
  }
}

export default function SmartParseBox({ directions = [], onParsed }: SmartParseBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [image, setImage] = useState<ImagePayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'warn' | 'error'; text: string } | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ tone: 'error', text: '请选择图片文件' })
      return
    }

    try {
      setLoading(true)
      const compressed = await compressImage(file)
      setImage(compressed)
      setText('')
      setMessage({ tone: 'info', text: '图片已压缩，准备识别' })
    } catch (err) {
      const errorText = err instanceof Error ? err.message : '图片处理失败'
      setMessage({ tone: 'error', text: errorText })
    } finally {
      setLoading(false)
    }
  }

  const handleParse = async () => {
    const hasImage = Boolean(image)
    const rawText = text.trim()

    if (!hasImage && !rawText) {
      setMessage({ tone: 'error', text: '请先粘贴文本或上传截图' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(hasImage ? '/api/ai-vision' : '/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hasImage
          ? {
              image_base64: image?.base64,
              imageBase64: image?.base64,
              mime_type: image?.mimeType,
              mimeType: image?.mimeType,
            }
          : { text: rawText }),
      })
      const payload = await response.json() as {
        data?: ParsedJobInfo
        code?: string
        error?: string
        message?: string
      }

      if (!response.ok || !payload.data) {
        if (!hasImage) {
          onParsed({ ...fallbackParse(rawText, directions), raw_note: rawText })
          setMessage({
            tone: 'warn',
            text: payload.code === 'API_KEY_MISSING'
              ? '未配置 API Key，已用本地规则提取'
              : 'AI 不可用，已用本地规则提取',
          })
          return
        }

        setMessage({
          tone: payload.code === 'API_KEY_MISSING' ? 'warn' : 'error',
          text: payload.message ?? payload.error ?? '图片识别失败',
        })
        return
      }

      onParsed({ ...normalizeParsedInfo(payload.data), raw_note: rawText })
      setMessage({ tone: 'info', text: '已填充识别结果' })
    } catch {
      if (!hasImage) {
        onParsed({ ...fallbackParse(rawText, directions), raw_note: rawText })
        setMessage({ tone: 'warn', text: '后端暂不可用，已用本地规则提取' })
      } else {
        setMessage({ tone: 'error', text: '图片识别服务暂不可用' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
      {image ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-white p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{image.fileName}</p>
            <p className="mt-1 text-xs text-slate-500">
              {fileSizeLabel(image.originalSize)} → {fileSizeLabel(image.compressedSize)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setImage(null)
              setMessage(null)
            }}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            删除
          </button>
        </div>
      ) : (
        <div
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            void handleFile(event.dataTransfer.files[0])
          }}
          className={cn(
            'relative rounded-lg border bg-white',
            dragging ? 'border-blue-400 ring-2 ring-blue-100' : 'border-blue-100'
          )}
        >
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="粘贴招聘信息、内推内容或岗位截图"
            className="min-h-28 w-full resize-none rounded-lg border-0 bg-transparent px-3 py-3 pr-12 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            aria-label="上传图片"
            title="上传图片"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600"
          >
            ▣
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p
          className={cn(
            'text-xs',
            message?.tone === 'error' && 'text-red-600',
            message?.tone === 'warn' && 'text-amber-600',
            (!message || message.tone === 'info') && 'text-slate-500'
          )}
        >
          {message?.text ?? ' '}
        </p>
        <button
          type="button"
          onClick={() => void handleParse()}
          disabled={loading}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '识别中...' : image ? '识别图片' : '智能识别'}
        </button>
      </div>
    </section>
  )
}
