import { contextBridge } from "electron";

/**
 * Works with contextIsolation off or on. Exposed values must already be clone-safe: class
 * instances silently lose their prototype once isolation is on.
 */
export const expose = (key: string, api: object): void => {
  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld(key, api);
  } else {
    (globalThis as unknown as Record<string, unknown>)[key] = api;
  }
};
