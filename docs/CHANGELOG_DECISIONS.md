# Changelog and decisions

This file records actual governance decisions and identifies candidates that still need a decision. It is not a substitute for ADRs.

## 2026-09-12 — Multiplayer invitation reliability

Status: local implementation **AUTOMATED VERIFIED** and **MANUALLY VERIFIED WITH EVIDENCE** against the public room service; deployment and physical-device verification remain **MANUAL VERIFICATION REQUIRED**.

- Made an explicit room in a WhatsApp/shared route authoritative over a different stored room, preventing returning browsers from polling and republishing the old code before the requested invitation is inspected.
- Cleared expired, missing, and removed stored sessions, kept invitation errors inside Friends mode with recovery actions, and suppressed the unrelated local-profile prompt while a no-account Friends route is opening.
- Made Create a Room and Join a Room explicit, added normalized pasted-code entry plus keyboard submission, and exposed Copy Room Code alongside the canonical public invite link and native share action.
- Normal frontend previews now use the same public persistent room service as the public site and always generate a public-site invitation. A local room service is available only through an exact loopback developer override.
- Preserved the Worker schema and room engine, nine-player limit, privacy, gameplay, scoring, readiness, host transfer, rematch, routes, and browser storage format. No generated Worker snapshot changed.

## 2026-09-11 — Explore country selection and facts

Status: accepted in [ADR 0003](architecture/0003-explore-country-selection-and-facts.md); local implementation **AUTOMATED VERIFIED**; production/device verification remains **MANUAL VERIFICATION REQUIRED**.

- Made accepted typed, spoken, and clicked Explore answers converge on one resolved country ID, visible renderer highlight, camera focus, and compact fact card.
- Kept recognition in the retained Free Map checker and extended its result additively with country metadata; game rules, scoring, persistence, routes, and multiplayer remain unchanged.
- Added a local World Bank `SP.POP.TOTL` snapshot for 194 playable countries with per-record observation years and a truthful unavailable state for Vatican City. Selection adds no runtime third-party request.
- Kept the card inside the root Explore globe stage, with responsive and dismissible presentation; scored-game and multiplayer routes do not consume it.

## 2026-09-10 — Mobile reliability and geometry delivery

Status: local implementation **AUTOMATED VERIFIED** and partially **MANUALLY VERIFIED WITH EVIDENCE**; production-origin and physical-device verification remain **MANUAL VERIFICATION REQUIRED**.

- Replaced the root Explore iframe DOM proxy and fixed delay with a structured retained-host answer result. Added the root speech-recognition control as an input method for that same path; recognition and scoring remain owned by the retained checker.
- Consolidated browser country geometry into one deterministically simplified bundle, retaining all 258 source features and every polygon part, and removed the duplicate raw browser asset. Border adjacency remains generated only from an explicit unsimplified upstream source.
- Preserved the local-globe adapter while reducing actual work: projection lookup remains precomputed, visible pixels are indexed, interaction draws are coalesced, and constrained devices use a smaller raster and lower frame cadence.
- Added bounded small-country markers/targets in all regional views, protected active solo runs with an in-app history-exit decision, and allowed exact loopback HTTP(S) origins at arbitrary local ports without relaxing production origin matching.
- Corrected the retained map-key foreground/background pairing found during mobile visual QA. Gameplay, scoring, persistence, profiles, canonical routes, multiplayer protocol, and Google/local fallback ownership remain unchanged.

## 2026-09-10 — Local globe fallback and canonical Home launcher

Status: accepted in [ADR 0002](architecture/0002-local-globe-fallback-and-home-launcher.md); local implementation **AUTOMATED VERIFIED**; production/device verification remains **MANUAL VERIFICATION REQUIRED**.

- Kept Google 3D as the preferred renderer and made a dependency-free rotating local globe, built from the existing country geometry, the immediate loading and terminal failure surface.
- Kept the retained application as the singleton recognition/game engine. It remains hidden as the Explore checker bridge and full-screen for scored games and multiplayer; it is not the visible Home fallback.
- Exposed World Conquest, Find the Country, Capital Clash, Flag Recall, and Flag Match on Home; grouped Countries and Capitals inside Explore; removed placeholder Home navigation, fabricated metrics, staged cards, and inert footer controls.
- Preserved canonical query routes, engine, rules, scoring, persistence keys, profiles, multiplayer protocol, country classification, browser key delivery, and generated Worker snapshots.
- Hardened root and retained GameShell foreground/control/focus colors independently of OS color preference and added forced-colors and reduced-motion contracts.

