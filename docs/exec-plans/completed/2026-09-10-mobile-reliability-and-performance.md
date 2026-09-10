# Mobile reliability and performance fixes

Status: completed 2026-09-10. Local preview and verification are in scope; production deployment requires a separately verified hosting path.

## Impact assessment

```text
Requested change: Fix the Explore answer race, oversized duplicate geometry, main-thread globe cost, small-country targeting, missing root voice input, accidental-navigation session loss, and rigid local-development CORS; inspect adjacent mobile rendering and reliability issues.
Affected workstreams: root Explore bridge and controls, retained Free Map bridge, local globe rendering and hit testing, country geometry delivery, game route/session lifecycle, multiplayer Worker origin validation, responsive/accessibility styling, tests and operational documentation.
Routes/components affected: / and ?game=explore|countries|capitals|world-conquest|find-country|capital-clash|flag-recall|flag-match|multiplayer; index.html, styles.css, src/main.js, src/root-interactions.js, src/map-adapter.js, src/country-geometry.js, legacy/index.html, game-ui.js, multiplayer-server/worker.mjs, country geometry assets and focused tests.
Gameplay impact: answer rules, scoring, questions, timers, progression, country recognition, and results remain unchanged; active solo sessions gain an explicit navigation confirmation/continuation path instead of silent teardown.
Persistence impact: none planned — no storage key or schema change; session protection is in-memory only.
Map/globe impact: preserve the approved local/Google adapter contract while replacing timing-based answer scraping, reducing geometry transfer/parse cost, reducing software-render workload, and adding bounded small-country hit assistance.
Mobile impact: improve first-interaction responsiveness, touch target tolerance, microphone reachability, safe-area layout, and accidental back-swipe protection; verify portrait and short landscape explicitly.
Accessibility impact: add a named 44px voice control with unsupported/error states, keep typed equivalence, announce deterministic answer results, preserve keyboard focus, and avoid color-only feedback.
Performance impact: remove duplicate runtime geometry, ship a simplified authoritative geometry payload, reduce local raster resolution/frame work on constrained/mobile devices, and avoid redundant parsing in the retained frame.
Migration risk: medium — shared map/bridge and route/session boundaries change, but public gameplay/persistence contracts remain intact and every change is independently reversible.
Rollback path: revert this plan's focused source/test/style changes and restore the previous geometry assets; no persisted or server data rollback is required.
Required QA: governance, root tests, multiplayer tests, JavaScript syntax, asset-reference and geometry-integrity checks, transfer-size comparison, diff/secret review, and browser checks at desktop, constrained laptop, mobile portrait, mobile landscape, keyboard, reduced motion, microphone-unavailable, active-session navigation, and representative small-country selection.
Architecture risk: architecture-authority — this touches protected globe/map, routing/session, cross-frame, performance, accessibility, and multiplayer security boundaries.
```

## Acceptance criteria

- Explore typed and globe answers receive a structured result from the retained checker; no fixed sleep or DOM feedback scraping remains.
- Only one optimized country-geometry payload is shipped and used by both root and retained renderers, with valid country identity/properties and materially lower transfer/parse cost.
- The local fallback keeps its adapter contract and visual behavior while doing materially less main-thread pixel work, especially on mobile and while idle/hidden.
- Small and island countries have a bounded, deterministic selection aid without changing geographic answers or making large-country selection ambiguous.
- Root Explore exposes accessible voice input when supported, with typed input remaining available and truthful unsupported/error feedback.
- Browser back/forward does not silently destroy an active scored solo session; the user can stay in the run or confirm leaving.
- Production origins remain exact-listed while syntactically valid `http(s)://localhost[:port]` and loopback origins are accepted for local development.
- Existing gameplay, persistence, profiles, multiplayer rules, canonical routes, renderer fallback, and mobile first-screen launcher remain intact.

## Ordered implementation

1. Trace the exact retained answer, renderer, geometry, session, origin, and responsive contracts and add focused failing tests where practical.
2. Replace the cross-frame answer proxy with a structured retained API and add root voice input through the same submission path.
3. Consolidate and simplify country geometry with integrity/size checks; update retained/root loading without adding a dependency.
4. Reduce software globe work and add small-country targeting inside the existing adapter boundary.
5. Protect active solo sessions during browser history navigation without changing explicit in-app exit behavior.
6. Generalize local-development CORS safely and add Worker tests.
7. Run automated checks, launch the local preview, perform requested desktop/mobile browser QA, fix verified regressions, and record exact evidence.

## Verification evidence

- `node scripts/check-governance.mjs`: passed (21 required files).
- `node --test tests/*.test.cjs`: passed, 74/74.
- `npm --prefix multiplayer-server test`: passed, 17/17, including exact production origins, ports 3000/4173/5173/8080, IPv6 loopback, and denied lookalike origins.
- `npm --prefix multiplayer-server run build`: passed in `/private/tmp/country-memory-map-worker-build.tn4c20`; both generated shared snapshots were byte-equal to the repository copies.
- JavaScript syntax checks passed for all changed runtime modules; Python source compilation passed for both geometry scripts; `git diff --check` passed.
- Geometry measurements: the shipped bundle fell from 13,287,262 to 1,792,471 bytes (643,242 local gzip bytes); the duplicate 13,287,234-byte raw GeoJSON was removed. The optimized bundle parses as 258 features and 79,891 coordinate points; root data tests still recognize all 195 playable countries and every accepted capital spelling.
- Local HTTP smoke returned 200 for `/`, the current root stylesheet/module, the optimized geometry, the retained document, and the retained game stylesheet.
- Local in-app browser evidence covered desktop/constrained laptop, 320×568 and 390×844 portrait, and 667×375 landscape. The Home launcher, both Explore modes, voice control, retained setup, active Find layout, map key, and mobile typography/contrast remained legible and reachable.
- Structured Explore results were exercised consecutively: India returned “Marked India.”, Brazil then returned “Marked Brazil.”, and New Delhi in Capitals returned “Marked New Delhi, India.” without stale feedback.
- Find the Country rendered a transparent 35.8px fine-pointer target with a separate 8px visible marker; source/runtime policy supplies a 44px target for coarse pointers. Selecting Mauritius through the target advanced the round to 1/20 and returned the correct score message.
- Browser Back during that active round restored `?game=find-country`, focused the in-app Stay action, and preserved 1/20 progress after Stay. Leave was separately exercised and returned to Home.
- The map-key computed colors were `rgba(247, 252, 255, 0.97)` with `rgb(11, 42, 66)` text. No new console errors appeared after the final complete browser reload before the last deterministic 6px attribution-spacing adjustment.

## Unresolved decisions

- Production publishing was not assumed from a request for a live preview. The local preview is served at `http://127.0.0.1:8000/`; any deployment must follow the repository/Sites access and approval rules.
- Physical coarse-touch, actual microphone permission/recognition, safe-area hardware, screen reader, reduced-motion/forced-colors, 200% zoom, production-origin Google success/failure, and deployed multiplayer smoke remain manual QA. No voice recording was captured during this work.
- Browser-control quota ended while reloading after the final 6px portrait attribution-spacing adjustment. The immediately preceding portrait capture showed the map and controls correctly with a near-adjacent (not hidden) Google attribution strip; the final CSS source/test and served asset were verified, but that last spacing nudge was not re-captured.
