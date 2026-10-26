window.__ModuleLoader__.load({
	id: "@vibeinging/dsh-trace-viewer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** Product copy for the read-only Trace workbench. */
		const zh = {
			"dataManagement": "数据管理",
			"view": "Trace",
			"title": "执行轨迹",
			"subtitle": "模型与工具的真实调用记录",
			"focusMode": "专注查看",
			"showComposer": "显示输入框",
			"hideComposer": "收起输入框",
			"toolCall": "工具调用",
			"request": "用户请求",
			"previousTurn": "上一轮",
			"nextTurn": "下一轮",
			"modelCount": "模型",
			"toolCount": "工具",
			"inputTokens": "输入 token",
			"outputTokens": "输出 token",
			"turn": "第 {turn} 轮",
			"unresolved": "未归属轮次",
			"turnPicker": "查看轮次",
			"scope": "当前轮次 · 已加载记录",
			"partialHistory": "还有更早的记录未加载",
			"loadOlder": "加载更早记录",
			"loading": "正在加载",
			"loadFailed": "记录读取失败，请重试",
			"readFailed": "会话读取失败",
			"readFailedBody": "请重新打开此会话后重试。",
			"unavailable": "当前宿主未提供轨迹数据",
			"unavailableBody": "请启用官方轨迹插件，并使用兼容的 DSH 版本。",
			"empty": "这个会话还没有调用记录",
			"emptyBody": "会话中的模型和工具执行会显示在这里。",
			"noMatches": "没有匹配的调用",
			"clearFilters": "清除筛选",
			"selectHint": "选择一步，查看它的输入与输出",
			"search": "搜索调用、工具或文件",
			"all": "全部",
			"errors": "仅失败",
			"models": "仅模型",
			"duration": "本轮耗时",
			"calls": "模型 / 工具",
			"tokens": "输入 / 输出",
			"cache": "缓存读取",
			"partialUsage": "部分用量未上报",
			"missing": "未采集",
			"none": "无记录",
			"steps": "调用与步骤",
			"elapsed": "相对时间",
			"durationColumn": "耗时",
			"shown": "{visible} / {total} 条记录",
			"withAncestors": "保留父级上下文",
			"model": "模型调用",
			"tool": "工具执行",
			"compaction": "压缩历史",
			"notice": "会话记录",
			"running": "执行中",
			"completed": "已完成",
			"failed": "失败",
			"interrupted": "已中断",
			"unknown": "状态未记录",
			"expand": "展开 {name}",
			"collapse": "收起 {name}",
			"select": "查看 {name}",
			"input": "输入",
			"output": "输出",
			"record": "原始记录",
			"detailTabs": "详情内容",
			"recordScope": "这是 DSH 提供的轨迹投影，字段以已加载记录为准。",
			"modelInputScope": "此处显示记录的请求配置、系统提示和工具定义；不代表完整消息请求体。",
			"timingMissing": "缺少完整时间记录，未推算耗时。",
			"failedRetained": "后续成功不会覆盖这次失败记录。",
			"streaming": "持续接收当前会话的执行记录",
			"source": "DSH 会话 · 本地只读",
			"copy": "复制内容",
			"copied": "已复制",
			"copyFailed": "复制失败，可直接选中文本复制",
			"showMore": "展开完整内容",
			"showLess": "收起长内容",
			"truncated": "长内容已折叠",
			"parent": "上级调用",
			"closeDetail": "关闭详情",
			"seconds": "s",
			"milliseconds": "ms"
		};
		const en = {
			"dataManagement": "Data management",
			"view": "Trace",
			"title": "Execution trace",
			"subtitle": "Recorded model and tool calls",
			"focusMode": "Focus",
			"showComposer": "Show composer",
			"hideComposer": "Hide composer",
			"toolCall": "Tool call",
			"request": "Request",
			"previousTurn": "Previous turn",
			"nextTurn": "Next turn",
			"modelCount": "Models",
			"toolCount": "Tools",
			"inputTokens": "Input tokens",
			"outputTokens": "Output tokens",
			"turn": "Turn {turn}",
			"unresolved": "Unassigned turn",
			"turnPicker": "Choose turn",
			"scope": "Current turn · loaded records",
			"partialHistory": "Earlier records have not been loaded",
			"loadOlder": "Load earlier records",
			"loading": "Loading",
			"loadFailed": "Could not read records. Try again.",
			"readFailed": "Could not read this session",
			"readFailedBody": "Reopen this session and try again.",
			"unavailable": "Trajectory data is unavailable",
			"unavailableBody": "Enable the official Trajectory plugin and use a compatible DSH version.",
			"empty": "No calls in this session yet",
			"emptyBody": "Recorded model and tool calls will appear here.",
			"noMatches": "No matching calls",
			"clearFilters": "Clear filters",
			"selectHint": "Select a step to inspect its input and output",
			"search": "Search calls, tools, or files",
			"all": "All",
			"errors": "Failures",
			"models": "Models",
			"duration": "Turn duration",
			"calls": "Models / tools",
			"tokens": "Input / output",
			"cache": "Cache read",
			"partialUsage": "Some usage was not reported",
			"missing": "Not recorded",
			"none": "No recorded content",
			"steps": "Calls and steps",
			"elapsed": "Relative time",
			"durationColumn": "Duration",
			"shown": "{visible} / {total} records",
			"withAncestors": "Parent context retained",
			"model": "Model call",
			"tool": "Tool execution",
			"compaction": "History compaction",
			"notice": "Session record",
			"running": "Running",
			"completed": "Complete",
			"failed": "Failed",
			"interrupted": "Interrupted",
			"unknown": "Status not recorded",
			"expand": "Expand {name}",
			"collapse": "Collapse {name}",
			"select": "Inspect {name}",
			"input": "Input",
			"output": "Output",
			"record": "Record",
			"detailTabs": "Detail content",
			"recordScope": "This is the DSH trajectory projection. Fields reflect the loaded records.",
			"modelInputScope": "Recorded request configuration, system prompt, and tool definitions; this is not the complete request message body.",
			"timingMissing": "Complete timing is unavailable. Duration is not inferred.",
			"failedRetained": "Later success does not overwrite this failure.",
			"streaming": "Receiving execution records from the current session",
			"source": "DSH session · local, read-only",
			"copy": "Copy content",
			"copied": "Copied",
			"copyFailed": "Copy failed. Select the text to copy it manually.",
			"showMore": "Expand full content",
			"showLess": "Collapse long content",
			"truncated": "Long content collapsed",
			"parent": "Parent call",
			"closeDetail": "Close details",
			"seconds": "s",
			"milliseconds": "ms"
		};
		//#endregion
		//#region ../../node_modules/.pnpm/@tanstack+virtual-core@3.17.8/node_modules/@tanstack/virtual-core/dist/esm/lazy-measurements.js
		function createLazyMeasurementsView(count, flat, getItemKey) {
			const cache = new Array(count);
			return new Proxy(cache, { get(target, prop, receiver) {
				if (typeof prop === "string") {
					const c = prop.charCodeAt(0);
					if (c >= 48 && c <= 57) {
						const i = +prop;
						if (Number.isInteger(i) && i >= 0 && i < count) {
							let v = target[i];
							if (!v) {
								const s = flat[i * 2];
								v = target[i] = {
									index: i,
									key: getItemKey(i),
									start: s,
									size: flat[i * 2 + 1],
									end: s + flat[i * 2 + 1],
									lane: 0
								};
							}
							return v;
						}
					}
					if (prop === "length") return count;
				}
				return Reflect.get(target, prop, receiver);
			} });
		}
		//#endregion
		//#region ../../node_modules/.pnpm/@tanstack+virtual-core@3.17.8/node_modules/@tanstack/virtual-core/dist/esm/utils.js
		function memo(getDeps, fn, opts) {
			let deps = opts.initialDeps ?? [];
			let result;
			let isInitial = true;
			function memoizedFunction() {
				const newDeps = getDeps();
				if (!(newDeps.length !== deps.length || newDeps.some((dep, index) => deps[index] !== dep))) return result;
				deps = newDeps;
				result = fn(...newDeps);
				if ((opts == null ? void 0 : opts.onChange) && !(isInitial && opts.skipInitialOnChange)) opts.onChange(result);
				isInitial = false;
				return result;
			}
			memoizedFunction.updateDeps = (newDeps) => {
				deps = newDeps;
			};
			return memoizedFunction;
		}
		function notUndefined(value, msg) {
			if (value === void 0) throw new Error(`Unexpected undefined${msg ? `: ${msg}` : ""}`);
			else return value;
		}
		const approxEqual = (a, b) => Math.abs(a - b) < 1.01;
		const debounce = (targetWindow, fn, ms) => {
			let timeoutId;
			return Object.assign(function(...args) {
				targetWindow.clearTimeout(timeoutId);
				timeoutId = targetWindow.setTimeout(() => fn.apply(this, args), ms);
			}, { cancel: () => {
				targetWindow.clearTimeout(timeoutId);
			} });
		};
		//#endregion
		//#region ../../node_modules/.pnpm/@tanstack+virtual-core@3.17.8/node_modules/@tanstack/virtual-core/dist/esm/index.js
		let _isIOSResult;
		const isIOSWebKit = () => {
			if (_isIOSResult !== void 0) return _isIOSResult;
			if (typeof navigator === "undefined") return _isIOSResult = false;
			if (/iP(hone|od|ad)/.test(navigator.userAgent)) return _isIOSResult = true;
			const mtp = navigator.maxTouchPoints;
			return _isIOSResult = navigator.platform === "MacIntel" && mtp !== void 0 && mtp > 0;
		};
		const getRect = (element) => {
			const { offsetWidth, offsetHeight } = element;
			return {
				width: offsetWidth,
				height: offsetHeight
			};
		};
		const defaultKeyExtractor = (index) => index;
		const defaultRangeExtractor = (range) => {
			const start = Math.max(range.startIndex - range.overscan, 0);
			const len = Math.min(range.endIndex + range.overscan, range.count - 1) - start + 1;
			const arr = new Array(len);
			for (let i = 0; i < len; i++) arr[i] = start + i;
			return arr;
		};
		const observeElementRect = (instance, cb) => {
			const element = instance.scrollElement;
			if (!element) return;
			const targetWindow = instance.targetWindow;
			if (!targetWindow) return;
			const handler = (rect) => {
				const { width, height } = rect;
				cb({
					width: Math.round(width),
					height: Math.round(height)
				});
			};
			handler(getRect(element));
			if (!targetWindow.ResizeObserver) return () => {};
			const observer = new targetWindow.ResizeObserver((entries) => {
				const run = () => {
					const entry = entries[0];
					if (entry == null ? void 0 : entry.borderBoxSize) {
						const box = entry.borderBoxSize[0];
						if (box) {
							handler({
								width: box.inlineSize,
								height: box.blockSize
							});
							return;
						}
					}
					handler(getRect(element));
				};
				instance.options.useAnimationFrameWithResizeObserver ? requestAnimationFrame(run) : run();
			});
			observer.observe(element, { box: "border-box" });
			return () => {
				observer.unobserve(element);
			};
		};
		const addEventListenerOptions = { passive: true };
		const supportsScrollend = typeof window == "undefined" ? true : "onscrollend" in window;
		const observeOffset = (instance, cb, readOffset) => {
			const element = instance.scrollElement;
			if (!element) return;
			const targetWindow = instance.targetWindow;
			if (!targetWindow) return;
			const registerScrollendEvent = instance.options.useScrollendEvent && supportsScrollend;
			let offset = 0;
			const fallback = registerScrollendEvent ? null : debounce(targetWindow, () => cb(offset, false), instance.options.isScrollingResetDelay);
			const createHandler = (isScrolling) => () => {
				offset = readOffset(element);
				fallback?.();
				cb(offset, isScrolling);
			};
			const handler = createHandler(true);
			const endHandler = createHandler(false);
			element.addEventListener("scroll", handler, addEventListenerOptions);
			if (registerScrollendEvent) element.addEventListener("scrollend", endHandler, addEventListenerOptions);
			return () => {
				element.removeEventListener("scroll", handler);
				if (registerScrollendEvent) element.removeEventListener("scrollend", endHandler);
				fallback?.cancel();
			};
		};
		const observeElementOffset = (instance, cb) => observeOffset(instance, cb, (el) => {
			const { horizontal, isRtl } = instance.options;
			return horizontal ? el.scrollLeft * (isRtl && -1 || 1) : el.scrollTop;
		});
		const measureElement = (element, entry, instance) => {
			if (instance.options.useCachedMeasurements) {
				const index = instance.indexFromElement(element);
				const key = instance.options.getItemKey(index);
				return instance.itemSizeCache.get(key) ?? instance.options.estimateSize(index);
			}
			if (entry == null ? void 0 : entry.borderBoxSize) {
				const box = entry.borderBoxSize[0];
				if (box) return Math.round(box[instance.options.horizontal ? "inlineSize" : "blockSize"]);
			}
			if (!entry) {
				const index = instance.indexFromElement(element);
				const key = instance.options.getItemKey(index);
				const cachedSize = instance.itemSizeCache.get(key);
				if (cachedSize !== void 0) return cachedSize;
			}
			return element[instance.options.horizontal ? "offsetWidth" : "offsetHeight"];
		};
		const scrollWithAdjustments = (offset, { adjustments = 0, behavior }, instance) => {
			var _a, _b;
			(_b = (_a = instance.scrollElement) == null ? void 0 : _a.scrollTo) == null || _b.call(_a, {
				[instance.options.horizontal ? "left" : "top"]: offset + adjustments,
				behavior
			});
		};
		const elementScroll = scrollWithAdjustments;
		var Virtualizer = class {
			constructor(opts) {
				this.unsubs = [];
				this.scrollElement = null;
				this.targetWindow = null;
				this.isScrolling = false;
				this.scrollState = null;
				this.measurementsCache = [];
				this._flatMeasurements = null;
				this.itemSizeCache = /* @__PURE__ */ new Map();
				this.itemSizeCacheVersion = 0;
				this.laneAssignments = /* @__PURE__ */ new Map();
				this.pendingMin = null;
				this.prevLanes = void 0;
				this.lanesChangedFlag = false;
				this.lanesSettling = false;
				this.pendingScrollAnchor = null;
				this.scrollRect = null;
				this.scrollOffset = null;
				this.scrollDirection = null;
				this.scrollAdjustments = 0;
				this._iosDeferredAdjustment = 0;
				this._iosTouching = false;
				this._iosJustTouchEnded = false;
				this._iosTouchEndTimerId = null;
				this._intendedScrollOffset = null;
				this.elementsCache = /* @__PURE__ */ new Map();
				this.now = () => {
					var _a, _b, _c;
					return ((_c = (_b = (_a = this.targetWindow) == null ? void 0 : _a.performance) == null ? void 0 : _b.now) == null ? void 0 : _c.call(_b)) ?? Date.now();
				};
				this.observer = /* @__PURE__ */ (() => {
					let _ro = null;
					const get = () => {
						if (_ro) return _ro;
						if (!this.targetWindow || !this.targetWindow.ResizeObserver) return null;
						return _ro = new this.targetWindow.ResizeObserver((entries) => {
							entries.forEach((entry) => {
								const run = () => {
									const node = entry.target;
									const index = this.indexFromElement(node);
									if (!node.isConnected) {
										this.observer.unobserve(node);
										for (const [cacheKey, cachedNode] of this.elementsCache) if (cachedNode === node) {
											this.elementsCache.delete(cacheKey);
											break;
										}
										return;
									}
									if (!this.isIndexInRange(index)) return;
									if (this.shouldMeasureDuringScroll(index)) this.resizeItem(index, this.options.measureElement(node, entry, this));
								};
								this.options.useAnimationFrameWithResizeObserver ? requestAnimationFrame(run) : run();
							});
						});
					};
					return {
						disconnect: () => {
							var _a;
							(_a = get()) == null || _a.disconnect();
							_ro = null;
						},
						observe: (target) => {
							var _a;
							return (_a = get()) == null ? void 0 : _a.observe(target, { box: "border-box" });
						},
						unobserve: (target) => {
							var _a;
							return (_a = get()) == null ? void 0 : _a.unobserve(target);
						}
					};
				})();
				this.range = null;
				this.setOptions = (opts2) => {
					var _a, _b;
					const merged = {
						debug: false,
						initialOffset: 0,
						overscan: 1,
						paddingStart: 0,
						paddingEnd: 0,
						scrollPaddingStart: 0,
						scrollPaddingEnd: 0,
						horizontal: false,
						getItemKey: defaultKeyExtractor,
						rangeExtractor: defaultRangeExtractor,
						onChange: () => {},
						measureElement,
						initialRect: {
							width: 0,
							height: 0
						},
						scrollMargin: 0,
						gap: 0,
						indexAttribute: "data-index",
						initialMeasurementsCache: [],
						lanes: 1,
						anchorTo: "start",
						followOnAppend: false,
						scrollEndThreshold: 1,
						isScrollingResetDelay: 150,
						enabled: true,
						isRtl: false,
						useScrollendEvent: false,
						useAnimationFrameWithResizeObserver: false,
						laneAssignmentMode: "estimate",
						useCachedMeasurements: false
					};
					for (const key in opts2) {
						const v = opts2[key];
						if (v !== void 0) merged[key] = v;
					}
					const prevOptions = this.options;
					let anchor = null;
					let followOnAppend = null;
					let edgeKeysChanged = false;
					if (prevOptions !== void 0 && prevOptions.enabled && merged.enabled && merged.anchorTo === "end" && this.scrollElement !== null) {
						const prevCount = prevOptions.count;
						const nextCount = merged.count;
						const measurements = this.getMeasurements();
						const prevFirstKey = prevCount > 0 ? ((_a = measurements[0]) == null ? void 0 : _a.key) ?? prevOptions.getItemKey(0) : null;
						const prevLastKey = prevCount > 0 ? ((_b = measurements[prevCount - 1]) == null ? void 0 : _b.key) ?? prevOptions.getItemKey(prevCount - 1) : null;
						if (nextCount !== prevCount || prevCount > 0 && nextCount > 0 && (merged.getItemKey(0) !== prevFirstKey || merged.getItemKey(nextCount - 1) !== prevLastKey)) {
							edgeKeysChanged = true;
							const item = prevCount > 0 ? this.getVirtualItemForOffset(this.getScrollOffset()) ?? measurements[0] : null;
							if (item) anchor = [item.key, this.getScrollOffset() - item.start];
							const behavior = merged.followOnAppend === true ? "auto" : merged.followOnAppend || null;
							if (behavior && nextCount > prevCount && this.isAtEnd(prevOptions.scrollEndThreshold) && (prevCount === 0 || merged.getItemKey(nextCount - 1) !== prevLastKey)) followOnAppend = behavior;
						}
					}
					this.options = merged;
					if (edgeKeysChanged) {
						this.pendingMin = 0;
						this.itemSizeCacheVersion++;
					}
					let anchorResolved = false;
					let anchorDelta = 0;
					if (anchor && this.scrollOffset !== null) {
						const [anchorKey, anchorOffset] = anchor;
						const newMeasurements = this.getMeasurements();
						const { count, getItemKey } = this.options;
						let idx = 0;
						while (idx < count && getItemKey(idx) !== anchorKey) idx++;
						if (idx < count) {
							const anchorItem = newMeasurements[idx];
							if (anchorItem) {
								const newOffset = Math.max(0, anchorItem.start + anchorOffset);
								if (newOffset !== this.scrollOffset) {
									anchorDelta = newOffset - this.scrollOffset;
									this.scrollOffset = newOffset;
									anchorResolved = true;
								}
							}
						}
					}
					if (anchorResolved || followOnAppend) this.pendingScrollAnchor = [
						anchorResolved ? anchor[0] : null,
						anchorResolved ? anchor[1] : 0,
						followOnAppend,
						anchorDelta
					];
				};
				this.notify = (sync) => {
					var _a, _b;
					(_b = (_a = this.options).onChange) == null || _b.call(_a, this, sync);
				};
				this.maybeNotify = memo(() => {
					this.calculateRange();
					return [
						this.isScrolling,
						this.range ? this.range.startIndex : null,
						this.range ? this.range.endIndex : null
					];
				}, (isScrolling) => {
					this.notify(isScrolling);
				}, {
					key: false,
					debug: () => this.options.debug,
					initialDeps: [
						this.isScrolling,
						this.range ? this.range.startIndex : null,
						this.range ? this.range.endIndex : null
					]
				});
				this.cleanup = () => {
					this.unsubs.filter(Boolean).forEach((d) => d());
					this.unsubs = [];
					this.observer.disconnect();
					if (this.rafId != null && this.targetWindow) {
						this.targetWindow.cancelAnimationFrame(this.rafId);
						this.rafId = null;
					}
					this.scrollState = null;
					this.isScrolling = false;
					this.scrollDirection = null;
					this._iosDeferredAdjustment = 0;
					this._iosTouching = false;
					this._iosJustTouchEnded = false;
					this.scrollElement = null;
					this.targetWindow = null;
				};
				this._didMount = () => {
					return () => {
						this.cleanup();
					};
				};
				this._willUpdate = () => {
					var _a;
					const scrollElement = this.options.enabled ? this.options.getScrollElement() : null;
					if (this.scrollElement !== scrollElement) {
						this.cleanup();
						if (!scrollElement) {
							this.maybeNotify();
							return;
						}
						this.scrollElement = scrollElement;
						if (this.scrollElement && "ownerDocument" in this.scrollElement) this.targetWindow = this.scrollElement.ownerDocument.defaultView;
						else this.targetWindow = ((_a = this.scrollElement) == null ? void 0 : _a.window) ?? null;
						this.elementsCache.forEach((cached) => {
							this.observer.observe(cached);
						});
						this.unsubs.push(this.options.observeElementRect(this, (rect) => {
							this.scrollRect = rect;
							this.maybeNotify();
						}));
						this.unsubs.push(this.options.observeElementOffset(this, (offset, isScrolling) => {
							if (isScrolling && this._intendedScrollOffset === null && offset === this.scrollOffset) return;
							if (this._intendedScrollOffset !== null && Math.abs(offset - this._intendedScrollOffset) < 1.5) offset = this._intendedScrollOffset;
							this._intendedScrollOffset = null;
							this.scrollAdjustments = 0;
							const prevOffset = this.getScrollOffset();
							this.scrollDirection = isScrolling ? prevOffset === offset ? this.scrollDirection : prevOffset < offset ? "forward" : "backward" : null;
							this.scrollOffset = offset;
							this.isScrolling = isScrolling;
							this._flushIosDeferredIfReady();
							if (this.scrollState) this.scheduleScrollReconcile();
							this.maybeNotify();
						}));
						if ("addEventListener" in this.scrollElement) {
							const scrollEl = this.scrollElement;
							const onTouchStart = () => {
								this._iosTouching = true;
								this._iosJustTouchEnded = false;
								if (this._iosTouchEndTimerId !== null && this.targetWindow != null) {
									this.targetWindow.clearTimeout(this._iosTouchEndTimerId);
									this._iosTouchEndTimerId = null;
								}
							};
							const onTouchEnd = () => {
								this._iosTouching = false;
								if (!isIOSWebKit() || this.targetWindow == null) return;
								this._iosJustTouchEnded = true;
								this._iosTouchEndTimerId = this.targetWindow.setTimeout(() => {
									this._iosJustTouchEnded = false;
									this._iosTouchEndTimerId = null;
									this._flushIosDeferredIfReady();
								}, 150);
							};
							scrollEl.addEventListener("touchstart", onTouchStart, addEventListenerOptions);
							scrollEl.addEventListener("touchend", onTouchEnd, addEventListenerOptions);
							this.unsubs.push(() => {
								scrollEl.removeEventListener("touchstart", onTouchStart);
								scrollEl.removeEventListener("touchend", onTouchEnd);
								if (this._iosTouchEndTimerId !== null && this.targetWindow != null) {
									this.targetWindow.clearTimeout(this._iosTouchEndTimerId);
									this._iosTouchEndTimerId = null;
								}
							});
						}
						this._scrollToOffset(this.getScrollOffset(), {
							adjustments: void 0,
							behavior: void 0
						});
					}
					const anchor = this.pendingScrollAnchor;
					this.pendingScrollAnchor = null;
					if (anchor && this.scrollElement && this.options.enabled) {
						const [key, _offset, followOnAppend, anchorDelta] = anchor;
						if (key !== null && !followOnAppend) if (isIOSWebKit() && (this.isScrolling || this._iosTouching || this._iosJustTouchEnded)) {
							if (anchorDelta !== 0) this._iosDeferredAdjustment += anchorDelta;
						} else this._scrollToOffset(this.getScrollOffset(), {
							adjustments: void 0,
							behavior: void 0
						});
						if (followOnAppend) this.scrollToEnd({ behavior: followOnAppend });
					}
				};
				this._flushIosDeferredIfReady = () => {
					if (this._iosDeferredAdjustment === 0) return;
					if (this.isScrolling) return;
					if (this._iosTouching) return;
					if (this._iosJustTouchEnded) return;
					const cur = this.getScrollOffset();
					const max = this.getMaxScrollOffset();
					if (cur < 0 || cur > max) return;
					if (this._iosDeferredAdjustment < 0 && cur >= max - 1) {
						this._iosDeferredAdjustment = 0;
						return;
					}
					const delta = this._iosDeferredAdjustment;
					this._iosDeferredAdjustment = 0;
					this._scrollToOffset(cur, {
						adjustments: this.scrollAdjustments += delta,
						behavior: void 0
					});
				};
				this.rafId = null;
				this.getSize = () => {
					if (!this.options.enabled) {
						this.scrollRect = null;
						return 0;
					}
					this.scrollRect = this.scrollRect ?? this.options.initialRect;
					return this.scrollRect[this.options.horizontal ? "width" : "height"];
				};
				this.getScrollOffset = () => {
					if (!this.options.enabled) {
						this.scrollOffset = null;
						return 0;
					}
					this.scrollOffset = this.scrollOffset ?? (typeof this.options.initialOffset === "function" ? this.options.initialOffset() : this.options.initialOffset);
					return this.scrollOffset;
				};
				this.getMeasurementOptions = memo(() => [
					this.options.count,
					this.options.paddingStart,
					this.options.scrollMargin,
					this.options.getItemKey,
					this.options.enabled,
					this.options.lanes,
					this.options.laneAssignmentMode,
					this.options.gap
				], (count, paddingStart, scrollMargin, getItemKey, enabled, lanes, laneAssignmentMode, gap) => {
					if (this.prevLanes !== void 0 && this.prevLanes !== lanes) this.lanesChangedFlag = true;
					this.prevLanes = lanes;
					this.pendingMin = null;
					return {
						count,
						paddingStart,
						scrollMargin,
						getItemKey,
						enabled,
						lanes,
						laneAssignmentMode,
						gap
					};
				}, { key: false });
				this.isIndexInRange = (index) => index >= 0 && index < this.options.count;
				this.getMeasurements = memo(() => [this.getMeasurementOptions(), this.itemSizeCacheVersion], ({ count, paddingStart, scrollMargin, getItemKey, enabled, lanes, laneAssignmentMode, gap }, _itemSizeCacheVersion) => {
					const itemSizeCache = this.itemSizeCache;
					if (!enabled) {
						this.measurementsCache = [];
						this.itemSizeCache.clear();
						this.laneAssignments.clear();
						return [];
					}
					if (this.laneAssignments.size > count) {
						for (const index of this.laneAssignments.keys()) if (index >= count) this.laneAssignments.delete(index);
					}
					if (this.lanesChangedFlag) {
						this.lanesChangedFlag = false;
						this.lanesSettling = true;
						this.measurementsCache = [];
						this.itemSizeCache.clear();
						this.laneAssignments.clear();
						this.pendingMin = null;
					}
					if (this.measurementsCache.length === 0 && !this.lanesSettling) {
						this.measurementsCache = this.options.initialMeasurementsCache;
						this.measurementsCache.forEach((item) => {
							this.itemSizeCache.set(item.key, item.size);
						});
					}
					const min = this.lanesSettling ? 0 : this.pendingMin ?? 0;
					this.pendingMin = null;
					if (this.lanesSettling && this.measurementsCache.length === count) this.lanesSettling = false;
					if (lanes === 1) {
						const need = count * 2;
						let flat = this._flatMeasurements;
						if (!flat || flat.length < need) {
							const next = new Float64Array(need);
							if (flat && min > 0) next.set(flat.subarray(0, min * 2));
							flat = next;
							this._flatMeasurements = flat;
						}
						let runningStart;
						if (min === 0) runningStart = paddingStart + scrollMargin;
						else {
							const prevIdx = min - 1;
							runningStart = flat[prevIdx * 2] + flat[prevIdx * 2 + 1] + gap;
						}
						for (let i = min; i < count; i++) {
							const key = getItemKey(i);
							const measuredSize = itemSizeCache.get(key);
							const size = typeof measuredSize === "number" ? measuredSize : this.options.estimateSize(i);
							flat[i * 2] = runningStart;
							flat[i * 2 + 1] = size;
							runningStart += size + gap;
						}
						const view = createLazyMeasurementsView(count, flat, getItemKey);
						this.measurementsCache = view;
						return view;
					}
					const measurements = this.measurementsCache.slice(0, min);
					const laneLastIndex = new Array(lanes).fill(void 0);
					const laneEnds = new Float64Array(lanes);
					let filledLanes = 0;
					for (let m = 0; m < min; m++) {
						const item = measurements[m];
						if (item) {
							if (laneLastIndex[item.lane] === void 0) filledLanes++;
							laneLastIndex[item.lane] = m;
							laneEnds[item.lane] = item.end;
						}
					}
					for (let i = min; i < count; i++) {
						const key = getItemKey(i);
						const cachedLane = this.laneAssignments.get(i);
						let lane;
						let start;
						const shouldCacheLane = laneAssignmentMode === "estimate" || itemSizeCache.has(key);
						if (cachedLane !== void 0 && this.options.lanes > 1) {
							lane = cachedLane;
							const prevIndex = laneLastIndex[lane];
							const prevInLane = prevIndex !== void 0 ? measurements[prevIndex] : void 0;
							start = prevInLane ? prevInLane.end + gap : paddingStart + scrollMargin;
						} else if (filledLanes === lanes) {
							let bestLane = 0;
							let bestEnd = laneEnds[0];
							let bestIdx = laneLastIndex[0];
							for (let l = 1; l < lanes; l++) {
								const e = laneEnds[l];
								if (e < bestEnd || e === bestEnd && laneLastIndex[l] < bestIdx) {
									bestLane = l;
									bestEnd = e;
									bestIdx = laneLastIndex[l];
								}
							}
							lane = bestLane;
							start = bestEnd + gap;
							if (shouldCacheLane) this.laneAssignments.set(i, lane);
						} else {
							lane = i % this.options.lanes;
							start = paddingStart + scrollMargin;
							if (shouldCacheLane) this.laneAssignments.set(i, lane);
						}
						const measuredSize = itemSizeCache.get(key);
						const size = typeof measuredSize === "number" ? measuredSize : this.options.estimateSize(i);
						const end = start + size;
						measurements[i] = {
							index: i,
							start,
							size,
							end,
							key,
							lane
						};
						if (laneLastIndex[lane] === void 0) filledLanes++;
						laneLastIndex[lane] = i;
						laneEnds[lane] = end;
					}
					this.measurementsCache = measurements;
					return measurements;
				}, {
					key: false,
					debug: () => this.options.debug
				});
				this.calculateRange = memo(() => [
					this.getMeasurements(),
					this.getSize(),
					this.getScrollOffset(),
					this.options.lanes
				], (measurements, outerSize, scrollOffset, lanes) => {
					if (measurements.length === 0 || outerSize === 0) {
						this.range = null;
						return null;
					}
					this.range = calculateRangeImpl(measurements, outerSize, scrollOffset, lanes, lanes === 1 && this._flatMeasurements != null ? this._flatMeasurements : null);
					return this.range;
				}, {
					key: false,
					debug: () => this.options.debug
				});
				this.getVirtualIndexes = memo(() => {
					let startIndex = null;
					let endIndex = null;
					const range = this.calculateRange();
					if (range) {
						startIndex = range.startIndex;
						endIndex = range.endIndex;
					}
					this.maybeNotify.updateDeps([
						this.isScrolling,
						startIndex,
						endIndex
					]);
					return [
						this.options.rangeExtractor,
						this.options.overscan,
						this.options.count,
						startIndex,
						endIndex
					];
				}, (rangeExtractor, overscan, count, startIndex, endIndex) => {
					return startIndex === null || endIndex === null ? [] : rangeExtractor({
						startIndex,
						endIndex,
						overscan,
						count
					});
				}, {
					key: false,
					debug: () => this.options.debug
				});
				this.indexFromElement = (node) => {
					const attributeName = this.options.indexAttribute;
					const indexStr = node.getAttribute(attributeName);
					if (!indexStr) {
						console.warn(`Missing attribute name '${attributeName}={index}' on measured element.`);
						return -1;
					}
					return parseInt(indexStr, 10);
				};
				this.shouldMeasureDuringScroll = (index) => {
					var _a;
					if (!this.scrollState || this.scrollState.behavior !== "smooth") return true;
					const scrollIndex = this.scrollState.index ?? ((_a = this.getVirtualItemForOffset(this.scrollState.lastTargetOffset)) == null ? void 0 : _a.index);
					if (scrollIndex !== void 0 && this.range) {
						const bufferSize = Math.max(this.options.overscan, Math.ceil((this.range.endIndex - this.range.startIndex) / 2));
						const minIndex = Math.max(0, scrollIndex - bufferSize);
						const maxIndex = Math.min(this.options.count - 1, scrollIndex + bufferSize);
						return index >= minIndex && index <= maxIndex;
					}
					return true;
				};
				this.measureElement = (node) => {
					if (!node) {
						this.elementsCache.forEach((cached, key2) => {
							if (!cached.isConnected) {
								this.observer.unobserve(cached);
								this.elementsCache.delete(key2);
							}
						});
						return;
					}
					const index = this.indexFromElement(node);
					if (!this.isIndexInRange(index)) return;
					const key = this.options.getItemKey(index);
					const prevNode = this.elementsCache.get(key);
					if (prevNode !== node) {
						if (prevNode) this.observer.unobserve(prevNode);
						this.observer.observe(node);
						this.elementsCache.set(key, node);
					}
					if ((!this.isScrolling || this.scrollState) && this.shouldMeasureDuringScroll(index)) this.resizeItem(index, this.options.measureElement(node, void 0, this));
				};
				this.resizeItem = (index, size) => {
					var _a, _b;
					if (!this.isIndexInRange(index)) return;
					let cachedSize;
					let itemStart;
					let key;
					const flat = this._flatMeasurements;
					if (this.options.lanes === 1 && flat !== null) {
						key = this.options.getItemKey(index);
						itemStart = flat[index * 2];
						cachedSize = flat[index * 2 + 1];
					} else {
						const item = this.measurementsCache[index];
						if (!item) return;
						key = item.key;
						itemStart = item.start;
						cachedSize = item.size;
					}
					const itemSize = this.itemSizeCache.get(key) ?? cachedSize;
					const delta = size - itemSize;
					if (delta !== 0) {
						const wasAtEnd = this.options.anchorTo === "end" && ((_a = this.scrollState) == null ? void 0 : _a.behavior) !== "smooth" && this.getVirtualDistanceFromEnd() <= this.options.scrollEndThreshold;
						const prevTotalSize = wasAtEnd ? this.getTotalSize() : 0;
						const scrollOffsetWithAdj = this.getScrollOffset() + this.scrollAdjustments;
						const defaultShouldAdjust = !this.itemSizeCache.has(key) ? itemStart < scrollOffsetWithAdj : itemStart + itemSize <= scrollOffsetWithAdj && this.scrollDirection !== "backward";
						const shouldAdjustScroll = ((_b = this.scrollState) == null ? void 0 : _b.behavior) !== "smooth" && (this.shouldAdjustScrollPositionOnItemSizeChange !== void 0 ? this.shouldAdjustScrollPositionOnItemSizeChange(this.measurementsCache[index] ?? {
							index,
							key,
							start: itemStart,
							size: cachedSize,
							end: itemStart + cachedSize,
							lane: 0
						}, delta, this) : defaultShouldAdjust);
						if (this.pendingMin === null || index < this.pendingMin) this.pendingMin = index;
						this.itemSizeCache.set(key, size);
						this.itemSizeCacheVersion++;
						let adjustedSync = false;
						if (wasAtEnd) adjustedSync = this.applyScrollAdjustment(this.getTotalSize() - prevTotalSize);
						else if (shouldAdjustScroll) adjustedSync = this.applyScrollAdjustment(delta);
						this.notify(adjustedSync);
					}
				};
				this.getVirtualItems = memo(() => [this.getVirtualIndexes(), this.getMeasurements()], (indexes, measurements) => {
					const virtualItems = [];
					for (let k = 0, len = indexes.length; k < len; k++) {
						const measurement = measurements[indexes[k]];
						virtualItems.push(measurement);
					}
					return virtualItems;
				}, {
					key: false,
					debug: () => this.options.debug
				});
				this.getVirtualItemForOffset = (offset) => {
					const measurements = this.getMeasurements();
					if (measurements.length === 0) return;
					const flat = this._flatMeasurements;
					const useFlat = this.options.lanes === 1 && flat != null;
					return notUndefined(measurements[findNearestBinarySearch(0, measurements.length - 1, useFlat ? (i) => flat[i * 2] : (i) => notUndefined(measurements[i]).start, offset)]);
				};
				this.getMaxScrollOffset = () => {
					if (!this.scrollElement) return 0;
					if ("scrollHeight" in this.scrollElement) return this.options.horizontal ? this.scrollElement.scrollWidth - this.scrollElement.clientWidth : this.scrollElement.scrollHeight - this.scrollElement.clientHeight;
					else {
						const doc = this.scrollElement.document.documentElement;
						return this.options.horizontal ? doc.scrollWidth - this.scrollElement.innerWidth : doc.scrollHeight - this.scrollElement.innerHeight;
					}
				};
				this.getVirtualDistanceFromEnd = () => {
					return Math.max(this.getTotalSize() - this.getSize() - this.getScrollOffset(), 0);
				};
				this.getDistanceFromEnd = () => {
					return Math.max(this.getMaxScrollOffset() - this.getScrollOffset(), 0);
				};
				this.isAtEnd = (threshold = this.options.scrollEndThreshold) => {
					return this.getDistanceFromEnd() <= threshold;
				};
				this.getOffsetForAlignment = (toOffset, align, itemSize = 0) => {
					if (!this.scrollElement) return 0;
					const size = this.getSize();
					const scrollOffset = this.getScrollOffset();
					if (align === "auto") align = toOffset >= scrollOffset + size ? "end" : "start";
					if (align === "center") toOffset += (itemSize - size) / 2;
					else if (align === "end") toOffset -= size;
					const maxOffset = this.getMaxScrollOffset();
					return Math.max(Math.min(maxOffset, toOffset), 0);
				};
				this.getOffsetForIndex = (index, align = "auto") => {
					index = Math.max(0, Math.min(index, this.options.count - 1));
					const size = this.getSize();
					const scrollOffset = this.getScrollOffset();
					const item = this.measurementsCache[index];
					if (!item) return;
					if (align === "auto") if (item.end >= scrollOffset + size - this.options.scrollPaddingEnd) align = "end";
					else if (item.start <= scrollOffset + this.options.scrollPaddingStart) align = "start";
					else return [scrollOffset, align];
					if (align === "end" && index === this.options.count - 1) return [this.getMaxScrollOffset(), align];
					const toOffset = align === "end" ? item.end + this.options.scrollPaddingEnd : item.start - this.options.scrollPaddingStart;
					return [this.getOffsetForAlignment(toOffset, align, item.size), align];
				};
				this.scrollToOffset = (toOffset, { align = "start", behavior = "auto" } = {}) => {
					this._iosDeferredAdjustment = 0;
					const offset = this.getOffsetForAlignment(toOffset, align);
					const now = this.now();
					this.scrollState = {
						index: null,
						align,
						behavior,
						startedAt: now,
						lastTargetOffset: offset,
						stableFrames: 0
					};
					this._scrollToOffset(offset, {
						adjustments: void 0,
						behavior
					});
					this.scheduleScrollReconcile();
				};
				this.scrollToIndex = (index, { align: initialAlign = "auto", behavior = "auto" } = {}) => {
					this._iosDeferredAdjustment = 0;
					index = Math.max(0, Math.min(index, this.options.count - 1));
					const offsetInfo = this.getOffsetForIndex(index, initialAlign);
					if (!offsetInfo) return;
					const [offset, align] = offsetInfo;
					const now = this.now();
					this.scrollState = {
						index,
						align,
						behavior,
						startedAt: now,
						lastTargetOffset: offset,
						stableFrames: 0
					};
					this._scrollToOffset(offset, {
						adjustments: void 0,
						behavior
					});
					this.scheduleScrollReconcile();
				};
				this.scrollBy = (delta, { behavior = "auto" } = {}) => {
					const offset = this.getScrollOffset() + delta;
					const now = this.now();
					this.scrollState = {
						index: null,
						align: "start",
						behavior,
						startedAt: now,
						lastTargetOffset: offset,
						stableFrames: 0
					};
					this._scrollToOffset(offset, {
						adjustments: void 0,
						behavior
					});
					this.scheduleScrollReconcile();
				};
				this.scrollToEnd = ({ behavior = "auto" } = {}) => {
					if (this.options.count > 0) {
						this.scrollToIndex(this.options.count - 1, {
							align: "end",
							behavior
						});
						return;
					}
					this.scrollToOffset(Math.max(this.getTotalSize() - this.getSize(), 0), { behavior });
				};
				this.getTotalSize = () => {
					var _a;
					const measurements = this.getMeasurements();
					let end;
					if (measurements.length === 0) end = this.options.paddingStart;
					else if (this.options.lanes === 1) {
						const lastIdx = measurements.length - 1;
						const flat = this._flatMeasurements;
						if (flat != null) end = flat[lastIdx * 2] + flat[lastIdx * 2 + 1];
						else end = ((_a = measurements[lastIdx]) == null ? void 0 : _a.end) ?? 0;
					} else {
						const endByLane = Array(this.options.lanes).fill(null);
						let endIndex = measurements.length - 1;
						while (endIndex >= 0 && endByLane.some((val) => val === null)) {
							const item = measurements[endIndex];
							if (endByLane[item.lane] === null) endByLane[item.lane] = item.end;
							endIndex--;
						}
						end = Math.max(...endByLane.filter((val) => val !== null));
					}
					return Math.max(end - this.options.scrollMargin + this.options.paddingEnd, 0);
				};
				this.takeSnapshot = () => {
					const snapshot = [];
					if (this.itemSizeCache.size === 0) return snapshot;
					const m = this.getMeasurements();
					for (const item of m) if (item && this.itemSizeCache.has(item.key)) snapshot.push({
						index: item.index,
						key: item.key,
						start: item.start,
						size: item.size,
						end: item.end,
						lane: item.lane
					});
					return snapshot;
				};
				this._scrollToOffset = (offset, { adjustments, behavior }) => {
					this._intendedScrollOffset = offset + (adjustments ?? 0);
					this.options.scrollToFn(offset, {
						behavior,
						adjustments
					}, this);
				};
				this.measure = () => {
					this.pendingMin = null;
					this.itemSizeCache.clear();
					this.laneAssignments.clear();
					this.itemSizeCacheVersion++;
					this.notify(false);
				};
				this.setOptions(opts);
			}
			applyScrollAdjustment(delta, behavior) {
				if (delta === 0) return false;
				if (isIOSWebKit() && (this.isScrolling || this._iosTouching || this._iosJustTouchEnded)) {
					this._iosDeferredAdjustment += delta;
					return false;
				} else {
					this._scrollToOffset(this.getScrollOffset(), {
						adjustments: this.scrollAdjustments += delta,
						behavior
					});
					if (this.scrollOffset !== null) {
						this.scrollOffset += this.scrollAdjustments;
						if (this.scrollOffset < 0) this.scrollOffset = 0;
						this.scrollAdjustments = 0;
					}
					return true;
				}
			}
			scheduleScrollReconcile() {
				if (!this.targetWindow) {
					this.scrollState = null;
					return;
				}
				if (this.rafId != null) return;
				this.rafId = this.targetWindow.requestAnimationFrame(() => {
					this.rafId = null;
					this.reconcileScroll();
				});
			}
			reconcileScroll() {
				if (!this.scrollState) return;
				if (!this.scrollElement) return;
				if (this.now() - this.scrollState.startedAt > 5e3) {
					this.scrollState = null;
					return;
				}
				const offsetInfo = this.scrollState.index != null ? this.getOffsetForIndex(this.scrollState.index, this.scrollState.align) : void 0;
				const targetOffset = offsetInfo ? offsetInfo[0] : this.scrollState.lastTargetOffset;
				const STABLE_FRAMES = 1;
				const targetChanged = targetOffset !== this.scrollState.lastTargetOffset;
				if (!targetChanged && approxEqual(targetOffset, this.getScrollOffset())) {
					this.scrollState.stableFrames++;
					if (this.scrollState.stableFrames >= STABLE_FRAMES) {
						if (this.getScrollOffset() !== targetOffset) this._scrollToOffset(targetOffset, {
							adjustments: void 0,
							behavior: "auto"
						});
						this.scrollState = null;
						return;
					}
				} else {
					this.scrollState.stableFrames = 0;
					if (targetChanged) {
						const viewport = this.getSize() || 600;
						const distance = Math.abs(targetOffset - this.getScrollOffset());
						const keepSmooth = this.scrollState.behavior === "smooth" && distance > viewport;
						this.scrollState.lastTargetOffset = targetOffset;
						if (!keepSmooth) this.scrollState.behavior = "auto";
						this._scrollToOffset(targetOffset, {
							adjustments: void 0,
							behavior: keepSmooth ? "smooth" : "auto"
						});
					}
				}
				this.scheduleScrollReconcile();
			}
		};
		const findNearestBinarySearch = (low, high, getCurrentValue, value) => {
			while (low <= high) {
				const middle = (low + high) / 2 | 0;
				const currentValue = getCurrentValue(middle);
				if (currentValue < value) low = middle + 1;
				else if (currentValue > value) high = middle - 1;
				else return middle;
			}
			if (low > 0) return low - 1;
			else return 0;
		};
		function findNearestBinarySearchFlat(flat, high, value) {
			let low = 0;
			while (low <= high) {
				const middle = (low + high) / 2 | 0;
				const currentValue = flat[middle * 2];
				if (currentValue < value) low = middle + 1;
				else if (currentValue > value) high = middle - 1;
				else return middle;
			}
			return low > 0 ? low - 1 : 0;
		}
		function calculateRangeImpl(measurements, outerSize, scrollOffset, lanes, flat) {
			const lastIndex = measurements.length - 1;
			if (measurements.length <= lanes) return {
				startIndex: 0,
				endIndex: lastIndex
			};
			if (lanes === 1 && flat !== null) {
				const startIndex2 = findNearestBinarySearchFlat(flat, lastIndex, scrollOffset);
				let endIndex2 = startIndex2;
				const limit = scrollOffset + outerSize;
				while (endIndex2 < lastIndex && flat[endIndex2 * 2] + flat[endIndex2 * 2 + 1] < limit) endIndex2++;
				return {
					startIndex: startIndex2,
					endIndex: endIndex2
				};
			}
			const getStart = (index) => measurements[index].start;
			let startIndex = findNearestBinarySearch(0, lastIndex, getStart, scrollOffset);
			let endIndex = startIndex;
			if (lanes === 1) while (endIndex < lastIndex && measurements[endIndex].end < scrollOffset + outerSize) endIndex++;
			else if (lanes > 1) {
				const endPerLane = Array(lanes).fill(0);
				while (endIndex < lastIndex && endPerLane.some((pos) => pos < scrollOffset + outerSize)) {
					const item = measurements[endIndex];
					endPerLane[item.lane] = item.end;
					endIndex++;
				}
				const startPerLane = Array(lanes).fill(scrollOffset + outerSize);
				while (startIndex >= 0 && startPerLane.some((pos) => pos >= scrollOffset)) {
					const item = measurements[startIndex];
					startPerLane[item.lane] = item.start;
					startIndex--;
				}
				startIndex = Math.max(0, startIndex - startIndex % lanes);
				endIndex = Math.min(lastIndex, endIndex + (lanes - 1 - endIndex % lanes));
			}
			return {
				startIndex,
				endIndex
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/@tanstack+react-virtual@3.14.10_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-virtual/dist/esm/index.js
		const useIsomorphicLayoutEffect = typeof document !== "undefined" ? react.useLayoutEffect : react.useEffect;
		function useVirtualizerBase({ useFlushSync = true, directDomUpdates = false, directDomUpdatesMode = "transform", ...options }) {
			const rerender = react.useReducer((x) => x + 1, 0)[1];
			const directRef = react.useRef({
				enabled: directDomUpdates,
				mode: directDomUpdatesMode,
				container: null,
				lastSize: null,
				lastPositions: /* @__PURE__ */ new WeakMap(),
				prevRange: null
			});
			directRef.current.enabled = directDomUpdates;
			directRef.current.mode = directDomUpdatesMode;
			const applyContainerSize = (instance2) => {
				const state = directRef.current;
				if (!state.enabled || !state.container) return;
				const totalSize = instance2.getTotalSize();
				if (totalSize !== state.lastSize) {
					state.lastSize = totalSize;
					const sizeAxis = instance2.options.horizontal ? "width" : "height";
					state.container.style[sizeAxis] = `${totalSize}px`;
				}
			};
			const applyDirectStyles = (instance2) => {
				const state = directRef.current;
				if (!state.enabled || !state.container) return;
				applyContainerSize(instance2);
				const horizontal = !!instance2.options.horizontal;
				const useTransform = state.mode === "transform";
				const posAxis = horizontal ? "left" : "top";
				const scrollMargin = instance2.options.scrollMargin;
				const items = instance2.getVirtualItems();
				for (const item of items) {
					const next = item.start - scrollMargin;
					const el = instance2.elementsCache.get(item.key);
					if (!el) continue;
					if (state.lastPositions.get(el) === next) continue;
					state.lastPositions.set(el, next);
					if (useTransform) el.style.transform = horizontal ? `translate3d(${next}px, 0, 0)` : `translate3d(0, ${next}px, 0)`;
					else el.style[posAxis] = `${next}px`;
				}
			};
			const resolvedOptions = {
				...options,
				onChange: (instance2, sync) => {
					var _a;
					const state = directRef.current;
					let shouldRerender = true;
					if (state.enabled) {
						applyDirectStyles(instance2);
						const range = instance2.range;
						const prev = state.prevRange;
						shouldRerender = !prev || prev.isScrolling !== instance2.isScrolling || prev.startIndex !== (range == null ? void 0 : range.startIndex) || prev.endIndex !== (range == null ? void 0 : range.endIndex);
						if (shouldRerender) state.prevRange = range ? {
							startIndex: range.startIndex,
							endIndex: range.endIndex,
							isScrolling: instance2.isScrolling
						} : null;
					}
					if (shouldRerender) if (useFlushSync && sync) (0, react_dom.flushSync)(rerender);
					else rerender();
					(_a = options.onChange) == null || _a.call(options, instance2, sync);
				}
			};
			const [instance] = react.useState(() => {
				const v = new Virtualizer(resolvedOptions);
				return Object.assign(v, { containerRef: (node) => {
					const state = directRef.current;
					state.container = node;
					state.lastSize = null;
					if (node && state.enabled) {
						const total = v.getTotalSize();
						state.lastSize = total;
						const axis = v.options.horizontal ? "width" : "height";
						node.style[axis] = `${total}px`;
					}
				} });
			});
			instance.setOptions(resolvedOptions);
			useIsomorphicLayoutEffect(() => {
				return instance._didMount();
			}, []);
			useIsomorphicLayoutEffect(() => {
				applyContainerSize(instance);
				return instance._willUpdate();
			});
			useIsomorphicLayoutEffect(() => {
				applyDirectStyles(instance);
			});
			return instance;
		}
		function useVirtualizer(options) {
			return useVirtualizerBase({
				observeElementRect,
				observeElementOffset,
				scrollToFn: elementScroll,
				...options
			});
		}
		//#endregion
		//#region src/model.ts
		const COUNTERS = [
			"inputTokens",
			"outputTokens",
			"cacheReadTokens",
			"cacheWriteTokens",
			"reasoningTokens"
		];
		function finite(value) {
			return typeof value === "number" && Number.isFinite(value) ? value : null;
		}
		function duration(start, end) {
			return start !== null && end !== null && end >= start ? end - start : null;
		}
		function record(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
		}
		function readUsage(value) {
			const source = record(value);
			if (source === null) return null;
			const result = {
				inputTokens: null,
				outputTokens: null,
				cacheReadTokens: null,
				cacheWriteTokens: null,
				reasoningTokens: null,
				reportedRequests: 1,
				missingRequests: 0
			};
			let reported = false;
			for (const key of COUNTERS) {
				const count = finite(source[key]);
				result[key] = count !== null && count >= 0 ? count : null;
				reported ||= result[key] !== null;
			}
			result.reportedRequests = result.inputTokens !== null && result.outputTokens !== null ? 1 : 0;
			result.missingRequests = result.reportedRequests === 1 ? 0 : 1;
			return reported ? result : null;
		}
		function usageOf(request, node) {
			const primary = readUsage(request?.usage);
			const fallback = readUsage(node?.usage);
			if (primary === null) return fallback;
			if (fallback === null) return primary;
			const result = { ...primary };
			for (const key of COUNTERS) result[key] = primary[key] ?? fallback[key];
			result.reportedRequests = result.inputTokens !== null && result.outputTokens !== null ? 1 : 0;
			result.missingRequests = result.reportedRequests === 1 ? 0 : 1;
			return result;
		}
		/** Sum each request once; missing counters remain distinguishable from zero. */
		function aggregateUsage(rows) {
			const requests = [...new Map(rows.filter((row) => row.kind === "model" || row.kind === "compaction").map((row) => [row.id, row])).values()];
			if (requests.length === 0) return null;
			const result = {
				inputTokens: null,
				outputTokens: null,
				cacheReadTokens: null,
				cacheWriteTokens: null,
				reasoningTokens: null,
				reportedRequests: 0,
				missingRequests: 0
			};
			for (const row of requests) {
				if (row.usage === null) {
					result.missingRequests++;
					continue;
				}
				result.reportedRequests += row.usage.reportedRequests;
				result.missingRequests += row.usage.missingRequests;
				for (const key of COUNTERS) {
					const count = row.usage[key];
					if (count !== null) result[key] = (result[key] ?? 0) + count;
				}
			}
			return result;
		}
		function plainContent(content) {
			const blocks = content.filter((block) => record(block)?.type !== "reasoning");
			const text = blocks.flatMap((block) => {
				const value = record(block);
				return value?.type === "text" && typeof value.text === "string" ? [value.text] : [];
			});
			return text.length > 0 && text.length === blocks.length ? text.join("\n\n") : blocks;
		}
		function assistantOutput(node) {
			if (node === void 0) return null;
			const blocks = node.blocks.filter((block) => block.kind !== "reasoning");
			if (blocks.length === 0) return null;
			if (blocks.every((block) => block.kind === "text")) return blocks.map((block) => block.text).join("\n\n");
			return blocks;
		}
		function modelId(sessionId, turn, step) {
			return `${sessionId}:model:${turn}:${step}`;
		}
		function placement(location) {
			return location?.kind === "step" ? {
				turn: location.turn.turn,
				step: location.step.step,
				parentId: null
			} : location?.kind === "turn" ? {
				turn: location.turn.turn,
				step: null,
				parentId: null
			} : {
				turn: null,
				step: null,
				parentId: null
			};
		}
		function requestRow(sessionId, request, node, partial) {
			const turn = request === void 0 ? node?.turn ?? partial?.turn ?? null : request.turn;
			const step = request?.step ?? node?.step ?? partial?.step ?? null;
			const partialMatches = partial !== null && partial.turn === turn && partial.step === step;
			const startTime = finite(request?.startedAt) ?? finite(node?.timing?.stepStartTime) ?? (partialMatches ? finite(partial.timing?.stepStartTime) : null);
			const endTime = finite(request?.completedAt) ?? finite(node?.timing?.completedTime) ?? finite(node?.time);
			const status = node?.interrupted === true ? "interrupted" : request?.status === "error" ? "failed" : request?.status === "complete" || node !== void 0 ? "completed" : "running";
			const config = request?.requestConfig ?? node?.requestConfig;
			const metadata = request?.providerMetadata ?? node?.providerMetadata;
			const compaction = request?.purpose === "compaction";
			const identity = compaction ? `${sessionId}:compaction:${request.startSeq}` : modelId(sessionId, turn ?? 0, step ?? 0);
			const output = compaction ? plainContent(request.rawOutput ?? request.summary ?? []) : assistantOutput(node ?? (partialMatches ? partial : void 0));
			return {
				id: identity,
				parentId: null,
				kind: compaction ? "compaction" : "model",
				name: compaction ? "compaction" : "model",
				status,
				turn,
				step,
				seq: request?.startSeq ?? node?.seq ?? null,
				startTime,
				endTime: status === "running" ? null : endTime,
				durationMs: status === "running" ? null : duration(startTime, endTime),
				input: request?.purpose === "assistant" ? request.prompt ?? null : null,
				output,
				error: status === "failed" ? request?.error ?? request?.errorCode ?? null : null,
				provider: metadata?.provider ?? config?.provider ?? null,
				model: metadata?.model ?? config?.model ?? null,
				usage: usageOf(request, node),
				raw: {
					source: "trajectory-projection",
					request: request === void 0 ? null : {
						purpose: request.purpose,
						startSeq: request.startSeq,
						startedAt: request.startedAt,
						completedAt: request.completedAt,
						status: request.status,
						resultSeq: request.resultSeq,
						requestConfig: request.requestConfig,
						providerMetadata: request.providerMetadata,
						usage: request.usage,
						error: request.error,
						errorCode: request.errorCode,
						...request.purpose === "assistant" ? {
							turn: request.turn,
							step: request.step,
							retry: request.retry
						} : {}
					},
					resultSeq: node?.seq ?? null,
					timing: node?.timing ?? null,
					interrupted: node?.interrupted === true
				}
			};
		}
		function toolRow(sessionId, block, position) {
			const settled = "kind" in block;
			const startTime = finite(settled ? block.callTime : block.time);
			const endTime = settled ? finite(block.time) : null;
			const errorCode = settled ? block.error?.code.toLowerCase() : void 0;
			const status = !settled ? "running" : errorCode === "interrupted" || errorCode === "aborted" ? "interrupted" : block.isError ? "failed" : "completed";
			const input = settled ? block.call?.argsRaw ?? null : block.phase === "start" ? block.argsRaw : null;
			return {
				id: `${sessionId}:tool:${block.callId}`,
				parentId: block.parentCallId === void 0 ? position.parentId : `${sessionId}:tool:${block.parentCallId}`,
				kind: "tool",
				name: block.name || block.callId,
				status,
				turn: settled ? position.turn : block.turn,
				step: settled ? position.step : block.step,
				seq: settled ? block.seq : null,
				startTime,
				endTime,
				durationMs: duration(startTime, endTime),
				input,
				output: settled ? plainContent(block.content) : null,
				error: settled && block.isError ? block.error?.reason ?? block.error?.code ?? (typeof plainContent(block.content) === "string" ? String(plainContent(block.content)) : null) : null,
				provider: null,
				model: null,
				usage: null,
				raw: {
					source: "trajectory-projection",
					callId: block.callId,
					parentCallId: block.parentCallId ?? null,
					name: block.name,
					...settled ? {
						seq: block.seq,
						time: block.time,
						callTime: block.callTime,
						isError: block.isError,
						error: block.error,
						meta: block.meta
					} : {
						phase: block.phase,
						time: block.time
					}
				}
			};
		}
		function turnStatus(boundary, rows) {
			if (boundary?.end !== void 0) {
				const reason = boundary.end.data.reason.kind;
				if (reason === "completed") return "completed";
				if (reason === "interrupted" || reason === "forked" || reason === "aborted") return "interrupted";
				if (reason === "error" || reason === "max-tokens" || reason === "blocked") return "failed";
			}
			if (boundary?.status === "open" || rows.some((row) => row.status === "running")) return "running";
			if (rows.some((row) => row.status === "interrupted")) return "interrupted";
			return "unknown";
		}
		function chronological(left, right) {
			return (left.startTime ?? left.endTime ?? Infinity) - (right.startTime ?? right.endTime ?? Infinity) || (left.seq ?? Infinity) - (right.seq ?? Infinity) || left.id.localeCompare(right.id);
		}
		/**
		* Build a read-only waterfall view from the DSH trajectory window.
		* @param snapshot - Current official trajectory projection; it can grow after paging.
		* @param sessionId - Stable Session identity, included in every row key.
		* @param options - Paging facts supplied by the Session binding.
		* @returns Rows and turn summaries without inferred times or duplicate requests.
		*/
		function buildTrace(snapshot, sessionId, options = {}) {
			const boundaries = /* @__PURE__ */ new Map();
			for (const location of snapshot.eventLocations.values()) {
				if (location.kind !== "step" && location.kind !== "turn") continue;
				const previous = boundaries.get(location.turn.turn);
				if (previous === void 0 || location.turn.end !== void 0 || previous.start === void 0) boundaries.set(location.turn.turn, location.turn);
			}
			const assistants = /* @__PURE__ */ new Map();
			const toolPositions = /* @__PURE__ */ new Map();
			for (const node of snapshot.eventNodes) {
				if (node.kind !== "assistant") continue;
				const id = modelId(sessionId, node.turn, node.step);
				const existing = assistants.get(id);
				if (existing === void 0 || existing.seq < node.seq) assistants.set(id, node);
				for (const block of node.blocks) if (block.kind === "tool-call") toolPositions.set(block.callId, {
					turn: node.turn,
					step: node.step,
					parentId: id
				});
			}
			if (snapshot.partial !== null) {
				for (const block of snapshot.partial.blocks) if (block.kind === "tool-call") toolPositions.set(block.callId, {
					turn: snapshot.partial.turn,
					step: snapshot.partial.step,
					parentId: modelId(sessionId, snapshot.partial.turn, snapshot.partial.step)
				});
			}
			const rows = /* @__PURE__ */ new Map();
			for (const request of snapshot.requests) {
				const row = requestRow(sessionId, request, request.purpose === "assistant" ? assistants.get(modelId(sessionId, request.turn, request.step)) : void 0, snapshot.partial);
				rows.set(row.id, row);
			}
			for (const [id, node] of assistants) if (!rows.has(id)) rows.set(id, requestRow(sessionId, void 0, node, snapshot.partial));
			if (snapshot.partial !== null) {
				const id = modelId(sessionId, snapshot.partial.turn, snapshot.partial.step);
				if (!rows.has(id)) rows.set(id, requestRow(sessionId, void 0, void 0, snapshot.partial));
			}
			const seenTools = /* @__PURE__ */ new Set();
			const toolParents = /* @__PURE__ */ new Map();
			function indexTool(block, inherited, visited = /* @__PURE__ */ new Set()) {
				if (visited.has(block.callId)) return;
				const next = new Set(visited).add(block.callId);
				const direct = toolPositions.get(block.callId);
				const fallback = "kind" in block ? placement(snapshot.eventLocations.get(block.seq)) : {
					turn: block.turn,
					step: block.step,
					parentId: null
				};
				if (block.parentCallId !== void 0) toolParents.set(block.callId, `${sessionId}:tool:${block.parentCallId}`);
				else if (inherited?.parentId !== null && inherited?.parentId !== void 0) toolParents.set(block.callId, inherited.parentId);
				const context = direct !== void 0 && direct.turn !== null ? direct : inherited ?? fallback;
				const position = {
					...context,
					parentId: toolParents.get(block.callId) ?? context.parentId
				};
				toolPositions.set(block.callId, position);
				for (const child of block.subCalls) indexTool(child, {
					turn: position.turn,
					step: position.step,
					parentId: `${sessionId}:tool:${block.callId}`
				}, next);
			}
			for (const node of snapshot.eventNodes) if (node.kind === "tool-result") indexTool(node);
			for (const block of snapshot.runningCalls) indexTool(block);
			function addTool(block, inherited) {
				if (seenTools.has(block.callId)) return;
				seenTools.add(block.callId);
				const direct = toolPositions.get(block.callId);
				const fromLocation = "kind" in block ? placement(snapshot.eventLocations.get(block.seq)) : {
					turn: block.turn,
					step: block.step,
					parentId: null
				};
				const row = toolRow(sessionId, block, direct ?? inherited ?? fromLocation);
				rows.set(row.id, row);
				for (const child of block.subCalls) addTool(child, {
					turn: row.turn,
					step: row.step,
					parentId: row.id
				});
			}
			for (const node of snapshot.eventNodes) if (node.kind === "tool-result") addTool(node);
			for (const block of snapshot.runningCalls) addTool(block);
			for (const node of snapshot.eventNodes) {
				if (node.kind !== "turn-error" && node.kind !== "turn-max-tokens") continue;
				const interrupted = node.kind === "turn-error" && node.code === "INTERRUPTED";
				const error = node.kind === "turn-error" ? node.message || node.code || null : "max-tokens";
				rows.set(`${sessionId}:notice:${node.seq}`, {
					id: `${sessionId}:notice:${node.seq}`,
					parentId: null,
					kind: "notice",
					name: node.kind,
					status: interrupted ? "interrupted" : "failed",
					turn: node.turn,
					step: node.step,
					seq: node.seq,
					startTime: null,
					endTime: finite(node.time),
					durationMs: null,
					input: null,
					output: null,
					error,
					provider: null,
					model: null,
					usage: null,
					raw: {
						source: "trajectory-projection",
						...node
					}
				});
			}
			const ordered = [...rows.values()].sort(chronological);
			const grouped = /* @__PURE__ */ new Map();
			for (const row of ordered) {
				const group = grouped.get(row.turn) ?? [];
				group.push(row);
				grouped.set(row.turn, group);
			}
			const titles = /* @__PURE__ */ new Map();
			for (const node of snapshot.eventNodes) {
				if (node.kind !== "user") continue;
				const position = placement(snapshot.eventLocations.get(node.seq));
				if (position.turn === null || titles.has(position.turn)) continue;
				const content = plainContent(node.content);
				if (typeof content === "string" && content.trim() !== "") titles.set(position.turn, content.trim());
			}
			return {
				sessionId,
				turns: [...grouped].sort(([left], [right]) => (left ?? Infinity) - (right ?? Infinity)).map(([turn, group]) => {
					const boundary = turn === null ? void 0 : boundaries.get(turn);
					const startTime = finite(boundary?.start?.time);
					const endTime = finite(boundary?.end?.time);
					const knownStarts = group.flatMap((row) => row.startTime === null ? [] : [row.startTime]);
					const knownEnds = group.flatMap((row) => row.endTime === null ? [] : [row.endTime]);
					return {
						id: `${sessionId}:turn:${turn ?? "unplaced"}`,
						turn,
						title: turn === null ? null : titles.get(turn) ?? null,
						status: turnStatus(boundary, group),
						startTime,
						endTime,
						durationMs: duration(startTime, endTime),
						timingComplete: duration(startTime, endTime) !== null,
						observedStartTime: knownStarts.length === 0 ? null : Math.min(...knownStarts),
						observedEndTime: knownEnds.length === 0 ? null : Math.max(...knownEnds),
						rows: group,
						modelCount: group.filter((row) => row.kind === "model").length,
						toolCount: group.filter((row) => row.kind === "tool").length,
						errorCount: group.filter((row) => row.status === "failed" || row.status === "interrupted").length,
						usage: aggregateUsage(group)
					};
				}),
				rows: ordered,
				partialHistory: options.hasMore === true
			};
		}
		//#endregion
		//#region src/client/format.ts
		/** Render data as escaped React text, never HTML or executable Markdown. */
		function formatContent(value) {
			if (value === null || value === void 0) return "";
			if (typeof value === "string") return value;
			try {
				return JSON.stringify(value, (_key, item) => typeof item === "bigint" ? String(item) : item, 2) ?? "";
			} catch {
				return String(value);
			}
		}
		function parseStructuredString(value) {
			if (typeof value !== "string") return value;
			try {
				const parsed = JSON.parse(value);
				return parsed !== null && typeof parsed === "object" ? parsed : value;
			} catch {
				return value;
			}
		}
		function isDisplayBlock(value) {
			if (!value || typeof value !== "object" || Array.isArray(value)) return false;
			const block = value;
			const keys = Object.keys(block);
			if (block.kind === "text") return typeof block.text === "string" && keys.length === 2 && keys.every((key) => key === "kind" || key === "text");
			return block.kind === "tool-call" && typeof block.name === "string" && typeof block.callId === "string" && typeof block.argsRaw === "string" && keys.length === 4 && keys.every((key) => [
				"kind",
				"name",
				"callId",
				"argsRaw"
			].includes(key));
		}
		function getDisplayBlocks(value) {
			const parsed = parseStructuredString(value);
			return Array.isArray(parsed) && parsed.length > 0 && parsed.every(isDisplayBlock) ? parsed : null;
		}
		/** Readable payload text; unfamiliar records retain their complete JSON shape. */
		function formatPayload(value) {
			const blocks = getDisplayBlocks(value);
			if (blocks) return blocks.map((block) => block.kind === "text" ? `kind: text\n${block.text}` : `kind: tool-call\nname: ${block.name}\ncallId: ${block.callId}\nargsRaw:\n${formatContent(parseStructuredString(block.argsRaw))}`).join("\n\n");
			return formatContent(parseStructuredString(value));
		}
		function formatDuration(value, t) {
			if (value === null || !Number.isFinite(value) || value < 0) return t("missing");
			return value < 1e3 ? `${Math.round(value)} ${t("milliseconds")}` : `${(value / 1e3).toFixed(2)} ${t("seconds")}`;
		}
		function formatTokens(value, t) {
			if (value === null) return t("missing");
			return new Intl.NumberFormat("en-US", {
				notation: "compact",
				maximumFractionDigits: 1
			}).format(value);
		}
		function rowName(row, t) {
			return row.kind === "tool" ? row.name : row.kind === "model" ? row.model ?? t("model") : t(row.kind);
		}
		function rowPreview(row) {
			if (row.error) return row.error.slice(0, 180);
			if (row.kind === "model") return row.provider ?? "";
			let value = row.input;
			if (typeof value === "string") try {
				value = JSON.parse(value);
			} catch {}
			if (value && typeof value === "object") {
				const input = value;
				for (const key of [
					"path",
					"file_path",
					"command",
					"query",
					"url",
					"description"
				]) if (typeof input[key] === "string") return input[key].slice(0, 180);
			}
			return typeof row.input === "string" ? row.input.slice(0, 180) : "";
		}
		//#endregion
		//#region \0dsh-trace-css:src/client/TraceView.module.css.mjs
		const tagId$1 = "@vibeinging/dsh-trace-viewer/src/client/TraceView.module.css";
		if (typeof document !== "undefined") {
			let style = [...document.querySelectorAll("style[data-plugin-css]")].find((tag) => tag.dataset.pluginCss === tagId$1);
			if (!style) {
				style = document.createElement("style");
				style.dataset.pluginCss = tagId$1;
				document.head.appendChild(style);
			}
			style.dataset.plugin = "@vibeinging/dsh-trace-viewer";
			style.textContent = "._6wjG4G_root{--trace-surface:var(--dsw-alias-bg-layer-1);--trace-panel:var(--dsw-alias-bg-layer-2);--trace-muted:var(--dsw-alias-label-tertiary);--trace-line:var(--dsw-alias-border-l2);--trace-accent:var(--dsw-alias-link);--trace-tool:var(--dsw-alias-label-secondary);width:100%;height:var(--dsh-conversation-viewport-height,100%);box-sizing:border-box;background:var(--trace-surface);min-width:0;min-height:0;color:var(--dsw-alias-label-primary);-webkit-font-smoothing:antialiased;flex-direction:column;flex:none;font-size:13px;line-height:1.5;display:flex;overflow:hidden;container-type:inline-size}._6wjG4G_root *{box-sizing:border-box}._6wjG4G_root button,._6wjG4G_root input,._6wjG4G_root select{font:inherit}._6wjG4G_root button{cursor:pointer}._6wjG4G_root button:disabled{cursor:default;opacity:.4}._6wjG4G_root button:focus-visible,._6wjG4G_root input:focus-visible,._6wjG4G_root select:focus-visible,._6wjG4G_request summary:focus-visible{outline:2px solid var(--trace-accent);outline-offset:-2px}._6wjG4G_root svg{flex-shrink:0;display:block}._6wjG4G_srOnly{clip:rect(0,0,0,0);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}._6wjG4G_header{justify-content:space-between;align-items:center;gap:16px;min-height:46px;padding:6px 20px;display:flex}._6wjG4G_heading{align-items:center;gap:10px;min-width:0;display:flex}._6wjG4G_heading>svg{width:20px;height:20px;color:var(--trace-accent)}._6wjG4G_heading h2{letter-spacing:-.2px;white-space:nowrap;margin:0;font-size:15px;font-weight:600}._6wjG4G_heading ._6wjG4G_status{border-left:1px solid var(--trace-line);margin-left:6px;padding-left:14px;font-size:11px}._6wjG4G_turnNavigation{border:1px solid var(--trace-line);background:var(--trace-panel);border-radius:8px;align-items:center;gap:2px;padding:2px;display:flex}._6wjG4G_turnPicker select{width:116px;min-height:28px;color:var(--dsw-alias-label-primary);background:0 0;border:0;border-radius:5px;padding:3px 8px;font-size:12px}._6wjG4G_turnPicker option{color:var(--dsw-alias-label-primary);background:var(--trace-panel)}._6wjG4G_iconButton,._6wjG4G_copyButton,._6wjG4G_collapse{color:var(--trace-muted);background:0 0;border:0;border-radius:5px;flex-shrink:0;justify-content:center;align-items:center;padding:0;display:inline-flex}._6wjG4G_iconButton{width:28px;height:28px}._6wjG4G_iconButton:hover:not(:disabled),._6wjG4G_copyButton:hover:not(:disabled),._6wjG4G_collapse:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}._6wjG4G_request{border-bottom:1px solid var(--trace-line);margin:0 20px}._6wjG4G_request summary{cursor:pointer;min-height:28px;color:var(--dsw-alias-label-secondary);align-items:center;gap:10px;list-style:none;display:flex}._6wjG4G_request summary::-webkit-details-marker{display:none}._6wjG4G_request summary>svg{width:12px;height:12px;color:var(--trace-muted);transition:transform .15s}._6wjG4G_request[open] summary>svg{transform:rotate(180deg)}._6wjG4G_requestLabel{color:var(--trace-muted);flex-shrink:0;font-size:11px}._6wjG4G_requestTitle{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:12px;overflow:hidden}._6wjG4G_request[open] p{white-space:pre-wrap;overflow-wrap:anywhere;max-height:140px;margin:8px 0 14px;font-size:12px;line-height:1.8;overflow:auto}._6wjG4G_metrics{align-items:center;gap:0;margin:0;padding:10px 20px 12px;display:flex}._6wjG4G_metrics>div{border-left:1px solid var(--trace-line);min-width:0;padding:0 24px}._6wjG4G_metrics>div:first-child{border-left:0;min-width:146px;padding-left:0}._6wjG4G_metrics dt,._6wjG4G_detailUsage dt{color:var(--trace-muted);white-space:nowrap;margin-bottom:3px;font-size:11px}._6wjG4G_metrics dd,._6wjG4G_detailUsage dd{font-variant-numeric:tabular-nums;letter-spacing:-.3px;white-space:nowrap;margin:0;font-size:17px;font-weight:500;line-height:1.25}._6wjG4G_metrics ._6wjG4G_primaryMetric dd{letter-spacing:-.8px;font-size:25px;font-weight:600}._6wjG4G_toolbar{border-top:1px solid var(--trace-line);border-bottom:1px solid var(--trace-line);flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;min-height:46px;padding:7px 16px;display:flex}._6wjG4G_filters{align-items:center;gap:3px;display:flex}._6wjG4G_button{min-height:30px;color:var(--trace-muted);white-space:nowrap;background:0 0;border:0;border-radius:6px;align-items:center;gap:7px;padding:5px 10px;display:inline-flex;font-size:12px!important}._6wjG4G_button:hover{background:var(--dsw-alias-interactive-bg-hover)}._6wjG4G_button[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--trace-panel);box-shadow:0 0 0 1px var(--trace-line),0 1px 2px #00000005}._6wjG4G_filterCount{font-variant-numeric:tabular-nums;color:var(--trace-muted);font-size:10px}._6wjG4G_searchBox{border:1px solid var(--trace-line);background:var(--trace-panel);width:248px;min-width:160px;height:32px;color:var(--trace-muted);border-radius:7px;align-items:center;gap:7px;padding:0 9px;display:flex}._6wjG4G_searchBox>svg{width:14px;height:14px}._6wjG4G_search{width:100%;min-width:0;height:100%;color:var(--dsw-alias-label-primary);background:0 0;border:0;padding:3px 0;font-size:12px!important}._6wjG4G_search::placeholder{color:var(--trace-muted)}._6wjG4G_body{flex:1;grid-template-columns:minmax(0,1fr);min-height:0;display:grid;overflow:hidden}._6wjG4G_body._6wjG4G_hasDetail{grid-template-columns:minmax(0,1fr) 340px}._6wjG4G_tablePane{flex-direction:column;min-width:0;min-height:0;display:flex}._6wjG4G_columns,._6wjG4G_row{grid-template-columns:218px minmax(80px,1fr) 66px;align-items:center;gap:12px;display:grid}._6wjG4G_ruler{min-height:39px;color:var(--trace-muted);border-bottom:1px solid var(--trace-line);padding:0 18px 0 14px;font-size:11px}._6wjG4G_ticks{font-variant-numeric:tabular-nums;justify-content:space-between;gap:3px;font-size:10px;display:flex}._6wjG4G_ticks span{white-space:nowrap}._6wjG4G_duration{text-align:right;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:11px;line-height:1.6}._6wjG4G_viewport{overscroll-behavior:contain;flex:1;min-height:100px;position:relative;overflow:auto}._6wjG4G_virtualRows{width:100%;position:relative}._6wjG4G_row{border-bottom:1px solid color-mix(in srgb,var(--trace-line)55%,transparent);width:100%;padding:0 18px 0 14px;position:absolute;top:0;left:0}._6wjG4G_row:hover{background:var(--dsw-alias-interactive-bg-hover)}._6wjG4G_row._6wjG4G_selected{background:color-mix(in srgb,var(--trace-accent)7%,var(--trace-surface));box-shadow:inset 2px 0 var(--trace-accent)}._6wjG4G_rowName{min-width:0;padding-left:calc(var(--trace-depth,0)*14px);align-items:center;gap:8px;display:flex}._6wjG4G_collapse,._6wjG4G_collapseSpace{flex:0 0 14px;width:14px;min-height:28px;padding:0}._6wjG4G_collapse svg{width:12px;height:12px}._6wjG4G_kind{background:var(--trace-panel);height:28px;color:var(--trace-tool);border-radius:7px;flex:0 0 28px;place-items:center;display:grid}._6wjG4G_kind>svg{width:15px;height:15px}._6wjG4G_kind[data-kind=model]{color:var(--trace-accent);background:color-mix(in srgb,var(--trace-accent)9%,transparent)}._6wjG4G_row[data-status=failed] ._6wjG4G_kind,._6wjG4G_row[data-status=interrupted] ._6wjG4G_kind{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary)10%,transparent)}._6wjG4G_selectRow{width:100%;min-width:0;min-height:50px;color:var(--dsw-alias-label-primary);text-align:left;background:0 0;border:0;flex-direction:column;justify-content:center;gap:3px;padding:4px 0;display:flex}._6wjG4G_selectRow>span,._6wjG4G_selectRow small{text-overflow:ellipsis;white-space:nowrap;max-width:100%;overflow:hidden}._6wjG4G_selectRow>span{font-size:12px;font-weight:500}._6wjG4G_selectRow small{color:var(--trace-muted);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:1.5}._6wjG4G_timeline{background:repeating-linear-gradient(to right,var(--trace-line)0,var(--trace-line).5px,transparent .5px,transparent 25%);border:0;min-width:0;height:60px;padding:0;position:relative}._6wjG4G_bar{height:14px;top:23px;left:var(--trace-left);width:var(--trace-width);border:1px solid color-mix(in srgb,var(--trace-tool)50%,transparent);background:color-mix(in srgb,var(--trace-tool)40%,var(--trace-surface));border-radius:4px;min-width:4px;max-width:100%;position:absolute}._6wjG4G_bar[data-kind=model]{background:color-mix(in srgb,var(--trace-accent)66%,var(--trace-surface));border-color:var(--trace-accent)}._6wjG4G_row._6wjG4G_selected ._6wjG4G_bar{box-shadow:0 0 0 3px color-mix(in srgb,var(--trace-accent)9%,transparent)}._6wjG4G_row[data-status=failed] ._6wjG4G_bar,._6wjG4G_row[data-status=interrupted] ._6wjG4G_bar{background:color-mix(in srgb,var(--dsw-alias-state-error-primary)55%,var(--trace-surface));border-color:var(--dsw-alias-state-error-primary)}._6wjG4G_row[data-status=failed] ._6wjG4G_duration,._6wjG4G_row[data-status=interrupted] ._6wjG4G_duration{color:var(--dsw-alias-state-error-primary)}._6wjG4G_bar._6wjG4G_startMarker{border-radius:2px;width:3px;height:17px;top:21px}._6wjG4G_rowRunning{color:var(--trace-accent);align-items:center;gap:4px;display:inline-flex}._6wjG4G_rowRunning>svg{width:12px;height:12px}._6wjG4G_listFooter,._6wjG4G_footer{color:var(--trace-muted);border-top:1px solid var(--trace-line);flex-wrap:wrap;justify-content:space-between;align-items:center;gap:4px 16px;padding:7px 18px;font-size:10px;display:flex}._6wjG4G_legend{align-items:center;gap:6px;display:flex}._6wjG4G_legend i{background:var(--trace-tool);border-radius:2px;width:7px;height:7px;margin-left:8px}._6wjG4G_legend i[data-kind=model]{background:var(--trace-accent)}._6wjG4G_footer{min-height:29px;padding:6px 20px;font-size:10px}._6wjG4G_footer>span{min-width:0}._6wjG4G_streaming{align-items:center;gap:6px;display:inline-flex}._6wjG4G_liveDot{background:var(--trace-accent);border-radius:50%;width:5px;height:5px}._6wjG4G_composerSpace{flex:0 0 var(--dsh-composer-height,0px)}._6wjG4G_paging{border-bottom:1px solid var(--trace-line);background:var(--trace-panel);flex-wrap:wrap;justify-content:center;align-items:center;gap:7px;padding:3px 8px;font-size:11px;display:flex}._6wjG4G_textButton{min-height:28px;color:var(--trace-accent);background:0 0;border:0;border-radius:5px;justify-content:center;align-items:center;gap:7px;padding:4px 7px;display:inline-flex;font-size:11px!important}._6wjG4G_textButton svg{width:13px;height:13px}._6wjG4G_textButton:hover{background:var(--dsw-alias-interactive-bg-hover)}._6wjG4G_paging>span,._6wjG4G_banner{color:var(--dsw-alias-state-error-primary)}._6wjG4G_banner{padding:8px 20px;font-size:12px}._6wjG4G_empty{text-align:center;height:100%;min-height:200px;color:var(--trace-muted);flex-direction:column;justify-content:center;align-items:center;gap:8px;padding:32px 20px;display:flex}._6wjG4G_empty h2,._6wjG4G_empty h3{color:var(--dsw-alias-label-primary);margin:0;font-size:14px;font-weight:500}._6wjG4G_empty p{max-width:320px;margin:0;font-size:12px}._6wjG4G_emptyMark{background:var(--trace-panel);width:44px;height:44px;color:var(--trace-muted);border-radius:12px;place-items:center;margin-bottom:8px;display:grid}._6wjG4G_emptyMark svg{width:26px;height:26px}._6wjG4G_detailPane{border-left:1px solid var(--trace-line);background:var(--trace-panel);overscroll-behavior:contain;min-width:0;min-height:0;overflow:auto}._6wjG4G_detail{min-width:0;padding-bottom:16px}._6wjG4G_detailHeader{padding:12px 18px 14px}._6wjG4G_detailCrumb{color:var(--trace-muted);justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;font-size:11px;display:flex}._6wjG4G_detailCrumb>span{align-items:center;gap:7px;display:inline-flex}._6wjG4G_detailCrumb svg{width:14px;height:14px}._6wjG4G_detail h3{letter-spacing:-.3px;overflow-wrap:anywhere;margin:0 0 8px;font-size:17px;font-weight:600;line-height:1.5}._6wjG4G_detailMeta{color:var(--trace-muted);font-variant-numeric:tabular-nums;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:11px;display:flex}._6wjG4G_detailMeta strong{color:var(--dsw-alias-label-primary);font-weight:500}._6wjG4G_sequence{margin-left:auto;font-family:ui-monospace,monospace;font-size:10px}._6wjG4G_status{white-space:nowrap;color:var(--dsw-alias-label-secondary);align-items:center;gap:5px;display:inline-flex}._6wjG4G_status>span{background:currentColor;border-radius:50%;width:5px;height:5px;display:inline-block}._6wjG4G_status[data-status=failed],._6wjG4G_status[data-status=interrupted]{color:var(--dsw-alias-state-error-primary)}._6wjG4G_status[data-status=completed]{color:var(--dsw-alias-state-success-primary)}._6wjG4G_status[data-status=running]{color:var(--trace-accent)}._6wjG4G_error{white-space:pre-wrap;overflow-wrap:anywhere;border-left:2px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);margin:0 18px 14px;padding-left:10px;font:11px/1.7 ui-monospace,monospace}._6wjG4G_payloadToolbar{border-top:1px solid var(--trace-line);border-bottom:1px solid var(--trace-line);background:var(--trace-panel);justify-content:space-between;align-items:center;gap:6px;padding:0 12px;display:flex}._6wjG4G_detailTabs{align-items:center;gap:2px;min-width:0;display:flex}._6wjG4G_detailTabs button{color:var(--trace-muted);white-space:nowrap;background:0 0;border:0;border-bottom:2px solid #0000;padding:10px 9px 8px;font-size:11px}._6wjG4G_detailTabs button:hover{color:var(--dsw-alias-label-primary)}._6wjG4G_detailTabs button[aria-pressed=true]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--trace-accent)}._6wjG4G_copyButton{width:28px;height:28px}._6wjG4G_copyButton svg{width:13px;height:13px}._6wjG4G_copyFeedback{color:var(--trace-muted);margin:8px 18px;font-size:11px}._6wjG4G_payloadBody{padding:16px 18px}._6wjG4G_content{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;color:var(--dsw-alias-label-secondary);tab-size:2;margin:0;padding:0;font:12px/1.8 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}._6wjG4G_detailNote{color:var(--trace-muted);overflow-wrap:anywhere;border-bottom:1px solid var(--trace-line);margin:0;padding:10px 18px;font-size:10px;line-height:1.7}._6wjG4G_payloadBody ._6wjG4G_detailNote{border-bottom:0;margin-top:12px;padding:0}._6wjG4G_truncated{color:var(--trace-muted);margin-bottom:10px;font-size:10px;display:block}._6wjG4G_detailUsage{gap:24px;margin:14px 0 0;display:flex}._6wjG4G_detailUsage dt{font-size:10px}._6wjG4G_detailUsage dd{font-size:12px}._6wjG4G_parentLink{text-align:left;max-width:100%;color:var(--trace-muted);background:0 0;border:0;align-items:center;gap:5px;margin-top:12px;padding:0;display:flex;font-size:10px!important}._6wjG4G_parentLink>span{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);overflow:hidden}._6wjG4G_parentLink svg{width:12px;height:12px}._6wjG4G_parentLink:hover>span{color:var(--trace-accent)}@container (width>=1300px){._6wjG4G_body._6wjG4G_hasDetail{grid-template-columns:minmax(0,1fr) 380px}._6wjG4G_columns,._6wjG4G_row{grid-template-columns:250px minmax(100px,1fr) 72px}}@container (width<=1000px){._6wjG4G_metrics>div{padding:0 18px}._6wjG4G_metrics>div:first-child{min-width:128px}._6wjG4G_columns,._6wjG4G_row{grid-template-columns:186px minmax(65px,1fr) 60px;gap:8px}._6wjG4G_ticks span:nth-child(2),._6wjG4G_ticks span:nth-child(4){display:none}._6wjG4G_body._6wjG4G_hasDetail{grid-template-columns:minmax(0,1fr) 312px}}@container (width<=830px){._6wjG4G_body,._6wjG4G_body._6wjG4G_hasDetail{flex-direction:column;display:flex;overflow:auto}._6wjG4G_tablePane{flex:1 0 330px;min-height:280px}._6wjG4G_hasDetail ._6wjG4G_tablePane{flex:0 0 330px}._6wjG4G_detailPane{border-left:0;border-top:1px solid var(--trace-line);flex:none;overflow:visible}._6wjG4G_columns,._6wjG4G_row{grid-template-columns:minmax(180px,.8fr) minmax(110px,1fr) 66px;gap:12px}._6wjG4G_metrics>div{flex:1;padding:0 12px}._6wjG4G_metrics>div:first-child{min-width:110px}._6wjG4G_metrics dd{font-size:15px}._6wjG4G_metrics ._6wjG4G_primaryMetric dd{font-size:23px}._6wjG4G_detailUsage{gap:36px}._6wjG4G_searchBox{width:210px}}@container (width<=520px){._6wjG4G_header{gap:8px;min-height:51px;padding:9px 12px}._6wjG4G_heading{gap:7px}._6wjG4G_heading h2{font-size:13px}._6wjG4G_heading>svg{width:17px;height:17px}._6wjG4G_heading ._6wjG4G_status{display:none}._6wjG4G_turnPicker select{width:100px}._6wjG4G_turnNavigation{gap:0}._6wjG4G_turnNavigation ._6wjG4G_iconButton{width:24px}._6wjG4G_request{margin:0 12px}._6wjG4G_metrics{flex-wrap:wrap;gap:12px 0;padding:12px}._6wjG4G_metrics>div{flex:0 0 25%;padding:0 10px}._6wjG4G_metrics>div:first-child{flex-basis:50%;min-width:0}._6wjG4G_metrics>div:nth-child(4){border-left:0;flex-basis:50%;padding-left:0}._6wjG4G_metrics dt{font-size:10px}._6wjG4G_metrics dd{font-size:14px}._6wjG4G_metrics ._6wjG4G_primaryMetric dd{font-size:22px}._6wjG4G_toolbar{gap:9px;padding:8px 10px}._6wjG4G_filters{width:100%}._6wjG4G_button{padding:5px 9px}._6wjG4G_toolbarActions{width:100%}._6wjG4G_searchBox{flex:1;width:auto;min-width:0;height:32px}._6wjG4G_focusButton>span{display:none}._6wjG4G_columns,._6wjG4G_row{grid-template-columns:minmax(132px,1.15fr) minmax(55px,1fr) 55px;gap:7px;padding-left:7px;padding-right:10px}._6wjG4G_ruler{padding-left:12px}._6wjG4G_ticks span:not(:first-child):not(:last-child){display:none}._6wjG4G_rowName{padding-left:calc(var(--trace-depth,0)*7px);gap:5px}._6wjG4G_kind{border-radius:5px;flex-basis:22px;height:24px}._6wjG4G_kind>svg{width:13px;height:13px}._6wjG4G_collapse,._6wjG4G_collapseSpace{flex-basis:10px;width:10px}._6wjG4G_selectRow>span{font-size:11px}._6wjG4G_selectRow small{font-size:9px}._6wjG4G_duration{font-size:10px}._6wjG4G_listFooter{padding:7px 12px}._6wjG4G_footer{padding:6px 12px}._6wjG4G_footer>span:last-child{display:none}._6wjG4G_detailHeader{padding:12px 14px}._6wjG4G_payloadBody{padding:14px}._6wjG4G_detailNote{padding:10px 14px}}@media (pointer:coarse){._6wjG4G_button,._6wjG4G_textButton,._6wjG4G_iconButton,._6wjG4G_copyButton,._6wjG4G_turnPicker select{min-height:44px}._6wjG4G_searchBox{height:44px}._6wjG4G_search{font-size:16px!important}}@media (prefers-reduced-motion:reduce){._6wjG4G_request summary>svg{transition:none}}._6wjG4G_toolbarActions{align-items:center;gap:8px;display:flex}._6wjG4G_focusButton{min-height:30px;color:var(--trace-muted);background:0 0;border:0;border-radius:6px;flex-shrink:0;align-items:center;gap:6px;padding:5px 9px;display:inline-flex;font-size:11px!important}._6wjG4G_focusButton>svg{width:14px;height:14px}._6wjG4G_focusButton:hover{background:var(--dsw-alias-interactive-bg-hover)}._6wjG4G_focusButton[aria-pressed=true]{color:var(--trace-accent);background:color-mix(in srgb,var(--trace-accent)7%,transparent)}._6wjG4G_proseContent{white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-primary);margin:0 0 16px;font-family:inherit;font-size:12px;line-height:1.9}._6wjG4G_payloadBlock{border:1px solid var(--trace-line);background:var(--trace-surface);border-radius:7px;margin-bottom:12px;overflow:hidden}._6wjG4G_payloadBlockHeader{border-bottom:1px solid var(--trace-line);align-items:center;gap:7px;padding:9px 11px;font-size:11px;display:flex}._6wjG4G_payloadBlockHeader>svg{width:13px;height:13px;color:var(--trace-muted)}._6wjG4G_payloadBlockHeader strong{font-weight:500}._6wjG4G_payloadBlockHeader>span{color:var(--trace-muted);margin-left:auto;font-size:10px}._6wjG4G_payloadBlock ._6wjG4G_content{padding:11px;font-size:11px}._6wjG4G_payloadId{color:var(--trace-muted);overflow-wrap:anywhere;padding:0 11px 10px;font-size:9px;display:block}@media (pointer:coarse){._6wjG4G_focusButton{min-height:44px}}";
		}
		var TraceView_module_css_default = {
			"collapseSpace": "_6wjG4G_collapseSpace",
			"turnNavigation": "_6wjG4G_turnNavigation",
			"collapse": "_6wjG4G_collapse",
			"metrics": "_6wjG4G_metrics",
			"bar": "_6wjG4G_bar",
			"payloadBlockHeader": "_6wjG4G_payloadBlockHeader",
			"requestLabel": "_6wjG4G_requestLabel",
			"paging": "_6wjG4G_paging",
			"composerSpace": "_6wjG4G_composerSpace",
			"liveDot": "_6wjG4G_liveDot",
			"empty": "_6wjG4G_empty",
			"banner": "_6wjG4G_banner",
			"parentLink": "_6wjG4G_parentLink",
			"truncated": "_6wjG4G_truncated",
			"status": "_6wjG4G_status",
			"payloadToolbar": "_6wjG4G_payloadToolbar",
			"rowName": "_6wjG4G_rowName",
			"search": "_6wjG4G_search",
			"footer": "_6wjG4G_footer",
			"request": "_6wjG4G_request",
			"content": "_6wjG4G_content",
			"filters": "_6wjG4G_filters",
			"row": "_6wjG4G_row",
			"rowRunning": "_6wjG4G_rowRunning",
			"selected": "_6wjG4G_selected",
			"heading": "_6wjG4G_heading",
			"error": "_6wjG4G_error",
			"toolbarActions": "_6wjG4G_toolbarActions",
			"detail": "_6wjG4G_detail",
			"payloadBlock": "_6wjG4G_payloadBlock",
			"searchBox": "_6wjG4G_searchBox",
			"turnPicker": "_6wjG4G_turnPicker",
			"tablePane": "_6wjG4G_tablePane",
			"srOnly": "_6wjG4G_srOnly",
			"virtualRows": "_6wjG4G_virtualRows",
			"startMarker": "_6wjG4G_startMarker",
			"listFooter": "_6wjG4G_listFooter",
			"legend": "_6wjG4G_legend",
			"proseContent": "_6wjG4G_proseContent",
			"header": "_6wjG4G_header",
			"copyButton": "_6wjG4G_copyButton",
			"hasDetail": "_6wjG4G_hasDetail",
			"duration": "_6wjG4G_duration",
			"root": "_6wjG4G_root",
			"textButton": "_6wjG4G_textButton",
			"emptyMark": "_6wjG4G_emptyMark",
			"copyFeedback": "_6wjG4G_copyFeedback",
			"iconButton": "_6wjG4G_iconButton",
			"detailUsage": "_6wjG4G_detailUsage",
			"button": "_6wjG4G_button",
			"ruler": "_6wjG4G_ruler",
			"focusButton": "_6wjG4G_focusButton",
			"viewport": "_6wjG4G_viewport",
			"filterCount": "_6wjG4G_filterCount",
			"payloadId": "_6wjG4G_payloadId",
			"detailCrumb": "_6wjG4G_detailCrumb",
			"columns": "_6wjG4G_columns",
			"ticks": "_6wjG4G_ticks",
			"body": "_6wjG4G_body",
			"detailHeader": "_6wjG4G_detailHeader",
			"detailTabs": "_6wjG4G_detailTabs",
			"payloadBody": "_6wjG4G_payloadBody",
			"streaming": "_6wjG4G_streaming",
			"requestTitle": "_6wjG4G_requestTitle",
			"sequence": "_6wjG4G_sequence",
			"primaryMetric": "_6wjG4G_primaryMetric",
			"selectRow": "_6wjG4G_selectRow",
			"detailMeta": "_6wjG4G_detailMeta",
			"toolbar": "_6wjG4G_toolbar",
			"kind": "_6wjG4G_kind",
			"timeline": "_6wjG4G_timeline",
			"detailPane": "_6wjG4G_detailPane",
			"detailNote": "_6wjG4G_detailNote"
		};
		//#endregion
		//#region src/client/TraceIcon.tsx
		/** Small local icons keep the viewer aligned with the host without another UI runtime. */
		function TraceIcon({ name }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				focusable: "false",
				children: {
					database: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ellipse", {
						cx: "12",
						cy: "5",
						rx: "8",
						ry: "3"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" })] }),
					focus: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" }) }),
					waterfall: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 5h8M7 10h9M12 15h9M3 3v16" }) }),
					model: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "6",
						y: "6",
						width: "12",
						height: "12",
						rx: "3"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M10 10h4v4h-4z" })] }),
					tool: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "3",
						y: "4",
						width: "18",
						height: "16",
						rx: "3"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m7 9 3 3-3 3m6 0h4" })] }),
					compaction: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4" }) }),
					notice: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "12",
						cy: "12",
						r: "9"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 11v6m0-10h.01" })] }),
					left: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m14 6-6 6 6 6" }),
					right: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m9 6 6 6-6 6" }),
					down: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6 9 6 6 6-6" }),
					search: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "10.5",
						cy: "10.5",
						r: "6.5"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m16 16 4 4" })] }),
					history: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 10a9 9 0 1 1 2 8M3 4v6h6m3-3v5l3 2" }) }),
					loading: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M20 12a8 8 0 1 1-8-8" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M17 4h3v3" })] }),
					error: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "12",
						cy: "12",
						r: "9"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 7v6m0 4h.01" })] }),
					close: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6 6 12 12M6 18 18 6" }),
					copy: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "8",
						y: "8",
						width: "12",
						height: "13",
						rx: "2"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" })] }),
					check: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m5 12 4 4L19 6" }),
					branch: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6 3v10a4 4 0 0 0 4 4h8m-4-4 4 4-4 4" }) })
				}[name]
			});
		}
		//#endregion
		//#region src/client/TraceView.tsx
		/** This adapter is the only component coupled to DSH's live selector hooks. */
		function TraceView(props) {
			if (typeof props.useTrajectory !== "function") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: TraceView_module_css_default.empty,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: props.t("unavailable") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: props.t("unavailableBody") })]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BoundTrace, { ...props });
		}
		function BoundTrace(props) {
			const snapshot = props.useTrajectory((value) => value);
			const session = props.useSession((value) => value);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceWorkbench, {
				data: (0, react.useMemo)(() => buildTrace(snapshot, String(props.sessionId), { hasMore: session.hasMore }), [
					snapshot,
					props.sessionId,
					session.hasMore
				]),
				t: props.t,
				loadOlder: props.loadOlder,
				focusComposer: props.focusComposer,
				openDataManagement: props.openDataManagement,
				hasMore: session.hasMore,
				loadingOlder: session.loadingOlder,
				running: session.running,
				loading: session.openState === "cold" || session.openState === "loading",
				readFailed: session.openState === "error"
			}, String(props.sessionId));
		}
		/** Preserve real ancestors during filtering; only declared parent ids form edges. */
		function visibleTree(rows, collapsed, filter, query) {
			const byId = new Map(rows.map((row) => [row.id, row]));
			const children = /* @__PURE__ */ new Map();
			const accepted = /* @__PURE__ */ new Set();
			const searching = filter !== "all" || query !== "";
			for (const row of rows) {
				const parent = row.parentId !== null && byId.has(row.parentId) ? row.parentId : null;
				const list = children.get(parent) ?? [];
				list.push(row);
				children.set(parent, list);
				if ((filter === "all" || filter === "errors" && (row.status === "failed" || row.status === "interrupted") || filter === "models" && row.kind === "model") && (!query || [
					row.name,
					row.model,
					row.provider,
					row.error,
					formatContent(row.input)
				].join(" ").toLowerCase().includes(query))) {
					let cursor = row;
					const seen = /* @__PURE__ */ new Set();
					while (cursor && !seen.has(cursor.id)) {
						accepted.add(cursor.id);
						seen.add(cursor.id);
						cursor = cursor.parentId ? byId.get(cursor.parentId) : void 0;
					}
				}
			}
			const result = [];
			const seen = /* @__PURE__ */ new Set();
			const visit = (row, depth) => {
				if (seen.has(row.id) || searching && !accepted.has(row.id)) return;
				seen.add(row.id);
				const kids = children.get(row.id) ?? [];
				result.push({
					row,
					depth,
					children: kids.length > 0
				});
				if (!collapsed.has(row.id) || searching) for (const child of kids) visit(child, depth + 1);
			};
			for (const row of children.get(null) ?? []) visit(row, 0);
			return result;
		}
		function timeRange(rows) {
			let start = null;
			let end = null;
			for (const row of rows) {
				if (row.startTime !== null) start = start === null ? row.startTime : Math.min(start, row.startTime);
				const endpoint = row.endTime ?? row.startTime;
				if (endpoint !== null) end = end === null ? endpoint : Math.max(end, endpoint);
			}
			return {
				start,
				span: start !== null && end !== null && end > start ? end - start : null
			};
		}
		/** Pure display component; both the shipped tab and component tests use this surface. */
		function TraceWorkbench({ data, t, loadOlder, hasMore, loadingOlder, loading, running, readFailed, focusComposer, openDataManagement }) {
			const [focused, setFocused] = (0, react.useState)(true);
			(0, react.useEffect)(() => focused ? focusComposer?.() : void 0, [focused, focusComposer]);
			const [turnId, setTurnId] = (0, react.useState)(null);
			const [selectedId, setSelectedId] = (0, react.useState)(null);
			const [filter, setFilter] = (0, react.useState)("all");
			const [query, setQuery] = (0, react.useState)("");
			const deferredQuery = (0, react.useDeferredValue)(query.trim().toLowerCase());
			const [collapsed, setCollapsed] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [paging, setPaging] = (0, react.useState)(false);
			const [pageError, setPageError] = (0, react.useState)(false);
			const mounted = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			const selectedRecord = selectedId ? data.rows.find((row) => row.id === selectedId) : void 0;
			const latestTurn = data.turns.findLast((item) => item.turn !== null) ?? data.turns.at(-1);
			const turn = (selectedRecord ? data.turns.find((item) => item.turn === selectedRecord.turn) : void 0) ?? data.turns.find((item) => item.id === turnId) ?? latestTurn;
			const rows = turn?.rows ?? [];
			const selected = selectedRecord ?? (selectedId === null ? rows.find((row) => row.status === "failed" || row.status === "interrupted") ?? rows[0] : void 0);
			const visible = (0, react.useMemo)(() => visibleTree(rows, collapsed, filter, deferredQuery), [
				rows,
				collapsed,
				filter,
				deferredQuery
			]);
			const range = (0, react.useMemo)(() => timeRange(rows), [rows]);
			const viewport = (0, react.useRef)(null);
			const virtual = useVirtualizer({
				count: visible.length,
				getScrollElement: () => viewport.current,
				estimateSize: () => 60,
				overscan: 8,
				getItemKey: (index) => visible[index]?.row.id ?? index,
				initialRect: {
					width: 800,
					height: 460
				}
			});
			const page = async () => {
				if (paging || loadingOlder) return;
				setPaging(true);
				setPageError(false);
				try {
					await loadOlder();
				} catch {
					if (mounted.current) setPageError(true);
				} finally {
					if (mounted.current) setPaging(false);
				}
			};
			const select = (row) => {
				setSelectedId(row.id);
				if (turn) setTurnId(turn.id);
			};
			const turnLabel = (item) => item.turn === null ? t("unresolved") : t("turn", { turn: item.turn });
			const empty = data.rows.length === 0;
			const turnIndex = data.turns.findIndex((item) => item.id === turn?.id);
			const changeTurn = (id) => {
				setTurnId(id);
				setSelectedId(null);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: TraceView_module_css_default.root,
				"aria-label": t("title"),
				"data-testid": "trace-workbench",
				"data-conversation-composer-overlay": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: TraceView_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: TraceView_module_css_default.heading,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "waterfall" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("title") }),
								turn && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Status, {
									status: turn.status,
									t
								})
							]
						}), data.turns.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: TraceView_module_css_default.turnNavigation,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TraceView_module_css_default.iconButton,
									"aria-label": t("previousTurn"),
									disabled: turnIndex <= 0,
									onClick: () => {
										const previous = data.turns[turnIndex - 1];
										if (previous) changeTurn(previous.id);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "left" })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: TraceView_module_css_default.turnPicker,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TraceView_module_css_default.srOnly,
										children: t("turnPicker")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
										value: turn?.id ?? "",
										onChange: (event) => changeTurn(event.target.value),
										children: [...data.turns].reverse().map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: item.id,
											children: turnLabel(item)
										}, item.id))
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TraceView_module_css_default.iconButton,
									"aria-label": t("nextTurn"),
									disabled: turnIndex < 0 || turnIndex >= data.turns.length - 1,
									onClick: () => {
										const next = data.turns[turnIndex + 1];
										if (next) changeTurn(next.id);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "right" })
								})
							]
						})]
					}),
					turn?.title && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: TraceView_module_css_default.request,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: TraceView_module_css_default.requestLabel,
								children: t("request")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: TraceView_module_css_default.requestTitle,
								children: turn.title
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "down" })
						] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: turn.title })]
					}, turn.id),
					turn && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
						className: TraceView_module_css_default.metrics,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
								label: t("duration"),
								value: formatDuration(turn.durationMs, t),
								primary: true
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
								label: t("modelCount"),
								value: String(turn.modelCount)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
								label: t("toolCount"),
								value: String(turn.toolCount)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
								label: t("inputTokens"),
								value: formatTokens(turn.usage?.inputTokens ?? null, t)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
								label: t("outputTokens"),
								value: formatTokens(turn.usage?.outputTokens ?? null, t)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
								label: t("cache"),
								value: formatTokens(turn.usage?.cacheReadTokens ?? null, t)
							})
						]
					}),
					readFailed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TraceView_module_css_default.banner,
						role: "alert",
						children: [
							t("readFailed"),
							" · ",
							t("readFailedBody")
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TraceView_module_css_default.toolbar,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: TraceView_module_css_default.filters,
							role: "group",
							"aria-label": t("steps"),
							children: [
								"all",
								"errors",
								"models"
							].map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: TraceView_module_css_default.button,
								"aria-pressed": filter === value,
								onClick: () => setFilter(value),
								children: [t(value), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: TraceView_module_css_default.filterCount,
									"aria-hidden": "true",
									children: value === "all" ? rows.length : value === "errors" ? rows.filter((row) => row.status === "failed" || row.status === "interrupted").length : turn?.modelCount ?? 0
								})]
							}, value))
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: TraceView_module_css_default.toolbarActions,
							children: [
								openDataManagement && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TraceView_module_css_default.focusButton,
									onClick: openDataManagement,
									"aria-label": t("dataManagement"),
									title: t("dataManagement"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "database" })
								}),
								focusComposer && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: TraceView_module_css_default.focusButton,
									"aria-label": t("focusMode"),
									"aria-pressed": focused,
									onClick: () => setFocused((value) => !value),
									title: t(focused ? "showComposer" : "hideComposer"),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "focus" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("focusMode") })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: TraceView_module_css_default.searchBox,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "search" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "search",
										className: TraceView_module_css_default.search,
										value: query,
										onChange: (event) => setQuery(event.target.value),
										placeholder: t("search"),
										"aria-label": t("search")
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `${TraceView_module_css_default.body} ${selected ? TraceView_module_css_default.hasDetail : ""}`,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: TraceView_module_css_default.tablePane,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: `${TraceView_module_css_default.ruler} ${TraceView_module_css_default.columns}`,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("steps") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: TraceView_module_css_default.ticks,
											"aria-label": t("elapsed"),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "0" }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: range.span === null ? "" : formatDuration(range.span / 4, t) }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: range.span === null ? "" : formatDuration(range.span / 2, t) }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: range.span === null ? "" : formatDuration(range.span * 3 / 4, t) }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: range.span === null ? t("missing") : formatDuration(range.span, t) })
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: TraceView_module_css_default.duration,
											children: t("durationColumn")
										})
									]
								}),
								hasMore && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: TraceView_module_css_default.paging,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: TraceView_module_css_default.textButton,
										disabled: paging || loadingOlder,
										onClick: () => {
											page();
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: paging || loadingOlder ? "loading" : "history" }), paging || loadingOlder ? t("loading") : t("loadOlder")]
									}), pageError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										role: "alert",
										children: t("loadFailed")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									ref: viewport,
									className: TraceView_module_css_default.viewport,
									"data-testid": "trace-rows",
									role: "list",
									"aria-label": t("steps"),
									children: empty ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TraceView_module_css_default.empty,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: TraceView_module_css_default.emptyMark,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "waterfall" })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: loading ? t("loading") : t("empty") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("emptyBody") })
										]
									}) : visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TraceView_module_css_default.empty,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("noMatches") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: TraceView_module_css_default.textButton,
											onClick: () => {
												setQuery("");
												setFilter("all");
											},
											children: t("clearFilters")
										})]
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: TraceView_module_css_default.virtualRows,
										style: { height: virtual.getTotalSize() },
										children: virtual.getVirtualItems().map((item) => {
											const value = visible[item.index];
											if (!value) return null;
											const { row, depth, children } = value;
											const name = rowName(row, t);
											const start = row.startTime !== null && range.start !== null ? range.span === null ? 0 : Math.max(0, (row.startTime - range.start) / range.span * 100) : null;
											const width = row.durationMs !== null && range.span !== null ? row.durationMs / range.span * 100 : null;
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												role: "listitem",
												className: `${TraceView_module_css_default.row} ${selected?.id === row.id ? TraceView_module_css_default.selected : ""}`,
												"data-status": row.status,
												style: {
													transform: `translateY(${item.start}px)`,
													height: item.size
												},
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: TraceView_module_css_default.rowName,
														style: { "--trace-depth": Math.min(depth, 6) },
														children: [
															children ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																className: TraceView_module_css_default.collapse,
																"aria-expanded": !collapsed.has(row.id),
																"aria-label": t(collapsed.has(row.id) ? "expand" : "collapse", { name }),
																onClick: () => setCollapsed((old) => {
																	const next = new Set(old);
																	if (next.has(row.id)) next.delete(row.id);
																	else next.add(row.id);
																	return next;
																}),
																children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: collapsed.has(row.id) ? "right" : "down" })
															}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: TraceView_module_css_default.collapseSpace }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: TraceView_module_css_default.kind,
																"data-kind": row.kind,
																children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: row.status === "failed" || row.status === "interrupted" ? "error" : row.kind })
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																type: "button",
																title: rowPreview(row) || name,
																className: TraceView_module_css_default.selectRow,
																"aria-pressed": selected?.id === row.id,
																"aria-label": t("select", { name }),
																onClick: () => select(row),
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: rowPreview(row) || t(row.kind) })]
															})
														]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: TraceView_module_css_default.timeline,
														onClick: () => select(row),
														"aria-label": `${t("select", { name })} · ${formatDuration(row.durationMs, t)}`,
														children: start !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: `${TraceView_module_css_default.bar} ${width === null ? TraceView_module_css_default.startMarker : ""}`,
															"data-kind": row.kind,
															style: {
																"--trace-left": `${Math.min(start, 99.5)}%`,
																"--trace-width": `${Math.min(width ?? 0, 100 - start)}%`
															}
														})
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: TraceView_module_css_default.duration,
														children: row.status === "running" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: TraceView_module_css_default.rowRunning,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "loading" }), t("running")]
														}) : formatDuration(row.durationMs, t)
													})
												]
											}, row.id);
										})
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: TraceView_module_css_default.listFooter,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("shown", {
										visible: visible.length,
										total: rows.length
									}) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TraceView_module_css_default.legend,
										children: filter !== "all" || query ? t("withAncestors") : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { "data-kind": "model" }),
											t("modelCount"),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { "data-kind": "tool" }),
											t("toolCount")
										] })
									})]
								})
							]
						}), selected && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("aside", {
							className: TraceView_module_css_default.detailPane,
							"aria-label": t("detailTabs"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceDetail, {
								row: selected,
								t,
								parent: selected.parentId ? rows.find((row) => row.id === selected.parentId) : void 0,
								onParent: select,
								onClose: () => {
									setSelectedId("");
								}
							}, selected.id)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: TraceView_module_css_default.footer,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: running ? TraceView_module_css_default.streaming : "",
							children: [running && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: TraceView_module_css_default.liveDot }), running ? t("streaming") : t("source")]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [hasMore ? t("partialHistory") : t("scope"), turn?.usage && turn.usage.missingRequests > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [" · ", t("partialUsage")] })] })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: TraceView_module_css_default.composerSpace,
						"aria-hidden": "true"
					})
				]
			});
		}
		function Metric({ label, value, primary = false }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: primary ? TraceView_module_css_default.primaryMetric : void 0,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: value })]
			});
		}
		function Status({ status, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: TraceView_module_css_default.status,
				"data-status": status,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { "aria-hidden": "true" }), t(status)]
			});
		}
		function TraceDetail({ row, t, parent, onParent, onClose }) {
			const [tab, setTab] = (0, react.useState)("output");
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [copyState, setCopyState] = (0, react.useState)("copy");
			const value = tab === "input" ? row.input : tab === "output" ? row.output : row.raw;
			const text = (0, react.useMemo)(() => tab === "record" ? formatContent(value) : formatPayload(value), [tab, value]);
			const blocks = tab === "record" ? null : getDisplayBlocks(value);
			const long = text.length > 24e3;
			const shown = long && !expanded ? text.slice(0, 24e3) : text;
			const copy = async () => {
				try {
					await navigator.clipboard.writeText(text);
					setCopyState("copied");
				} catch {
					setCopyState("copyFailed");
				}
			};
			const note = tab === "record" ? t("recordScope") : tab === "input" && row.kind === "model" ? t("modelInputScope") : row.status === "failed" ? t("failedRetained") : "";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: TraceView_module_css_default.detail,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TraceView_module_css_default.detailHeader,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TraceView_module_css_default.detailCrumb,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: row.kind }), t(row.kind)] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TraceView_module_css_default.iconButton,
									"aria-label": t("closeDetail"),
									onClick: onClose,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "close" })
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: rowName(row, t) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TraceView_module_css_default.detailMeta,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Status, {
										status: row.status,
										t
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: formatDuration(row.durationMs, t) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TraceView_module_css_default.sequence,
										children: row.seq !== null ? `#${row.seq}` : ""
									})
								]
							}),
							parent && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: TraceView_module_css_default.parentLink,
								onClick: () => onParent(parent),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "branch" }),
									t("parent"),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: rowName(parent, t) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "right" })
								]
							}),
							row.usage && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
								className: TraceView_module_css_default.detailUsage,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
										label: t("inputTokens"),
										value: formatTokens(row.usage.inputTokens, t)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
										label: t("outputTokens"),
										value: formatTokens(row.usage.outputTokens, t)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Metric, {
										label: t("cache"),
										value: formatTokens(row.usage.cacheReadTokens, t)
									})
								]
							})
						]
					}),
					row.error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
						className: TraceView_module_css_default.error,
						children: row.error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TraceView_module_css_default.payloadToolbar,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							role: "group",
							"aria-label": t("detailTabs"),
							className: TraceView_module_css_default.detailTabs,
							children: [
								"input",
								"output",
								"record"
							].map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": tab === value,
								onClick: () => {
									setTab(value);
									setExpanded(false);
									setCopyState("copy");
								},
								children: t(value)
							}, value))
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: TraceView_module_css_default.copyButton,
							"aria-label": t(copyState),
							title: t(copyState),
							disabled: !text,
							onClick: () => {
								copy();
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: copyState === "copied" ? "check" : "copy" })
						})]
					}),
					copyState !== "copy" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: TraceView_module_css_default.copyFeedback,
						role: "status",
						children: t(copyState)
					}),
					note && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: TraceView_module_css_default.detailNote,
						children: note
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TraceView_module_css_default.payloadBody,
						children: [
							long && !expanded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: TraceView_module_css_default.truncated,
								children: t("truncated")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								"data-testid": "trace-detail-content",
								children: blocks && (!long || expanded) ? blocks.map((block, index) => block.kind === "text" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
									className: TraceView_module_css_default.proseContent,
									children: block.text
								}, index) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: TraceView_module_css_default.payloadBlock,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: TraceView_module_css_default.payloadBlockHeader,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "tool" }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: block.name }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("toolCall") })
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											className: TraceView_module_css_default.content,
											children: formatPayload(block.argsRaw)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
											className: TraceView_module_css_default.payloadId,
											children: block.callId
										})
									]
								}, index)) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
									className: TraceView_module_css_default.content,
									children: shown || t("none")
								})
							}),
							long && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: TraceView_module_css_default.textButton,
								onClick: () => setExpanded((value) => !value),
								children: expanded ? t("showLess") : t("showMore")
							}),
							row.durationMs === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: TraceView_module_css_default.detailNote,
								children: t("timingMissing")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-trace-css:src/client/TraceDataPage.module.css.mjs
		const tagId = "@vibeinging/dsh-trace-viewer/src/client/TraceDataPage.module.css";
		if (typeof document !== "undefined") {
			let style = [...document.querySelectorAll("style[data-plugin-css]")].find((tag) => tag.dataset.pluginCss === tagId);
			if (!style) {
				style = document.createElement("style");
				style.dataset.pluginCss = tagId;
				document.head.appendChild(style);
			}
			style.dataset.plugin = "@vibeinging/dsh-trace-viewer";
			style.textContent = ".cM5jJq_root{--data-surface:var(--dsw-alias-bg-layer-1);--data-panel:var(--dsw-alias-bg-layer-2);--data-line:var(--dsw-alias-border-l2);--data-muted:var(--dsw-alias-label-tertiary);--data-accent:var(--dsw-alias-link);width:100%;min-width:0;height:100%;min-height:0;color:var(--dsw-alias-label-primary);background:var(--data-surface);-webkit-font-smoothing:antialiased;font-size:13px;line-height:1.6;overflow:hidden}.cM5jJq_root *{box-sizing:border-box}.cM5jJq_root button,.cM5jJq_root input,.cM5jJq_root select{font:inherit}.cM5jJq_root button{cursor:pointer}.cM5jJq_root button:disabled{cursor:default;opacity:.45}.cM5jJq_root button:focus-visible,.cM5jJq_root input:focus-visible,.cM5jJq_root select:focus-visible{outline:2px solid var(--data-accent);outline-offset:3px}.cM5jJq_root button svg{flex-shrink:0;width:14px;height:14px}.cM5jJq_scroll{overscroll-behavior:contain;height:100%;padding:30px max(24px,50% - 460px) 0;overflow:auto}.cM5jJq_root[data-embedded]{height:auto;min-height:100%;overflow:visible}.cM5jJq_root[data-embedded] .cM5jJq_scroll{height:auto;padding:0;overflow:visible}.cM5jJq_root[data-embedded] .cM5jJq_actions{position:static}.cM5jJq_header{justify-content:space-between;align-items:center;gap:20px;padding-bottom:24px;display:flex}.cM5jJq_eyebrow{color:var(--data-muted);align-items:center;gap:7px;font-size:11px;display:flex}.cM5jJq_eyebrow svg{width:16px;height:16px;color:var(--data-accent)}.cM5jJq_header h1{letter-spacing:-.6px;margin:6px 0 5px;font-size:24px;font-weight:600;line-height:1.4}.cM5jJq_header p{color:var(--data-muted);margin:0;font-size:12px}.cM5jJq_secondary,.cM5jJq_primary,.cM5jJq_danger{border:1px solid var(--data-line);min-height:32px;color:var(--dsw-alias-label-primary);background:var(--data-surface);white-space:nowrap;border-radius:6px;justify-content:center;align-items:center;gap:7px;padding:5px 12px;display:inline-flex}.cM5jJq_secondary:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.cM5jJq_primary{background:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-primary);color:var(--data-surface);font-weight:500}.cM5jJq_primary:hover:not(:disabled){opacity:.85}.cM5jJq_danger{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary)40%,var(--data-line));color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary)6%,var(--data-surface))}.cM5jJq_danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary)12%,var(--data-surface))}.cM5jJq_summary{border-top:1px solid var(--data-line);border-bottom:1px solid var(--data-line);grid-template-columns:1.2fr 1.2fr 1fr 1fr;gap:20px;margin:0 0 28px;padding:18px 0;display:grid}.cM5jJq_summary>div{min-width:0}.cM5jJq_summary dt{color:var(--data-muted);margin-bottom:6px;font-size:11px}.cM5jJq_summary dd{font-variant-numeric:tabular-nums;letter-spacing:-.4px;margin:0;font-size:21px;line-height:1.4}.cM5jJq_summary dd small{color:var(--data-muted);letter-spacing:0;margin-top:3px;font-size:10px;display:block}.cM5jJq_summary .cM5jJq_status{letter-spacing:0;align-items:center;gap:7px;font-size:16px;display:flex}.cM5jJq_status>span{background:var(--data-muted);border-radius:50%;width:6px;height:6px}.cM5jJq_status[data-enabled=true]>span{background:var(--dsw-alias-state-success-primary)}.cM5jJq_notice,.cM5jJq_message{background:var(--data-panel);border-left:2px solid var(--data-accent);overflow-wrap:anywhere;border-radius:0 6px 6px 0;margin:0 0 20px;padding:11px 14px;font-size:12px}.cM5jJq_message p{margin:0}.cM5jJq_message .cM5jJq_errorDetail{color:var(--data-muted);margin-top:5px;font-size:11px}.cM5jJq_message.cM5jJq_error{border-left-color:var(--dsw-alias-state-error-primary)}.cM5jJq_textButton{color:var(--data-accent);background:0 0;border:0;padding:5px 0 0}.cM5jJq_section{border:0;border-bottom:1px solid var(--data-line);min-width:0;margin:0 0 24px;padding:0 0 24px}.cM5jJq_section legend{width:100%;padding:0;font-size:14px;font-weight:600;line-height:1.5}.cM5jJq_sectionHelp{color:var(--data-muted);margin:5px 0 18px;font-size:12px}.cM5jJq_mainSwitch{justify-content:space-between;align-items:center;gap:20px;max-width:650px;min-height:42px;display:flex}.cM5jJq_mainSwitch>span{font-weight:500}.cM5jJq_mainSwitch input{appearance:none;border:1px solid var(--data-line);background:var(--dsw-alias-bg-layer-3);cursor:pointer;border-radius:11px;flex-shrink:0;width:34px;height:20px;margin:0;transition:background .15s;position:relative}.cM5jJq_mainSwitch input:after{content:\"\";background:var(--dsw-alias-label-tertiary);border-radius:50%;width:14px;height:14px;transition:transform .15s;display:block;position:absolute;top:2px;left:2px}.cM5jJq_mainSwitch input:checked{background:var(--data-accent);border-color:var(--data-accent)}.cM5jJq_mainSwitch input:checked:after{background:var(--data-surface);transform:translate(14px)}.cM5jJq_mainSwitch input:disabled{cursor:default;opacity:.5}.cM5jJq_subsection{margin-top:20px}.cM5jJq_subsection h2,.cM5jJq_storage h2{margin:0;font-size:12px;font-weight:500}.cM5jJq_help{color:var(--data-muted);overflow-wrap:anywhere;margin:5px 0 12px;font-size:11px;line-height:1.7}.cM5jJq_pointGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 28px;max-width:680px;margin-top:16px;display:grid}.cM5jJq_checkRow{cursor:pointer;align-items:flex-start;gap:9px;min-height:24px;display:flex}.cM5jJq_checkRow input{accent-color:var(--data-accent);cursor:pointer;flex-shrink:0;width:14px;height:14px;margin:3px 0 0}.cM5jJq_checkRow strong{font-size:12px;font-weight:500;display:block}.cM5jJq_checkRow small{color:var(--data-muted);margin-top:2px;font-size:11px;display:block}.cM5jJq_contentOptions{flex-wrap:wrap;gap:12px 32px;margin-bottom:10px;display:flex}.cM5jJq_selectGrid{grid-template-columns:repeat(2,minmax(0,250px));gap:24px;display:grid}.cM5jJq_selectGrid label{flex-direction:column;align-items:flex-start;gap:7px;font-size:12px;display:flex}.cM5jJq_selectGrid select{border:1px solid var(--data-line);background:var(--data-surface);width:100%;min-width:0;min-height:34px;color:var(--dsw-alias-label-primary);border-radius:6px;padding:5px 10px}.cM5jJq_selectGrid select option{background:var(--data-surface);color:var(--dsw-alias-label-primary)}.cM5jJq_validation{color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere;margin:10px 0 0;font-size:11px}.cM5jJq_storage{margin-bottom:24px}.cM5jJq_path{color:var(--dsw-alias-label-secondary);background:var(--data-panel);white-space:pre-wrap;overflow-wrap:anywhere;border-radius:6px;margin-top:9px;padding:10px 12px;font:11px/1.7 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;display:block}.cM5jJq_storageDetails{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 24px;margin:18px 0;display:grid}.cM5jJq_storageDetails>div{align-items:baseline;gap:12px;min-width:0;display:flex}.cM5jJq_storageDetails dt{color:var(--data-muted);flex:0 0 76px;font-size:11px}.cM5jJq_storageDetails dd{min-width:0;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;overflow-wrap:anywhere;margin:0;font-size:11px}.cM5jJq_confirm{border:1px solid var(--data-line);background:var(--data-panel);border-radius:7px;min-width:0;margin:18px 0 0;padding:12px 16px 16px}.cM5jJq_confirm legend{padding:0 5px;font-size:12px;font-weight:600}.cM5jJq_confirm p{margin:3px 0 10px;font-size:12px}.cM5jJq_confirm p.cM5jJq_help{font-size:11px}.cM5jJq_confirmActions{align-items:center;gap:8px;padding-top:5px;display:flex}.cM5jJq_actions{border-top:1px solid var(--data-line);background:var(--data-surface);z-index:1;justify-content:flex-end;align-items:center;gap:8px;padding:14px 0;display:flex;position:sticky;bottom:0}.cM5jJq_actions>span{color:var(--data-muted);flex:1;font-size:11px}.cM5jJq_loadState{min-height:280px;color:var(--data-muted);text-align:center;overflow-wrap:anywhere;flex-direction:column;justify-content:center;align-items:center;gap:10px;display:flex}.cM5jJq_loadState h2{color:var(--dsw-alias-label-primary);margin:0;font-size:14px;font-weight:500}.cM5jJq_loadState p{max-width:100%;margin:0}@media (width<=650px){[role=dialog]:has(.cM5jJq_root[data-embedded])>nav{width:56px;padding-inline:6px}[role=dialog]:has(.cM5jJq_root[data-embedded])>nav button{justify-content:center;min-height:44px;padding-inline:8px}[role=dialog]:has(.cM5jJq_root[data-embedded])>nav button span{clip-path:inset(50%);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}[role=dialog]:has(.cM5jJq_root[data-embedded])>nav>div:first-child{text-align:center;padding-inline:0}.cM5jJq_scroll{padding:22px 18px 0}.cM5jJq_header{align-items:flex-start;gap:12px}.cM5jJq_header h1{font-size:21px}.cM5jJq_header p{max-width:230px}.cM5jJq_summary{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 22px}.cM5jJq_summary dd{font-size:19px}.cM5jJq_storageDetails{grid-template-columns:minmax(0,1fr)}.cM5jJq_selectGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.cM5jJq_pointGrid{gap:16px}.cM5jJq_contentOptions{flex-direction:column}}@media (width<=380px){.cM5jJq_scroll{padding-inline:14px}.cM5jJq_header .cM5jJq_secondary{padding-inline:8px}.cM5jJq_header .cM5jJq_secondary svg{display:none}.cM5jJq_pointGrid,.cM5jJq_selectGrid{grid-template-columns:minmax(0,1fr)}.cM5jJq_actions{flex-wrap:wrap}.cM5jJq_actions>span{flex-basis:100%}}@media (pointer:coarse){.cM5jJq_root button,.cM5jJq_selectGrid select,.cM5jJq_checkRow{min-height:44px}}@media (prefers-reduced-motion:reduce){.cM5jJq_mainSwitch input,.cM5jJq_mainSwitch input:after{transition:none}}";
		}
		var TraceDataPage_module_css_default = {
			"secondary": "cM5jJq_secondary",
			"scroll": "cM5jJq_scroll",
			"checkRow": "cM5jJq_checkRow",
			"confirmActions": "cM5jJq_confirmActions",
			"help": "cM5jJq_help",
			"confirm": "cM5jJq_confirm",
			"storage": "cM5jJq_storage",
			"notice": "cM5jJq_notice",
			"danger": "cM5jJq_danger",
			"path": "cM5jJq_path",
			"primary": "cM5jJq_primary",
			"loadState": "cM5jJq_loadState",
			"storageDetails": "cM5jJq_storageDetails",
			"validation": "cM5jJq_validation",
			"summary": "cM5jJq_summary",
			"actions": "cM5jJq_actions",
			"status": "cM5jJq_status",
			"pointGrid": "cM5jJq_pointGrid",
			"mainSwitch": "cM5jJq_mainSwitch",
			"selectGrid": "cM5jJq_selectGrid",
			"errorDetail": "cM5jJq_errorDetail",
			"contentOptions": "cM5jJq_contentOptions",
			"sectionHelp": "cM5jJq_sectionHelp",
			"section": "cM5jJq_section",
			"subsection": "cM5jJq_subsection",
			"eyebrow": "cM5jJq_eyebrow",
			"root": "cM5jJq_root",
			"message": "cM5jJq_message",
			"header": "cM5jJq_header",
			"error": "cM5jJq_error",
			"textButton": "cM5jJq_textButton"
		};
		//#endregion
		//#region src/client/TraceDataPage.tsx
		const clone = (value) => ({
			...value,
			points: { ...value.points }
		});
		const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
		const errorText = (error) => error instanceof Error ? error.message : String(error);
		const hiddenSidebar = () => false;
		const noSubscription = () => () => {};
		const bytes = (value) => {
			if (value < 1024) return `${value} B`;
			const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), 3);
			return `${new Intl.NumberFormat(void 0, { maximumFractionDigits: 1 }).format(value / 1024 ** exponent)} ${[
				"B",
				"KB",
				"MB",
				"GB"
			][exponent]}`;
		};
		/** This page writes only through the host-backed management API. */
		function TraceDataPage({ api, t, navigation, embedded = false }) {
			const sidebarVisible = (0, react.useSyncExternalStore)(navigation?.subscribe ?? noSubscription, navigation?.getSnapshot ?? hiddenSidebar);
			const [navigationError, setNavigationError] = (0, react.useState)(false);
			const id = (0, react.useId)();
			const [state, setState] = (0, react.useState)(null);
			const [draft, setDraft] = (0, react.useState)(null);
			const [baseRevision, setBaseRevision] = (0, react.useState)(void 0);
			const [busy, setBusy] = (0, react.useState)("read");
			const [message, setMessage] = (0, react.useState)(null);
			const [preview, setPreview] = (0, react.useState)(null);
			const [conflict, setConflict] = (0, react.useState)(false);
			const [reloadRequired, setReloadRequired] = (0, react.useState)(false);
			const gate = (0, react.useRef)(false);
			const alive = (0, react.useRef)(false);
			const confirmRef = (0, react.useRef)(null);
			const previewRef = (0, react.useRef)(null);
			const restorePreviewFocus = (0, react.useRef)(false);
			const dirty = !!state && !!draft && !equal(draft, state.settings);
			const invalidPoints = !!draft?.captureEnabled && !Object.values(draft.points).some(Boolean);
			const canWrite = !!state?.settingsWritable;
			const date = (value, fallback = "never") => value === null ? t(fallback) : new Date(value).toLocaleString();
			(0, react.useEffect)(() => {
				alive.current = true;
				let current = true;
				gate.current = true;
				setBusy("read");
				api.readState().then((next) => {
					if (!current) return;
					setState(next);
					setDraft(clone(next.settings));
					setBaseRevision(next.settingsRevision);
					setMessage(null);
					setConflict(false);
					setReloadRequired(false);
				}).catch((error) => {
					if (current) setMessage({
						key: "loadFailed",
						error: errorText(error)
					});
				}).finally(() => {
					if (current) {
						gate.current = false;
						setBusy(null);
					}
				});
				return () => {
					current = false;
					alive.current = false;
					gate.current = false;
				};
			}, [api]);
			(0, react.useEffect)(() => {
				if (busy) return;
				if (preview && preview.traces > 0) confirmRef.current?.focus();
				else if (!preview && restorePreviewFocus.current) {
					previewRef.current?.focus();
					restorePreviewFocus.current = false;
				}
			}, [preview, busy]);
			async function refresh() {
				if (gate.current) return;
				gate.current = true;
				setBusy("read");
				setPreview(null);
				try {
					const next = await api.readState();
					if (!alive.current) return;
					setState(next);
					if (dirty && draft) if (next.settingsRevision !== baseRevision) {
						setConflict(true);
						setMessage({ key: "revisionChanged" });
					} else setMessage({ key: "dirtyRefresh" });
					else {
						setDraft(clone(next.settings));
						setBaseRevision(next.settingsRevision);
						setConflict(false);
						setReloadRequired(false);
						setMessage(null);
					}
				} catch (error) {
					if (alive.current) setMessage({
						key: state ? "refreshFailed" : "loadFailed",
						error: errorText(error)
					});
				} finally {
					if (alive.current) {
						gate.current = false;
						setBusy(null);
					}
				}
			}
			function discard() {
				if (!state || busy) return;
				setDraft(clone(state.settings));
				setBaseRevision(state.settingsRevision);
				setConflict(false);
				setPreview(null);
				setMessage(null);
			}
			function change(next) {
				setDraft(next);
				setPreview(null);
				if (!conflict) setMessage(null);
			}
			async function save() {
				if (gate.current || !draft || !state || !canWrite || baseRevision === void 0 || !dirty || conflict || reloadRequired || invalidPoints) return;
				gate.current = true;
				setBusy("save");
				setPreview(null);
				const nextSettings = clone(draft);
				let saved = false;
				try {
					await api.saveSettings(nextSettings, baseRevision);
					saved = true;
					if (!alive.current) return;
					setState({
						...state,
						settings: nextSettings
					});
					setDraft(nextSettings);
					const next = await api.readState();
					if (!alive.current) return;
					setState(next);
					setDraft(clone(next.settings));
					setBaseRevision(next.settingsRevision);
					setConflict(false);
					setReloadRequired(false);
					setMessage({ key: "saved" });
				} catch (error) {
					if (alive.current) {
						setReloadRequired(saved);
						setMessage({
							key: saved ? "savedRefreshFailed" : "saveFailed",
							error: errorText(error)
						});
					}
				} finally {
					if (alive.current) {
						gate.current = false;
						setBusy(null);
					}
				}
			}
			async function previewCleanup() {
				if (gate.current || !canWrite || dirty || conflict || reloadRequired) return;
				gate.current = true;
				setBusy("preview");
				setPreview(null);
				setMessage(null);
				try {
					const next = await api.previewCleanup();
					if (alive.current) setPreview(next);
				} catch (error) {
					if (alive.current) setMessage({
						key: "previewFailed",
						error: errorText(error)
					});
				} finally {
					if (alive.current) {
						gate.current = false;
						setBusy(null);
					}
				}
			}
			function cancelCleanup() {
				restorePreviewFocus.current = true;
				setPreview(null);
			}
			async function cleanup() {
				if (gate.current || !preview || !canWrite || dirty || conflict || reloadRequired) return;
				gate.current = true;
				setBusy("cleanup");
				try {
					const result = await api.cleanup(preview.token);
					if (!alive.current) return;
					restorePreviewFocus.current = true;
					setPreview(null);
					setMessage({
						key: "cleanupSuccess",
						params: {
							count: result.removedTraces,
							bytes: bytes(result.removedBytes)
						},
						...result.skippedTraces ? { suffix: t("cleanupSkipped", { count: result.skippedTraces }) } : {}
					});
					try {
						const next = await api.readState();
						if (alive.current) {
							setState(next);
							setDraft(clone(next.settings));
							setBaseRevision(next.settingsRevision);
						}
					} catch {
						if (alive.current) setMessage({
							key: "cleanupSuccess",
							params: {
								count: result.removedTraces,
								bytes: bytes(result.removedBytes)
							},
							suffix: t("cleanupRefreshFailed")
						});
					}
				} catch (error) {
					if (alive.current) {
						setPreview(null);
						setMessage({
							key: "cleanupFailed",
							error: errorText(error)
						});
					}
				} finally {
					if (alive.current) {
						gate.current = false;
						setBusy(null);
					}
				}
			}
			const controlsDisabled = !!busy || !canWrite || reloadRequired;
			const points = [
				"models",
				"tools",
				"errors",
				"compaction"
			];
			const pointHelp = {
				models: "modelsHelp",
				tools: "toolsHelp",
				errors: "errorsHelp",
				compaction: "compactionHelp"
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
				className: TraceDataPage_module_css_default.root,
				"data-embedded": embedded || void 0,
				"aria-labelledby": `${id}-title`,
				"data-testid": "trace-data-page",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: TraceDataPage_module_css_default.scroll,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: TraceDataPage_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TraceDataPage_module_css_default.eyebrow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: "waterfall" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "DSH Trace" })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
								id: `${id}-title`,
								children: t("title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("subtitle") })
						] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: TraceDataPage_module_css_default.secondary,
							disabled: !!busy,
							onClick: () => void refresh(),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceIcon, { name: busy === "read" ? "loading" : "history" }), t(busy === "read" ? "refreshing" : "refresh")]
						})]
					}), !state || !draft ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: TraceDataPage_module_css_default.loadState,
						children: busy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							role: "status",
							children: t("loading")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("loadFailed") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								role: "alert",
								children: message?.error ?? t("unknownError")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: TraceDataPage_module_css_default.secondary,
								onClick: () => void refresh(),
								children: t("retry")
							})
						] })
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
							className: TraceDataPage_module_css_default.summary,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("captureStatus") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
									className: TraceDataPage_module_css_default.status,
									"data-enabled": state.settings.captureEnabled,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}), t(state.settings.captureEnabled ? "enabled" : "disabled")]
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("savedTraces") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", { children: [state.stats.traces.toLocaleString(), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("activeTraces", { count: state.stats.activeTraces }) })] })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("savedEvents") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: state.stats.events.toLocaleString() })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("storage") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: bytes(state.stats.bytes) })] })
							]
						}),
						!canWrite && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: TraceDataPage_module_css_default.notice,
							children: t("readOnly")
						}),
						canWrite && baseRevision === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: TraceDataPage_module_css_default.notice,
							children: t("revisionUnavailable")
						}),
						message && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: `${TraceDataPage_module_css_default.message} ${message.error ? TraceDataPage_module_css_default.error : ""}`,
							role: message.error || conflict ? "alert" : "status",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [t(message.key, message.params), message.suffix && ` ${message.suffix}`] }),
								message.error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: TraceDataPage_module_css_default.errorDetail,
									children: t("detail", { message: message.error })
								}),
								conflict && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TraceDataPage_module_css_default.textButton,
									onClick: discard,
									disabled: !!busy,
									children: t("reloadSettings")
								})
							]
						}),
						navigation && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
							className: TraceDataPage_module_css_default.section,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("navigation") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: TraceDataPage_module_css_default.sectionHelp,
									children: t("navigationHelp")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: TraceDataPage_module_css_default.checkRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: sidebarVisible,
										onChange: (event) => {
											try {
												navigation.setVisible(event.target.checked);
												setNavigationError(false);
											} catch {
												setNavigationError(true);
											}
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("showInSidebar") }) })]
								}),
								navigationError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									role: "alert",
									className: TraceDataPage_module_css_default.validation,
									children: t("navigationSaveFailed")
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
							onSubmit: (event) => {
								event.preventDefault();
								save();
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
									className: TraceDataPage_module_css_default.section,
									disabled: controlsDisabled,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("collection") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: TraceDataPage_module_css_default.sectionHelp,
											children: t("collectionHelp")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: TraceDataPage_module_css_default.mainSwitch,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("captureEnabled") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												role: "switch",
												checked: draft.captureEnabled,
												onChange: (event) => change({
													...draft,
													captureEnabled: event.target.checked
												})
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: TraceDataPage_module_css_default.subsection,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("points") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													className: TraceDataPage_module_css_default.help,
													children: t("pointsHelp")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: TraceDataPage_module_css_default.pointGrid,
													children: points.map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: TraceDataPage_module_css_default.checkRow,
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: draft.points[key],
															onChange: (event) => change({
																...draft,
																points: {
																	...draft.points,
																	[key]: event.target.checked
																}
															})
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(key) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t(pointHelp[key]) })] })]
													}, key))
												}),
												invalidPoints && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													className: TraceDataPage_module_css_default.validation,
													role: "alert",
													children: t("invalidPoints")
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
									className: TraceDataPage_module_css_default.section,
									disabled: controlsDisabled,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("content") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: TraceDataPage_module_css_default.sectionHelp,
											children: t("contentHelp")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: TraceDataPage_module_css_default.contentOptions,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												className: TraceDataPage_module_css_default.checkRow,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: draft.captureModelText,
													onChange: (event) => change({
														...draft,
														captureModelText: event.target.checked
													})
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("captureModelText") }) })]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												className: TraceDataPage_module_css_default.checkRow,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: draft.captureToolPayloads,
													onChange: (event) => change({
														...draft,
														captureToolPayloads: event.target.checked
													})
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("captureToolPayloads") }) })]
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: TraceDataPage_module_css_default.help,
											children: t("contentNote")
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
									className: TraceDataPage_module_css_default.section,
									disabled: controlsDisabled,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("retention") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: TraceDataPage_module_css_default.sectionHelp,
											children: t("retentionHelp")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: TraceDataPage_module_css_default.selectGrid,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [t("retentionDays"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												value: draft.retentionDays ?? "unlimited",
												onChange: (event) => change({
													...draft,
													retentionDays: event.target.value === "unlimited" ? null : Number(event.target.value)
												}),
												children: [
													[
														7,
														30,
														90,
														365
													].map((days) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: days,
														children: t("days", { days })
													}, days)),
													draft.retentionDays !== null && ![
														7,
														30,
														90,
														365
													].includes(draft.retentionDays) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: draft.retentionDays,
														children: t("days", { days: draft.retentionDays })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "unlimited",
														children: t("unlimited")
													})
												]
											})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [t("cleanupInterval"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												value: draft.cleanupIntervalHours,
												onChange: (event) => change({
													...draft,
													cleanupIntervalHours: Number(event.target.value)
												}),
												children: [[
													1,
													6,
													24
												].map((hours) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: hours,
													children: t("hours", { hours })
												}, hours)), ![
													1,
													6,
													24
												].includes(draft.cleanupIntervalHours) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: draft.cleanupIntervalHours,
													children: t("hours", { hours: draft.cleanupIntervalHours })
												})]
											})] })]
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: TraceDataPage_module_css_default.storage,
									"aria-labelledby": `${id}-storage`,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
											id: `${id}-storage`,
											children: t("dataDirectory")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
											className: TraceDataPage_module_css_default.path,
											children: state.dataDir
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
											className: TraceDataPage_module_css_default.storageDetails,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("lastCaptured") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: date(state.lastCapturedAt) })] }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("lastCleanup") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: date(state.cleanup.lastRunAt) })] }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("nextCleanup") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: date(state.cleanup.nextRunAt, "notScheduled") })] }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("eligible") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("eligibleCount", {
													count: state.cleanup.eligibleTraces,
													bytes: bytes(state.cleanup.eligibleBytes)
												}) })] })
											]
										}),
										state.captureError && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
											className: TraceDataPage_module_css_default.validation,
											children: [
												t("captureError"),
												": ",
												state.captureError
											]
										}),
										state.cleanup.lastError && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
											className: TraceDataPage_module_css_default.validation,
											children: [
												t("cleanupError"),
												": ",
												state.cleanup.lastError
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: TraceDataPage_module_css_default.help,
											children: t("originalSafe")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											ref: previewRef,
											type: "button",
											className: TraceDataPage_module_css_default.secondary,
											disabled: controlsDisabled || dirty || conflict || !!preview,
											onClick: () => void previewCleanup(),
											children: t(busy === "preview" ? "previewing" : "cleanNow")
										}),
										dirty && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: TraceDataPage_module_css_default.help,
											children: t("dirtyCleanup")
										}),
										preview && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
											className: TraceDataPage_module_css_default.confirm,
											"aria-labelledby": `${id}-confirm`,
											disabled: !!busy,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", {
													id: `${id}-confirm`,
													children: t("cleanupTitle")
												}),
												preview.traces === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													role: "status",
													children: t(state.settings.retentionDays === null ? "cleanupUnlimited" : "cleanupEmpty")
												}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("cleanupSummary", {
														traces: preview.traces,
														events: preview.events,
														bytes: bytes(preview.bytes)
													}) }),
													preview.cutoffAt !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
														className: TraceDataPage_module_css_default.help,
														children: t("cleanupCutoff", { date: date(preview.cutoffAt) })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
														className: TraceDataPage_module_css_default.help,
														children: t("cleanupExpiry", { date: date(preview.expiresAt) })
													})
												] }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: TraceDataPage_module_css_default.confirmActions,
													children: [preview.traces > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														ref: confirmRef,
														type: "button",
														className: TraceDataPage_module_css_default.danger,
														disabled: !!busy || !canWrite || dirty || conflict,
														onClick: () => void cleanup(),
														children: t(busy === "cleanup" ? "cleaning" : "cleanupConfirm")
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: TraceDataPage_module_css_default.secondary,
														onClick: cancelCleanup,
														children: t("cancel")
													})]
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
									className: TraceDataPage_module_css_default.actions,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: dirty ? t("unsaved") : "" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: TraceDataPage_module_css_default.secondary,
											disabled: !dirty || !!busy || reloadRequired,
											onClick: discard,
											children: t("discard")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "submit",
											className: TraceDataPage_module_css_default.primary,
											disabled: !dirty || controlsDisabled || baseRevision === void 0 || invalidPoints || conflict,
											children: t(busy === "save" ? "saving" : "save")
										})
									]
								})
							]
						})
					] })]
				})
			});
		}
		//#endregion
		//#region src/client/managementLocales.ts
		/** Product copy for Trace-owned data collection and retention. */
		const dataZh = {
			title: "Trace 数据",
			subtitle: "管理本地采集、埋点范围和数据保留时间。",
			refresh: "刷新",
			refreshing: "正在刷新",
			navigation: "界面入口",
			navigationHelp: "侧边栏默认隐藏。此开关仅影响当前设备，修改后立即保存；所有配置都可从设置页访问。",
			showInSidebar: "在侧边栏显示 Trace 数据",
			navigationSaveFailed: "无法保存界面偏好，请重试。",
			loading: "正在读取 Trace 数据设置",
			loadFailed: "无法读取 Trace 数据设置",
			retry: "重试",
			captureStatus: "采集状态",
			enabled: "采集中",
			disabled: "已关闭",
			savedTraces: "Trace 记录",
			savedEvents: "事件",
			storage: "数据占用",
			activeTraces: "{count} 条记录段正在写入",
			collection: "采集设置",
			collectionHelp: "从启用时起，为所有会话的新事件保存一份 Trace 副本。记录段可能对应会话轮次、独立请求或压缩事件。",
			captureEnabled: "开启 Trace 数据采集",
			points: "埋点范围",
			pointsHelp: "选择需要保存的事件类型。开启采集时至少保留一项。",
			models: "模型调用",
			modelsHelp: "调用时间、模型和用量",
			tools: "工具执行",
			toolsHelp: "工具名称、执行时间和状态",
			errors: "失败事件",
			errorsHelp: "保存失败和中断的记录",
			compaction: "历史压缩",
			compactionHelp: "上下文压缩事件",
			content: "正文内容",
			contentHelp: "正文开关只影响之后新保存的副本；关闭后，已保存的正文仍保留。",
			captureModelText: "保存模型回复正文",
			captureToolPayloads: "保存工具参数和结果",
			contentNote: "正文可能包含文件内容、用户输入等信息。默认只保存调用信息。",
			retention: "保留与清理",
			retentionHelp: "自动清理到期的 Trace 副本。正在写入的记录段会跳过。",
			retentionDays: "数据保留时间",
			days: "{days} 天",
			unlimited: "一直保留",
			cleanupInterval: "自动检查间隔",
			hours: "每 {hours} 小时",
			dataDirectory: "数据目录",
			lastCaptured: "最近写入",
			lastCleanup: "最近清理",
			nextCleanup: "下次检查",
			eligible: "到期待清理",
			eligibleCount: "{count} 条记录段 · {bytes}",
			never: "暂无记录",
			notScheduled: "未安排",
			originalSafe: "此处的清理只删除 Trace 自有副本，DSH 原始会话会保留。",
			cleanNow: "预览到期清理",
			previewing: "正在检查",
			cleanupTitle: "确认清理到期数据",
			cleanupSummary: "将删除 {traces} 条记录段、{events} 个事件，共 {bytes}。",
			cleanupCutoff: "清理范围：早于 {date} 的已结束记录段。",
			cleanupUnlimited: "当前设置为一直保留，没有到期数据。",
			cleanupEmpty: "没有到期数据需要清理。",
			cleanupExpiry: "预览有效至 {date}；确认时会再次检查数据状态。",
			cleanupConfirm: "确认清理",
			cleaning: "正在清理",
			cancel: "取消",
			cleanupSuccess: "已清理 {count} 条记录段，释放 {bytes}。",
			cleanupSkipped: "另有 {count} 条记录段因状态变化而跳过。",
			cleanupFailed: "清理失败，请重新预览后重试。",
			previewFailed: "无法预览清理，请重试。",
			save: "保存设置",
			saving: "正在保存",
			discard: "放弃修改",
			unsaved: "有未保存的修改",
			saved: "设置已保存。",
			saveFailed: "设置保存失败，修改仍保留。",
			savedRefreshFailed: "设置已保存，但状态读取失败；请刷新后继续修改。",
			dirtyRefresh: "已刷新数据状态，未保存的修改已保留。",
			revisionChanged: "配置已在其他位置改变。你的修改已保留，请载入最新配置后再编辑。",
			reloadSettings: "载入最新配置",
			refreshFailed: "刷新失败，当前设置与修改已保留。",
			revisionUnavailable: "当前宿主未提供配置版本，暂不能保存；可刷新重试。",
			cleanupRefreshFailed: "清理已完成，但状态读取失败；请刷新查看最新统计。",
			readOnly: "当前宿主未开放配置写入权限，此页只能查看。",
			dirtyCleanup: "请先保存或放弃修改，再预览清理。",
			invalidPoints: "开启采集时，请至少选择一个埋点范围。",
			captureError: "最近采集错误",
			cleanupError: "最近清理错误",
			detail: "错误详情：{message}",
			unknownError: "未知错误"
		};
		const dataEn = {
			title: "Trace data",
			subtitle: "Manage local collection, event scope, and data retention.",
			refresh: "Refresh",
			refreshing: "Refreshing",
			navigation: "Navigation",
			navigationHelp: "Hidden from the sidebar by default. This device preference saves immediately. All options remain available in Settings.",
			showInSidebar: "Show Trace data in sidebar",
			navigationSaveFailed: "Could not save this preference. Try again.",
			loading: "Loading Trace data settings",
			loadFailed: "Could not load Trace data settings",
			retry: "Retry",
			captureStatus: "Collection",
			enabled: "Recording",
			disabled: "Off",
			savedTraces: "Trace records",
			savedEvents: "Events",
			storage: "Storage",
			activeTraces: "{count} segments being recorded",
			collection: "Collection settings",
			collectionHelp: "Save a Trace copy of new events across all sessions, starting when enabled. A record segment can represent a session turn, a standalone request, or compaction.",
			captureEnabled: "Enable Trace data collection",
			points: "Event scope",
			pointsHelp: "Choose which event types to save. Select at least one while collection is enabled.",
			models: "Model calls",
			modelsHelp: "Timing, model, and usage",
			tools: "Tool execution",
			toolsHelp: "Tool name, timing, and status",
			errors: "Failures",
			errorsHelp: "Failed and interrupted events",
			compaction: "History compaction",
			compactionHelp: "Context compaction events",
			content: "Content",
			contentHelp: "Content switches affect only new copies. Previously saved content is retained when switched off.",
			captureModelText: "Save model response text",
			captureToolPayloads: "Save tool arguments and results",
			contentNote: "Content may include files and user input. Only call metadata is saved by default.",
			retention: "Retention and cleanup",
			retentionHelp: "Automatically remove expired Trace copies. Active record segments are skipped.",
			retentionDays: "Keep data for",
			days: "{days} days",
			unlimited: "Keep indefinitely",
			cleanupInterval: "Automatic check interval",
			hours: "Every {hours} hours",
			dataDirectory: "Data directory",
			lastCaptured: "Last recorded",
			lastCleanup: "Last cleanup",
			nextCleanup: "Next check",
			eligible: "Expired data",
			eligibleCount: "{count} segments · {bytes}",
			never: "No record yet",
			notScheduled: "Not scheduled",
			originalSafe: "Cleanup removes only Trace-owned copies. Original DSH sessions are retained.",
			cleanNow: "Preview expired data cleanup",
			previewing: "Checking",
			cleanupTitle: "Confirm expired data cleanup",
			cleanupSummary: "Remove {traces} record segments and {events} events, totaling {bytes}.",
			cleanupCutoff: "Scope: finished record segments older than {date}.",
			cleanupUnlimited: "Retention is indefinite. No data has expired.",
			cleanupEmpty: "No expired data to remove.",
			cleanupExpiry: "Preview valid until {date}. Data status is checked again on confirmation.",
			cleanupConfirm: "Confirm cleanup",
			cleaning: "Cleaning",
			cancel: "Cancel",
			cleanupSuccess: "Removed {count} record segments and freed {bytes}.",
			cleanupSkipped: "{count} other record segments were skipped because their status changed.",
			cleanupFailed: "Cleanup failed. Preview again to retry.",
			previewFailed: "Could not preview cleanup. Try again.",
			save: "Save settings",
			saving: "Saving",
			discard: "Discard changes",
			unsaved: "Unsaved changes",
			saved: "Settings saved.",
			saveFailed: "Could not save settings. Your changes are retained.",
			savedRefreshFailed: "Settings saved, but status could not be loaded. Refresh before editing again.",
			dirtyRefresh: "Data status refreshed. Your unsaved changes are retained.",
			revisionChanged: "Configuration changed elsewhere. Your edits are retained. Load the latest configuration before editing again.",
			reloadSettings: "Load latest configuration",
			refreshFailed: "Refresh failed. Current settings and edits are retained.",
			revisionUnavailable: "The host did not provide a configuration revision. Saving is unavailable. Refresh to retry.",
			cleanupRefreshFailed: "Cleanup completed, but status could not be loaded. Refresh to see the latest totals.",
			readOnly: "This host does not grant configuration write access. This page is read-only.",
			dirtyCleanup: "Save or discard your changes before previewing cleanup.",
			invalidPoints: "Select at least one event type while collection is enabled.",
			captureError: "Last collection error",
			cleanupError: "Last cleanup error",
			detail: "Error details: {message}",
			unknownError: "Unknown error"
		};
		//#endregion
		//#region src/management.ts
		/** Shared, JSON-only contracts for the Trace-owned recording store. */
		const TRACE_DATA_CHANNEL = "/api";
		const TRACE_DATA_PREFIX = "dsh-trace-data";
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
		//#region src/client/managementApi.ts
		/** The editable values and revision must come from one accepted profile snapshot. */
		function formSettings(snapshot) {
			if (snapshot.status !== "ready" || snapshot.value === void 0) return void 0;
			try {
				return validateTraceSettings(snapshot.value.settings);
			} catch {
				return;
			}
		}
		/** Statistics use an owner-authenticated RPC; edits use DSH's own profile store. */
		function managementApi(connection, form) {
			const call = async (endpoint, payload) => {
				const result = await connection.rpc.call(TRACE_DATA_CHANNEL, `${TRACE_DATA_PREFIX}/${endpoint}`, payload);
				if (!result.ok) throw new Error(result.error.message);
				return result.value;
			};
			return {
				async readState() {
					const status = await call("status", {});
					const snapshot = form.getSnapshot();
					const settings = formSettings(snapshot);
					return {
						...status,
						settings: settings ?? status.settings,
						settingsWritable: settings !== void 0 && snapshot.writable && snapshot.revision !== void 0,
						settingsRevision: settings === void 0 ? void 0 : snapshot.revision
					};
				},
				async saveSettings(settings, expectedRevision) {
					const accepted = validateTraceSettings(settings);
					const snapshot = form.getSnapshot();
					if (formSettings(snapshot) === void 0 || !snapshot.writable || expectedRevision === void 0) throw new Error("Trace settings are not writable yet");
					if (snapshot.revision !== expectedRevision) throw new Error("Trace settings changed; refresh before saving");
					if (!await form.mutate([{
						op: "set",
						path: ["settings"],
						value: accepted
					}], expectedRevision)) throw new Error("The Host refused the Trace settings update; reload the saved configuration");
				},
				previewCleanup: () => call("cleanup/preview", {}),
				cleanup: (token) => call("cleanup/apply", { token })
			};
		}
		//#endregion
		//#region src/client/navigationPreferences.ts
		const KEY = "dsh-trace-viewer.sidebar-visible";
		function navigationPreferences() {
			const listeners = /* @__PURE__ */ new Set();
			const read = () => {
				try {
					return window.localStorage.getItem(KEY) === "true";
				} catch {
					return false;
				}
			};
			let visible = read();
			const publish = (next) => {
				if (visible === next) return;
				visible = next;
				for (const listener of listeners) listener();
			};
			const onStorage = (event) => {
				if (event.key === KEY || event.key === null) publish(read());
			};
			window.addEventListener("storage", onStorage);
			return {
				getSnapshot: () => visible,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				setVisible(next) {
					window.localStorage.setItem(KEY, String(next));
					publish(next);
				},
				dispose() {
					window.removeEventListener("storage", onStorage);
					listeners.clear();
				}
			};
		}
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"locale",
			"sessions",
			"connection",
			"layout",
			"configForms"
		];
		const PANEL_ID = "dsh-trace-data";
		/** The host keeps its composer draft mounted behind the elected empty view. */
		function FocusComposer() {
			return null;
		}
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register("dshTrace", {
				zh,
				en
			}), "dsh-trace: locale");
			ctx.effect(() => ctx.locale.register("dshTraceData", {
				zh: dataZh,
				en: dataEn
			}), "dsh-trace: data locale");
			const t = ctx.locale.bind("dshTrace");
			const dataT = ctx.locale.bind("dshTraceData");
			const api = managementApi(ctx.get("connection"), ctx.configForms.get("dsh-trace-viewer"));
			const navigation = navigationPreferences();
			ctx.effect(() => () => navigation.dispose());
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: PANEL_ID,
				order: 50,
				label: () => dataT("title"),
				locale: "dshTraceData",
				inject: () => ({
					api,
					navigation,
					embedded: true
				})
			}, TraceDataPage));
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: PANEL_ID,
				locale: "dshTraceData",
				inject: () => ({
					api,
					navigation
				})
			}, TraceDataPage));
			ctx.effect(() => {
				let remove;
				const sync = () => {
					if (navigation.getSnapshot() && !remove) remove = ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
						name: "sidebar.panellist",
						id: PANEL_ID,
						order: 40,
						locale: "dshTraceData",
						label: () => dataT("title")
					}, () => (0, react.createElement)(TraceIcon, { name: "database" })));
					else if (!navigation.getSnapshot() && remove) {
						remove();
						remove = void 0;
					}
				};
				const unsubscribe = navigation.subscribe(sync);
				sync();
				return () => {
					unsubscribe();
					remove?.();
				};
			});
			ctx.slots.inject("conversation.view", () => ctx.slots.register({
				name: "conversation.view",
				id: "dsh-trace",
				order: 12,
				locale: "dshTrace",
				label: () => t("view"),
				inject: (sessionId) => ({
					openDataManagement: () => ctx.layout.selectPanel(PANEL_ID),
					focusComposer: () => ctx.slots.inject("conversation.composer", () => ctx.slots.register({
						name: "conversation.composer",
						priority: 100,
						select: (owner) => owner.sessionId === sessionId && owner.pendingInteraction === void 0 ? { sessionId } : null
					}, FocusComposer)),
					loadOlder: async () => {
						const binding = ctx.sessions.binding(sessionId);
						if (binding === void 0) throw new Error("Trace session is unavailable");
						await binding.session.loadOlder();
					}
				})
			}, TraceView));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map