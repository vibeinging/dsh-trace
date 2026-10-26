import type { SessionEvent } from '@deepseek-ai/dsh-session/types';
import type { TraceCapturedEvent } from '../management.ts';
/** Project one live host event into one whitelisted, JSON-only Trace event. */
export declare function captureSessionEvent(sessionId: string, event: SessionEvent): TraceCapturedEvent | null;
