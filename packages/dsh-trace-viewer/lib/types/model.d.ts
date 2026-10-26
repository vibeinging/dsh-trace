import type { TrajectorySnapshot } from '@deepseek-ai/dsh-client-ui-trajectory/client';
import type { TraceBuildOptions, TraceData, TraceRow, TraceUsage } from './types.ts';
/** Sum each request once; missing counters remain distinguishable from zero. */
export declare function aggregateUsage(rows: readonly TraceRow[]): TraceUsage | null;
/**
 * Build a read-only waterfall view from the DSH trajectory window.
 * @param snapshot - Current official trajectory projection; it can grow after paging.
 * @param sessionId - Stable Session identity, included in every row key.
 * @param options - Paging facts supplied by the Session binding.
 * @returns Rows and turn summaries without inferred times or duplicate requests.
 */
export declare function buildTrace(snapshot: TrajectorySnapshot, sessionId: string, options?: TraceBuildOptions): TraceData;
