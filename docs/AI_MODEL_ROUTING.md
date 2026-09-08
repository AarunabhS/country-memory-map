# AI capability and risk routing

Route work by architectural risk and required judgment. Model branding is advisory only; repository enforcement cannot reliably know which commercial model is running.

## Level A — architecture authority

Use the strongest available, long-context, high-reasoning coding capability with authority to stop and request a decision.

Required for shared architecture, design-system primitives, GameShell decisions, game-engine rules, globe/map core, persistence or schema changes, routing, multiplayer core, cross-system work, security boundaries, and major performance architecture.

Expected output: verified current-state map, alternatives/tradeoffs, boundary decision, migration and rollback, ADR when a durable decision is made, and a QA plan. This level may approve work for lower levels.

## Level B — judgment-requiring implementation

Use a strong implementation model capable of tracing multiple files and validating responsive/interactive behavior.

Appropriate for implementing an approved architecture, complex responsive UI, custom interactions, and substantial game-specific integration. It may resolve local implementation details inside the approved boundary, but must escalate new ownership, persistence, routing, shared-primitive, or fallback decisions.

## Level C — mechanical execution

Use a cost/latency-optimized coding model only when the pattern, files, acceptance criteria, and rollback are explicit.

Appropriate for migration to established components, repetitive wiring, replacement of legacy primitives under an approved plan, straightforward tests, and known styling patterns. It must not invent architecture, tokens, data contracts, or gameplay behavior. Ambiguity or cross-boundary impact triggers escalation to Level B or A.

## Classification rules

- Choose the highest level triggered by any affected subsystem.
- High-risk data loss, security, or production deployment also requires a human owner decision.
- A stronger model does not expand task authorization and does not convert a proposal into an approved decision.
- Verification depth follows risk; it is not reduced merely because implementation is mechanical.

## Governance v1 routing

This repository-wide governance pass is Level A because it defines authority, protected boundaries, future architecture status, and CI policy across the root app and multiplayer service. Follow-up copy edits or migrations that exactly follow these documents may be Level C; implementation of the proposed GameShell is at least Level B and any shared contract decision remains Level A.
