import z from "@deepseek-ai/schemastery";
import path, { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import * as fs from "node:fs/promises";
import { clientRequestSchema } from "@deepseek-ai/dsh-client-connection";
//#region src/management.ts
/** Shared, JSON-only contracts for the Trace-owned recording store. */
const TRACE_DATA_CHANNEL = "/api";
const TRACE_DATA_PREFIX = "dsh-trace-data";
const DEFAULT_TRACE_SETTINGS = {
	captureEnabled: false,
	points: {
		models: true,
		tools: true,
		errors: true,
		compaction: true
	},
	captureModelText: false,
	captureToolPayloads: false,
	retentionDays: 30,
	cleanupIntervalHours: 24
};
/** Validate the complete settings object before accepting it at any boundary. */
function validateTraceSettings(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid Trace settings");
	const settings = value;
	const keys = [
		"captureEnabled",
		"points",
		"captureModelText",
		"captureToolPayloads",
		"retentionDays",
		"cleanupIntervalHours"
	];
	if (Object.keys(settings).some((key) => !keys.includes(key))) throw new Error("Unknown Trace setting");
	const points = settings.points;
	if (!points || typeof points !== "object" || Array.isArray(points)) throw new Error("Invalid capture points");
	const selected = points;
	if (Object.keys(selected).some((key) => ![
		"models",
		"tools",
		"errors",
		"compaction"
	].includes(key))) throw new Error("Unknown capture point");
	for (const key of [
		"models",
		"tools",
		"errors",
		"compaction"
	]) if (typeof selected[key] !== "boolean") throw new Error("Invalid capture point");
	for (const key of [
		"captureEnabled",
		"captureModelText",
		"captureToolPayloads"
	]) if (typeof settings[key] !== "boolean") throw new Error("Invalid capture switch");
	if (settings.captureEnabled && !Object.values(selected).some((value) => value === true)) throw new Error("Choose at least one capture point");
	const days = settings.retentionDays;
	if (days !== null && (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > 3650)) throw new Error("Retention must be 1–3650 days or unlimited");
	const hours = settings.cleanupIntervalHours;
	if (typeof hours !== "number" || !Number.isInteger(hours) || hours < 1 || hours > 168) throw new Error("Cleanup interval must be 1–168 hours");
	return {
		captureEnabled: settings.captureEnabled,
		points: {
			models: selected.models,
			tools: selected.tools,
			errors: selected.errors,
			compaction: selected.compaction
		},
		captureModelText: settings.captureModelText,
		captureToolPayloads: settings.captureToolPayloads,
		retentionDays: days,
		cleanupIntervalHours: hours
	};
}
//#endregion
//#region src/host/capture.ts
const usageKeys = [
	"inputTokens",
	"outputTokens",
	"cacheReadTokens",
	"cacheWriteTokens",
	"reasoningTokens"
];
const excludedPayloadKeys = /* @__PURE__ */ new Set([
	"reasoning",
	"reasoning_content",
	"reasoningcontent",
	"headers",
	"authorization",
	"apikey",
	"api_key"
]);
function usageMetadata(usage) {
	const metadata = {};
	for (const key of usageKeys) {
		const value = usage?.[key];
		if (typeof value === "number" && Number.isFinite(value) && value >= 0) metadata[key] = value;
	}
	return metadata;
}
/** Copy ordinary JSON tool arguments without retaining reasoning or credential fields. */
function ordinaryPayload(value) {
	if (Array.isArray(value)) return value.map(ordinaryPayload).filter((item) => item !== void 0);
	if (value !== null && typeof value === "object") {
		const record = value;
		if (record.type === "reasoning" || record.kind === "reasoning") return void 0;
		const result = {};
		for (const [key, item] of Object.entries(record)) {
			if (excludedPayloadKeys.has(key.toLowerCase())) continue;
			const clean = ordinaryPayload(item);
			if (clean !== void 0) Object.defineProperty(result, key, {
				value: clean,
				enumerable: true,
				writable: true,
				configurable: true
			});
		}
		return result;
	}
	if (value === null || typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number" && Number.isFinite(value)) return value;
}
function toolArguments(value) {
	try {
		return ordinaryPayload(JSON.parse(value));
	} catch {
		return value;
	}
}
/** Only user-visible text is copied; attachments, replay state and reasoning stay with DSH. */
function textContent(content) {
	const text = content.flatMap((block) => block.type === "text" ? [block.text] : []).join("\n\n");
	return text === "" ? void 0 : text;
}
function streamMetadata(stream) {
	const metadata = {};
	let failed = false;
	let usage;
	for (const record of stream) {
		if (record.type !== "chunk") continue;
		const chunk = record.chunk;
		if (chunk.type === "usage") usage = chunk.usage;
		if (chunk.type !== "finish") continue;
		metadata.reason = chunk.reason.kind;
		if (chunk.reason.kind === "error") {
			metadata.status = "failed";
			metadata.errorCode = chunk.reason.failure.code;
			failed = true;
		} else if (chunk.reason.kind === "aborted") {
			metadata.status = "interrupted";
			metadata.errorCode = chunk.reason.failure.code;
			failed = false;
		} else if (chunk.reason.kind === "max-tokens") {
			metadata.status = "failed";
			failed = true;
		} else if (chunk.reason.kind === "stop" || chunk.reason.kind === "tool-calls") {
			metadata.status = "completed";
			failed = false;
		}
	}
	return {
		metadata: {
			...metadata,
			...usageMetadata(usage)
		},
		failed
	};
}
function turnEnd(kind) {
	if (kind === "completed") return "completed";
	if (kind === "error" || kind === "blocked" || kind === "max-tokens") return "failed";
	if (kind === "aborted" || kind === "interrupted" || kind === "forked") return "interrupted";
}
/** Project one live host event into one whitelisted, JSON-only Trace event. */
function captureSessionEvent(sessionId, event) {
	const base = {
		sessionId,
		seq: event.seq,
		time: event.time,
		failed: false
	};
	switch (event.type) {
		case "turn/start": return {
			...base,
			type: event.type,
			point: "lifecycle",
			turn: event.data.turn,
			metadata: { status: "running" }
		};
		case "turn/end": {
			const end = turnEnd(event.data.reason.kind);
			const metadata = { reason: event.data.reason.kind };
			if (end !== void 0) metadata.status = end;
			if (event.data.reason.kind === "error") metadata.errorCode = event.data.reason.error.code;
			return {
				...base,
				type: event.type,
				point: "lifecycle",
				turn: event.data.turn,
				metadata,
				failed: end === "failed",
				...end === void 0 ? {} : { end }
			};
		}
		case "step/start":
		case "step/end": return {
			...base,
			type: event.type,
			point: "model",
			turn: event.data.turn,
			metadata: {
				step: event.data.step,
				status: event.type === "step/start" ? "running" : "ended"
			}
		};
		case "request/header": return {
			...base,
			type: event.type,
			point: "model",
			turn: null,
			metadata: {
				provider: event.data.header.config.provider,
				model: event.data.header.config.model
			}
		};
		case "assistant/message": {
			const stream = streamMetadata(event.data.stream);
			const metadata = {
				...stream.metadata,
				...usageMetadata(event.data.usage),
				step: event.data.step,
				provider: event.data.message.source.provider,
				model: event.data.message.source.model
			};
			if (event.data.interrupted) metadata.status = "interrupted";
			else if (metadata.status === void 0) metadata.status = "completed";
			const output = textContent(event.data.message.content);
			return {
				...base,
				type: event.type,
				point: "model",
				turn: event.data.turn,
				metadata,
				failed: event.data.interrupted ? false : stream.failed,
				...output === void 0 ? {} : { output }
			};
		}
		case "assistant/attempt": {
			const stream = streamMetadata(event.data.stream);
			return {
				...base,
				type: event.type,
				point: "model",
				turn: event.data.turn,
				metadata: {
					...stream.metadata,
					step: event.data.step
				},
				failed: stream.failed
			};
		}
		case "tool/call": {
			const input = toolArguments(event.data.arguments);
			return {
				...base,
				type: event.type,
				point: "tool",
				turn: event.data.turn,
				metadata: {
					step: event.data.step,
					toolName: event.data.name,
					callId: event.data.callId,
					status: "running"
				},
				...input === void 0 ? {} : { input }
			};
		}
		case "tool/result": {
			const metadata = {
				step: event.data.step,
				callId: event.data.message.toolCallId,
				status: event.data.message.isError ? "failed" : "completed"
			};
			if (event.data.error) {
				metadata.errorName = event.data.error.name;
				metadata.errorCode = event.data.error.code;
			}
			const output = textContent(event.data.message.content);
			return {
				...base,
				type: event.type,
				point: "tool",
				turn: event.data.turn,
				metadata,
				failed: event.data.message.isError === true,
				...output === void 0 ? {} : { output }
			};
		}
		case "compaction/start": return {
			...base,
			type: event.type,
			point: "compaction",
			turn: event.data.turn,
			metadata: { status: "running" }
		};
		case "compaction/end": {
			const failed = typeof event.data.error === "string";
			return {
				...base,
				type: event.type,
				point: "compaction",
				turn: event.data.turn,
				metadata: { status: failed ? "failed" : "completed" },
				failed
			};
		}
		default: return null;
	}
}
//#endregion
//#region src/host/store.ts
const RECORD_NAME = /^[a-f0-9]{64}-(?:turn|segment)-\d+\.trace\.json$/;
const META_KEYS = /* @__PURE__ */ new Set([
	"step",
	"model",
	"provider",
	"toolName",
	"callId",
	"status",
	"reason",
	"errorName",
	"errorCode",
	"inputTokens",
	"outputTokens",
	"cacheReadTokens",
	"cacheWriteTokens",
	"reasoningTokens"
]);
const DAY = 864e5;
const HOUR = 36e5;
const PREVIEW_LIFETIME = 3e5;
const MAX_PAYLOAD_BYTES = 1048576;
function message(error) {
	return error instanceof Error ? error.message : String(error);
}
function hash(value) {
	return createHash("sha256").update(value).digest("hex");
}
function object(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function finite(value) {
	return typeof value === "number" && Number.isFinite(value);
}
function integer(value) {
	return finite(value) && Number.isSafeInteger(value) && value >= 0;
}
function isEnd(value) {
	return value === "completed" || value === "failed" || value === "interrupted";
}
function noEntry(error) {
	return object(error) && error.code === "ENOENT";
}
function alreadyExists(error) {
	return object(error) && error.code === "EEXIST";
}
function alive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return !object(error) || error.code !== "ESRCH";
	}
}
function segmentEnd(event) {
	if (event.end !== void 0) return event.end;
	if (event.turn === null && event.type === "compaction/end" && isEnd(event.metadata.status)) return event.metadata.status;
}
/** Only JSON content is owned here. Reasoning blocks and fields never enter the copy. */
function payload(value, ancestors = /* @__PURE__ */ new Set()) {
	if (value === null || typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (typeof value !== "object") return void 0;
	if (ancestors.has(value)) throw new Error("Trace payload contains a circular reference");
	if (object(value) && [value.kind, value.type].some((kind) => typeof kind === "string" && /^(reasoning|thinking|redacted_thinking)$/i.test(kind))) return void 0;
	ancestors.add(value);
	try {
		if (Array.isArray(value)) return value.map((item) => payload(item, ancestors)).filter((item) => item !== void 0);
		const result = {};
		for (const [key, item] of Object.entries(value)) {
			if (/reasoning|chain.?of.?thought|^thinking$/i.test(key)) continue;
			const clean = payload(item, ancestors);
			if (clean !== void 0) Object.defineProperty(result, key, {
				value: clean,
				enumerable: true,
				configurable: true,
				writable: true
			});
		}
		return result;
	} finally {
		ancestors.delete(value);
	}
}
function cleanEvent(event, settings) {
	if (!event || typeof event.sessionId !== "string" || !event.sessionId || !integer(event.seq) || !finite(event.time) || event.time < 0 || event.turn !== null && !integer(event.turn)) throw new Error("Invalid Trace event identity");
	if (![
		"model",
		"tool",
		"compaction",
		"lifecycle"
	].includes(event.point) || typeof event.type !== "string" || !event.type || typeof event.failed !== "boolean" || !object(event.metadata) || event.end !== void 0 && !isEnd(event.end)) throw new Error("Invalid Trace event");
	const metadata = {};
	for (const [key, value] of Object.entries(event.metadata)) {
		if (!META_KEYS.has(key)) continue;
		if (value === null || typeof value === "string" || typeof value === "boolean" || finite(value)) metadata[key] = value;
	}
	const result = {
		sessionId: event.sessionId,
		turn: event.turn,
		seq: event.seq,
		time: event.time,
		type: event.type,
		point: event.point,
		failed: event.failed,
		metadata
	};
	if (event.end !== void 0) result.end = event.end;
	if (event.point === "model" && settings.captureModelText || event.point === "tool" && settings.captureToolPayloads) {
		const input = payload(event.input);
		const output = payload(event.output);
		if (input !== void 0) result.input = input;
		if (output !== void 0) result.output = output;
		if (Buffer.byteLength(JSON.stringify({
			input,
			output
		}), "utf8") > MAX_PAYLOAD_BYTES) throw new Error("Trace event payload exceeds 1 MiB");
	}
	return result;
}
/** A single writer, bounded to its own flat directory. It never reads DSH session files. */
var TraceDataStore = class {
	dataDir;
	options;
	now;
	owner = randomUUID();
	queue = Promise.resolve();
	initialized = false;
	closed = false;
	locked = false;
	initializedAt = 0;
	records = /* @__PURE__ */ new Map();
	previews = /* @__PURE__ */ new Map();
	lastCapturedAt = null;
	captureError = null;
	cleanupState = {
		lastRunAt: null,
		removedTraces: 0,
		lastError: null
	};
	constructor(options) {
		if (!options.dataDir || options.dataDir.split(/[\\/]/).includes("..")) throw new Error("Invalid Trace data directory");
		this.options = options;
		this.now = options.now ?? Date.now;
		this.dataDir = path.resolve(options.dataDir);
	}
	serial(operation, area = "capture") {
		const next = this.queue.then(operation).catch(async (error) => {
			if (area === "capture") this.captureError = message(error);
			else {
				this.cleanupState.lastError = message(error);
				if (this.initialized && this.locked) await this.persistState().catch(() => {});
			}
			throw error;
		});
		this.queue = next.then(() => void 0, () => void 0);
		return next;
	}
	settings() {
		return validateTraceSettings(this.options.getSettings());
	}
	requireReady() {
		if (this.closed) throw new Error("Trace data store is closed");
		if (!this.initialized) throw new Error("Trace data store is not initialized");
	}
	async directory() {
		const stat = await fs.lstat(this.dataDir);
		if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Trace data directory must be a real directory");
	}
	file(name) {
		if (name !== ".writer.lock" && name !== ".state.json" && !RECORD_NAME.test(name)) throw new Error("Invalid Trace store filename");
		return path.join(this.dataDir, name);
	}
	async readFile(name) {
		await this.directory();
		const before = await fs.lstat(this.file(name));
		if (!before.isFile() || before.isSymbolicLink()) throw new Error("Trace store entry must be a regular file");
		const handle = await fs.open(this.file(name), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
		try {
			const stat = await handle.stat();
			if (!stat.isFile() || stat.dev !== before.dev || stat.ino !== before.ino) throw new Error("Trace store entry changed while reading");
			return {
				text: await handle.readFile("utf8"),
				identity: stat
			};
		} finally {
			await handle.close();
		}
	}
	async read(name) {
		return (await this.readFile(name)).text;
	}
	async write(name, value) {
		await this.directory();
		const target = this.file(name);
		try {
			const current = await fs.lstat(target);
			if (!current.isFile() || current.isSymbolicLink()) throw new Error("Trace store entry must be a regular file");
		} catch (error) {
			if (!noEntry(error)) throw error;
		}
		const text = `${JSON.stringify(value)}\n`;
		const temp = `${target}.tmp-${this.owner}-${randomUUID()}`;
		try {
			const handle = await fs.open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
			try {
				await handle.writeFile(text, "utf8");
				await handle.sync();
			} finally {
				await handle.close();
			}
			await fs.rename(temp, target);
		} catch (error) {
			await fs.unlink(temp).catch(() => {});
			throw error;
		}
		return text;
	}
	async persistState() {
		await this.write(".state.json", {
			format: "dsh-trace-store",
			version: 1,
			lastCapturedAt: this.lastCapturedAt,
			cleanup: this.cleanupState
		});
	}
	async unlinkOwn(file, identity) {
		try {
			const current = await fs.lstat(file);
			if (!current.isFile() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino) throw new Error("Trace lock ownership changed; refusing to remove it");
			await fs.unlink(file);
		} catch (error) {
			if (!noEntry(error)) throw error;
		}
	}
	async createLock() {
		const file = this.file(".writer.lock");
		const handle = await fs.open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
		let identity;
		try {
			identity = await handle.stat();
			await handle.writeFile(JSON.stringify({
				version: 1,
				pid: process.pid,
				owner: this.owner
			}), "utf8");
			await handle.sync();
			await handle.close();
			this.locked = true;
		} catch (error) {
			await handle.close().catch(() => {});
			if (!identity) throw new Error(`${message(error)}; cannot identify incomplete Trace writer lock ${file}. Stop related DSH processes and move this lock aside before retrying.`);
			try {
				await this.unlinkOwn(file, identity);
			} catch (cleanupError) {
				throw new Error(`${message(error)}; failed to remove incomplete Trace writer lock: ${message(cleanupError)}`);
			}
			throw error;
		}
	}
	async lockSnapshot() {
		const { text, identity } = await this.readFile(".writer.lock");
		const lock = JSON.parse(text);
		if (!object(lock) || lock.version !== 1 || !integer(lock.pid) || lock.pid === 0 || typeof lock.owner !== "string") throw new Error("Invalid Trace writer lock; refusing to replace it");
		return {
			pid: lock.pid,
			identity
		};
	}
	async recoveryBlocked(guard) {
		let detail = "owner unknown";
		try {
			const stat = await fs.lstat(guard);
			if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Unsafe Trace recovery guard");
			const handle = await fs.open(path.join(guard, "owner.json"), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
			try {
				if (!(await handle.stat()).isFile()) throw new Error("Invalid recovery guard owner");
				const owner = JSON.parse(await handle.readFile("utf8"));
				if (object(owner) && integer(owner.pid) && owner.pid > 0) detail = `PID ${owner.pid} (${alive(owner.pid) ? "active" : "no longer running"})`;
			} finally {
				await handle.close();
			}
		} catch {}
		throw new Error(`Trace writer recovery is blocked by ${guard}; ${detail}. Stop all DSH processes using this data directory, move this recovery directory aside, then retry. It is never removed automatically.`);
	}
	async acquire() {
		try {
			await this.createLock();
			return;
		} catch (error) {
			if (!alreadyExists(error)) throw error;
		}
		if (alive((await this.lockSnapshot()).pid)) throw new Error("Trace data directory already has an active writer");
		const guard = path.join(this.dataDir, ".writer-recovery");
		try {
			await fs.mkdir(guard, { mode: 448 });
		} catch (error) {
			if (alreadyExists(error)) return this.recoveryBlocked(guard);
			throw error;
		}
		const identity = await fs.lstat(guard);
		const ownerFile = path.join(guard, "owner.json");
		let ownerIdentity;
		const errors = [];
		try {
			const owner = await fs.open(ownerFile, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
			try {
				ownerIdentity = await owner.stat();
				await owner.writeFile(JSON.stringify({
					version: 1,
					pid: process.pid,
					owner: this.owner
				}), "utf8");
			} finally {
				await owner.close();
			}
			try {
				const current = await this.lockSnapshot();
				if (alive(current.pid)) throw new Error("Trace data directory already has an active writer");
				await this.unlinkOwn(this.file(".writer.lock"), current.identity);
			} catch (error) {
				if (!noEntry(error)) throw error;
			}
			try {
				await this.createLock();
			} catch (error) {
				if (alreadyExists(error)) throw new Error("Trace data directory already has an active writer");
				throw error;
			}
		} catch (error) {
			errors.push(error);
		}
		try {
			const current = await fs.lstat(guard);
			if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino) throw new Error("Trace recovery guard ownership changed");
			if (ownerIdentity) await this.unlinkOwn(ownerFile, ownerIdentity);
			await fs.rmdir(guard);
		} catch (error) {
			errors.push(/* @__PURE__ */ new Error(`${message(error)}; Trace recovery guard remains at ${guard}. Stop related DSH processes and move it aside before retrying.`));
			if (this.locked) try {
				await this.release();
			} catch (releaseError) {
				errors.push(releaseError);
			}
		}
		if (errors.length === 1) throw errors[0];
		if (errors.length > 1) throw new AggregateError(errors, errors.map(message).join("; "));
	}
	async release() {
		if (!this.locked) return;
		const lock = JSON.parse(await this.read(".writer.lock"));
		if (!object(lock) || lock.owner !== this.owner) throw new Error("Trace writer lock ownership changed");
		await fs.unlink(this.file(".writer.lock"));
		this.locked = false;
	}
	decode(name, text) {
		const data = JSON.parse(text);
		if (!object(data) || data.version !== 1 || typeof data.id !== "string" || `${data.id}.trace.json` !== name || typeof data.sessionId !== "string" || !data.sessionId || data.turn !== null && !integer(data.turn) || !finite(data.startedAt) || !finite(data.updatedAt) || !(data.endedAt === null || finite(data.endedAt)) || ![
			"running",
			"completed",
			"failed",
			"interrupted"
		].includes(String(data.status)) || !Array.isArray(data.events)) throw new Error(`Invalid owned Trace record: ${name}`);
		if (Object.keys(data).some((key) => ![
			"version",
			"id",
			"sessionId",
			"turn",
			"startedAt",
			"updatedAt",
			"endedAt",
			"status",
			"events"
		].includes(key))) throw new Error(`Unknown field in owned Trace record: ${name}`);
		const prefix = `${hash(data.sessionId)}-${data.turn === null ? "segment" : "turn"}-`;
		if (!data.id.startsWith(prefix) || data.turn !== null && data.id !== `${prefix}${data.turn}`) throw new Error(`Trace record identity mismatch: ${name}`);
		const seen = /* @__PURE__ */ new Set();
		for (const item of data.events) {
			if (!object(item)) throw new Error(`Invalid Trace event in ${name}`);
			const event = cleanEvent(item, {
				captureEnabled: true,
				points: {
					models: true,
					tools: true,
					errors: true,
					compaction: true
				},
				captureModelText: true,
				captureToolPayloads: true,
				retentionDays: null,
				cleanupIntervalHours: 24
			});
			if (event.sessionId !== data.sessionId || event.turn !== data.turn || seen.has(event.seq) || JSON.stringify(event) !== JSON.stringify(item)) throw new Error(`Invalid Trace event in ${name}`);
			seen.add(event.seq);
		}
		return {
			record: data,
			bytes: Buffer.byteLength(text),
			digest: hash(text)
		};
	}
	active(record) {
		return record.status === "running" || record.endedAt === null && (this.options.activeSessionIds?.().has(record.sessionId) ?? false);
	}
	eligible(entry, settings, now = this.now()) {
		return settings.retentionDays !== null && !this.active(entry.record) && entry.record.updatedAt < now - settings.retentionDays * DAY;
	}
	async settleSegments(event) {
		const end = segmentEnd(event);
		if (end === void 0) return;
		for (const [name, entry] of this.records) {
			const record = entry.record;
			if (record.sessionId !== event.sessionId || record.status !== "running") continue;
			const sameTurn = record.turn === event.turn;
			const earlierUnassigned = event.end !== void 0 && record.turn === null && record.events.every((item) => item.seq <= event.seq);
			if (!sameTurn && !earlierUnassigned) continue;
			const ended = {
				...record,
				updatedAt: Math.max(record.updatedAt, event.time),
				endedAt: event.time,
				status: end
			};
			const text = await this.write(name, ended);
			this.records.set(name, {
				record: ended,
				bytes: Buffer.byteLength(text),
				digest: hash(text)
			});
		}
	}
	initialize() {
		return this.serial(async () => {
			if (this.closed) throw new Error("Trace data store is closed");
			this.settings();
			if (this.initialized) return;
			await fs.mkdir(this.dataDir, {
				recursive: true,
				mode: 448
			});
			await this.directory();
			await fs.chmod(this.dataDir, 448);
			await this.acquire();
			try {
				this.records.clear();
				try {
					const state = JSON.parse(await this.read(".state.json"));
					if (!object(state) || state.format !== "dsh-trace-store" || state.version !== 1 || !(state.lastCapturedAt === null || finite(state.lastCapturedAt)) || !object(state.cleanup) || !(state.cleanup.lastRunAt === null || finite(state.cleanup.lastRunAt)) || !integer(state.cleanup.removedTraces) || !(state.cleanup.lastError === null || typeof state.cleanup.lastError === "string")) throw new Error("Invalid Trace store state");
					this.lastCapturedAt = state.lastCapturedAt;
					this.cleanupState = state.cleanup;
				} catch (error) {
					if (!noEntry(error)) throw error;
				}
				for (const name of await fs.readdir(this.dataDir)) {
					if (!RECORD_NAME.test(name)) continue;
					const entry = this.decode(name, await this.read(name));
					if (entry.record.status === "running" && !this.options.activeSessionIds?.().has(entry.record.sessionId)) {
						entry.record.status = "interrupted";
						const text = await this.write(name, entry.record);
						entry.bytes = Buffer.byteLength(text);
						entry.digest = hash(text);
					}
					this.records.set(name, entry);
				}
				if (this.lastCapturedAt === null && this.records.size > 0) this.lastCapturedAt = Math.max(...[...this.records.values()].map((entry) => entry.record.updatedAt));
				this.initializedAt = this.now();
				this.initialized = true;
				this.captureError = null;
			} catch (error) {
				await this.release();
				throw error;
			}
		});
	}
	record(event) {
		return this.serial(async () => {
			this.requireReady();
			const settings = this.settings();
			if (!settings.captureEnabled) {
				if (event.end === void 0 && !(event.turn === null && event.type === "compaction/end")) return;
				const clean = cleanEvent(event, {
					...settings,
					captureModelText: false,
					captureToolPayloads: false
				});
				await this.settleSegments(clean);
				this.captureError = null;
				return;
			}
			if (!(event.point === "lifecycle" || event.point === "model" && settings.points.models || event.point === "tool" && settings.points.tools || event.point === "compaction" && settings.points.compaction || settings.points.errors && (event.failed || event.metadata.status === "interrupted" || event.end === "interrupted"))) return;
			const clean = cleanEvent(event, settings);
			const sessionPrefix = hash(clean.sessionId);
			let name = clean.turn === null ? void 0 : `${sessionPrefix}-turn-${clean.turn}.trace.json`;
			if (name === void 0) {
				const existing = [...this.records.entries()].filter(([, entry]) => entry.record.sessionId === clean.sessionId && entry.record.turn === null);
				name = (existing.find(([, entry]) => entry.record.events.some((item) => item.seq === clean.seq)) ?? existing.findLast(([, entry]) => entry.record.status === "running"))?.[0] ?? `${sessionPrefix}-segment-${clean.seq}.trace.json`;
			}
			const previous = this.records.get(name);
			if (previous?.record.events.some((item) => item.seq === clean.seq)) {
				await this.settleSegments(clean);
				return;
			}
			const record = previous ? {
				...previous.record,
				events: [...previous.record.events]
			} : {
				version: 1,
				id: name.slice(0, -11),
				sessionId: clean.sessionId,
				turn: clean.turn,
				startedAt: clean.time,
				updatedAt: clean.time,
				endedAt: null,
				status: "running",
				events: []
			};
			record.events.push(clean);
			record.events.sort((a, b) => a.seq - b.seq);
			record.startedAt = Math.min(record.startedAt, clean.time);
			record.updatedAt = Math.max(record.updatedAt, clean.time);
			if (record.status === "interrupted" && record.endedAt === null && clean.end === void 0) record.status = "running";
			const end = segmentEnd(clean);
			if (end !== void 0) {
				record.status = end;
				record.endedAt = clean.time;
			}
			const text = await this.write(name, record);
			this.records.set(name, {
				record,
				bytes: Buffer.byteLength(text),
				digest: hash(text)
			});
			await this.settleSegments(clean);
			this.lastCapturedAt = this.now();
			await this.persistState();
			this.captureError = null;
		});
	}
	/** End only our recording segment when its host session is disposed. */
	finishSession(sessionId) {
		return this.serial(async () => {
			this.requireReady();
			this.settings();
			if (typeof sessionId !== "string" || !sessionId) throw new Error("Invalid Trace session identity");
			for (const [name, entry] of this.records) {
				if (entry.record.sessionId !== sessionId || entry.record.status !== "running") continue;
				const now = this.now();
				const record = {
					...entry.record,
					status: "interrupted",
					endedAt: now,
					updatedAt: Math.max(entry.record.updatedAt, now)
				};
				const text = await this.write(name, record);
				this.records.set(name, {
					record,
					bytes: Buffer.byteLength(text),
					digest: hash(text)
				});
			}
			this.captureError = null;
		});
	}
	status() {
		return this.serial(async () => {
			const settings = this.settings();
			const entries = [...this.records.values()];
			const eligible = entries.filter((entry) => this.eligible(entry, settings));
			return {
				settings,
				dataDir: this.dataDir,
				stats: {
					traces: entries.length,
					events: entries.reduce((sum, entry) => sum + entry.record.events.length, 0),
					bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
					activeTraces: entries.filter((entry) => this.active(entry.record)).length,
					oldestAt: entries.length ? Math.min(...entries.map((entry) => entry.record.startedAt)) : null
				},
				lastCapturedAt: this.lastCapturedAt,
				captureError: this.captureError,
				cleanup: {
					...this.cleanupState,
					nextRunAt: settings.retentionDays === null ? null : (this.cleanupState.lastRunAt ?? this.initializedAt) + (this.cleanupState.lastRunAt === null ? 0 : settings.cleanupIntervalHours * HOUR),
					eligibleTraces: eligible.length,
					eligibleBytes: eligible.reduce((sum, entry) => sum + entry.bytes, 0)
				}
			};
		});
	}
	previewCleanup() {
		return this.serial(async () => {
			this.requireReady();
			const settings = this.settings();
			const now = this.now();
			const targets = /* @__PURE__ */ new Map();
			let events = 0;
			let bytes = 0;
			for (const [name, entry] of this.records) {
				if (!this.eligible(entry, settings, now)) continue;
				if (this.decode(name, await this.read(name)).digest !== entry.digest) throw new Error("Trace file changed outside the store; refresh before cleanup");
				targets.set(name, entry.digest);
				events += entry.record.events.length;
				bytes += entry.bytes;
			}
			for (const [key, preview] of this.previews) if (preview.expiresAt <= now) this.previews.delete(key);
			const token = randomUUID();
			const expiresAt = now + PREVIEW_LIFETIME;
			this.previews.set(token, {
				expiresAt,
				targets
			});
			return {
				token,
				traces: targets.size,
				events,
				bytes,
				cutoffAt: settings.retentionDays === null ? null : now - settings.retentionDays * DAY,
				expiresAt
			};
		}, "cleanup");
	}
	async remove(targets, settings) {
		const result = {
			removedTraces: 0,
			removedBytes: 0,
			skippedTraces: 0,
			completedAt: this.now()
		};
		this.cleanupState.lastRunAt = result.completedAt;
		this.cleanupState.removedTraces = 0;
		this.cleanupState.lastError = null;
		try {
			for (const [name, digest] of targets) {
				const entry = this.records.get(name);
				if (!entry || !this.eligible(entry, settings) || entry.digest !== digest) {
					result.skippedTraces++;
					continue;
				}
				let current;
				try {
					current = this.decode(name, await this.read(name));
				} catch (error) {
					if (noEntry(error)) {
						this.records.delete(name);
						result.skippedTraces++;
						continue;
					}
					throw error;
				}
				if (current.digest !== digest || !this.eligible(current, settings)) {
					result.skippedTraces++;
					continue;
				}
				await fs.unlink(this.file(name));
				this.records.delete(name);
				result.removedTraces++;
				result.removedBytes += current.bytes;
				this.cleanupState.removedTraces = result.removedTraces;
			}
			result.completedAt = this.now();
			this.cleanupState.lastRunAt = result.completedAt;
			await this.persistState();
			return result;
		} catch (error) {
			this.cleanupState.lastError = message(error);
			await this.persistState().catch(() => {});
			throw error;
		}
	}
	cleanup(token) {
		return this.serial(async () => {
			this.requireReady();
			const settings = this.settings();
			const preview = this.previews.get(token);
			this.previews.delete(token);
			if (!preview || preview.expiresAt <= this.now()) throw new Error("Trace cleanup preview expired; preview again before confirming");
			return this.remove(preview.targets, settings);
		}, "cleanup");
	}
	cleanupIfDue() {
		return this.serial(async () => {
			this.requireReady();
			const settings = this.settings();
			if (settings.retentionDays === null) return;
			if (this.cleanupState.lastRunAt !== null && this.now() < this.cleanupState.lastRunAt + settings.cleanupIntervalHours * HOUR) return;
			const targets = new Map([...this.records].filter(([, entry]) => this.eligible(entry, settings)).map(([name, entry]) => [name, entry.digest]));
			await this.remove(targets, settings);
		}, "cleanup");
	}
	close() {
		return this.serial(async () => {
			if (this.closed) return;
			await this.release();
			this.closed = true;
			this.initialized = false;
			this.previews.clear();
		});
	}
};
//#endregion
//#region src/host/rpc.ts
const fail = (code, message) => ({
	ok: false,
	error: {
		code,
		message,
		details: {}
	}
});
/** Operations receive only the already admitted request, never caller-supplied paths. */
function traceDataOperation(store) {
	return async (endpoint, payload, signal) => {
		if (signal.aborted) return fail("aborted", "The request was cancelled");
		if (!payload || typeof payload !== "object" || Array.isArray(payload)) return fail("invalid-payload", "Invalid Trace data request");
		const body = payload;
		try {
			if (endpoint === "status" || endpoint === "cleanup/preview") {
				if (Object.keys(body).length > 0) return fail("invalid-payload", "This request does not accept fields");
				return {
					ok: true,
					value: endpoint === "status" ? await store.status() : await store.previewCleanup()
				};
			}
			if (endpoint === "cleanup/apply") {
				if (Object.keys(body).length !== 1 || typeof body.token !== "string" || body.token.length < 1 || body.token.length > 200) return fail("invalid-payload", "A valid cleanup preview token is required");
				return {
					ok: true,
					value: await store.cleanup(body.token)
				};
			}
			return fail("not-found", "Unknown Trace data operation");
		} catch (error) {
			return fail("trace-data-error", error instanceof Error ? error.message : "Trace data operation failed");
		}
	};
}
/**
* Exact Fetch routes share Connection's owner gate, authentication, and body cap.
* They avoid the SDK's generic-channel registration, whose captured service
* context cannot read webServer in a strict Loader tree.
*/
function traceDataRoutes(store) {
	const operate = traceDataOperation(store);
	return [
		"status",
		"cleanup/preview",
		"cleanup/apply"
	].map((endpoint) => {
		const method = `${TRACE_DATA_PREFIX}/${endpoint}`;
		const path = `${TRACE_DATA_CHANNEL}/${method}`;
		return {
			path,
			methods: ["POST"],
			requestBody: "buffered",
			async fetch(request) {
				if (request.method !== "POST" || new URL(request.url).pathname !== path) return new Response("not found", { status: 404 });
				if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") return new Response("content type must be application/json", { status: 415 });
				let body;
				try {
					body = await request.json();
				} catch {
					return new Response("body is not JSON", { status: 400 });
				}
				const envelope = clientRequestSchema.safeParse(body);
				if (!envelope.success) return new Response("invalid client-request message", { status: 400 });
				const message = envelope.data;
				const result = message.method === method ? await operate(endpoint, message.payload, request.signal) : fail("gateway/bad-request", "The request method does not match this Trace endpoint");
				return Response.json({
					type: "server-response",
					rpcId: message.rpcId,
					result
				});
			}
		};
	});
}
//#endregion
//#region src/index.ts
const name = "dsh-trace-viewer";
const inject = ["sessions", "profileContext"];
const Settings = z.object({
	captureEnabled: z.boolean().default(false),
	points: z.object({
		models: z.boolean().default(true),
		tools: z.boolean().default(true),
		errors: z.boolean().default(true),
		compaction: z.boolean().default(true)
	}),
	captureModelText: z.boolean().default(false),
	captureToolPayloads: z.boolean().default(false),
	retentionDays: z.union([z.number().step(1).min(1).max(3650), z.const(null)]),
	cleanupIntervalHours: z.number().step(1).min(1).max(168).default(24)
});
/** Only data schemas survive DSH's settings descriptor transport; validate cross-field rules at use/write boundaries. */
const Config = z.object({ settings: Settings.default(DEFAULT_TRACE_SETTINGS).volatile() });
/** Locate only the currently active boundary; seed contents are never copied. */
function liveTurn(session) {
	for (let offset = Number(session.seq) - 1; offset >= 0; offset--) {
		const event = session.eventAt(offset);
		if (event?.type === "turn/end") return void 0;
		if (event?.type === "turn/start") return event.data.turn;
	}
}
/** Capture post-commit events globally, independently of which UI page is open. */
async function apply(ctx, config) {
	const profile = ctx.get("profileContext");
	if (!profile) throw new Error("Trace data management requires a DSH profile");
	const activeSessions = /* @__PURE__ */ new Set();
	const turns = /* @__PURE__ */ new Map();
	for (const session of ctx.sessions.list()) {
		const turn = liveTurn(session);
		if (turn !== void 0) {
			activeSessions.add(String(session.id));
			turns.set(String(session.id), turn);
		}
	}
	const settings = () => validateTraceSettings(config.settings.get());
	const store = new TraceDataStore({
		dataDir: join(profile.dir, "data", "dsh-trace-viewer"),
		getSettings: settings,
		activeSessionIds: () => activeSessions
	});
	await store.initialize();
	ctx.effect(() => () => store.close());
	const report = (error) => {
		ctx.logger.warn("Trace-owned data operation failed", error);
	};
	ctx.on("session/created", (session) => {
		const turn = liveTurn(session);
		if (turn !== void 0) {
			activeSessions.add(String(session.id));
			turns.set(String(session.id), turn);
		}
	});
	ctx.on("session/event", (session, event) => {
		const id = String(session.id);
		if (event.type === "turn/start") {
			activeSessions.add(id);
			turns.set(id, event.data.turn);
		} else if (event.type === "step/start") {
			activeSessions.add(id);
			turns.set(id, event.data.turn);
		}
		try {
			if (settings().captureEnabled || event.type === "turn/end" || event.type === "compaction/end") {
				const value = captureSessionEvent(id, event);
				if (value) {
					if (value.type === "request/header" && value.turn === null && turns.has(id)) value.turn = turns.get(id);
					store.record(value).catch(report);
				}
			}
		} catch (error) {
			report(error);
		}
		if (event.type === "turn/end") {
			activeSessions.delete(id);
			turns.delete(id);
		}
	});
	ctx.on("session/disposed", (session) => {
		const id = String(session.id);
		activeSessions.delete(id);
		turns.delete(id);
		store.finishSession(id).catch(report);
	});
	const timer = setInterval(() => {
		store.cleanupIfDue().catch(report);
	}, 6e4);
	timer.unref();
	ctx.effect(() => () => {
		clearInterval(timer);
	});
	ctx.inject(["connection"], (child) => {
		for (const route of traceDataRoutes(store)) child.connection.fetch.register(route);
	});
}
//#endregion
export { Config, apply, inject, name };
