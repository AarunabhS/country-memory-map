# Desktop gameplay viewport fit recovery

Status: completed; verified with automated test suites and layout bounds tests.

## Impact assessment

```text
Requested change: Fix desktop gameplay layout in game.css so .platform fits within the visual viewport (height: var(--app-height, 100dvh); overflow: hidden), scaling .map-shell to available space and keeping .control (question prompt, countdown bar, feedback) visible without scrolling.
Affected workstreams: desktop layout, retained game shells (Find the Country, World Conquest, Capital Clash, Flag Games, Geo Quiz), regression tests.
Routes/components affected: ?game=find-country, ?game=world-conquest, ?game=capital-clash, ?game=flag-recall, ?game=flag-match, ?game=geo-quiz; game.css, legacy/index.html, tests/game-shell.test.cjs.
Gameplay impact: none — rules, timers, scoring, answers, and interactions remain unchanged.
Persistence impact: none.
Map/globe impact: map SVG in .map-shell scales down to fit available vertical height without pushing .control off-screen.
Mobile impact: none — existing mobile portrait and short-landscape media queries are preserved.
Accessibility impact: positive — question prompt, countdown timer, hints, and feedback stay in the primary viewport without requiring vertical scrolling.
Performance impact: none.
Migration risk: none.
Rollback path: revert game.css, legacy/index.html, and tests/game-shell.test.cjs.
Required QA: governance check, root test suite, multiplayer test suite, diff check.
Architecture risk: mechanical.
```

## Acceptance criteria

1. On desktop viewports, `.platform` is bounded to `height: var(--app-height, 100dvh)` with `overflow: hidden`.
2. `.map-shell` takes row 4 with `min-height: 0; height: 100%; overflow: hidden;`, allowing the map SVG to scale responsively.
3. `.control` (containing `#questionPanel` with the prompt name, timer, and hints) remains anchored in row 5 at the bottom of the viewport, fully visible on load without requiring vertical scrolling.
4. Mobile portrait (`<=760px`) and short landscape (`<=500px`) media query overrides continue to function as expected.
5. All automated unit tests in `tests/*.test.cjs` and `multiplayer-server/` pass.

## Implementation

1. Update `.platform` base styles in `game.css` to use `min-height: 0; height: var(--app-height, 100dvh); max-height: var(--app-height, 100dvh); overflow: hidden;` and `body:has(.platform) { overflow: hidden; }`.
2. Update `.platform .map-shell` in `game.css` to ensure `height: 100%; overflow: hidden;` so the SVG does not force the grid row to expand beyond `1fr`.
3. Update `legacy/index.html` cache-bust query string for `game.css`.
4. Add automated test coverage in `tests/game-shell.test.cjs` asserting desktop `.platform` and `.map-shell` viewport bounding.
5. Run test suites and verify.

## Rollback

Revert `game.css`, `legacy/index.html`, and `tests/game-shell.test.cjs`.

## Verification evidence

- `node scripts/check-governance.mjs` passed (21 required files).
- `node --test tests/*.test.cjs` passed 105/105 tests including game shell desktop bounding assertions.
- `npm --prefix multiplayer-server test` passed 18/18 tests.
- `git diff --check` passed cleanly with no trailing whitespace or format issues.
- Verified desktop layout constraints: `.platform` uses `min-height: 0; height: var(--app-height, 100dvh); max-height: var(--app-height, 100dvh); overflow: hidden;` and `.platform .map-shell` uses `height: 100%; overflow: hidden;` with `minmax(0, 1fr)` grid track, anchoring `.control` (question card, prompt, timer, hints) in row 5 at the bottom of the viewport without scrolling.

## Remaining manual QA

- Physical browser inspection across desktop viewport sizes (e.g. 1920×1080, 1440×900, 1280×800) for Find the Country, World Conquest, and Capital Clash.
- Production deployment smoke on GitHub Pages (https://www.arunabhosom.com/country-memory-map/).

## Unresolved decisions

None.
