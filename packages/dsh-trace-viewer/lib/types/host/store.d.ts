import type { TraceCapturedEvent, TraceCleanupPreview, TraceCleanupResult, TraceDataSettings, TraceDataStatus } from '../management.ts';
export interface TraceDataStoreOptions {
    dataDir: string;
    getSettings: () => TraceDataSettings;
    now?: () => number;
    activeSessionIds?: () => ReadonlySet<string>;
}
/** A single writer, bounded to its own flat directory. It never reads DSH session files. */
export declare class TraceDataStore {
    readonly dataDir: string;
    private readonly options;
    private readonly now;
    private readonly owner;
    private queue;
    private initialized;
    private closed;
    private locked;
    private initializedAt;
    private records;
    private previews;
    private lastCapturedAt;
    private captureError;
    private cleanupState;
    constructor(options: TraceDataStoreOptions);
    private serial;
    private settings;
    private requireReady;
    private directory;
    private file;
    private readFile;
    private read;
    private write;
    private persistState;
    private unlinkOwn;
    private createLock;
    private lockSnapshot;
    private recoveryBlocked;
    private acquire;
    private release;
    private decode;
    private active;
    private eligible;
    private settleSegments;
    initialize(): Promise<void>;
    record(event: TraceCapturedEvent): Promise<void>;
    /** End only our recording segment when its host session is disposed. */
    finishSession(sessionId: string): Promise<void>;
    status(): Promise<TraceDataStatus>;
    previewCleanup(): Promise<TraceCleanupPreview>;
    private remove;
    cleanup(token: string): Promise<TraceCleanupResult>;
    cleanupIfDue(): Promise<void>;
    close(): Promise<void>;
}
