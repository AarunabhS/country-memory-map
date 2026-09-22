# P0/P1 defect repair

Status: **VERIFIED CURRENT ARCHITECTURE** — local defect repairs implemented and tested on 2026-09-22–23. Physical-device, independent editorial, field-performance and production verification remain **NEEDS QA**, as listed below. No new game mode or progression feature was added.

## Impact assessment

Requested change: repair roadmap F01–F14 in priority order, with bounded fixes rather than the proposed new progression/game systems.
Affected workstreams: Quiz integration, navigation, setup/results presentation, records, content, Explore facts, accessibility, performance measurement and current documentation.
Routes/components affected: existing solo routes, Explore, shared setup/results, local profiles, entry scripts and docs. No new route or game mode.
Gameplay impact: preserve scoring; fix two defective content answer sets (A-to-A adds Albania and Antigua and Barbuda; no-rivers narrows to Saudi Arabia with an explicit prompt); correctly finish/record Quiz and describe its distinct rules; unsupported Quiz practice/challenges must not appear actionable.
Persistence impact: new comparison-key version inside existing device record storage; retain old bests untouched. No destructive migration or named-player best store. Relabel historical identified-country sets honestly.
Map/globe impact: preserve local canvas/SVG and hit testing; restore the existing approved country-facts presentation via current free-map selection events.
Mobile impact: keep Start visible in a bounded setup layout, remove irrelevant Quiz controls, preserve answer-dock space.
Accessibility impact: semantic selection, focus visibility/return, truthful status and improved control hierarchy; physical assistive checks remain separately tracked.
Performance impact: baseline local assets/load and remove unnecessary recurring idle work where proven; defer data used only for facts. No new runtime dependency or external service.
Migration risk: medium — shared UI and result lifecycles; additive best keys avoid reinterpreting legacy records.
Rollback path: revert source/CSS/docs slice; retained legacy bests remain readable by old code, no server schema changes. New best keys are ignored by old comparison logic.
Required QA: root/server suites, governance, targeted behavioral regressions, disposable Worker build, browser setup/play/results/history/Explore checks at desktop/portrait/landscape, keyboard/reduced-motion checks, content provenance review, diff/secret review.
Architecture risk: Level A — shared lifecycle, route synchronization and persistence semantics.

## Boundary decisions

- Quiz retains its controller/rules and emits the existing tracker-compatible events plus a normalized result to the shared controller. Shared results explicitly omit unsupported actions. No new Quiz practice/challenge mode.
- Catalog selection synchronizes an existing canonical route through the host callback without restarting the selection; history navigation restores the matching setup.
- Best records remain explicitly device-wide. Comparison version 2 includes material configuration, content/rules version, and assistance. Legacy entries stay intact; no claim of per-player records.
- F07 is repaired by truthful “identified at least once” labels; Memory Atlas, spaced review and new mastery schemas remain deferred.
- F08 restores the already approved fact-card contract, using local sources and no new network data provider.
- F11 uses existing GameShell tokens for control hierarchy and removes irrelevant chrome; a complete art-direction redesign remains deferred.
- F12/F13 include measurements and real verification where tools permit; physical-device and production evidence cannot be invented. Record remaining verification explicitly.

## Ordered work

1. F01/F02: Quiz completion, recording, tracker lifecycle, idempotence and safe result capabilities; regression coverage.
2. F03–F07: route/history, visible Start, rule copy, comparable device bests, truthful identified statistics.
3. F08–F10: restore facts, reconcile prompt wording and the two explicitly documented answer-set defects, add sourced content review metadata and validation.
4. F11–F13: bounded presentation/accessibility fixes, local performance evidence, browser verification; list hardware/deployment checks still required.
5. F14: reconcile authoritative docs and roadmap status; run final suites/build/diff review.

## Acceptance and evidence

### Repair outcomes

