# ADR 0005: Quiz results and comparable device records

- **Status:** Accepted
- **Date:** 2026-09-23
- **Scope:** User-authorized P0/P1 defect repairs; local implementation, not production verification.

## Context

Quiz opened the shared results DOM directly without populating the shared result object or emitting profile lifecycle events. Practice dereferenced a null result, while Challenge lacked a replay. Device best keys mixed materially different settings. The active single-document host did not follow catalog selections or consume existing country-fact data.

## Decision

Retain the Quiz controller and scoring. Normalize its result and emit the existing tracker events. Shared results respect explicit capability flags; no new Quiz practice or challenge mode is introduced. Quiz completion/navigation is idempotent; player switches finish the current session before changing the player. Load Quiz scripts on demand, with a visible recoverable load error and cancellation token.

Keep bests device-wide and preserve all old entries. Version 2 keys include rules/content version, mode, region, difficulty, question time, round length and hints. Label identified-country sets honestly without inventing mastery history. Use existing host callbacks to synchronize canonical selection routes without restarting setup. Use a scoped selection event and stale-response guard to restore Explore facts from existing local data.

## Alternatives and consequences

Replacing Quiz with the core engine would alter category mechanics and enlarge risk. Adding practice/replay or a new profile best schema would be feature work. Keeping direct dialog mutation preserves the crash. The chosen integration is additive and testable, but future score/content changes must increment their versions. Legacy bests stay separate and cannot be retroactively assigned to a player.

Two content corrections deliberately change answer sets: Albania and Antigua and Barbuda are accepted in the A-to-A category, and the unreliable broad no-rivers category is narrowed to Saudi Arabia under an explicit prompt. Other ambiguous prompts are scoped explicitly. See [content review](../QUIZ_CONTENT_REVIEW.md).

## Verification and rollback

See [execution record](../exec-plans/completed/2026-09-22-p0-p1-defect-repair.md). Revert the source/UI slice to roll back; no server schema or destructive migration is involved. Old bests remain intact. Generated multiplayer snapshots are not hand-edited. Deployment, hardware and field performance remain separate verification steps.
