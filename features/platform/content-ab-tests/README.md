# `@features/platform-content-ab-tests`

> [!CAUTION]
> **Status: UNSTABLE** — New package; the public API may still change.

English copy experiments. The package reads `feature_copy_*` values from a Remote Config `getAll()` payload the app already fetched for feature flags, stores them, and installs them as runtime overrides on the English i18n baseline.

It does not decide whether a feature flag is on. That stays in `@features/platform-feature-flags`. Until Firebase Remote Config types move to their own package, `RemoteConfigValue` is imported from `@features/platform-feature-flags/firebase`.

## Exports

| Export | Behaviour |
| --- | --- |
| `setContentAbTestCopy(all)` | Stores experiments from one `getAll()` payload. An identical poll does not republish. |
| `getContentAbTestCopy()` / `subscribeToContentAbTestCopy` | The English copy currently applied: the `copy` of enabled experiments. |
| `getContentAbTests()` | Every valid experiment, enabled or not, keyed by in-app id (`feature_copy_upgrade_banner` becomes `upgradeBanner`), with its full payload. Apps send it as the `ab_tests` analytics attribute. |
| `installContentAbTestCopyOverrides` | Applies the stored copy to an i18n instance. English only; keys missing from the English baseline are skipped. |
