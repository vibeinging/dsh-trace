/** Shared, JSON-only contracts for the Trace-owned recording store. */
export declare const TRACE_DATA_CHANNEL = "/api";
export declare const TRACE_DATA_PREFIX = "dsh-trace-data";
export interface TraceDataSettings {
    captureEnabled: boolean;
    points: {
        models: boolean;
        tools: boolean;
        errors: boolean;
        compaction: boolean;
    };
    captureModelText: boolean;
    captureToolPayloads: boolean;
    retentionDays: number | null;
    cleanupIntervalHours: number;
}
export declare const DEFAULT_TRACE_SETTINGS: TraceDataSettings;
export type TraceCapturePoint = 'model' | 'tool' | 'compaction' | 'lifecycle';
/** A whitelisted event; never the complete host event or request configuration. */
export interface TraceCapturedEvent {
    sessionId: string;
    turn: number | null;
    seq: number;
    time: number;
    type: string;
    point: TraceCapturePoint;
    failed: boolean;
    end?: 'completed' | 'failed' | 'interrupted';
    metadata: Record<string, string | number | boolean | null>;
    input?: unknown;
    output?: unknown;
}
export interface TraceStoredRecord {
    version: 1;
    id: string;
    sessionId: string;
    turn: number | null;
    startedAt: number;
    updatedAt: number;
    endedAt: number | null;
    status: 'running' | 'completed' | 'failed' | 'interrupted';
    events: TraceCapturedEvent[];
}
export interface TraceDataStatus {
    settings: TraceDataSettings;
    dataDir: string;
    stats: {
        traces: number;
        events: number;
        bytes: number;
        activeTraces: number;
        oldestAt: number | null;
    };
    lastCapturedAt: number | null;
    captureError: string | null;
    cleanup: {
        lastRunAt: number | null;
        nextRunAt: number | null;
        removedTraces: number;
        eligibleTraces: number;
        eligibleBytes: number;
        lastError: string | null;
    };
}
export interface TraceDataPageState extends TraceDataStatus {
    settingsWritable: boolean;
    settingsRevision: number | undefined;
}
export interface TraceCleanupPreview {
    token: string;
    traces: number;
    events: number;
    bytes: number;
    cutoffAt: number | null;
    expiresAt: number;
}
export interface TraceCleanupResult {
    removedTraces: number;
    removedBytes: number;
    skippedTraces: number;
    completedAt: number;
}
export interface TraceDataManagementApi {
    readState(): Promise<TraceDataPageState>;
    saveSettings(settings: TraceDataSettings, expectedRevision: number | undefined): Promise<void>;
    previewCleanup(): Promise<TraceCleanupPreview>;
    cleanup(token: string): Promise<TraceCleanupResult>;
}
/** Validate the complete settings object before accepting it at any boundary. */
export declare function validateTraceSettings(value: unknown): TraceDataSettings;
