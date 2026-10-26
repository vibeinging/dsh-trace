import { type ConnectionFetchRoute, type ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection';
import type { TraceDataStore } from './store.js';
type ManagedStore = Pick<TraceDataStore, 'status' | 'previewCleanup' | 'cleanup'>;
/** A direct invocation must supply the real carrier-admitted owner Peer. */
export declare function traceDataRpc(store: ManagedStore): ConnectionRpcHandler;
/**
 * Exact Fetch routes share Connection's owner gate, authentication, and body cap.
 * They avoid the SDK's generic-channel registration, whose captured service
 * context cannot read webServer in a strict Loader tree.
 */
export declare function traceDataRoutes(store: ManagedStore): ConnectionFetchRoute[];
export {};
