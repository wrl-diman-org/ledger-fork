import { files as filesBridge } from "~/renderer/bridge";
import type { SaveOutcome } from "~/bridge/contract";

export const readLocalManifest = (): Promise<string | null> => filesBridge.readLocalManifest();

export const writeLocalManifest = (defaultName: string, contents: string): Promise<boolean> =>
  filesBridge.writeLocalManifest(defaultName, contents);

export const savePng = (
  options: Electron.SaveDialogOptions,
  base64: string,
): Promise<SaveOutcome> => filesBridge.savePng(options, base64);
