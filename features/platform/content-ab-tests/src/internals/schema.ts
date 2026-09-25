import { z } from "zod";

const ContentAbTestTrackingConfigurationSchema = z.object({
  ptxEventProperty: z.string().min(1),
  ptxEventValue: z.string().min(1),
});

/** Schema that validates a `feature_copy_*` Remote Config experiment, enabled or not. */
export const ContentAbTestPayloadSchema = z.object({
  enabled: z.boolean(),
  copy: z.record(z.string(), z.string()),
  trackingConfiguration: ContentAbTestTrackingConfigurationSchema.optional(),
});
