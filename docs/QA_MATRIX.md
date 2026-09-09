# QA matrix

Use the QA evidence labels defined in [`MASTER_PROJECT_INDEX.md`](MASTER_PROJECT_INDEX.md): **AUTOMATED VERIFIED**, **MANUALLY VERIFIED WITH EVIDENCE**, **MANUAL VERIFICATION REQUIRED**, **KNOWN DEFECT**, **PLANNED AUTOMATION**, and **NOT APPLICABLE**. Passing automation does not complete a separate manual check or grant **PRODUCTION-VERIFIED IMPLEMENTATION** status. Root-recovery browser evidence below was captured in the Codex task on 2026-09-09 against local `http://127.0.0.1` origins; it is not production-origin or physical-device evidence.

| Flow / condition | Automated evidence | Current QA status | Required evidence / gap |
|---|---|---|---|
| App load/start | **AUTOMATED VERIFIED** — static shell contracts | **MANUAL VERIFICATION REQUIRED** | Load root and retained route; check console, network, and recovery |
| Country entry/selection | **AUTOMATED VERIFIED** — engine/data/server answers plus adapter callback identity, one-event delivery, mode policy, single-flight, cancellation, and bridge preparation | **MANUALLY VERIFIED WITH EVIDENCE** for affected local root flows; **MANUAL VERIFICATION REQUIRED** for production/devices | Inline local browser evidence: typed India, Countries click on Sudan, Capitals non-answering click, retained score/message, and staged messaging |
| Correct answer | **AUTOMATED VERIFIED** — root and multiplayer | **MANUALLY VERIFIED WITH EVIDENCE** for local root bridge; **MANUAL VERIFICATION REQUIRED** for full game matrix | Inline local browser evidence records root and retained “Marked” feedback/count; map/flag result layers remain open |
| Incorrect answer/retry | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Penalties, reveal, focus, and feedback timing |
| Score/streak/accuracy | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | HUD and result presentation match engine values |
| Progression/timer/completion | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Transition timing, manual end, and background/deadline behavior |
| Flag Recall / Flag Match | **AUTOMATED VERIFIED** — root | **MANUAL VERIFICATION REQUIRED** | Asset load, neutral alt text, choices, hints, and unusual ratios |
| Free map | **AUTOMATED VERIFIED** — direct bridge preparation and submission contracts plus data contracts | **MANUALLY VERIFIED WITH EVIDENCE** for root typed/click marks; **MANUAL VERIFICATION REQUIRED** for retained feature matrix | Inline local browser evidence shows supported Free Map activation and retained marks; labels, filters, speech, and reset remain open |
| Local persistence / bests | **AUTOMATED VERIFIED** — root | **MANUAL VERIFICATION REQUIRED** | Reload, corrupt/denied storage, and Practice Missed |
| Player profiles | No automated check | **KNOWN DEFECT**; **MANUAL VERIFICATION REQUIRED** | Local fallback; remote client/backend contract mismatch |
| Multiplayer rooms/challenges | **AUTOMATED VERIFIED** — server engine | **MANUAL VERIFICATION REQUIRED** | Two browsers/devices, reconnect, host transfer, DNF, and results |
| Multiplayer source/snapshot parity | **PLANNED AUTOMATION** | **KNOWN DEFECT** | Reconcile the stale committed snapshots before parity becomes a CI gate |
| Desktop layout | **AUTOMATED VERIFIED** — selected CSS contracts | **MANUALLY VERIFIED WITH EVIDENCE** for root; **MANUAL VERIFICATION REQUIRED** for all game/result layers | Inline local desktop capture shows live 3D, rails, attribution, and answer dock |
| Mobile portrait | **AUTOMATED VERIFIED** — shared clearance/safe-area structural contracts | **MANUALLY VERIFIED WITH EVIDENCE** locally; **MANUAL VERIFICATION REQUIRED** on devices | Inline captures and measured geometry at 320×568, 375×667, 390×844, and 768×1024: no dock/nav overlap or horizontal overflow; sheet and long copy exercised |
| Mobile landscape / short viewport | **AUTOMATED VERIFIED** — navigation-footprint and 44px contracts | **MANUALLY VERIFIED WITH EVIDENCE** locally; **MANUAL VERIFICATION REQUIRED** on devices | Inline capture and measured geometry at 667×375 and 844×390: dock and sheet clear the 240px navigation footprint with no horizontal overflow |
| Keyboard-only | **AUTOMATED VERIFIED** — typed handler | **MANUALLY VERIFIED WITH EVIDENCE** for affected root form; **MANUAL VERIFICATION REQUIRED** for all routes | Enter submitted through retained checker; Tab moved logically from input to Mark button; visible focus captured at a contracted 390×500 viewport |
| Screen-reader semantics | No automated check | **MANUAL VERIFICATION REQUIRED** | Landmarks, names, live regions, and dialog focus/return |
| Reduced motion | **AUTOMATED VERIFIED** — selected CSS presence | **MANUAL VERIFICATION REQUIRED** | All motion feedback remains understandable |
| 3D globe available | **AUTOMATED VERIFIED** — behavioral adapter event contract | **MANUALLY VERIFIED WITH EVIDENCE** locally; **MANUAL VERIFICATION REQUIRED** for production/gestures | Inline local captures show live renderer, attribution, and one visible globe click marking Sudan; key restrictions, drag/touch discrimination, and production origin remain open |
| 3D failure/slow state | **AUTOMATED VERIFIED** — initialization failure emits no country callback | **KNOWN DEFECT**; **MANUALLY VERIFIED WITH EVIDENCE** for local loading presentation; **MANUAL VERIFICATION REQUIRED** | Inline tablet capture records non-blocking loading presentation; root playable 2D exposure remains out of scope and unverified |
| Retained 2D app | **AUTOMATED VERIFIED** — retained source/iframe-linkage contracts | **MANUAL VERIFICATION REQUIRED** | Verify the retained route independently; this does not prove root fallback exposure or per-game deep links |
| Root playable 2D fallback | No automated check | **KNOWN DEFECT** | Failure path keeps the retained iframe hidden; implement before verification |
| API/error/offline states | **AUTOMATED VERIFIED** — selected multiplayer server errors | **MANUAL VERIFICATION REQUIRED** | Friends unavailable/expired/rate-limited, profile mismatch, and storage failure |
| Accessibility contrast/touch/zoom | **AUTOMATED VERIFIED** — selected 44px CSS contracts | **MANUALLY VERIFIED WITH EVIDENCE** for local target geometry/focus; **MANUAL VERIFICATION REQUIRED** | Browser geometry confirmed 44px answer buttons and visible focus. Contrast audit, actual touch, safe-area devices, screen reader, reduced-motion emulation, and 200% zoom remain open |
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
