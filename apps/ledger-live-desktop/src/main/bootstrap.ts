import os from "os";
import { app, ipcMain } from "electron";
import Store from "electron-store";
import { CHANNELS, type Bootstrap } from "~/bridge/contract";
import { getDistributionChannel } from "~/helpers/distributionChannel";

let store: Store | undefined;

/**
 * Lazy: index.ts imports this before setUserDataPath(), so an eager store would open in the
 * default userData and silently start empty.
 */
function getStore(): Store {
  if (!store) {
    store = new Store({ name: "lld", encryptionKey: "this_only_obfuscates" });
  }
  return store;
}

export function buildBootstrap(): Bootstrap {
  return {
    version: 1,
    env: { ...process.env },
    os: {
      type: os.type(),
      release: os.release(),
      platform: os.platform(),
      hostname: os.hostname(),
    },
    paths: {
      userData: app.getPath("userData"),
      home: app.getPath("home"),
    },
    distributionChannel: getDistributionChannel(),
    store: getStore().store as Record<string, unknown>,
  };
}

ipcMain.on(CHANNELS.bootstrap, event => {
  event.returnValue = buildBootstrap();
});

ipcMain.on(CHANNELS.storeSet, (_event, key: string, value: unknown) => {
  getStore().set(key, value);
});

ipcMain.on(CHANNELS.storeClear, () => {
  getStore().clear();
});
