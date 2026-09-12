# ADR 0004: Home navigation from a finished multiplayer round

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

The owner requested Home navigation without leaving the room and prompt rematches after DNF. The screenshot showed every player finished while a timed room remained PLAYING. `syncRoom` previously required the timer to expire for timed matches even when all players had ended. Ordinary route suspension stopped polling and could make a member disconnected before rematch.

## Decision

- Live rooms enter RESULTS when their deadline expires or every player's game ends. Scores, DNF rules, deadlines, host authority, and readiness remain server-owned and unchanged.
- The results screen offers Back to Home through the existing retained navigation bridge. It does not send Leave or clear the stored session.
- That explicit action parks the UI and retains presence using the existing eight-second background polling interval. Hidden room responses cannot navigate, render a remote game over Home/solo play, or surface room errors over another game.
- Reopening Play with Friends resumes the saved room with foreground polling. Closing the page, losing connectivity, room expiration and the existing server grace periods still apply.

## Alternatives

- Leaving/rejoining would violate the requested membership retention.
- Retaining credentials but stopping heartbeats would leave the player eligible for removal during rematch.
- A new route or socket service is unnecessary for this bounded behavior.

## Consequences

Home browsing after a finished round retains low-frequency network traffic. No browser/server schema, credential scope, polling-rate increase, or map ownership change is introduced. Guests remain not-ready after rematch until they explicitly ready up.

## Affected systems

`multiplayer-ui.js`, `multiplayer-service.js`, `multiplayer-server/room-engine.mjs`, existing Home navigation, and regression tests.

## Migration

Publish both the static frontend and rebuilt Worker for the complete repair. The payload and stored-room schema remain compatible with older clients. No generated canonical game/data snapshot input changed.

## Rollback

Revert this slice and rebuild/redeploy the prior Worker. Existing room and browser data remain valid; a room already finalized does not become active again.

## Verification

See the [execution record](../exec-plans/completed/2026-09-13-multiplayer-voice-results-latency.md) for automated and local browser evidence. Physical iOS speech, device background suspension, and deployed-origin checks remain required.
