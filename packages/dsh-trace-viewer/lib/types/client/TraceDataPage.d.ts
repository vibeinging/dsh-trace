import type { TraceDataManagementApi } from '../management.js';
import type { DataKey } from './managementLocales.js';
import type { TraceNavigationPreferences } from './navigationPreferences.js';
export interface TraceDataPageProps {
    api: TraceDataManagementApi;
    t: (key: DataKey, params?: Record<string, string | number>) => string;
    navigation?: TraceNavigationPreferences;
    embedded?: boolean;
}
/** This page writes only through the host-backed management API. */
export declare function TraceDataPage({ api, t, navigation, embedded }: TraceDataPageProps): import("react").JSX.Element;
