import { ipcRenderer } from "electron";
import { CHANNELS, type Bootstrap, type LedgerBridge } from "~/bridge/contract";
import { expose } from "./expose";
import { db } from "./db";
import { transport } from "./transport";
import { deeplink, updater } from "./push";
import { app, files, power, store } from "./shell";
import { shell, system } from "./system";

export function installBridge(): void {
  const bootstrap = ipcRenderer.sendSync(CHANNELS.bootstrap) as Bootstrap;

  const bridge: LedgerBridge = {
    version: 1,
    bootstrap: Object.freeze(bootstrap),
    db,
    transport,
    updater,
    deeplink,
    app,
    files,
    power,
    store,
    shell,
    system,
  };

  // Not `ledger`: that is the renderer's E2E debug handle.
  expose("lld", bridge);
}
