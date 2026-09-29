# Post-repair release readiness

Status: **APPROVED FUTURE WORK** for release checks after the P0/P1 repair and orbital UI tasks. This record covers the current audit and the first bounded correction; it does not claim a complete release gate.

## Impact assessment

```text
Requested change: Reassess the game after the repair report and UI refresh, prioritize remaining release work, and start the next task.
Affected workstreams: release QA, result copy, content review, device accessibility/voice, production and field performance.
Routes/components affected: World Conquest result dialog and release documentation; no new route.
Gameplay impact: none — keep the result's existing remaining-country practice pool and scoring.
Persistence impact: none — no key or result schema change.
Map/globe impact: none — no renderer or hit-testing change.
Mobile impact: result copy must remain usable in portrait and short landscape.
Accessibility impact: clarify the practice action and summary for screen-reader users.
Performance impact: negligible text-only change; no new asset or request.
Migration risk: low — presentation copy only.
Rollback path: revert the result-copy and documentation patch.
Required QA: governance, root tests, production/local result inspection, diff review; device and production checks tracked separately.
Architecture risk: judgment-requiring audit; the bounded correction follows the existing result contract.
```

## Current evidence, 2026-09-23

- The repair record reports F01–F06, F08–F09, F11 and F14 repaired locally. F07 is addressed by truthful old-stat labels; the proposed skill-specific learning system was deferred. F10 began with eleven source checks and 41 independent fact checks open; this audit has added two source checks, leaving 39. F12 has local measurements and deferred Quiz loading, with field data open. F13 still requires physical voice and assistive checks.
- The later orbital UI task reports six routes inspected at desktop, portrait and short landscape. Its reduced-motion, forced-colors, screen-reader, touch and production caveats remain open.
- Fresh root tests passed 157/157 and server tests passed 26/26 in this audit. The canonical production frontend visibly serves the orbital Home and repaired Quiz setup; matching asset version tags alone do not prove byte parity. A production solo World Conquest answer for India scored and displayed results without captured console warnings/errors. The deployed Friends `/health` endpoint returned `ok: true`. A separate two-client room smoke is recorded below. These checks do not establish full production verification.
- A production one-country World Conquest result displayed “Countries to practise (194)” and “Practice Missed.” `game-core.js` intentionally defines those 194 as uncompleted pool countries; most were never attempted. Preserve that practice pool and correct its visible meaning.

## Ordered next work

1. Correct World Conquest result copy for the remaining-country practice pool, then verify the active result and its button in the local browser.
2. Complete independent source review for the remaining 39 Quiz prompts, accepted sets, hints and facts. Correct demonstrated errors with content-version discipline; do not mark broad dataset references as factual verification.
3. Run physical iPhone Safari Canada/multiword voice trials and device keyboard/background tests with the affected hardware; record actual success rates and permission behavior.
4. Run screen-reader, 200% zoom, forced-colors, reduced-motion and physical touch/safe-area journeys on representative devices. Fix reproduced defects and rerun affected journeys.
5. Measure cold/slow-network and low-end-device performance, then extend production frontend/Worker compatibility across remaining game modes and room recovery paths. Production deployment or changes remain separate actions.

Memory Atlas and other new progression work follow these release checks, consistent with the user's priority to close the existing experience first.

## Completion gate for this slice

The World Conquest result distinguishes unattempted remaining countries from actual misses, its practice action is still functional, root/governance checks pass, and the local UI displays the corrected copy. The broader release-readiness plan stays active until the remaining checks have evidence.

## First slice outcome

**AUTOMATED VERIFIED**: root tests 157/157, server tests 26/26 at audit baseline; after the result-copy change, root tests 157/157, governance, `node --check game-ui.js`, and `git diff --check` passed. Server code did not change after its audit-baseline run.

**MANUALLY VERIFIED WITH EVIDENCE**: local Codex in-app browser at 390×844 on `http://127.0.0.1:8765/?game=world-conquest`. After the cache-busted `game-ui.js?v=20260923-results1` loaded, entering India and ending the round displayed “Countries left to find (194)” and “Practice remaining.” Selecting that action started a 194-country practice round. The browser tool transcript contains the accessibility snapshots. This verifies the local UI and preserved practice pool, not production deployment of the correction.

