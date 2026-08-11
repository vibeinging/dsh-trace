import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import Include from '@cordisjs/plugin-include'
import Loader from '@cordisjs/plugin-loader'
import { createAssistantMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import type { TelemetryRecord } from '@deepseek-ai/dsh-session-telemetry'
import { Context } from 'cordis'
import { describe, expect, it } from 'vitest'
import DshTrace from '../src/index.ts'

const SECRET = 'loader-sensitive-value-123'
const REDACTED = '[LOADER-REDACTED]'

function scrub(value: unknown): unknown {
  if (typeof value === 'string') return value.replaceAll(SECRET, REDACTED)
  if (Array.isArray(value)) return value.map(scrub)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, scrub(entry)]))
  }
  return value
}

const RedactionRule = {
  name: 'test-telemetry-redaction',
  apply(ctx: Context): void {
    ctx.on('telemetry/record', (_record: TelemetryRecord, next: () => TelemetryRecord) => {
      const record = next()
      return { ...record, body: scrub(record.body) }
    })
  },
}

describe('standalone Loader profile', () => {
  it('loads YAML composition and exports only the redacted record copy', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-trace-loader-'))
    const captures: unknown[] = []
    const server = createServer((request, response) => {
      const chunks: Buffer[] = []
      request.on('data', chunk => chunks.push(chunk as Buffer))
      request.on('end', () => {
        captures.push(JSON.parse(Buffer.concat(chunks).toString()) as unknown)
        response.writeHead(200, { 'content-type': 'application/json' }).end('{}')
      })
    })
    server.listen(0, '127.0.0.1')
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('loader yiTrace mock has no port')

    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      '- id: sessions',
      "  name: '@deepseek-ai/dsh-session'",
      '- id: redact',
      '  name: test-telemetry-redaction',
      '- id: dsh-trace',
      "  name: '@deepseek-ai/dsh-trace'",
      '  config:',
      '    exporter:',
      `      url: http://127.0.0.1:${address.port}/v1/ingest`,
      '    batchSize: 2',
      '',
    ].join('\n'))

    const ctx = new Context()
    let disposed = false
    try {
      ctx.baseUrl = `${pathToFileURL(root).href}/`
      await ctx.plugin(Loader)
      ctx.loader.builtins.include = Include
      const modules = new Map<string, unknown>([
        ['@deepseek-ai/dsh-session', SessionStore],
        ['test-telemetry-redaction', RedactionRule],
        ['@deepseek-ai/dsh-trace', DshTrace],
      ])
      ctx.loader.internal = {
        version: 'v2',
        async import(specifier: string) {
          if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
          return modules.get(specifier)
        },
      } as unknown as NonNullable<typeof ctx.loader.internal>
      await ctx.loader.create({
        name: 'cordis:include',
        config: { path: pathToFileURL(configPath).href },
      })
      await ctx.loader.await()

      const session = ctx.sessions.create(SessionId('loader-session'), { meta: {} })
      session.append('turn/start', { turn: 1 })
      session.append('step/start', { turn: 1, step: 1 })
      session.append('user/message', createUserMessage({
        content: [{ type: 'text', text: `inspect ${SECRET}` }],
        source: { kind: 'user' },
      }), { surfaceOp: 'append' })
      session.append('assistant/message', {
        turn: 1,
        step: 1,
        message: createAssistantMessage({
          content: [{ type: 'text', text: 'done' }],
          source: { provider: 'loader-provider', model: 'loader-model' },
        }),
      }, { surfaceOp: 'append' })
      session.append('step/end', { turn: 1, step: 1 })
      session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

      await ctx.fiber.dispose()
      disposed = true
      const wire = JSON.stringify(captures)
      expect(wire).not.toContain(SECRET)
      expect(wire).toContain(REDACTED)
      expect(wire).toContain('dsh.turn')
      expect(wire).toContain('dsh.step')
    } finally {
      if (!disposed) await ctx.fiber.dispose()
      server.closeAllConnections()
      server.close()
      await rm(root, { recursive: true, force: true })
    }
  })
})
