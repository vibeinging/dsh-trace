import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client';
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type TraceDataSettings, type TraceDataManagementApi } from '../management.js';
export interface TraceProfileConfig {
    settings: TraceDataSettings;
}
/** Statistics use an owner-authenticated RPC; edits use DSH's own profile store. */
export declare function managementApi(connection: ConnectionHandle, form: ConfigForm<TraceProfileConfig>): TraceDataManagementApi;
