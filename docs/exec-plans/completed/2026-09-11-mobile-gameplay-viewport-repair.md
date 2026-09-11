# Mobile gameplay viewport repair

Status: completed 2026-09-11. Local implementation and browser verification are complete; a subsequent release step was authorized for commit, push, deployment, and production smoke. Physical-device verification remains a separate release check.

## Impact assessment

Requested change: Repair mobile rendering, scrolling, keyboard occlusion, clipped bottom content, and missing essential navigation across the root and retained game screens on iOS and Android-sized viewports.
Affected workstreams: responsive presentation, retained GameShell, root-to-retained full-screen routing, browser viewport/keyboard behavior, mobile QA.
Routes/components affected: root Home/Explore shell; retained setup, active-game HUD/stage/answer controls, results, profile, and multiplayer presentation; shared responsive CSS and viewport metadata/runtime sizing only as inspection proves necessary.
Gameplay impact: none intended; game rules, answers, scoring, timing, progression, and lifecycle remain unchanged.
Persistence impact: none.
Map/globe impact: none intended; map rendering and selection behavior remain unchanged, while its available mobile layout space may be corrected.
Mobile impact: direct; portrait, landscape, dynamic viewport contraction, safe-area insets, scroll reachability, and software-keyboard behavior.
Accessibility impact: improve reachability, focus visibility, touch targets, zoom/reflow, and semantic availability of essential navigation; preserve existing announcements and keyboard behavior.
Performance impact: negligible; CSS/viewport/layout changes only, with no new dependency, payload, or network request.
Migration risk: low to medium — shared retained presentation rules span all scored games and must avoid desktop regressions.
Rollback path: revert the scoped HTML/CSS/runtime viewport changes and their contract tests; no data migration is involved.
Required QA: governance and root tests; local HTTP smoke; desktop and constrained-height desktop; 320x568, 375x667, 390x844, and representative Android portrait; 667x375 and 844x390 landscape; all five setup and active-game routes; setup, HUD, typed input with simulated contracted viewport, results/back navigation, profile/multiplayer representative surfaces; horizontal overflow, scroll-to-bottom, keyboard-only, reduced motion, and essential-control visibility; screenshot evidence.
Architecture risk: judgment-requiring (Level B) within the approved thin GameShell boundary; stop if a new routing, gameplay, renderer, persistence, or shared-primitive decision is required.

## Acceptance criteria

- Every mobile page can scroll to all interactive content without a fixed layer or browser UI permanently covering it.
- Active typed-answer games keep the current prompt and input/actions reachable when the visual viewport contracts for a software keyboard.
- The retained game header exposes a visible, usable Back to games or equivalent route action on mobile, while End round remains available during an active round.
- No unintended horizontal page overflow occurs at the required portrait or landscape widths.
- Primary controls remain at least 44 CSS pixels in coarse-pointer layouts and respect safe-area insets.
- Desktop presentation and protected gameplay behavior remain unchanged.
- Automated checks pass and requested multi-viewport screenshots are recorded with exact routes and viewport sizes.

## Implementation order

1. Reproduce and measure the current layout at required viewports and gameplay states.
2. Trace viewport sizing, overflow ownership, fixed/sticky layers, focus handling, and header action visibility.
3. Apply the smallest coherent shared responsive repair; add focused contract coverage.
4. Run automated checks and browser QA across representative routes/states.
5. Review the diff and move this plan to completed with exact evidence and remaining physical-device limits.

## Unresolved decisions

- None. The repair stayed inside the current GameShell, retained iframe, and canonical route boundaries.

## Verification evidence

- **AUTOMATED VERIFIED** — `node scripts/check-governance.mjs` passed (21 required files).
- **AUTOMATED VERIFIED** — `node --test tests/*.test.cjs` passed (95/95), including new retained visual-viewport, setup-scroll, keyboard-context, narrow alignment, flag viewport, short-landscape, and Geo Quiz chrome contracts.
- **AUTOMATED VERIFIED** — `npm --prefix multiplayer-server test` passed (17/17); no multiplayer server source or generated snapshot changed.
- **AUTOMATED VERIFIED** — `node --check src/main.js`, `node --check game-ui.js`, `node --check quiz-game.js`, and `git diff --check` passed.
- **MANUALLY VERIFIED WITH EVIDENCE** — Codex in-app Chromium against `http://127.0.0.1:8000/`; screenshots are attached to the 2026-09-11 Codex task browser record.
  - Home at 390×844: header, Explore input, globe, and all six game launchers fit with page width/scroll width 390 and height/scroll height 844.
  - Flag Match setup at 430×740: the header spans 8–70px, `Back to games` spans 17–61px, and the setup scroller spans 76–722px without overlap.
  - Find the Country setup at 320×568: the two-row narrow header exposes `Back to games` and profile; the setup panel scrolls from a 437px client height through 654px of content, reaching Start, rules, recent rounds, and storage copy.
  - Find the Country active at 320×568: document and app remain exactly 568px high with no horizontal overflow; the header, HUD, map, End round, profile, and prompt/control remain within 8–548px. The earlier 18px left shift is removed (`control` now spans 8–312px).
  - Flag Recall at 375×667 and Flag Match at 390×844: header, HUD, flag/choice stage, hint, typed answer or choice controls, and End round are fully visible; document scroll height equals viewport height.
  - Capital Clash at 430×740: document and app remain exactly 740px high; the map contracts to 352px and the complete prompt/input/action panel ends at 702px instead of expanding the surface to the reproduced 795px defect.
  - Software-keyboard simulation at 430×420 in World Conquest: parent and iframe viewport heights both resolve to 420px; the `keyboard-open` layout keeps the map, text field, Speak, Mark, and status copy within 0–420px with no document overflow.
  - Short landscape at 844×390: setup is a below-header 298px scroll region; active Capital Clash fixes the previous 688px document expansion and keeps header, HUD, 125px map, prompt, input, and actions within the 390px viewport.
  - Geo Quiz at 390×844: retained zoom controls and Map key are hidden while the quiz stage is active, removing the reproduced prompt/badge overlap; the quiz remains internally scrollable.
  - Results and profile at 390×844: results actions are visible in the 751px dialog; the 760px profile content scroller reaches all 1,098px of profile content and bottom actions while the page itself remains fixed to the viewport.
  - Multiplayer at 390×844: the panel sits below the header from 98–836px, scrolls independently, and exposes create/join/active-room/back actions without horizontal overflow.
  - Desktop at 1440×900: Capital Clash retains the existing map-backed setup composition, with `Back to games`, profile, setup, and Start visible and page scroll dimensions equal to the viewport.

## Outcome and remaining release checks

- The reproduced setup-header occlusion, portrait answer clipping, narrow horizontal offset, short-landscape expansion, keyboard viewport mismatch, and Geo Quiz chrome overlap are fixed locally.
- No gameplay, scoring, timing, persistence, country recognition, routing, renderer, or multiplayer-server behavior changed.
- **MANUAL VERIFICATION REQUIRED** — physical iOS Safari and Android Chrome safe-area/touch/real software-keyboard checks, screen reader, 200% zoom, and production-origin smoke. Local Chromium viewport emulation cannot truthfully substitute for those release checks.
- The implementation task itself did not include deployment. The user subsequently authorized a separate commit, push, deployment, and production-smoke step.
