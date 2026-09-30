import type { z } from "zod";
import type { RemoteConfigValue } from "@features/platform-feature-flags/firebase";
import { ContentAbTestPayloadSchema } from "./schema";

const FIREBASE_COPY_PREFIX = "feature_copy_";

export type ContentAbTestCopy = Readonly<Record<string, string>>;
export type ContentAbTestPayload = z.infer<typeof ContentAbTestPayloadSchema>;
export type ContentAbTests = Readonly<Record<string, ContentAbTestPayload>>;
export type ContentAbTestTracking = Readonly<Record<string, Readonly<Record<string, string>>>>;

/**
 * Reads valid `feature_copy_*` experiments from a Remote Config `getAll()` payload, keyed by
 * in-app id (`feature_copy_upgrade_banner` becomes `upgradeBanner`).
 *
 * These keys match no feature-flag id, so the flag parser ignores them. Disabled experiments are
 * kept. A malformed payload, including a broken `trackingConfiguration`, is skipped, and keys
 * placed beside `enabled`, `copy` and `trackingConfiguration` are dropped.
 */
export function parseContentAbTests(all: Record<string, RemoteConfigValue>): ContentAbTests {
  const parsed: Record<string, ContentAbTestPayload> = {};
  for (const [key, value] of Object.entries(all)) {
    if (value.getSource() !== "remote") continue;
    const id = firebaseKeyToContentAbTestId(key);
    if (!id) continue;

    let payload: unknown;
    try {
      payload = JSON.parse(value.asString());
    } catch {
      continue;
    }
    const experiment = ContentAbTestPayloadSchema.safeParse(payload);
    if (experiment.success) parsed[id] = experiment.data;
  }
  return Object.freeze(parsed);
}

/** Merges the `copy` of enabled experiments. Disabled experiments never override copy. */
export function enabledContentAbTestCopy(experiments: ContentAbTests): ContentAbTestCopy {
  const merged: Record<string, string> = {};
  for (const experiment of Object.values(experiments)) {
    if (experiment.enabled) Object.assign(merged, experiment.copy);
  }
  return Object.freeze(merged);
}

/**
 * The `trackingConfiguration` of each enabled experiment, keyed by in-app id. Disabled
 * experiments and experiments without tracking pairs are left out.
 */
export function enabledContentAbTestTracking(experiments: ContentAbTests): ContentAbTestTracking {
  const tracking: Record<string, Readonly<Record<string, string>>> = {};
  for (const [id, experiment] of Object.entries(experiments)) {
    const pairs = experiment.trackingConfiguration;
    if (experiment.enabled && pairs && Object.keys(pairs).length > 0) {
      tracking[id] = Object.freeze({ ...pairs });
    }
  }
  return Object.freeze(tracking);
}

function firebaseKeyToContentAbTestId(key: string): string | null {
  const lower = key.toLowerCase();
  if (!lower.startsWith(FIREBASE_COPY_PREFIX)) return null;
  const id = lower
    .slice(FIREBASE_COPY_PREFIX.length)
    .replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
  return id.length > 0 ? id : null;
}
