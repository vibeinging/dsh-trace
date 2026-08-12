//#region src/invariant.ts
const PACKAGE_NAME = "@deepseek-ai/dsh-trace";
/** Cordis companion plugin name. */
const name = "dsh-trace-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the backend projects seam records into an external
* yiTrace SDK queue and appends nothing to an authoritative DSH event stream.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
