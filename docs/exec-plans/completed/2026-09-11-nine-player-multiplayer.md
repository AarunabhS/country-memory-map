# Nine-player multiplayer recovery

Status: implemented and verified locally; awaiting review, physical multi-device QA, and coordinated frontend/backend deployment. No deployment authorized.

## Impact assessment

```text
Requested change: Repair Play with Friends end to end and support one host playing simultaneously with eight friends.
Affected workstreams: initial multiplayer route readiness, multiplayer room capacity and public contract, retained multiplayer lobby/results UI, local multi-client preview, focused automated coverage, and operator documentation.
Routes/components affected: ?game=multiplayer; index.html and legacy/index.html cache-bust references, game-ui.js, multiplayer-ui.js, multiplayer.css, multiplayer-server/room-engine.mjs, multiplayer-server tests, root multiplayer UI tests, and multiplayer-server/README.md.
Gameplay impact: live and asynchronous rooms increase from eight total players to nine total players; question generation, answer validation, scoring, timing, rankings, reconnect, host transfer, and rematch rules are preserved.
Persistence impact: low and backward-compatible — room JSON gains no required stored field and the D1 schema does not change; existing rooms receive the new server capacity when handled by updated code.
Map/globe impact: none — the retained map adapter and root globe bridge are not changed.
Mobile impact: the room roster and actions must remain usable with nine visible players in portrait and short landscape without hiding primary controls.
Accessibility impact: capacity and readiness are exposed as text, player states retain text labels, direct-route focus moves into the multiplayer panel, lobby refreshes preserve focused controls, controls remain keyboard reachable, and status/error announcements continue through existing live regions.
Performance impact: one additional player adds one small roster/standings record per poll; polling frequency, answer payloads, country data, and renderer work are unchanged.
Migration risk: low — one numeric room-rule increase plus an additive public maxPlayers field; no schema, route, token, or gameplay snapshot migration.
Rollback path: restore the prior eight-player limit/copy/UI and revert focused tests, documentation, cache-bust references, and this plan; stored room records remain compatible.
Required QA: governance, root tests, multiplayer server tests, disposable Worker build/snapshot parity, syntax/diff checks, API create plus eight concurrent friend joins, ready/start and answer flow across nine clients, and desktop/mobile/short-landscape browser review of the multiplayer route.
Architecture risk: architecture-authority — the retained host readiness handoff, room engine, and public multiplayer contract are protected shared boundaries; this plan keeps their existing ownership and fixes the observed startup race plus the explicitly requested capacity.
```

## Acceptance criteria

1. A host can create a private room and eight distinct friends can join it; a tenth participant is rejected truthfully.
2. All nine connected players can ready up, the host can start, each receives the same question order, and independent answers update standings without leaking answer history or tokens.
3. Lobby, invitation, live standings, results, reconnect, leave, kick, host transfer, and rematch flows continue to use the existing room engine and transport.
4. The multiplayer UI consistently communicates nine-player capacity and remains usable on desktop, mobile portrait, and short mobile landscape.
5. Existing solo gameplay, profiles, persistence keys, routes, map/globe behavior, and generated gameplay snapshots remain unchanged.
6. Opening `?game=multiplayer` directly waits for the multiplayer controller and shows its primary control with intentional focus instead of silently leaving the solo setup visible.
7. Poll-driven lobby refreshes preserve focus on a still-present control.

## Implementation

1. Make the retained host wait for the multiplayer controller's readiness signal on first-load routes and focus the visible multiplayer surface.
2. Centralize the server capacity at nine and expose it in public room payloads.
3. Update atomic-capacity and nine-client gameplay tests, including the tenth-player rejection boundary.
4. Render capacity and a nine-person roster from the server contract, improve full-room/readiness presentation, and add focused source-contract tests.
5. Refresh only the affected static cache-bust references and multiplayer documentation.
6. Run automated checks, exercise a real local nine-client room through the HTTP API, then review the live route at required responsive viewports.

## Rollback

Revert the files named in the impact assessment. No database migration or data repair is required.

## Verification evidence

- Reproduced the initial-route race in the local browser: `?game=multiplayer` exposed the retained solo setup because the host bridge became available before `CountryMemoryMultiplayer`; after the readiness handoff, the same direct route opened the Friends panel and focused its primary control.
- A real local HTTP smoke created one host plus eight friends, rejected the tenth participant with `ROOM_FULL`, started a shared Find the Country match, and accepted one independently validated answer from every player. The final room payload reported nine standings rows and `maxPlayers: 9`.
- Browser QA showed a full nine-seat room with readable capacity/readiness text, a scroll-bounded roster, settings, invite controls, and 44px removal targets. The panel had no horizontal overflow at the default desktop viewport, 390×844 portrait, or 844×390 short landscape; keyboard Tab moved from the focused Ready control to Copy Invite Link while correctly skipping disabled Start Game, and a readiness refresh retained focus on the replaced Ready control.
- `node scripts/check-governance.mjs` passed with 21 required files.
- `node --test tests/*.test.cjs` passed 98/98 after the final source and cache-bust changes.
- `npm --prefix multiplayer-server test` passed 18/18, including the new nine-player gameplay and concurrent capacity cases.
- A disposable `npm --prefix multiplayer-server run build` completed. The generated game-core and country snapshots matched the committed snapshots byte-for-byte, the bundle contained the nine-player contract, and `node --check` passed on the Worker bundle.
- `node --check game-ui.js`, `node --check multiplayer-ui.js`, `node --check multiplayer-server/room-engine.mjs`, and `git diff --check` passed.
- Diff review found no schema, gameplay snapshot, persistence-key, route-definition, map/globe, profile, secret, or dependency change.

## Remaining manual QA

- Nine simultaneous physical browsers/devices, including phone networks, reconnect, host transfer, DNF, final results, and rematch.
- Reduced-motion, forced-colors, screen-reader, and 200% zoom checks on physical browsers.
- Coordinated deployment of both the Worker and frontend, followed by production-origin room creation, eight-friend joining, gameplay, and cache refresh verification.

## Unresolved decisions

None. The request defines nine total simultaneous players; the current room, polling, game, persistence, and UI architecture remains authoritative.
