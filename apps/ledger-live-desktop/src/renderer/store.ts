import isEmpty from "lodash/isEmpty";
import { bootstrap, store as storeBridge } from "~/renderer/bridge";

// Synchronous on purpose: the Recover funnel reads it on first render.
const cache = new Map<string, unknown>(Object.entries(bootstrap.store));

const storeKey = (key: string, storeId: string) => `${storeId}-${key}`;

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const value = cache.get(storeKey(key, storeId));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return isEmpty(value) ? undefined : (value as T);
}

export function setStoreValue<T>(key: string, value: T, storeId: string) {
  cache.set(storeKey(key, storeId), value);
  storeBridge.set(storeKey(key, storeId), value);
}

export function resetStore() {
  cache.clear();
  storeBridge.clear();
}
