# ADR 0007: Room previews and terminal departure

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

Invite links identify a private room. Before joining, the browser reads that room to show its host, game, capacity, and readiness. The previous anonymous response also contained every player name and standing, and an anonymous read could persist timer or host transitions. A player who explicitly left during a match remained in the room record and could reactivate the same token with another request.

## Decision

- An anonymous room read returns only invite preview fields and never writes room state. Membership, standings, match details, and personal game state require a room token.
- Joining by invite code remains available without an account. A newly joined player receives a unique bearer token scoped to that room.
- Explicit departure revokes that player's token for subsequent actions and polls. During a live match the player record remains for scoring, DNF, and results.
- New invite codes have eight uniformly selected base-32 characters after the `GEO` prefix. Existing six-character suffixes continue to work until their rooms expire.

## Alternatives and consequences

Requiring a token for the pre-join preview would remove the current invitation screen. Removing the player record immediately during a match would change ranking and completion behavior. The preview still displays the host name because it helps invitees recognize the room; the code remains an invitation to join, not account authentication. Longer codes reduce guessing risk without changing room storage or active links.

## Migration and rollback

Publish the rebuilt Worker and static frontend together. The frontend accepts both old and new preview payloads during rollout. No schema or stored-room migration is required. Rollback uses the prior Worker and frontend; new eleven-character codes remain within the old accepted length range.

## Verification

The 2026-09-28 [execution record](../exec-plans/completed/2026-09-28-security-hardening.md) covers server authorization tests, a disposable Worker build, and a local two-origin browser join flow. Deployment and production smoke remain separate.
