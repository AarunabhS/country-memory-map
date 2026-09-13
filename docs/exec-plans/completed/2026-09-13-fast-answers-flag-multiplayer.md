# Faster room answers, Flag multiplayer, and Geo Quiz speech

Status: completed locally; not deployed. Production latency and physical microphone verification remain open.

## Impact assessment

Requested change: reduce multiplayer answer latency, add Flag Recall/Match rooms, enable Geo Quiz Speak.
Affected workstreams: room transport/persistence, existing flag presentation, quiz voice lifecycle.
Routes/components affected: existing Friends lobby/game, Flag Games, Geo Quiz; no new routes.
Gameplay impact: expose existing flag rules with authoritative choices, hints and replay; preserve scoring, timing compensation and retries.
Persistence impact: existing JSON room envelope carries flag state already defined by the engine; no schema/key migration.
Map/globe impact: existing renderer ownership preserved; flag mode must not enable map answers.
Mobile impact: reuse current flag layouts and speech button in portrait/landscape.
Accessibility impact: preserve option labels/focus; enable speech only while Quiz accepts answers.
Performance impact: overlap independent rate-limit/read operations, avoid unchanged poll writes within a five-second presence interval, pause scheduled polls during answers. No higher polling rate or new dependency.
Migration risk: medium — concurrent authoritative room writes and remote flag input; existing CAS and sequence checks retained.
Rollback path: revert this slice and rebuild prior Worker; no persistent migration.
Required QA: concurrency, retry, presence/deadline, flag choice/hint/reconnect/replay tests; root/server/governance suites; disposable build; local browser gameplay and responsive checks. Physical microphone and production latency remain separate.
Architecture risk: architecture-authority (Level A), bounded integration within existing owners.

## Boundary decision

Keep HTTP polling and D1 compare-and-swap ownership. Optimize redundant/serial work instead of introducing a second transport or speculative scoring. Unchanged polls refresh stored presence at most every five seconds (below the existing fifteen-second connected threshold); state transitions still persist immediately. Flag options and hints use the existing sequenced answer envelope. No shared rule snapshot edits: current engine snapshot matches source.


## Verification evidence

- **AUTOMATED VERIFIED**: root suite 136 tests and server suite 26 tests; governance and disposable Worker build passed. Coverage includes nine concurrent answers with polls, atomic nine-player membership, rate gate enforcement, unchanged-read revisions, presence refresh, deadline transitions, departure during pending answers, retry reconciliation, both Flag modes, hints, shared order, independent scores, fabricated/stale choices, and solo flag replay.
- Synthetic backend benchmark: Node v25.2.1 on this development Mac, in-memory storage with a fixed 40 ms delay for each rate/read/save operation; five sequential samples per implementation against the same current room engine. Old Worker was loaded from Git HEAD; no real network or D1 used. Answer times before: 177,125,124,125,125 ms (first sample includes cold-start overhead); after: 83,84,82,84,84 ms. Median 125 → 84 ms (~33%). Four unchanged polls: before 492–496 ms and four writes, after 165–166 ms and zero writes. This demonstrates removed sequential work, not deployed end-to-end latency.
- Disposable build path: `/var/folders/1f/bdc4nn3x7y75sg4ygp4bdpp00000gn/T/cmm-fast-build-di5cnmt6`. Committed generated snapshots untouched; rule snapshot matches root source.
- **MANUALLY VERIFIED WITH EVIDENCE**: Codex Chromium browser using `127.0.0.1:8014` host and `localhost:8014` guest with isolated SQLite `/tmp/cmm-fast-flags.sqlite`. Temporary HTTP harness injects the existing allowed loopback API override; no public room mutated. Browser snapshots/screenshots are in the task tool transcript.
- Room GEO8DQSMY: two players joined/readied, Flag Recall displayed the same room configuration, hint charged −25, typing India with Enter registered one correct answer and score 75. Reload restored the ongoing round. Recall Speak enabled; actual microphone not invoked.
- Room GEOQEQCDK: host selected Flag Match, guest joined/readied, four flag options rendered. Haiti hint removed option A; keyboard Enter on option D registered one correct answer and score 75. Later questions continued. Options and hints use authoritative remote state.
- Visual inspection: Recall at desktop 1280×720 and portrait 390×844; Match at portrait 390×844 and landscape 844×390. Standings moved out of the hidden map and collapsed by default in Flag games. Flag stage scrolls in short landscape; keyboard focus brought option B visibly into view. Viewport override reset. Existing map-game board positioning retained.
- Geo Quiz: Speak enabled after countdown, disabled after Reveal, and enabled again on Next Question. Reveal message remains “Answers revealed.” instead of microphone cancellation copy. Speech is explicitly stopped on reveal, finish and exit.
- **MANUAL VERIFICATION REQUIRED**: production frontend/Worker rollout and mobile-network latency, physical speech/permissions, nine physical devices, screen-reader and reduced-motion interaction checks. No production latency target is claimed achieved by local measurements.

## Delivery

Deploy the rebuilt Worker before the frontend so Flag configuration/answer support is present when new controls arrive. No schema migration, dependencies, key changes, push, merge or deployment performed. Roll back both source slices/rebuilt Worker together; browser/room storage schema remains compatible. Existing two untracked voice postmortem documents were untouched.
