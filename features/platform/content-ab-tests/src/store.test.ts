import {
  getContentAbTestCopy,
  getContentAbTests,
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
    expect(getContentAbTests()).toEqual({});
  });
});

describe("getContentAbTests", () => {
  it("is empty when no experiment is served", () => {
    expect(getContentAbTests()).toEqual({});
  });

  it("keeps the full payload, including an optional trackingConfiguration", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Discover Ledger Flex" },
        trackingConfiguration: { ptxEventProperty: "ab_upgrade", ptxEventValue: "variant_b" },
      }),
    });

    expect(getContentAbTests()).toEqual({
      upgradeBanner: {
        enabled: true,
        copy: { "upgrade.banner.title": "Discover Ledger Flex" },
        trackingConfiguration: { ptxEventProperty: "ab_upgrade", ptxEventValue: "variant_b" },
      },
    });
    expect(getContentAbTestCopy()).toEqual({
      "upgrade.banner.title": "Discover Ledger Flex",
    });
  });

  it("includes a valid disabled experiment without overriding copy", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: false,
        copy: { "upgrade.banner.title": "Hidden" },
      }),
    });

    expect(getContentAbTests()).toEqual({
      upgradeBanner: {
        enabled: false,
        copy: { "upgrade.banner.title": "Hidden" },
      },
    });
    expect(getContentAbTestCopy()).toEqual({});
  });

  it("excludes malformed payloads and a broken trackingConfiguration", () => {
    setContentAbTestCopy({
      feature_copy_broken: value("not json"),
      feature_copy_invalid: experiment({ enabled: "yes", "invalid.key": "Nope" }),
      feature_copy_bad_tracking: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Should stay out" },
        trackingConfiguration: {},
      }),
    });

    expect(getContentAbTests()).toEqual({});
    expect(getContentAbTestCopy()).toEqual({});
  });
});
