import { clientRequestSchema, type ConnectionFetchRoute, type ConnectionRpcHandler, type ConnectionRpcResult } from '@deepseek-ai/dsh-client-connection'
import type { TraceDataStore } from './store.js'
import { TRACE_DATA_CHANNEL, TRACE_DATA_PREFIX } from '../management.js'

type ManagedStore = Pick<TraceDataStore, 'status' | 'previewCleanup' | 'cleanup'>
const fail = (code: string, message: string) => ({ ok: false as const, error: { code, message, details: {} } })

/** Operations receive only the already admitted request, never caller-supplied paths. */
function traceDataOperation(store: ManagedStore) {
  return async (endpoint: string, payload: unknown, signal: AbortSignal): Promise<ConnectionRpcResult<unknown>> => {
    if (signal.aborted) return fail('aborted', 'The request was cancelled')
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return fail('invalid-payload', 'Invalid Trace data request')
    const body = payload as Record<string, unknown>
    try {
      if (endpoint === 'status' || endpoint === 'cleanup/preview') {
        if (Object.keys(body).length > 0) return fail('invalid-payload', 'This request does not accept fields')
        return { ok: true, value: endpoint === 'status' ? await store.status() : await store.previewCleanup() }
      }
      if (endpoint === 'cleanup/apply') {
        if (Object.keys(body).length !== 1 || typeof body.token !== 'string' || body.token.length < 1 || body.token.length > 200) return fail('invalid-payload', 'A valid cleanup preview token is required')
        return { ok: true, value: await store.cleanup(body.token) }
      }
      return fail('not-found', 'Unknown Trace data operation')
    } catch (error) {
      return fail('trace-data-error', error instanceof Error ? error.message : 'Trace data operation failed')
    }
  }
}

/** A direct invocation must supply the real carrier-admitted owner Peer. */
export function traceDataRpc(store: ManagedStore): ConnectionRpcHandler {
  const operate = traceDataOperation(store)
  return (endpoint, payload, signal, peer) => peer.principal.kind === 'owner'
    ? operate(endpoint, payload, signal)
    : Promise.resolve(fail('forbidden', 'Trace data management requires the Host owner'))
}

/**
 * Exact Fetch routes share Connection's owner gate, authentication, and body cap.
 * They avoid the SDK's generic-channel registration, whose captured service
 * context cannot read webServer in a strict Loader tree.
 */
export function traceDataRoutes(store: ManagedStore): ConnectionFetchRoute[] {
  const operate = traceDataOperation(store)
  return ['status', 'cleanup/preview', 'cleanup/apply'].map(endpoint => {
    const method = `${TRACE_DATA_PREFIX}/${endpoint}`
    const path = `${TRACE_DATA_CHANNEL}/${method}`
    return {
      path, methods: ['POST'], requestBody: 'buffered',
      async fetch(request) {
        if (request.method !== 'POST' || new URL(request.url).pathname !== path) return new Response('not found', { status: 404 })
        if (request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') return new Response('content type must be application/json', { status: 415 })
        let body: unknown
        try { body = await request.json() } catch { return new Response('body is not JSON', { status: 400 }) }
        const envelope = clientRequestSchema.safeParse(body)
        if (!envelope.success) return new Response('invalid client-request message', { status: 400 })
        const message = envelope.data
        const result = message.method === method
          ? await operate(endpoint, message.payload, request.signal)
          : fail('gateway/bad-request', 'The request method does not match this Trace endpoint')
        return Response.json({ type: 'server-response', rpcId: message.rpcId, result })
      },
    }
  })
}