## 2026-09-09 — Final release candidate profile mode and snapshot refresh

Status: accepted release decision; local implementation **AUTOMATED VERIFIED** and **MANUALLY VERIFIED WITH EVIDENCE** on local origins; production-origin verification remains **MANUAL VERIFICATION REQUIRED**.

- Set `REMOTE_PROFILE_SYNC_ENABLED` default-off for this release. Local profiles, selection, statistics, mastery, settings, recent results, and reload persistence remain supported without changing storage keys or schemas.
- Disabled mode does not construct the unsupported remote profile service or stats queue, does not send `/profiles`, `/recover`, or `/sessions` traffic, hides remote-only profile controls/copy, and uses device-local wording.
- Regenerated `multiplayer-server/shared/game-core.cjs` and `multiplayer-server/shared/countries.json` through the documented Worker build. Both outputs match their current canonical root/data sources; no Worker security or routing source changed.
- Final local checks passed: governance; root tests 64/64; multiplayer tests 16/16 before and after build; Worker build; and `git diff --check`.
- Remaining production-only checks are production-origin profile persistence and storage failure, Google browser-key referrer/API restrictions, deployed Worker room smoke, physical-device layout/touch/screen-reader/reduced-motion checks, and deployment verification.

## 2026-09-09 — Google 3D country-click contract

Status: accepted architecture decision; local implementation awaiting review and production verification.

- Accepted [ADR 0001](architecture/0001-google-3d-country-click-contract.md): adapters emit renderer-neutral country events, while the root owns fail-closed mode semantics, single-flight behavior, asynchronous mode revalidation, retained Free Map preparation, and accessible typed equivalence.
- Kept Capitals, staged modes, and unknown modes non-answering for country clicks.
- Explicitly excluded playable 2D failure fallback, Universal GameShell, game deep links, retained Home navigation, and gameplay-rule changes.
- Implemented the separately approved mobile answer-zone/navigation clearance using shared safe-area and layout variables; this responsive correction is not an expansion of the event ADR.

## 2026-09-09 — Repository Governance Framework v1

Status: accepted governance decision.

- Established the repository precedence chain, canonical architecture/delivery and QA evidence vocabularies, protected behaviors, impact assessment, risk routing, QA matrix, performance/accessibility/responsive standards, ADR process, execution-plan lifecycle, PR template, and dependency-free governance check.
- Recorded defects verified against clean HEAD source without repairing or redesigning production behavior: dropped Google 3D callback forwarding, no root-exposed playable 2D failure fallback, mobile answer-dock/navigation overlap, staged root surfaces, profile API mismatch, duplicated classification, partial shell integration, and stale multiplayer snapshots.
- Classified the Universal Cinematic GameShell as **PROPOSED TARGET ARCHITECTURE** with **APPROVED FUTURE WORK** direction only; no shell implementation or game migration was approved by this change.
- Kept generated multiplayer snapshot parity as a non-blocking follow-up until the baseline is deliberately reconciled.
- Added CI for current dependency-free governance/root tests and existing multiplayer tests/build. CI does not assert source/generated snapshot parity.
- Distinguished browser-delivered Maps API keys from private/server secrets and required minimum API permissions, authorized website/referrer restrictions, and monitoring/quota controls where appropriate.
- Did not add branch-protection settings because they require repository-owner configuration.

## Recommended repository-owner settings

After the workflow is observed green on a pull request, consider requiring pull requests, the governance/root-test job, and the multiplayer-test/build job; require review for architecture/persistence/map/security changes; dismiss stale approvals; and block force pushes/deletion on `main`. Configure these in GitHub rather than committing disruptive assumptions.

## Candidate future ADRs — not decisions

Create an ADR only when the corresponding decision is actively being made:

- Universal GameShell ownership, public API, tokens, and migration order
- Root/retained shell integration and routing strategy
- Canonical country classification/data ownership
- Profile persistence/API ownership and migration
- Multiplayer generated-snapshot generation/parity policy
- Accessibility testing/tooling baseline
- Performance measurement and numeric budgets