| Finding | Local outcome |
| --- | --- |
| F01 / F02 — P0 | Quiz uses normalized shared results/history/profile events. Unsupported Practice/Challenge are hidden and guarded. Completion is idempotent; completed/revealed input cannot score again; manual/navigation/player-switch endings close the current session. Core actions restore on the next game. |
| F03 | Catalog selections update the existing canonical route without restarting setup. Choose game/Back to games open the catalog. Reload and browser Back restore matching setup. |
| F04 | Two-column catalog leads to focused setup; Start stays outside its scrolling content. Keyboard selection moves focus to Start. |
| F05 | Distinct Quiz/core/flag scoring copy; truthful category accuracy and Hard/Expert eight-question counts. |
| F06 | Versioned comparison keys separate rules/content, timing, round length, difficulty, region and hint use. Old best entries preserved. Device-wide scope is explicit. |
| F07 | Existing country sets labelled “identified at least once”, including assistance and mixed skill types. No inferred mastery or invented history. Skill-specific learning features deferred. |
| F08 | Existing local country facts restored on typed/spoken map recognition with safe DOM text, population attribution/year, close/reset and stale-selection/navigation guards. |
| F09 | Prompt/answer contradictions repaired while retaining the intentional CAF bonus; A-to-A and no-rivers corrections documented and versioned. |
| F10 | All 52 questions have review/provenance metadata and scope; 11 targeted source checks, semantic regression tests, and a review register. Independent verification of the remaining 41 descriptive fact sets remains open; metadata does not claim it occurred. |
| F11 | Existing shell tokens distinguish primary/secondary controls; duplicate setup identity reduced, HUD numbers stabilized, map focus restored, irrelevant active Quiz chrome hidden. Map colors/geometry retained; wholesale art-direction work deferred. |
| F12 | Quiz scripts deferred; local five-sample diagnostic and direct-asset before/after measurement recorded. Engine work skipped while idle/Quiz. Production/low-end/cold-network/Web Vitals measurements remain open. |
| F13 | Typed input preserved; keyboard/focus behavior checked locally, speech lifecycle automated suite passes. Physical Safari transcription, screen-reader, reduced-motion/forced-colors and software-keyboard checks remain open. |
| F14 | README, architecture, design, shell, responsive, performance, index and QA docs reconciled with the active single-document app. Historical execution records retained. |

### Automated evidence

- `node --test --test-reporter=tap tests/*.test.cjs`: **157 passed, 0 failed**. Includes full Quiz controller lifecycle/profile recording, unsupported result actions, core-action restoration, partial rounds, duplicate finish protection, comparable device keys/legacy retention and content metadata/semantic checks.
- `npm --prefix multiplayer-server test`: **26 passed, 0 failed** against committed server snapshots.
- `npm run build` in disposable `country-worker-cy0zsumd/multiplayer-server`: succeeded. Country snapshot identical. Generated core differs only in the client LocalProfile comparison method changed in this task; no engine rule difference. Committed generated snapshots left untouched, consistent with the protocol. No production deployment.
- Governance and final whitespace/link checks: see final verification below.

### Local browser evidence

**MANUALLY VERIFIED WITH EVIDENCE**, macOS Codex in-app browser at `http://127.0.0.1:8000`, 2026-09-22–23. Evidence is in this task's CUA accessibility snapshots/screenshots/log results (not committed screenshots):

- 390×844: lazy-loaded Quiz, typed Australia, correct score/Next focus, nine reveal/next transitions, full result (1/10, 100 points, 10%), no unsupported result buttons, Choose game returns to catalog.
- 390×844 and 320×568: focused setup has visible Start; 844×390 landscape and 1280×720 desktop preserve Start with scrollable settings. Screenshots show the actual layouts.
- Selection updates Find the Country URL; browser Back restores World Conquest. Quiz deep-link reload restores Quiz setup. Final-version keyboard selection moves focus to Start. Hard displays eight questions.
- Leaving during Quiz countdown returns Home and does not start a late round. After reload, recent rounds still show the completed Quiz result.
- Quiz → World Conquest: map/input restored; India earns 100 points; manual results restore Practice Missed and Challenge Friends.
- Explore Countries: India → Brazil updates facts; Capitals: New Delhi shows India. Close via Enter returns input focus; Reset clears facts. Portrait screenshot shows fact card above the answer dock. No captured console errors during these flows.
- Performance diagnostic: five cached local Home samples, no Quiz script requested. See [performance evidence](../../PERFORMANCE_BUDGET.md) for bytes/timings and limits.

### Limits and remaining acceptance

This is a completed **local repair slice**, not a claim that every P1 release gate is closed. A person with the reported iPhone must still run repeated Canada/multiword speech attempts with real permission, backgrounding and keyboard transitions. Screen-reader, forced-colors, reduced-motion and zoomed-text behavior need real assistive verification. Live room creation/packet loss were not re-tested in this pass; server/client regression suites passed. Cold/slow-network and low-end production measurements, the remaining independent trivia review, and production frontend/Worker smoke are still required. Full visual redesign, Memory Atlas, new practice/challenge mechanics and new features remain deferred.

No dependencies, server schema, country recognition policy, map geometry, secrets or deployed services changed. The unrelated untracked Word document was left untouched. Reverting this source slice preserves legacy bests and requires no data migration.


### Final verification

**AUTOMATED VERIFIED**: final root suite 157/157, server suite 26/26, governance (21 required files), all changed-document local links, and `git diff --check` passed. Final source diff reviewed for scope, secrets, generated files, gameplay and documentation status. Browser console contained no captured errors; temporary viewport override reset. No commit, push or deployment performed.
