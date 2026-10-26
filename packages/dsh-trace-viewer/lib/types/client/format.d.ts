import type { TraceRow } from '../types.js';
import type { TraceKey } from './locales.js';
export type Translate = (key: TraceKey, params?: Record<string, string | number>) => string;
/** Render data as escaped React text, never HTML or executable Markdown. */
export declare function formatContent(value: unknown): string;
export type DisplayBlock = {
    kind: 'text';
    text: string;
} | {
    kind: 'tool-call';
    name: string;
    callId: string;
    argsRaw: string;
};
export declare function getDisplayBlocks(value: unknown): DisplayBlock[] | null;
/** Readable payload text; unfamiliar records retain their complete JSON shape. */
export declare function formatPayload(value: unknown): string;
export declare function formatDuration(value: number | null, t: Translate): string;
export declare function formatTokens(value: number | null, t: Translate): string;
export declare function rowName(row: TraceRow, t: Translate): string;
export declare function rowPreview(row: TraceRow): string;
