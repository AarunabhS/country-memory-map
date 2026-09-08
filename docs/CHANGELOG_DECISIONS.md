# Changelog and decisions

This file records actual governance decisions and identifies candidates that still need a decision. It is not a substitute for ADRs.

## 2026-09-09 — Repository Governance Framework v1

Status: accepted governance decision.

- Established the repository precedence chain, canonical architecture/delivery and QA evidence vocabularies, protected behaviors, impact assessment, risk routing, QA matrix, performance/accessibility/responsive standards, ADR process, execution-plan lifecycle, PR template, and dependency-free governance check.
- Recorded defects verified against clean HEAD or accepted browser evidence without repairing or redesigning production behavior: dropped Google 3D callback forwarding, no root-exposed playable 2D failure fallback, mobile answer-dock/navigation overlap, staged root surfaces, profile API mismatch, duplicated classification, partial shell integration, and stale multiplayer snapshots.
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
- Google Maps 3D event and renderer-adapter contract
- Canonical country classification/data ownership
- Profile persistence/API ownership and migration
- Multiplayer generated-snapshot generation/parity policy
- Accessibility testing/tooling baseline
- Performance measurement and numeric budgets
