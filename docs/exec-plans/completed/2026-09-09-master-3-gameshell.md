# MASTER 3 — cinematic GameShell migration

Status: implemented locally; automated and focused local browser evidence recorded. No deployment authorized.

## Impact assessment

```text
Requested change: Add the approved thin GameShell presentation adapter and migrate the retained scored-game suite to its cinematic visual treatment without changing game mechanics.
Affected workstreams: retained game presentation, shared HUD/stage/result styling, controller-to-presentation display adapter, focused presentation tests and traceability documentation.
Routes/components affected: legacy/index.html retained surface for canonical scored-game routes; game-ui.js, new game-shell.js/game-shell.css, existing game/flag/multiplayer/profile presentation styles.
Gameplay impact: none — game-core Engine, question selection, aliases, scoring, timers, reveals, replay and results remain authoritative.
Persistence impact: none — no storage reads/writes or keys are changed by GameShell.
Map/globe impact: none — GameShell receives a map-stage label only; it imports neither Google Maps nor renderer code and does not alter map adapters/recovery.
Mobile impact: shared portrait and short-landscape shell layout adds safe-area-aware stage/HUD/input allocations.
Accessibility impact: preserve existing live feedback and dialogs; add explicit game-shell landmark/state attributes, visible focus and reduced-motion structural rules.
Performance impact: two small local static assets; no dependency, data, renderer, iframe, eager stage asset, or network addition.
Migration risk: low — one existing controller owns every scored solo game and this is a reversible presentation adapter with no engine/state changes.
Rollback path: remove game-shell.js/game-shell.css and its legacy includes/calls; existing game-ui markup, engines, routes, maps and storage stay intact.
Required QA: focused GameShell static tests, root/game/server suites, diff check, and available desktop/390x844/844x390 browser smoke for Golden Game and representative suite routes.
Architecture risk: judgment-requiring implementation inside the user-approved GameShell contract; no new ownership decision.
```

## Ownership, migration, and rollback

`GameShell` owns only serializable presentation metadata, semantic page/stage state, and cinematic layout classes. `game-ui.js` is the existing controller adapter: it supplies start, question, feedback, result, setup, free-map, and remote display snapshots plus existing callback ownership. The Engine, map adapter, routes, renderer recovery, profile services, and multiplayer transport remain outside the shell.

The single adapter covers Capital Clash (Golden Game), Find the Country, World Conquest, Flag Recall, Flag Match, existing free map/checker presentation, and retained multiplayer surrounding UI. The new styling also applies to the shared HUD, stage, setup, result, profile, and lobby surfaces; no game receives a separate presentation contract. Reverting the two shell assets and their legacy includes/calls restores the prior retained presentation without data migration.

## Verification record

- `node --test tests/*.test.cjs` — passed, 59 tests, including 2 focused GameShell contract tests and all existing engine/route/renderer tests.
- `npm --prefix multiplayer-server test` — passed, 16 tests.
- `node scripts/check-governance.mjs` — passed.
- `git diff --check` — passed.
- Local Chrome browser, desktop — Capital Clash Classic setup, typed Guatemala City answer, score/streak HUD update, automatic map-country question transition, and keyboard Arrow/Enter map selection were exercised. The visible map label updated to the keyboard contract; no browser console errors were present.
- Local Chrome browser, desktop — World Conquest Relaxed accepted India and updated countries/score/streak. Flag Match presented four neutral flag options and applied incorrect-choice feedback/penalty without exposing a correct answer in option labels.
- Local Chrome browser, 390×844 — Flag Match stage, choices, hint control, HUD, and prompt fit inside the 390px document width with no document overflow (document height 844px).
- Local Chrome browser, 844×390 — Capital Clash Classic retained HUD, map, question and answer control fit with no document overflow (document height 390px; map 130px; answer control bottom 343px).
- Browser viewport override was reset after testing. A local QA profile (`QAShell`) was created only in browser local storage to permit a score-bearing smoke round; no remote profile synchronization was used.

Not manually verified in this run: all results/replay end states, actual touch/safe-area hardware, screen reader operation, reduced-motion emulation, live Google 3D on the restarted static server, production-origin behavior, multiplayer room creation/joining, and all remaining game route interactions. Existing automated coverage remains green; these gaps are for Luna full QA.

## Release risk

The existing guest-access and root playable-fallback release risks were not changed or resolved by this presentation-only migration.
