---
"ledger-live-desktop": patch
---

Device animations are code-split per device model and loaded lazily instead of being read back through a runtime `require()`.
