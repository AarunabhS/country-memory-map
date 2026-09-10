# Front UI to game-engine integration

Status: completed 2026-09-10

## Impact assessment

Requested change: Connect the cinematic Home launcher to the retained game engines through the existing canonical route and iframe bridge.
Affected workstreams: Root shell routing, retained game-host lifecycle, Google/local renderer interaction state.
Routes/components affected: `index.html`, `src/main.js`, `src/map-adapter.js`, `legacy/index.html`, retained `game-ui.js` host API.
Gameplay impact: none — existing `Engine`, question generation, answer validation, scoring, timing, and results remain authoritative.
Persistence impact: none — existing local profile and player stores are unchanged.
Map/globe impact: low — renderer interaction is disabled only while the retained game surface owns the viewport; root globe behavior remains unchanged.
Mobile impact: none intended — retained surface uses its existing responsive shell; verify the route transition does not expose the hidden root controls.
Accessibility impact: improve — preserve the retained surface focus target and avoid a failed route that strands focus on the Home launcher.
Performance impact: none intended — reuse the existing retained frame and adapters; no new dependency or network request.
Migration risk: low — changes are defensive and reversible; rollback is reverting this plan's source changes.
Rollback path: Revert the guarded retained-frame loading/style and renderer interaction-state changes, leaving the existing engine and route contracts intact.
Required QA: `node scripts/check-governance.mjs`, `node --test tests/*.test.cjs`, plus browser checks for Home → each scored-game setup, representative typed/map/flag games, Home return, keyboard focus, and retained-frame loading.
Architecture risk: architecture-authority — this crosses the approved root route, retained game engine, and map/globe boundaries but does not introduce a new ownership decision.

## Delivered

- Home game cards now use the canonical `?game=<slug>` routes and activate the retained engine host's existing `openGame` API.
- The retained engine iframe is eagerly loaded as the singleton bridge, with bounded host-contract polling for cached or delayed iframe readiness.
- Setup and playing views become visible on the retained surface while the root launcher/globe controls are hidden and inert.
- Engine navigation back to Home restores the root launcher and Explore controls without a reload or duplicate engine.
- Google 3D interaction gating now uses DOM-safe pointer-events and `aria-disabled` state instead of assigning an unsupported gesture value.
- Regression coverage verifies the route handoff, retained bridge contract, local callback boundary, and renderer interaction gating.

## Verification

- `node scripts/check-governance.mjs` — passed (21 required files).
- `node --test tests/*.test.cjs` — passed (69 tests).
- `git diff --check` — passed.
- Browser smoke-tested at `http://127.0.0.1:8000/`: all five Home cards opened their engine setup UI; World Conquest, Capital Clash, Flag Recall, and Flag Match reached answer handling; Find the Country reached its map-question playing state; engine Back/Home navigation returned to the root launcher; keyboard Enter launched World Conquest and focus moved to its Start button.
- The Google 3D preview reported ready in the local browser; no new Google Maps gesture value was assigned.
- The Find the Country map answer was not counted as a reliable automation result because the test click did not target the intended country geometry; the engine route and playing state were verified.

## Rollback

Revert the source and test changes associated with this plan. The retained engine, route definitions, and existing gameplay rules remain independently usable.
