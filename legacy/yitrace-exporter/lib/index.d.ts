import z from "@deepseek-ai/schemastery";
import { Context, Service } from "@deepseek-ai/cordis";
import { Telemetry, TelemetryRecord } from "@deepseek-ai/dsh-session-telemetry";
//#region src/index.d.ts
/** Embedded yiTrace database settings after load-time validation. */
interface TraceDatabaseConfig {
  /** Local yiTrace data directory; relative paths resolve from the process working directory at load. */
  dataDir: string;
  /** Optional unsigned 64-bit tenant id applied to embedded writes and span events. */
  tenantId?: string | number;
  /** Maximum failed events retained in the embedded writer's in-memory retry buffer. */
  maxBuffered?: number;
}
/** Cordis plugin configuration for dsh-trace. */
interface Config {
  /** yiTrace embedded database settings. */
  database: TraceDatabaseConfig;
  /** Events collected before one serial embedded database ingest. */
  batchSize?: number;
  /** Optional yiTrace Snowflake node id; omit to derive it from the process id. */
  nodeId?: number;
  /** Agent name attached to every emitted yiTrace span. */
  agentName?: string;
  /** Outer deadline for draining queued writes and closing the database during plugin disposal. */
  shutdownTimeoutMillis?: number;
}
/** Schemastery validator for {@link Config}. */
declare const Config: z<Config>;
/** yiTrace SDK batch size used when the deployment does not choose one. */
declare const DEFAULT_BATCH_SIZE = 256;
/** Outer shutdown allowance used when the deployment does not choose one. */
declare const DEFAULT_SHUTDOWN_TIMEOUT_MILLIS = 3000;
/**
 * Loadable dsh-trace plugin. The class owns projection and embedded-delivery
 * state; the seam owns capture and deployment-mounted redaction.
 */
declare class DshTrace extends Telemetry {
  static inject: string[];
  static Config: z<Config>;
  /** Embedded traces stay on this machine and are never shared by this backend. */
  readonly sharing: "disabled";
  private readonly ids;
  private readonly sessions;
  private readonly resolved;
  private readonly logger;
  private embedded;
  private exporter;
  private delivery;
  private shutdownPromise;
  constructor(ctx: Context, config: Config);
  /** Open the embedded database before the telemetry capture listeners become active. */
  protected [Service.init](): AsyncGenerator<() => Promise<void>, void, void>;
  /**
   * Project one post-waterfall seam record into the open yiTrace hierarchy.
   * The method only creates SDK events and enqueues them in memory.
   * @param record - logical record handed over synchronously by the seam.
   */
  emit(record: TelemetryRecord): void;
  /** Forward a natural seam boundary into the serial embedded writer and retry buffer. */
  flush(): void;
  /**
   * Close open spans, drain queued writes, and stop awaiting after the
   * configured outer deadline. A native database call already in progress
   * cannot be canceled.
   * @returns fulfillment after the database closes, or rejection at the deadline.
   */
  shutdown(): Promise<void>;
  private shutdownOnce;
  private requireExporter;
  private requireEmbedded;
  private queueDelivery;
  private emitLedger;
  private emitOps;
  private session;
  private startTurn;
  private ensureTurn;
  private startStep;
  private ensureStep;
  private startTool;
  private openSpan;
  private closeStep;
  private closeTurn;
  private closeSession;
  private requestText;
  private logGeneric;
}
//#endregion
export { Config, DEFAULT_BATCH_SIZE, DEFAULT_SHUTDOWN_TIMEOUT_MILLIS, DshTrace, DshTrace as default, TraceDatabaseConfig };