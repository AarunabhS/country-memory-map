# Performance budget

## Current baseline

**VERIFIED CURRENT ARCHITECTURE**

- The root frontend has no bundler or automated performance measurement.
- It serves large first-party geometry/data assets, a cinematic CSS/JS shell, an optional Google Maps 3D network path, a retained iframe application, and self-hosted flag SVGs.
- The multiplayer Worker has an existing esbuild production build.

No production Core Web Vitals, transfer-size, memory, or long-task baseline was captured by governance v1. Do not label estimates as measurements.

## Governance budget

Until a measured numeric baseline is approved:

- no new frontend framework, bundler, runtime library, font service, analytics tag, or always-on network request without architecture-authority review;
- no duplicate country/geometry payload or eager loading of an entire game-only asset class without measured justification;
- preserve progressive loading: optional live 3D may not block first usable UI or remove recovery paths;
- clean up observers, animation frames, timers, listeners, map overlays, polling, and large references when their owner is destroyed;
- keep animations transform/opacity-oriented where practical and provide reduced-motion behavior;
- any change expected to add more than 50 KiB compressed first-party JS/CSS or more than 5% to a measured route transfer requires an explicit budget exception;
- multiplayer polling, retry, and payload growth require load/latency review before expansion.

## Required evidence

For performance-sensitive changes record device/network assumptions, cold/warm state, route/mode, tool used, before/after values, and variance. The future baseline should cover first usable UI, total/first-party transfer, request count, LCP, INP, CLS, long tasks, peak memory where available, Google 3D success/failure, and the playable fallback.

Budget exceptions require architecture authority, rationale, a user benefit, mitigation, rollback, and a follow-up measurement date.
