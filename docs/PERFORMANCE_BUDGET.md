# Performance budget

## Current baseline — 2026-09-23

**VERIFIED CURRENT ARCHITECTURE**: one HTML document, classic scripts plus the `src/app.js` module graph, local canvas Home globe and SVG gameplay. There is no active Google Maps import or retained iframe. Geometry, flags and country data are local. The Worker has an esbuild build; the root has no bundler.

Quiz data/controller now load only when starting Quiz. Explore facts/population load on selection. Optional asset failure does not replace the map; navigation tokens prevent a late Quiz load from starting after departure. The shared 50ms timer remains installed but skips engine/HUD work while idle or playing Quiz. Quiz owns its active timer and clears it on finish/deactivation. No runtime dependency was added.

Entry-point JS/CSS file-size comparison against `88c1f8f` (sum of separately gzipped files, Python gzip, not actual HTTP transfer):

| Measurement | Before | After |
| --- | ---: | ---: |
| Eager JS/CSS references | 28 | 26 |
| Raw bytes | 2,230,931 | 2,189,865 |
| Gzip bytes | 760,990 | 749,474 |

These figures cover direct `index.html` JS/CSS references, not transitive module imports or lazy flags. `countries-data.js` still dominates the payload. The earlier geometry reduction is documented in its historical execution record; no geometry was changed here.

Five samples using `scripts/performance-audit.html`, local Python HTTP server, macOS in-app browser, 1100×620 iframe, retained browser cache, no network throttling:

| Sample | DOMContentLoaded ms | Load ms | Resources | Reported transfer bytes | Decoded resource bytes | Quiz requested |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 349 | 351 | 29 | 6,556 | 2,230,579 | No |
| 2 | 152 | 154 | 29 | 6,556 | 2,230,579 | No |
| 3 | 144 | 145 | 29 | 6,556 | 2,230,579 | No |
| 4 | 147 | 148 | 29 | 6,556 | 2,230,579 | No |
| 5 | 131 | 133 | 29 | 6,556 | 2,230,579 | No |

Median local load: 148ms; range 133–351ms. The tiny reported transfer reflects cached resources and is **not** a cold-download size. Samples preceded final minor copy/focus edits. There is no comparable historical runtime sample, so these times do not establish a speedup. LCP, INP, CLS, long tasks, memory, low-end mobile and production network performance remain **NEEDS QA**. This is a reproducible local baseline, not field Web Vitals.

## Governance budget

Until a measured numeric baseline is approved:

- no new frontend framework, bundler, runtime library, font service, analytics tag, or always-on network request without architecture-authority review;
- no duplicate country/geometry payload or eager loading of an entire game-only asset class without measured justification;
- preserve progressive loading: optional mode assets may not block Home or remove recovery paths;
- clean up observers, animation frames, timers, listeners, map overlays, polling, and large references when their owner is destroyed;
- keep animations transform/opacity-oriented where practical and provide reduced-motion behavior;
- any change expected to add more than 50 KiB compressed first-party JS/CSS or more than 5% to a measured route transfer requires an explicit budget exception;
- multiplayer polling, retry, and payload growth require load/latency review before expansion.

## Required evidence

For performance-sensitive changes record device/network assumptions, cold/warm state, route/mode, tool used, before/after values, and variance. The future baseline should cover first usable UI, total/first-party transfer, request count, LCP, INP, CLS, long tasks, peak memory where available, optional asset success/failure, local-globe availability, and SVG play.

Budget exceptions require architecture authority, rationale, a user benefit, mitigation, rollback, and a follow-up measurement date.
