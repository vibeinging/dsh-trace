import z from "@deepseek-ai/schemastery";
import { resolve } from "node:path";
import { Service } from "@deepseek-ai/cordis";
import { APP_IDENTITY } from "@deepseek-ai/dsh-llm";
import { Telemetry, TelemetryCoordinator } from "@deepseek-ai/dsh-session-telemetry";
import { YiTraceDB } from "@yitrace/db";
import { BatchExporter, EventType, Snowflake, toWire } from "@yitrace/trace-sdk";
//#region src/index.ts
/**
* dsh-trace plugin backed by the DeepSeek Harness session-telemetry seam.
*
* The backend converts the seam's post-waterfall logical records into a
* yiTrace hierarchy: one trace per DSH turn, step spans under the turn, and
* tool spans under their step. It writes the SDK wire events directly through
* yiTrace's embedded Node-API database; no HTTP server or socket is involved.
*
* @module @deepseek-ai/dsh-trace
*/
const TraceDatabaseConfig = z.object({
	dataDir: z.string().required(),
	tenantId: z.union([z.string(), z.number()]),
	maxBuffered: z.number()
}).required();
/** Schemastery validator for {@link Config}. */
const Config = z.object({
	database: TraceDatabaseConfig,
	batchSize: z.number(),
	nodeId: z.number(),
	agentName: z.string(),
	shutdownTimeoutMillis: z.number()
});
/** yiTrace SDK batch size used when the deployment does not choose one. */
const DEFAULT_BATCH_SIZE = 256;
/** Outer shutdown allowance used when the deployment does not choose one. */
const DEFAULT_SHUTDOWN_TIMEOUT_MILLIS = 3e3;
const MAX_TIMER_DELAY_MILLIS = 2147483647;
const MAX_YITRACE_NODE_ID = 1023;
const MAX_U64 = (1n << 64n) - 1n;
const FNV_OFFSET = 14695981039346656037n;
const FNV_PRIME = 1099511628211n;
function positiveInteger(value, field) {
	if (!Number.isSafeInteger(value) || value < 1) throw new Error(`dsh-trace: ${field} must be a positive safe integer, got ${String(value)}`);
	return value;
}
function parseDataDir(value) {
	const trimmed = value.trim();
	if (trimmed.length === 0) throw new Error("dsh-trace: database.dataDir must not be empty");
	return resolve(trimmed);
}
function parseTenantId(value) {
	if (value === void 0) return void 0;
	if (typeof value === "number" && (!Number.isSafeInteger(value) || value < 0)) throw new Error(`dsh-trace: database.tenantId must be an unsigned 64-bit integer, got ${String(value)}`);
	if (typeof value === "string" && !/^\d+$/.test(value)) throw new Error(`dsh-trace: database.tenantId must be an unsigned 64-bit integer, got ${JSON.stringify(value)}`);
	const parsed = BigInt(value);
	if (parsed > MAX_U64) throw new Error(`dsh-trace: database.tenantId exceeds the unsigned 64-bit range: ${String(value)}`);
	return parsed;
}
function resolveConfig(config) {
	const batchSize = positiveInteger(config.batchSize ?? 256, "batchSize");
	const maxBuffered = positiveInteger(config.database.maxBuffered ?? batchSize * 16, "database.maxBuffered");
	const tenantId = parseTenantId(config.database.tenantId);
	const shutdownTimeoutMillis = config.shutdownTimeoutMillis ?? 3e3;
	if (!Number.isFinite(shutdownTimeoutMillis) || shutdownTimeoutMillis <= 0 || shutdownTimeoutMillis > MAX_TIMER_DELAY_MILLIS) throw new Error(`dsh-trace: shutdownTimeoutMillis must be a positive finite number no greater than ${MAX_TIMER_DELAY_MILLIS}, got ${String(shutdownTimeoutMillis)}`);
	if (config.nodeId !== void 0 && (!Number.isInteger(config.nodeId) || config.nodeId < 0 || config.nodeId > MAX_YITRACE_NODE_ID)) throw new Error(`dsh-trace: nodeId must be an integer from 0 through ${MAX_YITRACE_NODE_ID}, got ${String(config.nodeId)}`);
	const agentName = (config.agentName ?? APP_IDENTITY.product).trim();
	if (agentName.length === 0) throw new Error("dsh-trace: agentName must not be empty");
	return {
		database: {
			dataDir: parseDataDir(config.database.dataDir),
			...tenantId === void 0 ? {} : { tenantId },
			maxBuffered
		},
		batchSize,
		...config.nodeId === void 0 ? {} : { nodeId: config.nodeId },
		agentName,
		shutdownTimeoutMillis
	};
}
function epochNanos(time) {
	return BigInt(Math.max(0, Math.trunc(time))) * 1000000n;
}
function stableSessionId(value) {
	let hash = FNV_OFFSET;
	for (const byte of new TextEncoder().encode(value)) {
		hash ^= BigInt(byte);
		hash = hash * FNV_PRIME & MAX_U64;
	}
	return hash;
}
function eventSeq(record) {
	const value = record.attributes["event.seq"];
	return typeof value === "number" ? value : void 0;
}
function eventType(record) {
	const value = record.attributes["event.type"];
	if (typeof value !== "string") throw new Error("dsh-trace: ledger record has no event.type");
	return value;
}
function sessionId(record) {
	const value = record.attributes["session.id"];
	if (typeof value !== "string") throw new Error("dsh-trace: record has no session.id");
	return value;
}
function bodyText(value) {
	return JSON.stringify(value);
}
function sourceSeqAttribute(record) {
	const seq = eventSeq(record);
	return seq === void 0 ? {} : { "dsh.event.start_seq": seq };
}
function contentText(blocks) {
	return blocks.map((block) => {
		switch (block.type) {
			case "text":
			case "reasoning": return block.text;
			case "tool-call": return `${block.name}(${block.arguments})`;
			case "tool-result": return contentText(block.content);
			default: return bodyText(block);
		}
	}).filter(Boolean).join("\n");
}
function turnStatus(reason) {
	return reason.kind === "completed" ? 0 : 1;
}
function toDatabaseEvent(event) {
	return {
		...toWire(event),
		seq: Number(event.seq)
	};
}
var EmbeddedExporter = class {
	database;
	maxBuffered;
	onError;
	buffered = [];
	closePromise;
	lastError;
	closed = false;
	constructor(database, maxBuffered, onError) {
		this.database = database;
		this.maxBuffered = maxBuffered;
		this.onError = onError;
	}
	export(event) {
		if (this.closed) throw new Error("dsh-trace: cannot export after embedded database shutdown");
		this.buffered.push(event);
	}
	async exportBatch(events) {
		if (this.closed) throw new Error("dsh-trace: cannot export after embedded database shutdown");
		await this.ingest(events);
	}
	async flush() {
		if (this.closed) return;
		if (this.buffered.length > 0) {
			const batch = this.buffered.splice(0);
			await this.ingest(batch);
		}
		await this.database.flush();
	}
	close() {
		this.closePromise ??= this.closeOnce();
		return this.closePromise;
	}
	async ingest(events) {
		if (events.length === 0) return;
		try {
			await this.database.ingest(events.map(toDatabaseEvent));
			if (this.buffered.length === 0) this.lastError = void 0;
		} catch (error) {
			this.lastError = error;
			this.buffered = events.concat(this.buffered);
			const dropped = Math.max(0, this.buffered.length - this.maxBuffered);
			if (dropped > 0) this.buffered = this.buffered.slice(dropped);
			this.onError(error, dropped);
		}
	}
	async closeOnce() {
		const errors = [];
		try {
			await this.flush();
			if (this.buffered.length > 0) errors.push(new Error(`dsh-trace: embedded database closed with ${this.buffered.length} buffered events`, { cause: this.lastError }));
		} catch (error) {
			errors.push(error);
		}
		try {
			await this.database.close();
		} catch (error) {
			errors.push(error);
		} finally {
			this.closed = true;
		}
		if (errors.length === 1) throw errors[0];
		if (errors.length > 1) throw new AggregateError(errors, "dsh-trace: embedded database shutdown failed");
	}
};
var OpenSpan = class {
	exporter;
	spec;
	seq = 0n;
	closed = false;
	model = null;
	inputText = null;
	outputText = null;
	inputTokens = null;
	outputTokens = null;
	cacheReadTokens = null;
	cacheWriteTokens = null;
	constructor(exporter, spec) {
		this.exporter = exporter;
		this.spec = spec;
		this.export(EventType.SpanStart, spec.startedAt);
	}
	get spanId() {
		return this.spec.spanId;
	}
	get traceId() {
		return this.spec.traceId;
	}
	get sessionId() {
		return this.spec.sessionId;
	}
	setModel(model) {
		this.model = model;
	}
	setIo(inputText, outputText) {
		if (inputText !== void 0) this.inputText = inputText;
		if (outputText !== void 0) this.outputText = outputText;
	}
	setTokens(usage) {
		if (usage === void 0) return;
		this.inputTokens = BigInt(usage.inputTokens);
		this.outputTokens = BigInt(usage.outputTokens);
		if (usage.cacheReadTokens !== void 0) this.cacheReadTokens = BigInt(usage.cacheReadTokens);
		if (usage.cacheWriteTokens !== void 0) this.cacheWriteTokens = BigInt(usage.cacheWriteTokens);
		if (usage.reasoningTokens !== void 0) this.spec.attributes["llm.reasoning_tokens"] = usage.reasoningTokens;
	}
	setAttribute(key, value) {
		this.spec.attributes[key] = value;
	}
	log(time, message) {
		if (this.closed) return;
		this.export(EventType.Log, time, { logs: [message] });
	}
	close(time, status) {
		if (this.closed) return;
		this.closed = true;
		const durationNs = BigInt(Math.max(0, Math.trunc(time - this.spec.startedAt))) * 1000000n;
		this.export(EventType.SpanEnd, time, {
			status,
			durationNs
		});
	}
	export(eventTypeValue, time, options = {}) {
		this.seq += 1n;
		const isStart = eventTypeValue === EventType.SpanStart;
		const isEnd = eventTypeValue === EventType.SpanEnd;
		this.exporter.export({
			traceId: this.spec.traceId,
			spanId: this.spec.spanId,
			ts: epochNanos(time),
			seq: this.seq,
			eventType: eventTypeValue,
			extSpanId: `${this.spec.traceId}-${this.spec.spanId}`,
			parentSpanId: this.spec.parentSpanId,
			status: options.status ?? null,
			durationNs: options.durationNs ?? null,
			inputTokens: isEnd ? this.inputTokens : null,
			outputTokens: isEnd ? this.outputTokens : null,
			cacheReadTokens: isEnd ? this.cacheReadTokens : null,
			cacheWriteTokens: isEnd ? this.cacheWriteTokens : null,
			sessionId: this.spec.sessionId,
			tenantId: this.spec.tenantId,
			spanName: isStart ? this.spec.name : null,
			displayName: isStart ? this.spec.displayName : null,
			agentName: this.spec.agentName,
			toolName: this.spec.toolName ?? null,
			model: this.model,
			inputText: this.inputText,
			outputText: this.outputText,
			logs: options.logs ?? [],
			attrs: isEnd ? { ...this.spec.attributes } : {}
		});
	}
};
/**
* Loadable dsh-trace plugin. The class owns projection and embedded-delivery
* state; the seam owns capture and deployment-mounted redaction.
*/
var DshTrace = class extends Telemetry {
	static inject = ["sessions"];
	static Config = Config;
	/** Embedded traces stay on this machine and are never shared by this backend. */
	sharing = "disabled";
	ids;
	sessions = /* @__PURE__ */ new Map();
	resolved;
	logger;
	embedded;
	exporter;
	delivery = Promise.resolve();
	shutdownPromise;
	constructor(ctx, config) {
		super(ctx);
		this.resolved = resolveConfig(config);
		this.logger = ctx.logger;
		this.ids = new Snowflake(this.resolved.nodeId);
	}
	/** Open the embedded database before the telemetry capture listeners become active. */
	async *[Service.init]() {
		const database = await YiTraceDB.open({
			dataDir: this.resolved.database.dataDir,
			...this.resolved.database.tenantId === void 0 ? {} : { tenantId: this.resolved.database.tenantId.toString() }
		});
		this.embedded = new EmbeddedExporter(database, this.resolved.database.maxBuffered, (error, dropped) => {
			this.logger.warn(`dsh-trace: embedded ingest failed (${dropped} buffered events dropped)`, error);
		});
		this.exporter = new BatchExporter(this.embedded, this.resolved.batchSize);
		yield async () => {
			await this.shutdown();
		};
		new TelemetryCoordinator(this.ctx, this);
	}
	/**
	* Project one post-waterfall seam record into the open yiTrace hierarchy.
	* The method only creates SDK events and enqueues them in memory.
	* @param record - logical record handed over synchronously by the seam.
	*/
	emit(record) {
		switch (record.channel) {
			case "ledger":
				this.emitLedger(record);
				return;
			case "ops":
				this.emitOps(record);
				return;
		}
	}
	/** Forward a natural seam boundary into the serial embedded writer and retry buffer. */
	flush() {
		this.queueDelivery("flush", async () => {
			await this.requireExporter().flush();
			await this.requireEmbedded().flush();
		});
	}
	/**
	* Close open spans, drain queued writes, and stop awaiting after the
	* configured outer deadline. A native database call already in progress
	* cannot be canceled.
	* @returns fulfillment after the database closes, or rejection at the deadline.
	*/
	shutdown() {
		if (this.shutdownPromise !== void 0) return this.shutdownPromise;
		this.shutdownPromise = this.shutdownOnce();
		return this.shutdownPromise;
	}
	async shutdownOnce() {
		const time = Date.now();
		for (const [id, state] of this.sessions) this.closeSession(id, state, time);
		const close = this.queueDelivery("shutdown", async () => {
			await this.requireExporter().close();
		});
		let timer;
		const deadline = new Promise((_resolve, reject) => {
			timer = setTimeout(() => {
				reject(/* @__PURE__ */ new Error(`dsh-trace: embedded database shutdown exceeded ${this.resolved.shutdownTimeoutMillis}ms`));
			}, this.resolved.shutdownTimeoutMillis);
		});
		try {
			await Promise.race([close, deadline]);
		} finally {
			/* v8 ignore else -- the Promise executor assigns synchronously. */
			if (timer !== void 0) clearTimeout(timer);
		}
	}
	requireExporter() {
		if (this.exporter === void 0) throw new Error("dsh-trace: embedded exporter is not initialized");
		return this.exporter;
	}
	requireEmbedded() {
		if (this.embedded === void 0) throw new Error("dsh-trace: embedded database is not initialized");
		return this.embedded;
	}
	queueDelivery(label, operation) {
		this.delivery = this.delivery.then(operation).catch((error) => {
			this.logger.warn(`dsh-trace: ${label} failed`, error);
		});
		return this.delivery;
	}
	emitLedger(record) {
		const type = eventType(record);
		const id = sessionId(record);
		const state = this.session(id);
		switch (type) {
			case "turn/start": {
				const body = record.body;
				this.startTurn(id, state, body.turn, record, false);
				return;
			}
			case "turn/end": {
				const body = record.body;
				const turn = this.ensureTurn(id, state, body.turn, record);
				this.closeStep(turn, record.time, turn.failed ? 1 : 0);
				turn.span.setAttribute("dsh.turn.reason", body.reason.kind);
				turn.span.close(record.time, turn.failed ? 1 : turnStatus(body.reason));
				delete state.turn;
				return;
			}
			case "step/start": {
				const body = record.body;
				this.startStep(id, state, body.turn, body.step, record, false);
				return;
			}
			case "step/end": {
				const body = record.body;
				const turn = this.ensureTurn(id, state, body.turn, record);
				const step = this.ensureStep(id, state, body.turn, body.step, record);
				this.closeStep(turn, record.time, step.failed ? 1 : 0);
				return;
			}
			case "user/message": {
				const body = record.body;
				if (state.turn?.step === void 0) return;
				state.messages.push(contentText(body.content));
				return;
			}
			case "request/header": {
				const body = record.body;
				const step = state.turn?.step;
				if (step === void 0) return;
				if (body.header.system === void 0) delete state.system;
				else state.system = body.header.system;
				step.span.setModel(body.header.config.model);
				step.span.setAttribute("llm.provider", body.header.config.provider);
				step.span.setIo(this.requestText(state), void 0);
				step.span.log(record.time, bodyText({
					type,
					seq: eventSeq(record),
					body: record.body
				}));
				return;
			}
			case "assistant/message": {
				const body = record.body;
				const step = this.ensureStep(id, state, body.turn, body.step, record);
				const output = contentText(body.message.content);
				step.span.setModel(body.message.source.model);
				step.span.setAttribute("llm.provider", body.message.source.provider);
				step.span.setIo(this.requestText(state), output);
				step.span.setTokens(body.usage);
				state.messages.push(output);
				return;
			}
			case "tool/call": {
				const body = record.body;
				const step = this.ensureStep(id, state, body.turn, body.step, record);
				this.startTool(step, String(body.callId), body.name, body.arguments, record);
				return;
			}
			case "tool/result": {
				const body = record.body;
				const step = this.ensureStep(id, state, body.turn, body.step, record);
				const block = body.message.content[0];
				const callId = String(body.message.source.callId);
				const tool = step.tools.get(callId) ?? this.startTool(step, callId, "unknown", void 0, record, true);
				tool.setIo(void 0, contentText(block.content));
				if (body.error !== void 0) {
					tool.setAttribute("error.name", body.error.name);
					tool.setAttribute("error.code", body.error.code);
				}
				tool.close(record.time, block.isError === true ? 1 : 0);
				step.tools.delete(callId);
				state.messages.push(contentText(block.content));
				return;
			}
			case "assistant/chunk":
			case "session/end-seed": return;
			default: this.logGeneric(state, record);
		}
	}
	emitOps(record) {
		const id = sessionId(record);
		const op = record.attributes["telemetry.op"];
		if (op === "shutdown") {
			const state = this.sessions.get(id);
			if (state !== void 0) this.closeSession(id, state, record.time);
			return;
		}
		if (op !== "agent-error") return;
		const turnNumber = record.attributes["turn"];
		const stepNumber = record.attributes["step"];
		if (typeof turnNumber !== "number" || typeof stepNumber !== "number") return;
		const state = this.session(id);
		const turn = this.ensureTurn(id, state, turnNumber, record);
		const step = this.ensureStep(id, state, turnNumber, stepNumber, record);
		step.failed = true;
		turn.failed = true;
		step.span.setAttribute("error.name", String(record.attributes["error.name"] ?? "Error"));
		step.span.log(record.time, bodyText(record.body));
	}
	session(id) {
		let state = this.sessions.get(id);
		if (state !== void 0) return state;
		state = {
			numericId: stableSessionId(id),
			messages: []
		};
		this.sessions.set(id, state);
		return state;
	}
	startTurn(id, state, turnNumber, record, recovered) {
		if (state.turn?.turn === turnNumber) return state.turn;
		if (state.turn !== void 0) this.closeTurn(state.turn, record.time, 1);
		const traceId = this.ids.next();
		state.turn = {
			turn: turnNumber,
			span: this.openSpan({
				traceId,
				parentSpanId: null,
				sessionId: state.numericId,
				name: "dsh.turn",
				displayName: `Turn ${turnNumber}`,
				startedAt: record.time,
				attributes: {
					"dsh.session.id": id,
					"dsh.turn": turnNumber,
					...sourceSeqAttribute(record),
					...recovered ? { "dsh.recovered_segment": true } : {}
				}
			}),
			failed: false
		};
		return state.turn;
	}
	ensureTurn(id, state, turnNumber, record) {
		return state.turn?.turn === turnNumber ? state.turn : this.startTurn(id, state, turnNumber, record, true);
	}
	startStep(id, state, turnNumber, stepNumber, record, recovered) {
		const turn = this.ensureTurn(id, state, turnNumber, record);
		if (turn.step?.step === stepNumber) return turn.step;
		if (turn.step !== void 0) this.closeStep(turn, record.time, 1);
		turn.step = {
			turn: turnNumber,
			step: stepNumber,
			span: this.openSpan({
				traceId: turn.span.traceId,
				parentSpanId: turn.span.spanId,
				sessionId: state.numericId,
				name: "dsh.step",
				displayName: `Step ${turnNumber}.${stepNumber}`,
				startedAt: record.time,
				attributes: {
					"dsh.session.id": id,
					"dsh.turn": turnNumber,
					"dsh.step": stepNumber,
					...sourceSeqAttribute(record),
					...recovered ? { "dsh.recovered_segment": true } : {}
				}
			}),
			tools: /* @__PURE__ */ new Map(),
			failed: false
		};
		return turn.step;
	}
	ensureStep(id, state, turnNumber, stepNumber, record) {
		return state.turn?.turn === turnNumber && state.turn.step?.step === stepNumber ? state.turn.step : this.startStep(id, state, turnNumber, stepNumber, record, true);
	}
	startTool(step, callId, toolName, input, record, recovered = false) {
		const existing = step.tools.get(callId);
		if (existing !== void 0) return existing;
		const tool = this.openSpan({
			traceId: step.span.traceId,
			parentSpanId: step.span.spanId,
			sessionId: step.span.sessionId,
			name: `tool.${toolName}`,
			displayName: toolName,
			toolName,
			startedAt: record.time,
			attributes: {
				"dsh.turn": step.turn,
				"dsh.step": step.step,
				"dsh.tool.call_id": callId,
				...sourceSeqAttribute(record),
				...recovered ? { "dsh.recovered_segment": true } : {}
			}
		});
		tool.setIo(input, void 0);
		step.tools.set(callId, tool);
		return tool;
	}
	openSpan(spec) {
		return new OpenSpan(this.requireExporter(), {
			...spec,
			spanId: this.ids.next(),
			agentName: this.resolved.agentName,
			tenantId: this.resolved.database.tenantId ?? null
		});
	}
	closeStep(turn, time, status) {
		const step = turn.step;
		if (step === void 0) return;
		for (const tool of step.tools.values()) tool.close(time, 1);
		step.tools.clear();
		step.span.close(time, step.failed ? 1 : status);
		delete turn.step;
	}
	closeTurn(turn, time, status) {
		this.closeStep(turn, time, status);
		turn.span.close(time, turn.failed ? 1 : status);
	}
	closeSession(id, state, time) {
		if (state.turn !== void 0) this.closeTurn(state.turn, time, 1);
		this.sessions.delete(id);
	}
	requestText(state) {
		const sections = [state.system, ...state.messages].filter((value) => value !== void 0 && value.length > 0);
		return sections.length === 0 ? void 0 : sections.join("\n\n");
	}
	logGeneric(state, record) {
		const target = state.turn?.step?.span ?? state.turn?.span;
		if (target === void 0) return;
		target.log(record.time, bodyText({
			type: eventType(record),
			seq: eventSeq(record),
			body: record.body
		}));
		if (record.severity === "error") {
			if (state.turn?.step !== void 0) state.turn.step.failed = true;
			if (state.turn !== void 0) state.turn.failed = true;
		}
	}
};
//#endregion
export { Config, DEFAULT_BATCH_SIZE, DEFAULT_SHUTDOWN_TIMEOUT_MILLIS, DshTrace, DshTrace as default };
