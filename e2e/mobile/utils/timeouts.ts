/**
 * The shared duration vocabulary of the mobile E2E suite.
 *
 * Two scales, deliberately kept apart:
 *  - `TIMEOUT`  — upper bounds: "give up after this long".
 *  - `INTERVAL` — cadences: "wait this long between attempts".
 *
 * Passing an `INTERVAL` where a `TIMEOUT` belongs (or the reverse) is almost always a
 * bug, so they never share a name or a lookup.
 *
 * Pick the *smallest* bucket that is not flaky. An oversized timeout costs nothing on a
 * passing test, but it makes a failing one take much longer to report — and on a shared
 * CI runner that cost is paid by every other spec in the shard.
 *
 * The scales are a vocabulary, so every bucket stays even while a single file uses it.
 * Beyond them, a named budget lives here only when more than one file relies on it. A
 * budget that bounds one file's own flow (a per-test override, a harness step, a partner's
 * server-side wait) stays in that file as a named constant next to the code it bounds, so
 * its rationale travels with it. Either way, a call site never passes a bare number.
 *
 * `jest.config.js` requires this file as well as the test code, so it must stay free of
 * imports and of non-erasable TypeScript syntax (no `enum`, no `namespace`) — Node strips
 * the types at require time.
 */

/*
 * Both scales are typed as `number` rather than `as const`. A literal type would make
 * `async waitFor(timeout = TIMEOUT.l)` infer the parameter as `60000`, so every caller
 * passing a different bucket would fail to typecheck.
 */

/** Upper bounds for "wait until X happens". */
interface TimeoutScale {
  /** 500ms — "is this already on screen right now?". Never for something still loading. */
  readonly xxs: number;
  /** 1s — probe an element that is either already mounted or genuinely absent. */
  readonly xs: number;
  /** 2s — a short probe: an optional affordance that may or may not render (e.g. an
   * "expand" toggle), where waiting the full `s` budget would be paid on every miss. */
  readonly xsm: number;
  /** 5s — a purely local UI transition: a drawer opens, a screen pushes, a list re-renders. */
  readonly s: number;
  /** 10s — one round-trip to something outside the app, e.g. the E2E bridge. */
  readonly sm: number;
  /** 20s — a swap quote or amount that has to settle after a provider round-trip. */
  readonly smm: number;
  /** 30s — anything crossing the network or the E2E bridge: sync, quotes, fee estimation. */
  readonly m: number;
  /** 1min — the element-helper default: a screen that mounts behind a sync or a webview. */
  readonly l: number;
  /** 2min — cold start, portfolio first paint, waiting on a broadcast to land. */
  readonly xl: number;
  /** 5min — a whole device-signing flow (approve, sign, broadcast) end to end. */
  readonly xxl: number;
}

export const TIMEOUT: TimeoutScale = {
  xxs: 500,
  xs: 1_000,
  xsm: 2_000,
  s: 5_000,
  sm: 10_000,
  smm: 20_000,
  m: 30_000,
  l: 60_000,
  xl: 120_000,
  xxl: 300_000,
};

/** Cadences for "try again in a moment". Never use these as a timeout. */
interface IntervalScale {
  /** 100ms — busy-wait on something local: a file appearing, a process flushing before exit. */
  readonly instant: number;
  /** 200ms — tight poll inside a loop that is already bounded by a TIMEOUT. */
  readonly tick: number;
  /** 500ms — default retry cadence. */
  readonly short: number;
  /** 1s — let an animation or a scroll settle before asserting on it. */
  readonly medium: number;
  /** 2s — poll something expensive: a webview query, an error-modal probe. */
  readonly long: number;
  /** 5s — poll a remote service whose state changes slowly, e.g. a Speculos health check. */
  readonly slow: number;
}

export const INTERVAL: IntervalScale = {
  instant: 100,
  tick: 200,
  short: 500,
  medium: 1_000,
  long: 2_000,
  slow: 5_000,
};

/** Jest's per-test budget. Specs that need longer derive from it (e.g. delegate's Mina pair flow). */
export const TEST_TIMEOUT = 360_000;
