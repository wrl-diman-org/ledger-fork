---
"ledger-live-desktop": minor
---

Route the desktop renderer's access to Electron and the main process through an explicit, allow-listed preload bridge (`window.lld`), declared once in `src/bridge/contract.ts` and imported by both sides. Every `ipcRenderer` call, the application database, device transport, the updater and deep-link channels, `electron-store`, clipboard, `webFrame` and `shell.openExternal` now go through named bridge methods; the renderer no longer touches the filesystem or `os`, and winston is replaced there by a minimal logger with the same surface.

Save dialogs now run in the main process, which keeps the chosen path: the renderer can no longer hand an arbitrary path back to be written, and cancelling an export is distinguishable from a failed one.

The renderer still runs with `nodeIntegration` on; the bridge works in both modes, so this changes no behaviour on its own.
