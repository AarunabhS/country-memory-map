# Final pre-deployment release candidate

## Impact assessment

Requested change: Disable unsupported remote profile synchronization by default while preserving local profiles and refresh persistence; regenerate the documented multiplayer Worker snapshots.
Affected workstreams: Profile bootstrap/UI/tracking, focused profile tests, multiplayer generated artifacts, release QA/documentation.
Routes/components affected: Retained game route (`legacy/index.html`) profile UI and game tracker; multiplayer Worker build outputs. No route ownership changes.
Gameplay impact: none — the existing Engine, scoring, recognition, progression, and local statistics paths remain authoritative.
Persistence impact: none — existing storage keys and stored profile/data shapes remain unchanged; the remote queue is not constructed or written in local-only mode.
Map/globe impact: none.
Mobile impact: local profile UI remains responsive; no new layout contract is introduced.
Accessibility impact: remote-only controls are omitted from the dialog; existing local profile controls and dialog semantics remain.
Performance impact: reduced release traffic and no local-only remote-queue work; no new dependency or bundle is added.
Migration risk: low — the change is a default-off guard with a reversible configuration override and no storage migration.
Rollback path: revert the profile flag/UI/tracker/test/documentation changes and regenerated snapshot/build outputs in the single checkpoint commit.
Required QA: focused profile tests; snapshot regeneration/diff review; multiplayer tests before and after build; Worker build; governance; root tests; diff check; local desktop and 390×844 release smoke.
Architecture risk: architecture-authority boundary already approved; bounded implementation only, with no new persistence, routing, renderer, gameplay, or multiplayer-rule decision.

## Acceptance criteria and outcome

- `REMOTE_PROFILE_SYNC_ENABLED` defaults to `false`.
- Local profile creation, selection, statistics, results, settings, and reload persistence continue to work without a remote service.
- Disabled mode makes no profile/recovery/session-sync requests and does not construct or persist a stats-sync queue during gameplay.
- PIN, Player Code, recovery, remote permanent-delete, and remote-sync wording are hidden or truthfully degraded in disabled mode.
- `multiplayer-server/build.mjs` regenerates the committed game-core and country-data snapshots, with no unrelated generated artifacts.
- Release gates and bounded local smoke are recorded below.

## Implementation

- Added `REMOTE_PROFILE_SYNC_ENABLED: false` to `multiplayer-config.js` and passed the flag through `game-ui.js`.
- Kept `ProfileManager` local-first when disabled, made `GameTracker` operate without a remote queue, and made disabled remote operations safe no-ops.
- Omitted PIN, Player Code, recovery, and permanent-delete UI in local-only mode; replaced sync/offline copy with “Saved on this device.”
- Bumped retained-route cache-busters for the changed profile/config/UI assets.
- Added `tests/profile-system.test.cjs` with five focused tests.
- Regenerated only `multiplayer-server/shared/game-core.cjs` and `multiplayer-server/shared/countries.json` through `npm --prefix multiplayer-server run build`.

## Verification evidence

- Starting branch/HEAD: `codex/fix-root-interaction-recovery` / `735776f681b14d38f126962cd7f1ad4c5f8b81a3`.
- `node scripts/check-governance.mjs`: passed (`Governance check passed (21 required files).`).
- `node --test tests/*.test.cjs`: passed 64/64, including the five new profile tests.
- `npm --prefix multiplayer-server test` before build: passed 16/16.
- `npm --prefix multiplayer-server run build`: passed (`Built multiplayer Worker.`).
- Generated review: `shared/game-core.cjs` is byte-identical to `game-core.js`; `shared/countries.json` exactly matches `scripts/load-game-data.cjs`; only the two approved generated targets changed; no Worker security/routing source changed.
- `npm --prefix multiplayer-server test` after build: passed 16/16.
- `git diff --check`: passed.
- Browser smoke on `http://localhost:8000/legacy/` at the clean `localhost` origin: created two local profiles, switched between them, reloaded with the selected profile retained, completed a scored World Conquest answer/result, confirmed local stats in the profile, accepted Flag Recall input, and exercised keyboard map selection. The UI showed “Saved on this device”; PIN, Player Code, recovery, permanent-delete, and remote-sync copy were absent. Browser console had no warning/error entries on this local-origin smoke.
- Desktop Chrome smoke: the cinematic root loaded live 3D, launched the retained World Conquest route inside the root shell, accepted an India answer for 110 points, and showed the desktop HUD/map/answer dock without a release-blocking overflow.
- Browser smoke at 390×844: the retained game and profile dialog fit without horizontal overflow; profile local-only controls remained correctly omitted.
- Browser smoke on the cinematic root: root loaded with live 3D presentation, Home navigation returned to `/#main-content`, and a local multiplayer room was created, joined from a second origin, and left by both participants. The room was not deployed.
- A pre-existing root diagnostic was observed during the 3D/route smoke: a `MutationObserver` timing error and Google’s rejected `gestureHandling: "NONE"` warning. They did not prevent the requested smoke flows and are outside this bounded profile/snapshot package; no unrelated fix was made.
- Google configuration review: no runtime Google config file changed; the existing browser key remains in `public/runtime-config.js`; no private/server credential was introduced; account-level referrer/API restrictions were not observable locally.

## Remaining production-only checks

Production-origin profile persistence/storage failure, deployed Worker room smoke, Google browser-key referrer/API restrictions, physical-device touch/safe-area/zoom, screen-reader and reduced-motion checks, and post-deployment critical-flow verification remain **MANUAL VERIFICATION REQUIRED**. No deployment was performed.

## Rollback and release result

Revert the single checkpoint commit to restore the prior profile bootstrap/UI and committed snapshots; no storage migration or remote data rollback is required. Nothing was pushed, merged, or deployed.

## Unresolved decisions

None. Any future re-enablement of remote profile sync requires a separately approved backend contract; any generated diff beyond direct root-source parity requires implementation review.
