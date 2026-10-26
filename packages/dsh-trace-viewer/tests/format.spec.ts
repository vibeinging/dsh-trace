import { describe, expect, it } from 'vitest'
import { formatContent, formatPayload, getDisplayBlocks, rowPreview } from '../src/client/format.js'
import type { TraceRow } from '../src/types.js'

describe('readable trace payloads', () => {
  it('keeps plain strings, invalid JSON, and JSON scalar strings unchanged', () => {
    for (const value of ['plain text\nnext line', '<script>danger()</script>', '{broken', 'null', '42', '"quoted"']) {
      expect(formatPayload(value)).toBe(value)
    }
    expect(formatPayload(null)).toBe('')
  })

  it('indents structured JSON strings without changing formatContent', () => {
    const value = '{"path":"src/main.ts","options":{"all":true},"items":[1,2]}'
    expect(formatPayload(value)).toBe(JSON.stringify(JSON.parse(value), null, 2))
    expect(formatContent(value)).toBe(value)
    expect(formatPayload('[1,{"nested":true}]')).toBe('[\n  1,\n  {\n    "nested": true\n  }\n]')
  })

  it('keeps all text and tool call fields while expanding structured arguments', () => {
    const blocks = [
      { kind: 'text', text: 'Read this file.\n```ts\nconst answer = 42\n```' },
      { kind: 'tool-call', name: 'read', callId: 'read-1', argsRaw: '{"path":"src/main.ts","range":{"start":1,"end":20}}' },
      { kind: 'text', text: 'Then inspect the result.' },
    ]
    expect(formatPayload(blocks)).toBe('kind: text\nRead this file.\n```ts\nconst answer = 42\n```\n\nkind: tool-call\nname: read\ncallId: read-1\nargsRaw:\n{\n  "path": "src/main.ts",\n  "range": {\n    "start": 1,\n    "end": 20\n  }\n}\n\nkind: text\nThen inspect the result.')
    expect(formatPayload(JSON.stringify(blocks))).toBe(formatPayload(blocks))
  })

  it('keeps unparsed tool arguments intact', () => {
    const blocks = [{ kind: 'tool-call', name: 'run', callId: 'run-2', argsRaw: '{incomplete\ncommand' }]
    expect(formatPayload(blocks)).toBe('kind: tool-call\nname: run\ncallId: run-2\nargsRaw:\n{incomplete\ncommand')
  })

  it('falls back to complete JSON for unknown blocks, extra fields, or malformed known blocks', () => {
    const cases = [
      [{ kind: 'text', text: 'answer' }, { kind: 'image', url: 'https://example.com/image.png' }],
      [{ kind: 'text', text: 'answer', annotations: [{ source: 'evidence' }] }],
      [{ kind: 'tool-call', name: 'read', callId: 'read-1', argsRaw: '{}', metadata: { retry: 2 } }],
      [{ kind: 'text', text: 42 }],
      [{ kind: 'tool-call', name: 'read', argsRaw: '{}' }],
      [],
    ]
    for (const value of cases) {
      expect(formatPayload(value)).toBe(formatContent(value))
      expect(formatPayload(JSON.stringify(value))).toBe(formatContent(value))
    }
  })

  it('exposes known display blocks and rejects records with unknown fields', () => {
    const blocks = [{ kind: 'text', text: 'answer' }, { kind: 'tool-call', name: 'read', callId: 'call-1', argsRaw: '{}' }]
    expect(getDisplayBlocks(blocks)).toEqual(blocks)
    expect(getDisplayBlocks(JSON.stringify(blocks))).toEqual(blocks)
    expect(getDisplayBlocks([{ kind: 'text', text: 'answer', metadata: { source: 'evidence' } }])).toBeNull()
    expect(getDisplayBlocks([])).toBeNull()
    expect(getDisplayBlocks('answer')).toBeNull()
  })
})

describe('trace row preview', () => {
  const model: TraceRow = { id: 'model-1', parentId: null, kind: 'model', name: 'request', status: 'completed', turn: 1, step: 1, seq: 1,
    startTime: null, endTime: null, durationMs: null, input: null, output: null, error: null,
    provider: 'deepseek', model: 'deepseek-v4', usage: null, raw: null }

  it('shows provider without repeating the model name', () => {
    expect(rowPreview(model)).toBe('deepseek')
    expect(rowPreview({ ...model, provider: null })).toBe('')
  })

  it('prioritizes failure evidence for model requests and tools', () => {
    const error = 'Request failed. '.repeat(30)
    expect(rowPreview({ ...model, status: 'failed', error })).toBe(error.slice(0, 180))
    expect(rowPreview({ ...model, kind: 'tool', input: { path: 'main.ts' }, error: 'Permission denied' })).toBe('Permission denied')
  })
})
