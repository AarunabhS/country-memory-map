# Changelog and decisions

This file records actual governance decisions and identifies candidates that still need a decision. It is not a substitute for ADRs.

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
- Playable 3D-to-2D fallback contract
- Canonical country classification/data ownership
- Profile persistence/API ownership and migration
- Multiplayer generated-snapshot generation/parity policy
- Accessibility testing/tooling baseline
- Performance measurement and numeric budgets
