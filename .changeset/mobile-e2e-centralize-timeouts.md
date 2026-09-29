---
"ledger-live-mobile-e2e-tests": patch
---

Give the mobile E2E suite one shared duration vocabulary in `e2e/mobile/utils/timeouts.ts`, without changing any value.

Two deliberately separate scales replace the scattered magic numbers:

- `TIMEOUT` (upper bounds): `xxs` 500ms, `xs` 1s, `xsm` 2s, `s` 5s, `sm` 10s, `smm` 20s, `m` 30s, `l` 1min, `xl` 2min, `xxl` 5min
- `INTERVAL` (poll cadences): `instant` 100ms, `tick` 200ms, `short` 500ms, `medium` 1s, `long` 2s, `slow` 5s

The scales are a vocabulary, so every bucket stays even while a single file uses it. Beyond them, a named budget lives in `timeouts.ts` only when more than one file relies on it: today that is `TEST_TIMEOUT`, which `jest.config.js` requires and specs that need longer derive from. A budget that bounds one file's own flow (a per-test override, a harness step, a partner's server-side wait) stays in that file as a named constant next to the code it bounds. Either way, no call site passes a bare number.

Every resolved value equals the one that was in place before: element-helper waits still default to 1min, visibility probes to 1s.

The duplicate `DEFAULT_TIMEOUT` / `VISIBILITY_PROBE_TIMEOUT` / `QUICK_VISIBILITY_PROBE_TIMEOUT` exports are removed from `helpers/elementHelpers.ts`, and the `getLogs` outer bound in `jest.environment.ts` is now derived from the bridge's exported `BRIDGE_RESPONSE_TIMEOUT` so the two cannot drift apart.
