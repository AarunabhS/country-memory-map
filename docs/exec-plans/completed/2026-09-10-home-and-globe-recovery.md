# Home and local-globe recovery

Status: completed 2026-09-10. Production deployment was not part of this plan.

## Impact assessment

```text
Requested change: Replace the static/retained-map failure presentation with the previously designed-style rotating local globe; expose the five scored games on Home; group Countries and Capitals under Explore; remove placeholder controls; restore cross-platform readable colors; audit adjacent irregularities.
Affected workstreams: root home composition, canonical game launcher, renderer recovery and local globe adapter, retained hosted-game setup presentation, shared contrast/accessibility styling, architecture and QA documentation.
Routes/components affected: root / and ?game=explore|countries|capitals|world-conquest|find-country|capital-clash|flag-recall|flag-match|multiplayer; index.html, styles.css, src/main.js, src/map-adapter.js, renderer lifecycle, retained GameShell presentation.
Gameplay impact: none — game-core.js remains authoritative for questions, rules, timing, scoring, retries, results, and saved outcomes; the retained Free Map checker remains authoritative for country/capital recognition.
Persistence impact: none — no key, schema, profile, room, or saved-result change.
Map/globe impact: Google 3D remains the preferred renderer; a dependency-free local orthographic globe built from the existing country geometry becomes the immediate loading/failure surface and keeps Explore playable without exposing the flat retained map.
Mobile impact: the root is recomposed so Explore and all five game launchers remain on the first screen, with compact portrait and short-landscape allocations and no bottom-navigation/dock collision.
Accessibility impact: semantic launcher groups, explicit status copy, keyboard globe rotation/zoom, typed country/capital equivalence, visible focus, reduced motion, forced-colors support, and non-color-only renderer labels.
Performance impact: removes the root's duplicate decorative/placeholder UI and static preview transfer from the page; adds no dependency or network request; reuses the already-required country geometry and caps local-globe raster resolution and frame rate.
Migration risk: medium — shared routing and map/globe ownership change, but engines, stored data, canonical game definitions, and server behavior remain untouched.
Rollback path: revert ADR 0002, root markup/styles/controller changes, local-globe adapter/recovery changes, retained hosted-presentation styling, focused tests, and status documentation. No data rollback is required.
Required QA: governance; all root tests; multiplayer tests; focused local-globe projection/recovery/launcher contracts; diff and secret review; manual desktop, narrow portrait, short landscape, keyboard, reduced-motion, Google success/failure, and all five launchers before production verification.
Architecture risk: architecture-authority — map/globe fallback, root/retained surface ownership, routing presentation, and shared GameShell treatment are protected boundaries.
```

## Acceptance criteria

- Home visibly exposes exactly five scored-game launchers: World Conquest, Find the Country, Capital Clash, Flag Recall, and Flag Match.
- Explore visibly contains Countries and Capitals and keeps the correct retained checker behind both local and Google globes.
- The local rotating globe is visible immediately, remains active after Google failure/timeout, supports drag/click plus keyboard rotation/zoom, and never exposes the retained flat map as the root fallback.
- Every game launcher opens the existing matching engine family/variant through the canonical URL and singleton retained iframe.
- Placeholder Daily Challenge, fake progress/session cards, inactive navigation, staging copy, decorative compass buttons, and inert footer actions are removed from Home.
- Root, hosted setup, gameplay, results, profile, and multiplayer text/control states use explicit high-contrast colors independent of OS color preference, with visible focus, forced-colors, and reduced-motion behavior.
- No gameplay, persistence, multiplayer rules, country recognition, API credential, generated multiplayer snapshot, or deployment configuration changes.

## Ordered implementation

1. Record the accepted local-globe fallback decision and update the root shell markup.
2. Add the dependency-free local globe adapter and update one-shot renderer recovery.
3. Simplify root routing/interactions and hosted retained-game setup without changing engine behavior.
4. Replace accumulated root CSS overrides with one responsive, accessible composition and harden GameShell contrast.
5. Add/update focused structural and behavioral tests.
6. Run applicable automated checks and review the full diff for scope, secrets, generated files, and documentation accuracy.
7. Record exact verification evidence and move this plan to completed only when the implementation is complete.

## Verification evidence

- `node scripts/check-governance.mjs` passed all 21 required-file checks.
- `node --test tests/*.test.cjs` passed 67/67 tests, including launcher, renderer recovery, local-globe callback, routing, game engine, profile, contrast-token, responsive, reduced-motion, and forced-color contracts.
- `npm --prefix multiplayer-server test` passed 16/16 tests; no multiplayer source, rules, or generated snapshots changed.
- `node --check` passed for `src/main.js`, `src/map-adapter.js`, `src/renderer-recovery.js`, and `game-ui.js`.
- `git diff --check` passed. The change list contains no generated multiplayer file, dependency, persistence schema, deployment configuration, or newly introduced credential.
- A local HTTP smoke returned 200 for the updated root. Earlier module requests confirmed the root, renderer, geometry, and retained assets load through the static server; this is asset-load evidence only, not visual or interaction QA.
- Reference solid-surface contrast contracts enforce at least 7:1 for root text/muted text and retained GameShell text/muted/control text. The checked pairs measured from 10.60:1 to 17.20:1.
- The Worker build was not run because its canonical engine/data/server inputs did not change and the build regenerates committed snapshots.

## Unresolved verification

- Physical touch, screen-reader, safe-area hardware, 200% zoom, and production-origin Google key/failure behavior require manual evidence after local implementation.
- Deployment requires a separate explicit action and production smoke check.
