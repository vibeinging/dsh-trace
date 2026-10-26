/** Status supported by the recorded DSH projection. */
export type TraceStatus = 'running' | 'completed' | 'failed' | 'interrupted' | 'unknown';
/** Disjoint provider counters; null means this counter was not reported. */
export interface TraceUsage {
    inputTokens: number | null;
    outputTokens: number | null;
    cacheReadTokens: number | null;
    cacheWriteTokens: number | null;
    reasoningTokens: number | null;
    /** Requests with both uncached input and output counters present. */
    reportedRequests: number;
    /** Requests missing either of those core counters. */
    missingRequests: number;
}
/** One model request, tool call, compaction, or terminal notice. */
export interface TraceRow {
    id: string;
    parentId: string | null;
    kind: 'model' | 'tool' | 'compaction' | 'notice';
    name: string;
    status: TraceStatus;
    turn: number | null;
    step: number | null;
    seq: number | null;
    startTime: number | null;
    endTime: number | null;
    durationMs: number | null;
    input: unknown | null;
    output: unknown | null;
    error: string | null;
    provider: string | null;
    model: string | null;
    usage: TraceUsage | null;
    /** DSH projection fields, not an unmodified Session event. */
    raw: unknown;
}
/** A turn's loaded rows and, when available, authoritative turn boundaries. */
export interface TraceTurn {
    id: string;
    turn: number | null;
    title: string | null;
    status: TraceStatus;
    startTime: number | null;
    endTime: number | null;
    durationMs: number | null;
    timingComplete: boolean;
    observedStartTime: number | null;
    observedEndTime: number | null;
    rows: readonly TraceRow[];
    modelCount: number;
    toolCount: number;
    errorCount: number;
    usage: TraceUsage | null;
}
/** Session-scoped view built from the currently loaded trajectory window. */
export interface TraceData {
    sessionId: string;
    turns: readonly TraceTurn[];
    rows: readonly TraceRow[];
    partialHistory: boolean;
}
/** Paging facts from the DSH Session binding. */
export interface TraceBuildOptions {
    hasMore?: boolean;
}
