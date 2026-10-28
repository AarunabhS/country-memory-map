# Country Memory Map project constitution

This file governs AI and human changes. Keep it concise; use the linked documents for detail.

## Source-of-truth order

When instructions conflict, use this order:

1. Verified current repository and runtime behavior
2. This `AGENTS.md`
3. [`ARCHITECTURE.md`](ARCHITECTURE.md)
4. [`docs/MASTER_PROJECT_INDEX.md`](docs/MASTER_PROJECT_INDEX.md)
5. The relevant subsystem, design, gameplay, or QA specification
6. An approved task or implementation plan
7. Agent assumptions

An assumption never overrides observed behavior. Use the status vocabulary in the project index; planned work is not production behavior.

## Protected behavior

- Preserve existing gameplay, rules, country recognition, scoring, progression, persistence, profiles, multiplayer behavior, routes, and working user flows unless the task explicitly changes them.
- Prefer additive, reversible, coherent, minimal-risk changes. Do not perform unrelated refactors or replace a functioning system merely because another architecture appears cleaner.
- Before modifying a shared subsystem, inspect its implementation, consumers, data flow, tests, and deployment boundary.
- Treat map/globe integration as a protected shared subsystem. Never hard-code new keys or secrets. Browser-delivered Maps API keys are distinct from private/server secrets and must use the minimum required API permissions, authorized website/referrer restrictions, and monitoring/quota controls where appropriate. Preserve the current single-document local-globe and SVG gameplay contract described in `ARCHITECTURE.md`; historical retained iframe/bridge descriptions in ADR 0002 are superseded where they conflict with verified current behavior.
- Once an approved shared cinematic visual architecture exists, game pages must consume it. Games may not independently invent competing typography, spacing, buttons, HUDs, modals, shells, or animation frameworks without architecture approval.
- Consider desktop and mobile for every user-facing change, including portrait and landscape where relevant.
- Preserve or improve keyboard access, screen-reader semantics, visible focus, touch targets, contrast, and reduced-motion behavior.
- Avoid unnecessary bundle, network, and memory growth. Follow [`docs/PERFORMANCE_BUDGET.md`](docs/PERFORMANCE_BUDGET.md).

## Required workflow

1. Read [`docs/DEVELOPMENT_PROTOCOL.md`](docs/DEVELOPMENT_PROTOCOL.md) and write the short impact assessment it requires for a material change.
2. Classify the change using [`docs/AI_MODEL_ROUTING.md`](docs/AI_MODEL_ROUTING.md). A low-discretion executor must escalate architectural choices instead of making them.
3. Inspect current behavior and dependencies before editing. Stop if the work reveals unexpected architectural impact or requires changing protected behavior outside the request.
4. Make the smallest coherent change and preserve a rollback path.
5. Run the repository's actual applicable checks and use [`docs/QA_MATRIX.md`](docs/QA_MATRIX.md) for manual coverage.
6. Review the diff for scope, generated files, secrets, application behavior, and documentation accuracy.

Never claim a test, screenshot, runtime check, deployment, accessibility result, or production verification unless it was actually performed. Do not treat generated-snapshot parity as a required gate until its documented baseline is deliberately reconciled.

## Codex model selection

Follow the approved [GPT-6 development-workflow plan](docs/exec-plans/active/2026-09-12-gpt-6-model-migration.md) for this repository. Use GPT-6 Sol for ordinary implementation, GPT-6 Astra for Level A architecture and protected-boundary work, and GPT-6 Luna for fully specified Level C work only after its pilot passes. Classify the task before choosing the model; raise the tier when inspection reveals broader risk. A user-requested model takes precedence for that task.

Judge the rollout by correctness, preservation of working app behavior, review effort, latency, and usage. Keep the existing QA and rollback gates. Model choice does not change task authorization or permit weaker verification.

## Navigation

- Current architecture and boundaries: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Document authority and status vocabulary: [`docs/MASTER_PROJECT_INDEX.md`](docs/MASTER_PROJECT_INDEX.md)
- Design and proposed shell: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md), [`docs/GAME_SHELL_SPEC.md`](docs/GAME_SHELL_SPEC.md)
- Responsive, accessibility, performance, and QA: [`docs/RESPONSIVE_STANDARD.md`](docs/RESPONSIVE_STANDARD.md), [`docs/ACCESSIBILITY_STANDARD.md`](docs/ACCESSIBILITY_STANDARD.md), [`docs/PERFORMANCE_BUDGET.md`](docs/PERFORMANCE_BUDGET.md), [`docs/QA_MATRIX.md`](docs/QA_MATRIX.md)
- Decisions and execution plans: [`docs/CHANGELOG_DECISIONS.md`](docs/CHANGELOG_DECISIONS.md), [`docs/architecture/README.md`](docs/architecture/README.md), [`docs/exec-plans/README.md`](docs/exec-plans/README.md)
