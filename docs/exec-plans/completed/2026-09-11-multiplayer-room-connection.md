# Multiplayer room connection recovery

Status: implemented and verified locally; awaiting review and physical multi-client QA. No deployment authorized.

## Impact assessment

```text
Requested change: Make Play with Friends create a room instead of entering an indefinite reconnecting state when the root site is previewed locally without the optional local friends process.
Affected workstreams: retained multiplayer runtime endpoint selection, transport/session recovery, cache-busted script delivery, focused automated coverage, and deployment documentation accuracy.
Routes/components affected: ?game=multiplayer; multiplayer-config.js, multiplayer-service.js, legacy/index.html, and focused root tests. The Worker API, room engine, D1 schema, and multiplayer UI/game rules are unchanged.
Gameplay impact: none — room settings, membership, readiness, questions, scoring, timers, ranking, and invite behavior remain authoritative in the existing service.
Persistence impact: low and backward-compatible — the existing local friend-session object gains the API origin that owns its room; the storage key and server schema do not change, and sessions without the field remain readable.
Map/globe impact: none — the retained multiplayer surface continues to use the existing map/game adapters.
Mobile impact: room creation no longer strands phone or laptop previews in a reconnect loop; no layout or touch behavior changes.
Accessibility impact: the existing live status now distinguishes an initial service failure from reconnecting an established room; controls and focus behavior remain unchanged.
Performance impact: local previews perform at most two small no-store health checks before the first multiplayer request. Production and established sessions continue directly to one configured API.
Migration risk: low — additive client transport selection only, with no server/data migration and no retry of an uncertain room-creation POST.
Rollback path: revert the endpoint fallback, persisted session-origin field, cache-bust update, focused test, and this plan; existing room/server data require no rollback.
Required QA: focused endpoint-selection/session tests, governance, all root tests, multiplayer server tests, JavaScript syntax, direct hosted health/create probe, local static asset smoke, and diff/generated-file/secret review. Physical multi-browser/mobile joining and deployed frontend cache behavior remain manual unless separately performed.
Architecture risk: architecture-authority — multiplayer transport and cross-origin deployment selection are protected boundaries, but the change preserves the existing local and hosted service ownership model.
```

## Verified current state

- The local frontend selects `http://127.0.0.1:8787` unconditionally on loopback hosts.
- The current local preview has no process listening on port 8787, so the Create Room POST never reaches a room service.
- The configured hosted service returned HTTP 200 from `/health`, allowed the exact local preview origin, and returned HTTP 201 for a temporary QA room.
- The failure therefore occurs before room-engine validation or D1 persistence and does not require a Worker, schema, or gameplay change.

## Implementation boundary

1. Preserve the local friends service as the preferred loopback endpoint when its health route responds.
2. On loopback only, fall back to the existing hosted service before sending the first mutating room request.
3. Persist the selected API alongside the existing room code/token and reuse it for every poll/action/reload of that room.
4. Do not retry a room-creation POST against a second service after an ambiguous network failure.
5. Keep production origins on the hosted endpoint and retain exact Worker CORS validation.

## Verification evidence

- `node scripts/check-governance.mjs` passed with 21 required files.
- `node --test tests/*.test.cjs` passed 85/85 after the final source changes. Focused coverage verifies loopback configuration, local-to-hosted health fallback, exactly one room-creation POST, persisted service reuse, rejection of an unconfigured stored API origin, and truthful initial connection messaging.
- `npm --prefix multiplayer-server test` passed 17/17 after the final source changes, including exact production/loopback CORS allowlisting and denied lookalikes.
- `node --check multiplayer-config.js`, `node --check multiplayer-service.js`, and `git diff --check` passed.
- The absent local friends process was reproduced: `127.0.0.1:8787` refused the connection while the static preview remained available on port 8000.
- The configured hosted service returned HTTP 200 from `/health` with `Access-Control-Allow-Origin: http://127.0.0.1:8000`, then returned HTTP 201 for temporary QA room `GEOEG468U` from that exact origin. No credential is recorded in the repository or this plan.
- The running preview returned HTTP 200 for `/?game=multiplayer`, `legacy/index.html?v=20260911-friends1`, `multiplayer-config.js?v=20260911-connect1`, and `multiplayer-service.js?v=20260911-connect1`.
- Diff review confirmed the task changes are limited to client endpoint/session transport, cache-bust references, focused tests, service documentation, and this plan. Existing unrelated Explore/mobile worktree changes were preserved.
- The Worker build was not run because Worker source, room rules, schema, dependencies, and generated snapshots were not changed. No production deployment was performed.

## Remaining manual QA

- Create and join the same room from two physical browsers/devices, exercise ready/start/leave, and repeat on a phone network.
- Verify the next deployed frontend release refreshes the cache-busted retained document. The backend endpoint is already live and was directly probed, but the modified frontend has not been published.
