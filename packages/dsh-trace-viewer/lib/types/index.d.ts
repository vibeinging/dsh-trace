import type { Context, Volatile } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type TraceDataSettings } from './management.js';
export declare const name = "dsh-trace-viewer";
export declare const inject: string[];
export interface Config {
    settings: Volatile<TraceDataSettings>;
}
/** Only data schemas survive DSH's settings descriptor transport; validate cross-field rules at use/write boundaries. */
export declare const Config: z<Config>;
/** Capture post-commit events globally, independently of which UI page is open. */
export declare function apply(ctx: Context, config: Config): Promise<void>;
