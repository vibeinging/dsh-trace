import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { TraceData } from '../types.js';
import { type Translate } from './format.js';
export interface TraceInjected {
    loadOlder: () => Promise<void>;
    focusComposer?: () => (() => void);
    openDataManagement?: () => void;
}
type TraceProps = ConvViewProps & PropsLocale<'dshTrace'> & TraceInjected;
/** This adapter is the only component coupled to DSH's live selector hooks. */
export declare function TraceView(props: TraceProps): import("react").JSX.Element;
export interface TraceWorkbenchProps {
    data: TraceData;
    t: Translate;
    loadOlder: () => Promise<void>;
    hasMore: boolean;
    loadingOlder: boolean;
    loading: boolean;
    running: boolean;
    readFailed: boolean;
    focusComposer?: (() => (() => void)) | undefined;
    openDataManagement?: (() => void) | undefined;
}
/** Pure display component; both the shipped tab and component tests use this surface. */
export declare function TraceWorkbench({ data, t, loadOlder, hasMore, loadingOlder, loading, running, readFailed, focusComposer, openDataManagement }: TraceWorkbenchProps): import("react").JSX.Element;
export {};
