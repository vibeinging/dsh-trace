import type { TraceRow } from '../types.js'
import type { TraceKey } from './locales.js'

export type Translate = (key: TraceKey, params?: Record<string, string | number>) => string

/** Render data as escaped React text, never HTML or executable Markdown. */
export function formatContent(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  try { return JSON.stringify(value, (_key, item: unknown) => typeof item === 'bigint' ? String(item) : item, 2) ?? '' }
  catch { return String(value) }
}

function parseStructuredString(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object' ? parsed : value
  } catch { return value }
}

export type DisplayBlock = { kind: 'text', text: string } | { kind: 'tool-call', name: string, callId: string, argsRaw: string }

function isDisplayBlock(value: unknown): value is DisplayBlock {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const block = value as Record<string, unknown>
  const keys = Object.keys(block)
  if (block.kind === 'text') return typeof block.text === 'string' && keys.length === 2 && keys.every(key => key === 'kind' || key === 'text')
  return block.kind === 'tool-call' && typeof block.name === 'string' && typeof block.callId === 'string' && typeof block.argsRaw === 'string'
    && keys.length === 4 && keys.every(key => ['kind', 'name', 'callId', 'argsRaw'].includes(key))
}

export function getDisplayBlocks(value: unknown): DisplayBlock[] | null {
  const parsed = parseStructuredString(value)
  return Array.isArray(parsed) && parsed.length > 0 && parsed.every(isDisplayBlock) ? parsed : null
}

/** Readable payload text; unfamiliar records retain their complete JSON shape. */
export function formatPayload(value: unknown): string {
  const blocks = getDisplayBlocks(value)
  if (blocks) {
    return blocks.map(block => block.kind === 'text'
      ? `kind: text\n${block.text}`
      : `kind: tool-call\nname: ${block.name}\ncallId: ${block.callId}\nargsRaw:\n${formatContent(parseStructuredString(block.argsRaw))}`).join('\n\n')
  }
  return formatContent(parseStructuredString(value))
}

export function formatDuration(value: number | null, t: Translate): string {
  if (value === null || !Number.isFinite(value) || value < 0) return t('missing')
  return value < 1000 ? `${Math.round(value)} ${t('milliseconds')}` : `${(value / 1000).toFixed(2)} ${t('seconds')}`
}

export function formatTokens(value: number | null, t: Translate): string {
  if (value === null) return t('missing')
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function rowName(row: TraceRow, t: Translate): string {
  return row.kind === 'tool' ? row.name : row.kind === 'model' ? row.model ?? t('model') : t(row.kind)
}

export function rowPreview(row: TraceRow): string {
  if (row.error) return row.error.slice(0, 180)
  if (row.kind === 'model') return row.provider ?? ''
  let value = row.input
  if (typeof value === 'string') {
    try { value = JSON.parse(value) as unknown } catch { /* Unparsed arguments remain visible below. */ }
  }
  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>
    for (const key of ['path', 'file_path', 'command', 'query', 'url', 'description']) {
      if (typeof input[key] === 'string') return input[key].slice(0, 180)
    }
  }
  return typeof row.input === 'string' ? row.input.slice(0, 180) : ''
}
