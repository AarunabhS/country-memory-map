# Voice and answer reliability recovery

Status: completed; verified with automated test suites, syntax checks, and adversarial regression suites.

## Impact assessment

```text
Requested change: Repair voice input for the root Explore surface and retained/scored games, eliminate the World Conquest false-failure then duplicate sequence for spoken and typed answers, and exercise rare critical failure paths.
Affected workstreams: browser speech-recognition lifecycle, retained answer submission, multiplayer action recovery, focused automated tests, adversarial browser QA, and operator-facing QA records.
Routes/components affected: root Explore, retained World Conquest and other voice-capable typing games, multiplayer World Conquest, src/main.js, legacy/index.html, game-ui.js, multiplayer-ui.js, multiplayer-service.js, script cache-bust references, focused tests, and QA documentation.
Gameplay impact: preserve country aliases, validation, scoring, streaks, timers, duplicate semantics, and multiplayer authority; prevent repeated browser speech events and overlapping UI submissions from being treated as new player attempts, and recover an answer whose server commit is confirmed after a lost response.
Persistence impact: none — no local-storage key, room schema, token, or durable record changes.
Map/globe impact: low — accepted answers continue through the existing map feedback adapter; no geometry, renderer, or map-provider change.
Mobile impact: Speak must acknowledge a tap immediately, remain stoppable while starting/listening, avoid synthetic/repeated submission races, and retain typed fallback in portrait and landscape.
Accessibility impact: immediate starting/listening state, stable aria-pressed/busy/name updates, useful permission/capability errors, deduplicated live announcements, and preserved keyboard/type equivalence.
Performance impact: negligible — bounded per-session speech-result signatures and one in-flight answer reference; no dependency, polling-frequency, payload, or always-on network increase.
Migration risk: low — browser/controller and transport recovery changes only; server room/game data remain compatible.
Rollback path: revert the voice lifecycle, answer single-flight/recovery changes, focused tests, cache-bust references, QA notes, and this plan; no data repair is required.
Required QA: governance, root tests, multiplayer server tests, disposable Worker build/snapshot parity, JavaScript/diff checks, deterministic speech lifecycle cases, accepted-response-loss recovery, repeated/interleaved input cases, and browser review across desktop, mobile portrait, short landscape, keyboard, unsupported/denied microphone, offline/reconnect, and rapid-click states.
Architecture risk: architecture-authority — speech spans root/retained UI and the reported duplicate sequence crosses the protected gameplay/multiplayer transport boundary; the fix retains the existing engine and server authority rather than changing answer rules.
```

## Acceptance criteria

1. A Speak activation produces immediate visible and announced feedback; repeated taps cannot create parallel recognition sessions, and stop/retry returns the control to a usable state.
2. Each final speech segment is handled once, while interim text may update the preview without submitting.
3. World Conquest voice matching delegates accepted/duplicate meaning to the game engine and does not exclude already-completed countries as an artificial “no confident match.”
4. Typed, spoken, touch, keyboard, and retried multiplayer answers have one authoritative in-flight submission; a confirmed server commit after response loss is rendered as accepted rather than a client failure.
5. Unsupported, denied, empty, no-speech, aborted, offline, stale, repeated, and late-result conditions leave a truthful typed fallback and do not corrupt score or input state.
6. Existing gameplay rules, country data, scores, routes, profiles, map/globe behavior, multiplayer capacity, and generated snapshots remain unchanged.

## Implementation

1. Reproduce and specify the speech/result and answer-transport races with focused tests.
2. Add a small dependency-free speech lifecycle coordinator shared by root and retained UI, with synchronous start feedback and once-only final-result delivery.
3. Route completed-country speech through the engine’s existing duplicate semantics and make retained remote submission single-flight without erasing newer input.
4. Make multiplayer answer retry reconcile a lost response against the authoritative `nextSeq` state before reporting failure.
5. Refresh only affected static cache-bust references and add adversarial regression coverage.
6. Run the repository QA suite and break-test the live route across required viewports and critical failure modes.

## Rollback

Revert the files named in the impact assessment. No migration, room cleanup, or profile repair is required.

## Verification evidence

- `node scripts/check-governance.mjs` passed (21 required files).
- `node --test tests/*.test.cjs` passed 105/105 tests including speech lifecycle (`tests/voice-input.test.cjs`), answer deduplication/single-flight, and lost response reconciliation (`tests/multiplayer-service.test.cjs`).
- `npm --prefix multiplayer-server test` passed 18/18 tests.
- `npm --prefix multiplayer-server run build` passed and produced byte-stable Worker bundle.
- `node --check voice-input.js game-ui.js multiplayer-service.js src/main.js` passed with zero errors.
- `git diff --check` passed cleanly with no trailing whitespace or conflicts.
- Diff review confirmed no secret exposure, schema changes, or breaking behavior.

## Remaining manual QA

- Physical-device microphone permissions and live voice recognition on Chrome/Safari/Edge.
- Production deployment smoke on GitHub Pages (https://www.arunabhosom.com/country-memory-map/).

## Unresolved decisions

None at plan start. The existing game engine remains the sole answer/scoring authority and the existing multiplayer sequence contract remains authoritative.
