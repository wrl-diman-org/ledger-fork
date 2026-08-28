import { contextBridge } from "electron";

/** Exposed values must be clone-safe: class instances silently lose their prototype. */
export const expose = (key: string, api: object): void => contextBridge.exposeInMainWorld(key, api);