## Content review progress

The Danube River Basin [commission](https://www.icpdr.org/danube-basin/danube-river-basin/danube-river-basin-overview-map) directly lists Vienna, Bratislava, Budapest and Belgrade as the four capitals on the Danube; its source does not establish the old worldwide superlative, which was removed. The [Baarle-Nassau municipal plan](https://www.baarle-nassau.nl/fileadmin/Bestanden_BaarleNassau/Projecten/Masterplan_Centrum_Baarle.pdf) documents 22 Belgian and eight Dutch enclaves and streets/buildings crossed by the border; the hint and fact now stay within that evidence. Both questions retain their prompts and accepted sets. Their `verifiedAt` dates are 2026-09-23; the remaining 39 questions are still explicitly editorial-only. The lazy Quiz import and its parent script version were changed to load the corrected content. Root tests passed 157/157, governance and syntax checks passed, and the final diff was reviewed after this edit.

## Second slice impact assessment — remaining Quiz content

```text
Requested change: Complete the next ordered task, independent review of the remaining 39 Geo Quiz items.
Affected workstreams: question-bank accuracy, review evidence, cache loading, release documentation.
Routes/components affected: Geo Quiz question data and the existing lazy import; no new route.
Gameplay impact: one flag question gains valid answers; several prompts, hints and facts are corrected or scoped. Timing and scoring rules stay the same.
Persistence impact: the content version changes so new results are identified against the corrected answer set; no stored schema changes.
Map/globe impact: none — only reference geometry is used to check two geography answers.
Mobile impact: question text length may wrap differently in portrait and short landscape.
Accessibility impact: question and fact copy must remain understandable in text and speech; no control changes.
Performance impact: no new runtime network request or dependency; question data grows slightly.
Migration risk: low — a content-version bump separates results made under different answer sets.
Rollback path: revert this content, import-version, and documentation patch together.
Required QA: governance, root tests, syntax and diff review; inspect representative Quiz layouts where feasible.
Architecture risk: Level B judgment within the established Quiz question-bank contract.
```

## Second slice outcome

**SOURCE CROSS-CHECKED**: the 39 formerly editorial-only Quiz items now have dated, scoped source-review records, bringing the bank to 52/52 source-checked items. The [content register](../../QUIZ_CONTENT_REVIEW.md) lists each reference and explains the source boundaries. One demonstrated answer-set gap was corrected: the displayed Bolivia, Haiti, Iran and Dominican Republic flags now count in the weapons category. Mainland coastlines and game coastline resolution are explicit where relevant; several unsupported superlatives, distances and historical claims were narrowed. `CONTENT_VERSION` was bumped to `quiz-52-20260923-source1`, and both import URLs were advanced to load it. No scoring rule, route, map renderer, or persistent schema changed.

**AUTOMATED VERIFIED**: governance, root tests 158/158, `node --check quiz-data.js`, `node --check game-ui.js`, and `git diff --check` passed after this slice. Multiplayer code did not change; its 26/26 audit-baseline result is recorded above, and it was not rerun here. **MANUALLY VERIFIED WITH EVIDENCE**: at a 1280×720 local browser viewport, a medium Geo Quiz round showed its question, hint, revealed answer list and revised Borneo fact without visible clipping. This checks one question flow, not every longer prompt or mobile layout. Physical-device, assistive, and production Quiz checks remain open under ordered work items 3–5. The release-readiness plan stays active.

## Production Friends smoke

**MANUALLY VERIFIED WITH EVIDENCE**: On the canonical production origin, one Codex in-app browser host and one independent Chrome guest joined a temporary two-player World Conquest Blitz room. Both clients showed the same readiness state; the host started the 60-second round. The guest submitted India (110 points), the host submitted China (100 points), and each client's live standings reflected both scores. After timeout, both clients showed the same ranking and their own result details. The host's Rematch / Change Game action returned both clients to the lobby and reset guest readiness. Both players left the room. Neither browser captured console warnings or errors during the round. Accessibility and DOM snapshots in the browser tool transcript are the evidence. This covers one game/mode and normal completion/rematch, not reconnect, disconnect, kick, remaining modes, or device browsers.
