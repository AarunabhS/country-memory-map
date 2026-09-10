# iOS retained-game header occlusion

Status: completed 2026-09-10. This is a Level B responsive presentation correction inside the established root-to-retained GameShell boundary.

## Impact assessment

```text
Requested change: Keep the shared game header and its buttons visible on iPhone Safari in Find the Country and World Conquest.
Affected workstreams: root retained-surface layering, mobile presentation, focused shell tests.
Routes/components affected: all retained game routes, especially ?game=find-country and ?game=world-conquest; root .topbar, .game-launcher, .globe-stage, and .legacy-map-frame.
Gameplay impact: none; rules, questions, timers, scoring, answers, and navigation handlers are unchanged.
Persistence impact: none.
Map/globe impact: none; the retained iframe and map renderer stay mounted and interactive.
Mobile impact: removes the hidden Home header's composited overlay so the retained game header remains visible below the device safe area.
Accessibility impact: removes inactive Home controls from layout/painting while the game is active; the retained header remains the accessible active surface.
Performance impact: slightly less retained-route painting because inactive Home chrome is not composited.
Migration risk: low — a reversible retained-surface CSS state change and cache-buster update.
Rollback path: restore the retained-surface visibility-only rule and prior stylesheet query value.
Required QA: governance, root tests, CSS diff check, localhost smoke, Find the Country and World Conquest mobile-width header inspection.
Architecture risk: judgment-requiring — shared root/retained layering is touched, but ownership and the iframe contract do not change.
```

## Acceptance criteria

- The retained game header, title, Back/End button, and profile control are not covered by root Home chrome.
- Find the Country and World Conquest use the same corrected shared behavior.
- Home continues to render its top bar and launcher normally.
- Desktop and other retained games remain unchanged.

## Verification evidence

- `node scripts/check-governance.mjs` passed (21 required files).
- `node --test tests/*.test.cjs` passed (76/76).
- `npm test` in `multiplayer-server/` passed (17/17).
- `git diff --check` passed.
- Localhost returned HTTP 200 for the updated root document.
- At a 430 x 932 browser viewport, Find the Country and World Conquest each showed the complete shared header, including the title, Back to games button, and profile control. Home retained its own top bar and launcher at the same viewport.
- Runtime inspection confirmed the inactive root top bar computes to `display: none` while the retained surface is active and the retained iframe remains visible.
- Physical iPhone Safari and production deployment verification remain release checks; neither was performed in this local change.

## Unresolved decisions

None. The inactive root layer is removed from painting and compositing only while the retained surface is active.
