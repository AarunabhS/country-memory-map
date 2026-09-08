# Master project index

This is the navigation and authority map for Country Memory Map development.

## Precedence

1. Verified current repository/runtime behavior
2. Root [`AGENTS.md`](../AGENTS.md)
3. Root [`ARCHITECTURE.md`](../ARCHITECTURE.md)
4. This index
5. Relevant subsystem, design, gameplay, or QA specifications
6. Approved task/implementation plan
7. Agent assumptions

When a document disagrees with observed behavior, record the discrepancy and use observed behavior as the current baseline. Do not silently rewrite history.

## Canonical status vocabulary

Use these labels verbatim across governance documents. Architecture and delivery labels describe what exists or is authorized:

- **VERIFIED CURRENT ARCHITECTURE**: present in the current repository or directly observed at runtime.
- **VERIFIED CURRENT DEFECT**: reproduced, demonstrated by current source, or supplied with accepted evidence as a baseline defect.
- **PROPOSED TARGET ARCHITECTURE**: a design direction that is not current behavior.
- **APPROVED FUTURE WORK**: explicitly authorized direction for a future scoped implementation; it is not shipped.
- **PRODUCTION-VERIFIED IMPLEMENTATION**: deployed and checked on the production origin. Tests or local QA alone do not earn this label.
- **NEEDS QA**: present or claimed, but not verified at the required runtime or surface.

QA evidence labels describe the result of a specific check:

- **AUTOMATED VERIFIED**: an identified automated check ran and passed against the stated revision.
- **MANUALLY VERIFIED WITH EVIDENCE**: a named manual check was completed and its browser, device/viewport, route, result, and evidence location were recorded.
- **MANUAL VERIFICATION REQUIRED**: the manual check has not yet been completed with evidence.
- **KNOWN DEFECT**: accepted evidence shows the check currently fails; link or describe the defect.
- **PLANNED AUTOMATION**: automation does not exist yet and is explicitly planned; this is not a passing result.
- **NOT APPLICABLE**: the check does not apply, with a brief reason when that is not obvious.

## Authoritative documents

| Concern | Authority | Scope |
|---|---|---|
| Project constitution and workflow | [`AGENTS.md`](../AGENTS.md) | Protected behavior, routing, escalation, verification |
| Current architecture | [`ARCHITECTURE.md`](../ARCHITECTURE.md) | Verified boundaries, defects, deployment |
| Change workflow | [`DEVELOPMENT_PROTOCOL.md`](DEVELOPMENT_PROTOCOL.md) | Impact assessment, stops, rollback, completion |
| Current/planned visual rules | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Status-separated visual governance |
| Proposed shared game shell | [`GAME_SHELL_SPEC.md`](GAME_SHELL_SPEC.md) | Conceptual responsibilities only |
| Responsive behavior | [`RESPONSIVE_STANDARD.md`](RESPONSIVE_STANDARD.md) | Desktop/mobile/portrait/landscape review |
| Accessibility | [`ACCESSIBILITY_STANDARD.md`](ACCESSIBILITY_STANDARD.md) | Keyboard, semantics, focus, touch, contrast, motion |
| Performance | [`PERFORMANCE_BUDGET.md`](PERFORMANCE_BUDGET.md) | Growth controls and measurement requirements |
| Model/executor routing | [`AI_MODEL_ROUTING.md`](AI_MODEL_ROUTING.md) | Capability and risk tiers |
| QA | [`QA_MATRIX.md`](QA_MATRIX.md) | Automated/manual coverage and gaps |
| Decisions and candidates | [`CHANGELOG_DECISIONS.md`](CHANGELOG_DECISIONS.md) | Actual governance decisions; future ADR candidates |
| ADR process | [`architecture/README.md`](architecture/README.md) | ADR lifecycle and template |
| Execution plans | [`exec-plans/README.md`](exec-plans/README.md) | Active/completed plan lifecycle |

`README.md` remains the user/operator entry point. `AUDIT.md` is an audit/reuse record and evidence source, not a higher-priority architecture specification.

## Current follow-up register

The verified defects in `ARCHITECTURE.md` remain unresolved: Google 3D callback forwarding, root exposure of the retained playable 2D fallback, mobile answer-dock/navigation overlap, profile API mismatch, stale multiplayer snapshots, staged root modes/navigation, duplicated country classification, and cinematic/legacy integration. Governance v1 records them; it does not repair them.
