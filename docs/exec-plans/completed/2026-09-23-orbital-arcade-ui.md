# Orbital arcade visual refresh

Status: completed in the working tree; deployment is separate.

## Impact assessment

Requested change: transform the UI into a modern game-inspired experience.
Affected workstreams: Home presentation and the existing shared cinematic shell.
Routes/components affected: Home, six solo setups, shared HUD/controls/results, Explore, Friends and profiles.
Gameplay impact: none; keep game engines, answer handlers, rules and deadlines unchanged.
Persistence impact: none; no new keys or data migrations.
Map/globe impact: presentation around existing canvas/SVG only; keep renderer, geometry, input and fallback ownership unchanged.
Mobile impact: responsive Home cards/hero; preserve bounded game stages and persistent setup footer.
Accessibility impact: semantic links, decorative art hidden, visible focus, contrast and reduced-motion styles.
Performance impact: CSS and small inline vector art; no dependencies, fonts, remote requests or new animation loops.
Migration risk: medium — shared CSS cascades require route and viewport QA.
Rollback path: revert this presentation patch; no data or server migration.
Required QA: governance and root tests; local browser Home, each solo mode, answer/results, Explore and Friends at desktop/portrait/landscape; keyboard and CSS motion/contrast review.
Architecture risk: architecture-authority (Level A) for shared visual tokens; implementation Level B.

## Boundary decision

Use the existing app.css (Home/layout) and game-shell.css (shared tokens/controls) owners. Restyle that thin shell instead of introducing a parallel component framework. Add Home links to existing canonical routes through the existing show() navigation so history and parked rooms retain their semantics. Hand-authored inline SVG/CSS art is decorative and carries no game data. No new runtime library or image payload.

The approved user request is the dedicated visual-design scope. Ink/lime colors, system type, consistent rounded rectangles, and restrained transform/opacity hover motion are shared presentation choices. Preserve gameplay map colors and flag assets for recognition. A full UI framework remains deferred.

## Implementation

- Rebuilt Home composition around the existing globe; six inline-vector mission cards use canonical links and the existing navigation handler. Modified clicks retain browser behavior.
- Updated the shared shell colors, controls, setup cards, HUD, profile labels, feedback colors, results and Friends form. Kept game engines and authentic geography assets unchanged.
- Extended the existing two-column landscape allocation to flags/Quiz and compressed the landscape HUD so Capital Clash's input/submit buttons fit. All four Flag Match answers fit together at 667×375.
- Isolated decorative SVG frames from global map CSS. Corrected small-phone heading sizing and retained the persistent setup action.

## Verification

**AUTOMATED VERIFIED**: `node scripts/check-governance.mjs`; `node --test tests/*.test.cjs` (157/157); syntax checks for `game-ui.js` and `src/app.js`; `git diff --check`. No dependencies or generated server snapshots changed. Server test/build are NOT APPLICABLE to this frontend presentation patch; no server/core sources changed.

**MANUALLY VERIFIED WITH EVIDENCE**: local HTTP preview in the Codex in-app browser. Evidence is the browser screenshots, accessibility snapshots and DOM bounding-box records emitted in the implementation task (2026-09-23), not a production claim.

| Viewport / flow | Evidence and result |
| --- | --- |
| 1280×720, all six solo routes | Setup Start actions and active controls stay inside viewport; no document horizontal overflow. Each mode launched through its actual Start button. |
| 390×844, all six solo routes | Each mode launched; visible active input/submit controls inside viewport, no horizontal overflow. Quiz stage and mobile results inspected visually. |
| 667×375, all six solo routes | Initial inspection identified insufficient flag/Quiz stage space and a clipped Capital Clash submit control. After layout correction, quiz and flag screenshots show usable side-by-side allocation; Capital Clash screenshot shows question, input, Speak and Mark inside the control panel. Remaining map modes and Flag Recall rechecked. |
| 320×568 and 390×844 Home | Hero and cards inspected. Final 320px heading and primary-button right bounds are 302px, preserving the 18px inset; document has no horizontal overflow. Library scroll/link works. |
| World Conquest, desktop | India accepted, score/count/streak updated; repeat India returns Already found; End round displays the same score in redesigned results. |
| Capital Clash, landscape | Rabat accepted for Morocco, +100 feedback. |
| Flag Match, landscape | Correct United States option accepted (+100); four-option layout captured. |
| Geo Quiz, portrait | Equatorial Guinea accepted for displayed language question; fact card, Next Question and shared results displayed. |
| Explore, 320px | Brazil updates count and country-facts panel. Final dark controls/lime primary action inspected after asset refresh. |
| Friends, portrait/landscape | Create/join form readable; focusing room code scrolls Join and Back controls into view in landscape. No external room was created. |
| Profiles, desktop | Existing create-player dialog opens; no profile created. Labels and primary-action CSS corrected after inspection. |
| Keyboard | Typed country/capital submissions, Enter on Home, then Tab/Enter into Solo catalog verified; Start receives focus. Visible focus inspected in screenshots. |

Reduced-motion and forced-colors rules were reviewed in source; their actual device rendering remains **MANUAL VERIFICATION REQUIRED**. No claim of full accessibility audit. Screen-reader announcements, physical touch/software-keyboard/safe-area behavior, live multiplayer sessions and physical microphone transcription remain **MANUAL VERIFICATION REQUIRED**. CSS and runtime smoke do not establish field performance or production readiness.

## Performance and review

No runtime dependency, font service, remote artwork request, new animation loop, engine/rules edit or persistence migration. The changed entry assets grew approximately 7 KiB when summed as separately gzipped files against HEAD; this is a source-size comparison, not network/Web Vitals evidence. It remains below the 50 KiB compressed exception threshold. Actual field performance remains NEEDS QA.

Reviewed the diff for protected behavior, generated changes, secret exposure and route ownership. No deployment/push performed. Rollback is the scoped presentation patch. Durable visual choices recorded in ADR 0006.

