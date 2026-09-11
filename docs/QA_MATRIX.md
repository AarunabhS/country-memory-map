# QA matrix

Use the QA evidence labels defined in [`MASTER_PROJECT_INDEX.md`](MASTER_PROJECT_INDEX.md): **AUTOMATED VERIFIED**, **MANUALLY VERIFIED WITH EVIDENCE**, **MANUAL VERIFICATION REQUIRED**, **KNOWN DEFECT**, **PLANNED AUTOMATION**, and **NOT APPLICABLE**. Passing automation does not complete a separate manual check or grant **PRODUCTION-VERIFIED IMPLEMENTATION** status. The 2026-09-10 mobile reliability pass includes local HTTP browser captures and interactions recorded in its execution plan; production-origin and physical-device evidence remain separate.

| Flow / condition | Automated evidence | Current QA status | Required evidence / gap |
|---|---|---|---|
| App load/start | **AUTOMATED VERIFIED** — static shell contracts; local preview returned 200 and requested root/renderer/geometry/retained modules | **MANUAL VERIFICATION REQUIRED** | Load root and retained route; check console, renderer transition, and recovery |
| Country entry/selection | **AUTOMATED VERIFIED** — engine/data/server answers plus both adapter callback identities, Google one-event delivery, mode policy, single-flight, cancellation, structured bridge submission, common renderer focus, local population coverage, and Explore fact-card contracts | **MANUALLY VERIFIED WITH EVIDENCE** for the earlier local typed Countries/Capitals and retained small-target selection; **MANUAL VERIFICATION REQUIRED** for the new highlight/fact presentation, physical touch, microphone, and production Google | Verify typed, spoken, and clicked India/Brazil selections update the same highlight and fact card; verify close/reopen, unavailable population copy, renderer recovery, coarse touch, and production Google |
| Correct answer | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Verify current root/retained feedback and count plus map/flag result layers |
| Incorrect answer/retry | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Penalties, reveal, focus, and feedback timing |
| Score/streak/accuracy | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | HUD and result presentation match engine values |
| Progression/timer/completion | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Transition timing, manual end, and background/deadline behavior |
| Flag Recall / Flag Match | **AUTOMATED VERIFIED** — root | **MANUAL VERIFICATION REQUIRED** | Asset load, neutral alt text, choices, hints, and unusual ratios |
| Free map | **AUTOMATED VERIFIED** — direct structured bridge preparation/submission contracts, additive resolved-country metadata, Explore fact formatting, and population snapshot coverage | **MANUALLY VERIFIED WITH EVIDENCE** for the earlier local typed Countries/Capitals; **MANUAL VERIFICATION REQUIRED** for the new highlight/fact presentation, microphone input, and the full retained matrix | Verify India then Brazil plus New Delhi update the visible root highlight/facts without stale state; retained labels, filters, physical microphone, and reset remain open |
| Local persistence / bests | **AUTOMATED VERIFIED** — root | **MANUAL VERIFICATION REQUIRED** | Reload, corrupt/denied storage, and Practice Missed |
| Player profiles | **AUTOMATED VERIFIED** — `tests/profile-system.test.cjs` covers local creation, selection, stats, reload persistence, disabled requests/queue, and local-only controls | **MANUALLY VERIFIED WITH EVIDENCE** for local release smoke; **MANUAL VERIFICATION REQUIRED** for production origin | Remote profile sync is default-off for this release; production-origin profile persistence and storage failure remain open |
| Multiplayer rooms/challenges | **AUTOMATED VERIFIED** — server engine covers one host plus eight friends, atomic tenth-player rejection, shared question order, independent answers, reconnect, host transfer, DNF, and results | **MANUALLY VERIFIED WITH EVIDENCE** for local nine-session HTTP gameplay and the desktop/mobile lobby in the current execution plan; **MANUAL VERIFICATION REQUIRED** for nine physical browsers/devices and production | Nine physical browsers/devices, reconnect, host transfer, DNF, results, and deployed-origin smoke |
| Multiplayer source/snapshot parity | **AUTOMATED VERIFIED** — documented Worker build regenerated snapshots and byte-parity was checked | **MANUAL VERIFICATION REQUIRED** for the deployed Worker | Re-run the documented build after future rule/data changes; production Worker smoke remains open |
| Desktop layout | **AUTOMATED VERIFIED** — Home/launcher structural CSS contracts | **MANUAL VERIFICATION REQUIRED** | Verify Home, each setup/game/result layer, local globe, Google globe, and constrained laptop height |
| Mobile portrait | **AUTOMATED VERIFIED** — compact first-screen launcher, safe-area, voice control, and 44px coarse-target contracts | **MANUALLY VERIFIED WITH EVIDENCE** at 320×568 and 390×844 in the local browser; **MANUAL VERIFICATION REQUIRED** for remaining devices | Local captures covered Home and active Find the Country with no overlap; check 375×667, 768×1024, safe-area hardware, and physical touch |
| Mobile landscape / short viewport | **AUTOMATED VERIFIED** — compact left launcher and 44px primary-control contracts | **MANUALLY VERIFIED WITH EVIDENCE** at 667×375 for Home/setup; **MANUAL VERIFICATION REQUIRED** for physical devices and all result layers | Check 844×390 plus active HUD, result, software fallback, and safe-area behavior on hardware |
| Keyboard-only | **AUTOMATED VERIFIED** — typed handler and local-globe arrow/plus/minus/Home bindings | **MANUAL VERIFICATION REQUIRED** | Verify focus order/visibility, Enter submission, globe keys, game launch/back, and dialogs |
| Screen-reader semantics | No automated check | **MANUAL VERIFICATION REQUIRED** | Landmarks, names, live regions, and dialog focus/return |
| Reduced motion | **AUTOMATED VERIFIED** — selected CSS presence | **MANUAL VERIFICATION REQUIRED** | All motion feedback remains understandable |
| Google 3D globe available | **AUTOMATED VERIFIED** — behavioral adapter event and terminal recovery contracts | **MANUAL VERIFICATION REQUIRED** for the current Home | Verify attribution, country selection, camera controls, key restrictions, drag/touch discrimination, and production origin |
| Google 3D failure/slow state | **AUTOMATED VERIFIED** — local globe is immediate; failure/geometry failure/45s timeout lock recovery against late Google replacement | **MANUAL VERIFICATION REQUIRED** | Force blocked script, invalid key/permission, geometry failure, and timeout; verify Home remains playable and truthful |
| Retained 2D app | **AUTOMATED VERIFIED** — retained source/iframe-linkage contracts | **MANUAL VERIFICATION REQUIRED** | Verify the retained route independently; this does not prove root fallback exposure or per-game deep links |
| Home local-globe fallback | **AUTOMATED VERIFIED** — local adapter, shared callback, animation cap, reduced motion, and renderer recovery structure | **MANUAL VERIFICATION REQUIRED** | Verify rotation, drag-versus-click, typed checker, country selection, keyboard rotation/zoom, visibility pause, and low-power responsiveness |
| API/error/offline states | **AUTOMATED VERIFIED** — selected multiplayer server errors | **MANUAL VERIFICATION REQUIRED** | Friends unavailable/expired/rate-limited, profile mismatch, and storage failure |
| Accessibility contrast/touch/zoom | **AUTOMATED VERIFIED** — explicit root/GameShell/legend foregrounds, system-font stack, WebKit text fill, visible focus, 44px coarse targets, forced colors, and reduced motion | **MANUALLY VERIFIED WITH EVIDENCE** for local mobile visual contrast and pointer selection; **MANUAL VERIFICATION REQUIRED** for assistive/physical modes | Actual coarse touch, safe-area devices, screen reader, reduced-motion emulation, forced-colors use, and 200% zoom remain open |
| Production deployment smoke | **NOT APPLICABLE** — no deployment in this recovery | **MANUAL VERIFICATION REQUIRED** for a future deployment | Production URL, assets, browser-key restrictions, and critical flows |

## Existing commands

```sh
node scripts/check-governance.mjs
node --test tests/*.test.cjs
npm --prefix multiplayer-server test
```

The Worker build is `npm --prefix multiplayer-server run build`. It regenerates committed snapshots, so use a disposable copy unless snapshot reconciliation is explicitly in scope. There is no current root lint, typecheck, build, Playwright, Axe, or visual-regression command.

## Minimum manual matrix for user-facing changes

Test every affected game/route at desktop, narrow mobile portrait, and short mobile landscape; repeat the affected flow with keyboard only and reduced motion. Include loading/error/fallback states whenever the change touches network, persistence, microphone, profiles, map/globe, or multiplayer. Record browser, viewport/device, route, result, and evidence location.
