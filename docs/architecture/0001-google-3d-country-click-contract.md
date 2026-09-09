# ADR 0001: Google 3D country-click contract

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

The root creates a Google 3D map adapter with an `onCountryClick` callback, but the current factory drops that callback. `Google3DAdapter` already creates interactive country polygons and can emit renderer-neutral country information from `gmp-click`.

Direct callback recovery alone is unsafe. Root `Capitals` uses the retained capital-name checker, staged root modes do not run their named games, and unknown future modes have no click-answer definition. The retained iframe also starts in its game chooser, where its controller consumes root submissions before the existing Free Map checker can process them.

Google 3D and the retained bridge are protected shared boundaries. The correction must preserve current recognition, scoring, data, persistence, routes, multiplayer behavior, and retained gameplay.

## Decision

- `Google3DAdapter` exposes an optional renderer-neutral `onCountryClick(payload)` callback. `createMapAdapter()` preserves the exact callback supplied by its consumer.
- One country-polygon `gmp-click` emits one callback containing the existing `{ id, name, feature, position }` payload. The adapter does not interpret application modes, score, inspect the iframe, mutate persistence, or implement gameplay debounce.
- The cinematic root owns mode semantics:
  - `Explore` and `Countries` may submit a valid country click once to the retained Free Map country checker.
  - `Capitals`, `Flag Sprint`, `World Conquest`, `Play with Friends`, unknown modes, and future modes without an explicit contract are non-answering.
- Before an authorized root submission, the hidden retained application enters its existing Free Map state through its existing Free Map control. Recognition remains owned by the retained checker.
- Only one answer-producing map click may be unresolved. Further answer-producing clicks are ignored rather than queued. A later deliberate repeat may reach retained duplicate handling after the first operation finishes.
- The root captures the originating mode and revalidates it after asynchronous checker preparation. A mode change cancels the pending answer. Checker failure produces no score/progress mutation and exposes concise recovery feedback.
- Existing typed entry is the keyboard-equivalent answer path for root `Explore` and `Countries`. Non-answering modes do not gain a click-only country-selection state.

This ADR does not decide the playable Google-3D-to-retained-2D fallback architecture, connect staged modes to game rounds, or define a Universal GameShell.

## Alternatives

- **Recover only the historical factory forwarding:** rejected because it would deliver country names to Capitals and staged-mode consumers without a safe application policy, while the retained chooser would still swallow nominal submissions.
- **Make the map adapter mode-aware:** rejected because renderer infrastructure must not own shell or gameplay semantics.
- **Submit country IDs directly to `game-core.js`:** rejected because the cinematic root does not own an active engine question/session contract.
- **Infer or automatically submit a capital from a country click:** rejected because it bypasses capital recognition.
- **Implement the playable 2D fallback or Universal GameShell now:** rejected as separate architecture work.

## Consequences

- Google 3D country clicks become useful in the two root modes with an existing country-checker contract without changing recognition or game rules.
- Capitals and staged/unknown modes fail closed.
- Root/retained integration gains a small explicit Free Map preparation step and root-owned single-flight state.
- The typed form remains required for keyboard answer equivalence; Google polygon keyboard activation is not assumed.
- The adapter remains reusable by future consumers, which must explicitly define their own event semantics.
- There is no dependency, persistent-data, route, or network-request growth.

## Affected systems

- Root route: cinematic Google 3D country selection, typed answer UI, live-region feedback, and retained iframe bridge.
- Map/globe: callback wiring only; geometry and camera behavior are unchanged.
- Retained application: existing Free Map transition and checker are consumed without rule changes.
- Gameplay, country data, persistence, profiles, multiplayer, deployment: unchanged.
- Documentation and tests: adapter, root policy, bridge, QA status, and execution evidence.

## Migration

No data, persistence, route, dependency, or generated-artifact migration is required. Implement callback forwarding, root mode policy, bridge preparation, concurrency handling, and dependency-free behavioral tests together so no unsafe intermediate behavior is treated as complete.

## Rollback

Revert the adapter forwarding and root interaction/bridge changes together. This restores the known disconnected Google 3D click defect without affecting stored data. Revert the ADR/status documentation if the decision itself is superseded or rejected; do not rewrite accepted history after release.

## Verification

- `node scripts/check-governance.mjs`
- `node --test tests/*.test.cjs`
- `npm --prefix multiplayer-server test`
- Behavioral adapter tests for callback identity, one-event/one-payload delivery, multi-piece isolation, and initialization failure.
- Behavioral root tests for mode authorization, single-flight, mode-change cancellation, Free Map activation, checker failure, and typed submission.
- Browser checks at desktop, mobile portrait, and short landscape for click, drag, rapid taps, typed Enter, Capitals/staged behavior, loading/failure, announcements, and renderer failure.
- Production-origin verification remains required after a separately authorized deployment.
