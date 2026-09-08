# QA matrix

Use the QA evidence labels defined in [`MASTER_PROJECT_INDEX.md`](MASTER_PROJECT_INDEX.md): **AUTOMATED VERIFIED**, **MANUALLY VERIFIED WITH EVIDENCE**, **MANUAL VERIFICATION REQUIRED**, **KNOWN DEFECT**, **PLANNED AUTOMATION**, and **NOT APPLICABLE**. Passing automation does not complete a separate manual check or grant **PRODUCTION-VERIFIED IMPLEMENTATION** status. No row earned **MANUALLY VERIFIED WITH EVIDENCE** during governance v1 because no browser QA was performed for this change.

| Flow / condition | Automated evidence | Current QA status | Required evidence / gap |
|---|---|---|---|
| App load/start | **AUTOMATED VERIFIED** — static shell contracts | **MANUAL VERIFICATION REQUIRED** | Load root and retained route; check console, network, and recovery |
| Country entry/selection | **AUTOMATED VERIFIED** — engine/data and server answers | **KNOWN DEFECT**; **MANUAL VERIFICATION REQUIRED** | Typed bridge needs browser evidence; live 3D click is disconnected because the factory drops its callback |
| Correct answer | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Visual feedback, announcement, and map/flag state |
| Incorrect answer/retry | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Penalties, reveal, focus, and feedback timing |
| Score/streak/accuracy | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | HUD and result presentation match engine values |
| Progression/timer/completion | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Transition timing, manual end, and background/deadline behavior |
| Flag Recall / Flag Match | **AUTOMATED VERIFIED** — root | **MANUAL VERIFICATION REQUIRED** | Asset load, neutral alt text, choices, hints, and unusual ratios |
| Free map | **AUTOMATED VERIFIED** — indirect data/bridge contracts | **MANUAL VERIFICATION REQUIRED** | Labels, zoom/pan, filters, speech, reset, and mark |
| Local persistence / bests | **AUTOMATED VERIFIED** — root | **MANUAL VERIFICATION REQUIRED** | Reload, corrupt/denied storage, and Practice Missed |
| Player profiles | No automated check | **KNOWN DEFECT**; **MANUAL VERIFICATION REQUIRED** | Local fallback; remote client/backend contract mismatch |
| Multiplayer rooms/challenges | **AUTOMATED VERIFIED** — server engine | **MANUAL VERIFICATION REQUIRED** | Two browsers/devices, reconnect, host transfer, DNF, and results |
| Multiplayer source/snapshot parity | **PLANNED AUTOMATION** | **KNOWN DEFECT** | Reconcile the stale committed snapshots before parity becomes a CI gate |
| Desktop layout | **AUTOMATED VERIFIED** — selected CSS contracts | **MANUAL VERIFICATION REQUIRED** | Root plus every game family and result layer |
| Mobile portrait | **AUTOMATED VERIFIED** — selected CSS contracts | **KNOWN DEFECT**; **MANUAL VERIFICATION REQUIRED** | Prior browser evidence found root answer-dock/navigation overlap; retest after implementation |
| Mobile landscape / short viewport | No automated check | **MANUAL VERIFICATION REQUIRED** | Stage, HUD, input, bottom navigation, and dialogs |
| Keyboard-only | No automated check | **MANUAL VERIFICATION REQUIRED** | All routes/actions, focus order, map alternative, and dialogs |
| Screen-reader semantics | No automated check | **MANUAL VERIFICATION REQUIRED** | Landmarks, names, live regions, and dialog focus/return |
| Reduced motion | **AUTOMATED VERIFIED** — selected CSS presence | **MANUAL VERIFICATION REQUIRED** | All motion feedback remains understandable |
| 3D globe available | **AUTOMATED VERIFIED** — source contract only | **KNOWN DEFECT**; **MANUAL VERIFICATION REQUIRED** | Browser-delivered key restrictions, production-origin load, selection, attribution, and gestures |
| 3D failure/slow state | No automated check | **KNOWN DEFECT**; **MANUAL VERIFICATION REQUIRED** | Root must expose the retained playable 2D implementation before the fallback can be verified |
| Retained 2D app | **AUTOMATED VERIFIED** — retained route/source contracts | **MANUAL VERIFICATION REQUIRED** | Verify the retained route independently; this does not prove root fallback exposure |
| Root playable 2D fallback | No automated check | **KNOWN DEFECT** | Failure path keeps the retained iframe hidden; implement before verification |
| API/error/offline states | **AUTOMATED VERIFIED** — selected multiplayer server errors | **MANUAL VERIFICATION REQUIRED** | Friends unavailable/expired/rate-limited, profile mismatch, and storage failure |
| Accessibility contrast/touch/zoom | No automated check | **MANUAL VERIFICATION REQUIRED** | WCAG AA review, 44px targets, and 200% zoom/reflow |
| Production deployment smoke | **NOT APPLICABLE** — no deployment in governance v1 | **MANUAL VERIFICATION REQUIRED** for a future deployment | Production URL, assets, browser-key restrictions, and critical flows |

## Existing commands

```sh
node scripts/check-governance.mjs
node --test tests/*.test.cjs
npm --prefix multiplayer-server test
```

The Worker build is `npm --prefix multiplayer-server run build`. It regenerates committed snapshots, so use a disposable copy unless snapshot reconciliation is explicitly in scope. There is no current root lint, typecheck, build, Playwright, Axe, or visual-regression command.

## Minimum manual matrix for user-facing changes

Test every affected game/route at desktop, narrow mobile portrait, and short mobile landscape; repeat the affected flow with keyboard only and reduced motion. Include loading/error/fallback states whenever the change touches network, persistence, microphone, profiles, map/globe, or multiplayer. Record browser, viewport/device, route, result, and evidence location.
