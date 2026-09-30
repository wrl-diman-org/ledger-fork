import type { RemoteConfigValue } from "@features/platform-feature-flags/firebase";
import {
  enabledContentAbTestCopy,
  enabledContentAbTestTracking,
  parseContentAbTests,
  type ContentAbTestCopy,
  type ContentAbTestTracking,
} from "./internals/parse";

export type { ContentAbTestCopy, ContentAbTestTracking } from "./internals/parse";

type Subscriber = (copy: ContentAbTestCopy) => void;

const EMPTY_COPY: ContentAbTestCopy = Object.freeze({});
const ENGLISH_LANGUAGE = "en";

let tracking: ContentAbTestTracking | undefined;
let copy: ContentAbTestCopy = EMPTY_COPY;
const subscribers = new Set<Subscriber>();

type TranslationEngine = {
  language: string;
  resolvedLanguage?: string;
  addResource(
    language: string,
    namespace: string,
    key: string,
    value: string,
    options: { silent: boolean },
  ): void;
  on(event: "languageChanged", callback: (language: string) => void): void;
};

export function getContentAbTestCopy(): ContentAbTestCopy {
  return copy;
}

/**
 * The `trackingConfiguration` of each enabled experiment, sent as `ab_tests`. `undefined` when no
 * enabled experiment has tracking pairs, so events carry no empty attribute.
 */
export function getContentAbTestTracking(): ContentAbTestTracking | undefined {
  return tracking;
}

export function subscribeToContentAbTestCopy(callback: Subscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Reads the Engagement copy experiments out of the feature-flag Remote Config payload. Called
 * with the `getAll()` result the flag fetch already produced, so copy costs no extra network
 * round-trip and cannot delay boot on its own.
 *
 * Only enabled experiments apply copy and reach `getContentAbTestTracking`. A malformed payload,
 * including a non-string tracking value, is dropped entirely.
 */
export function setContentAbTestCopy(all: Record<string, RemoteConfigValue>): ContentAbTestCopy {
  const experiments = parseContentAbTests(all);
  const nextTracking = enabledContentAbTestTracking(experiments);
  tracking = Object.keys(nextTracking).length > 0 ? nextTracking : undefined;
  const next = enabledContentAbTestCopy(experiments);
  if (isSameCopy(copy, next)) return copy;
  copy = next;
  subscribers.forEach(callback => callback(copy));
  return copy;
}

export function installContentAbTestCopyOverrides(
  i18nInstance: TranslationEngine,
  englishBaseline: object,
  namespace: string,
): void {
  const baselineSnapshot = cloneTranslationTree(englishBaseline);
  let appliedKeys = new Set<string>();

  const applyCopyOverrides = (language: string) => {
    for (const key of appliedKeys) {
      const baselineValue = getTranslationValue(baselineSnapshot, key);
      if (baselineValue !== undefined) {
        i18nInstance.addResource(ENGLISH_LANGUAGE, namespace, key, baselineValue, { silent: true });
      }
    }
    appliedKeys = new Set();

    if (!isEnglish(language)) return;
    for (const [key, value] of Object.entries(getContentAbTestCopy())) {
      if (getTranslationValue(baselineSnapshot, key) === undefined) continue;
      i18nInstance.addResource(ENGLISH_LANGUAGE, namespace, key, value, {
        silent: true,
      });
      appliedKeys.add(key);
    }
  };

  const onLanguageChanged = (language: string) => {
    applyCopyOverrides(language);
  };

  i18nInstance.on("languageChanged", onLanguageChanged);
  applyCopyOverrides(i18nInstance.resolvedLanguage ?? i18nInstance.language);

  subscribeToContentAbTestCopy(() => {
    applyCopyOverrides(i18nInstance.resolvedLanguage ?? i18nInstance.language);
  });
}

function isSameCopy(current: ContentAbTestCopy, next: ContentAbTestCopy): boolean {
  const currentKeys = Object.keys(current);
  if (currentKeys.length !== Object.keys(next).length) return false;
  return currentKeys.every(key => current[key] === next[key]);
}

function isEnglish(language: string): boolean {
  return language === ENGLISH_LANGUAGE || language.startsWith(`${ENGLISH_LANGUAGE}-`);
}

function cloneTranslationTree(value: object): object {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isTranslationTree(entry) ? cloneTranslationTree(entry) : entry,
    ]),
  );
}

function getTranslationValue(baseline: object, key: string): string | undefined {
  let value: unknown = baseline;
  for (const segment of key.split(".")) {
    if (!isTranslationTree(value) || !Object.hasOwn(value, segment)) return undefined;
    value = value[segment];
  }
  return typeof value === "string" ? value : undefined;
}

function isTranslationTree(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
