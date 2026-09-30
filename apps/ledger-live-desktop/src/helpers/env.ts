import { setEnvUnsafe } from "@shared/env";

// Renderer only, despite the name: main seeds its own env from process.env at startup.
export const setEnvOnAllThreads = (name: string, value: unknown): boolean =>
  setEnvUnsafe(name, value);
