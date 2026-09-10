# ADR 0002: Local globe fallback and canonical Home launcher

- **Status:** Accepted
- **Date:** 2026-09-10

## Context

The current root shows a raster Earth while Google 3D loads, then replaces the entire cinematic shell with the retained flat-map iframe after a renderer failure. The five scored games exist and have canonical query routes, but they are mixed with Explore, duplicate checker entries, multiplayer, fake session data, and placeholder controls in an overflowing side rail. The result does not present the actual game suite clearly and exposes unfinished interactions.

The requested direction is a plain rotating 3D Earth matching the earlier cinematic concept whenever Google 3D is unavailable, five real games on Home, and Countries/Capitals inside Explore. Existing game rules, checker recognition, persistence, routes, and multiplayer behavior remain protected.

## Decision

- Google Maps 3D remains the preferred optional renderer.
- Home owns a dependency-free local orthographic globe built from the existing authoritative country geometry. It is shown immediately while Google loads and remains the root renderer after a Google initialization, geometry, or readiness-timeout failure.
- The local globe emits the same renderer-neutral country payload used by Google 3D. Root mode policy and the retained Free Map checker continue to own whether and how that payload becomes an answer.
- The retained flat map remains a hidden singleton bridge for country/capital recognition and the full-screen surface for existing scored games and multiplayer. It is no longer the visible root renderer fallback.
- Home exposes exactly five scored-game launchers using the existing canonical route definitions: World Conquest, Find the Country, Capital Clash, Flag Recall, and Flag Match. Countries and Capitals are grouped as Explore checker choices. Multiplayer remains one real, separately labelled action.
- Placeholder or fabricated Home actions and metrics are removed rather than presented as interactive product behavior.
- Hosted scored-game setup may hide the duplicate family chooser because Home has already selected the family; real format, difficulty, region, timer, rules, profile, start, end, results, and multiplayer controls remain game-owned.

This decision does not change country classification, engine rules, persistence, profile synchronization, multiplayer protocol, or deployment.

## Alternatives

- **Keep the raster Earth:** rejected because it is decorative, non-interactive, and explicitly contrary to the requested fallback.
- **Expose the retained flat map after failure:** superseded for the root fallback because it changes visual and interaction architecture at failure time and does not match the requested globe.
- **Add a third-party WebGL globe library:** rejected because it adds bundle, dependency, compatibility, and maintenance cost for behavior that can reuse the current geometry with a small local renderer.
- **Make each game a separate implementation:** rejected because the existing retained engine and route adapter already provide one authoritative implementation.

## Consequences

- Explore remains usable during Google outages through typed entry and local-globe country clicks.
- The local globe is an intentionally stylized orthographic rendering, not photorealistic terrain.
- Reusing the existing geometry adds no new payload, but the local renderer allocates capped in-memory raster textures while active. Animation is frame-capped, pauses with page visibility, and is disabled under reduced motion.
- Home becomes smaller, clearer, and more truthful by removing inactive controls and fake data.
- Direct scored-game routes remain stable and continue to use the singleton retained application.

## Affected systems

- Root markup, styling, accessibility semantics, launcher interactions, history, and renderer status.
- `src/map-adapter.js`, renderer recovery state, root/retained surface coordination, and country-click callbacks.
- Retained GameShell presentation only; engine, data, profiles, persistence, multiplayer source, and generated snapshots are unchanged.
- Architecture, QA, and execution-plan documentation.

## Migration

No stored-data, route, API, dependency, generated snapshot, or deployment migration is required. The root fallback and Home composition ship as one reversible slice so the old flat-map failure presentation is never mixed with the new launcher contract.

## Rollback

Revert the local-globe adapter/recovery, root composition/controller, hosted setup presentation, focused tests, and this ADR's status-document updates together. Existing engines, routes, hidden bridge, saved data, and multiplayer backend remain valid.

## Verification

- `node scripts/check-governance.mjs`
- `node --test tests/*.test.cjs`
- `npm --prefix multiplayer-server test`
- Focused adapter tests for local projection helpers, callback identity, fallback status, and interaction lifecycle.
- Static contracts for exactly five Home games, Explore checker grouping, removal of placeholder actions, readable focus/forced-color/reduced-motion rules, and retained singleton use.
- Manual desktop, narrow portrait, short landscape, keyboard, reduced-motion, renderer success/failure, all five canonical launchers, both Explore checkers, profile/result presentation, and production-origin follow-up.
