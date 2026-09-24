import axios from "axios";
import makeFetchCookie from "fetch-cookie";
import type { FetchFn } from "@ledgerhq/auth";

// A stalled auth call must fail fast, so the shared base query can still send the quote.
const AUTH_REQUEST_TIMEOUT_MS = 10_000;
let authRequestTimeoutMs = AUTH_REQUEST_TIMEOUT_MS;

/** @internal Test seam — shortens the auth timeout; `null` restores it. */
export function _setTestAuthRequestTimeoutMs(ms: number | null): void {
  authRequestTimeoutMs = ms ?? AUTH_REQUEST_TIMEOUT_MS;
}

// LKRP sends its OIDC calls through live-network's axios, which only times out GETs.
axios.interceptors.request.use(config => {
  if (!config.timeout && config.url?.includes("/openid/v1/")) {
    config.timeout = authRequestTimeoutMs;
  }
  return config;
});

/**
 * Fetch for the Keycloak calls of one CLI run. Keycloak keeps its auth session in a cookie across
 * the challenge redirect, which Bun's fetch does not persist. `globalThis.fetch` is resolved per
 * call so a fetch patched after startup (test interceptors) is still used.
 */
export function createAuthFetch(): FetchFn {
  const cookieFetch = makeFetchCookie((input: RequestInfo | URL, init?: RequestInit) =>
    globalThis.fetch(input, init),
  );
  // Set outside the cookie jar, so the redirect hops share one deadline.
  return (input, init) =>
    cookieFetch(input, { ...init, signal: AbortSignal.timeout(authRequestTimeoutMs) });
}
