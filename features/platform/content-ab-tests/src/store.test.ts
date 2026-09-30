import {
  getContentAbTestCopy,
  getContentAbTestTracking,
  setContentAbTestCopy,
  subscribeToContentAbTestCopy,
} from "./store";

const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
  asString: () => raw,
  getSource: () => source,
});

const experiment = (payload: object, source: "remote" | "default" | "static" = "remote") =>
  value(JSON.stringify(payload), source);

beforeEach(() => {
  setContentAbTestCopy({});
});

describe("setContentAbTestCopy", () => {
  it("publishes the merged copy to subscribers", () => {
    const seen: unknown[] = [];
    const unsubscribe = subscribeToContentAbTestCopy(copy => {
      seen.push(copy);
    });

    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    });
    unsubscribe();

    expect(getContentAbTestCopy()).toEqual({
      "upgrade.banner.title": "Remote",
    });
    expect(seen).toEqual([{ "upgrade.banner.title": "Remote" }]);
  });

  it("does not notify subscribers when a poll returns the same copy", () => {
    const payload = {
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    };
    setContentAbTestCopy(payload);

    const callback = jest.fn();
    subscribeToContentAbTestCopy(callback);
    const republished = setContentAbTestCopy(payload);

    expect(callback).not.toHaveBeenCalled();
    expect(republished).toBe(getContentAbTestCopy());
  });

  it("clears the copy when the experiment stops being served", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    });

    expect(setContentAbTestCopy({})).toEqual({});
    expect(getContentAbTestTracking()).toBeUndefined();
  });
});

describe("getContentAbTestTracking", () => {
  it("is undefined when no experiment is served", () => {
    expect(getContentAbTestTracking()).toBeUndefined();
  });

  it("returns the tracking pairs of enabled experiments, keyed by id", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Discover Ledger Flex" },
        trackingConfiguration: { ab_upgrade: "variant_b", cohort: "q3" },
      }),
      feature_copy_swap_cta: experiment({
        enabled: true,
        copy: { "swap.cta": "Swap now" },
        trackingConfiguration: { cohort: "control" },
      }),
    });

    expect(getContentAbTestTracking()).toEqual({
      upgradeBanner: { ab_upgrade: "variant_b", cohort: "q3" },
      swapCta: { cohort: "control" },
    });
  });

  it("is undefined when only disabled or untracked experiments are served", () => {
    setContentAbTestCopy({
      feature_copy_hidden: experiment({
        enabled: false,
        copy: { "upgrade.banner.title": "Hidden" },
        trackingConfiguration: { ab_hidden: "variant_b" },
      }),
      feature_copy_untracked: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Untracked" },
      }),
    });

    expect(getContentAbTestTracking()).toBeUndefined();
    expect(getContentAbTestCopy()).toEqual({ "upgrade.banner.title": "Untracked" });
  });

  it("drops an experiment whose tracking values are not strings, copy included", () => {
    setContentAbTestCopy({
      feature_copy_bad_tracking: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Should stay out" },
        trackingConfiguration: { variant: 2 },
      }),
    });

    expect(getContentAbTestTracking()).toBeUndefined();
    expect(getContentAbTestCopy()).toEqual({});
  });
});
