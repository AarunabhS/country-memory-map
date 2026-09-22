# QA matrix

Use the QA evidence labels defined in [`MASTER_PROJECT_INDEX.md`](MASTER_PROJECT_INDEX.md): **AUTOMATED VERIFIED**, **MANUALLY VERIFIED WITH EVIDENCE**, **MANUAL VERIFICATION REQUIRED**, **KNOWN DEFECT**, **PLANNED AUTOMATION**, and **NOT APPLICABLE**. Passing automation does not complete a separate manual check or grant **PRODUCTION-VERIFIED IMPLEMENTATION** status. The 2026-09-10 mobile reliability pass includes local HTTP browser captures and interactions recorded in its execution plan; production-origin and physical-device evidence remain separate.

| Flow / condition | Automated evidence | Current QA status | Required evidence / gap |
|---|---|---|---|
| App load/start | **AUTOMATED VERIFIED** — static shell contracts; local preview returned 200 and requested app/renderer/geometry modules | **MANUAL VERIFICATION REQUIRED** | Load Home, canonical game links and the legacy redirect; check console and recovery |
| Country entry/selection | **AUTOMATED VERIFIED** — engine/data/server answers plus map contracts, cancellation, local population coverage and fact formatting | **MANUALLY VERIFIED WITH EVIDENCE** for the earlier local typed Countries/Capitals and retained small-target selection; **MANUAL VERIFICATION REQUIRED** for physical touch, microphone and production origin | Verify typed, spoken, and clicked India/Brazil selections update the same highlight and fact card; verify close/reopen, unavailable population copy, coarse touch and production origin |
| Correct answer | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Verify current game feedback and count plus map/flag result layers |
| Incorrect answer/retry | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Penalties, reveal, focus, and feedback timing |
| Score/streak/accuracy | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | HUD and result presentation match engine values |
| Progression/timer/completion | **AUTOMATED VERIFIED** — root and multiplayer | **MANUAL VERIFICATION REQUIRED** | Transition timing, manual end, and background/deadline behavior |
| Flag Recall / Flag Match | **AUTOMATED VERIFIED** — root | **MANUAL VERIFICATION REQUIRED** | Asset load, neutral alt text, choices, hints, and unusual ratios |
| Free map | **AUTOMATED VERIFIED** — direct structured bridge preparation/submission contracts, additive resolved-country metadata, Explore fact formatting, and population snapshot coverage | **MANUALLY VERIFIED WITH EVIDENCE** for local typed Countries/Capitals and restored facts/reset/close (2026-09-23 repair record); **MANUAL VERIFICATION REQUIRED** for microphone input and remaining map interactions | Verify India then Brazil plus New Delhi update the visible SVG highlight/facts without stale state; physical microphone, labels and filters remain in the hardware matrix |
| Local persistence / bests | **AUTOMATED VERIFIED** — root | **MANUAL VERIFICATION REQUIRED** | Reload, corrupt/denied storage, and Practice Missed |
| Player profiles | **AUTOMATED VERIFIED** — `tests/profile-system.test.cjs` covers local creation, selection, stats, reload persistence, disabled requests/queue, and local-only controls | **MANUALLY VERIFIED WITH EVIDENCE** for local release smoke; **MANUAL VERIFICATION REQUIRED** for production origin | Remote profile sync is default-off for this release; production-origin profile persistence and storage failure remain open |
| Multiplayer rooms/challenges | **AUTOMATED VERIFIED** — server engine covers one host plus eight friends, atomic tenth-player rejection, shared question order, independent answers, reconnect, host transfer, DNF, and results; client tests cover direct-invite precedence, stale-session clearing, public endpoint/share selection, formatted codes, and recovery UI | **MANUALLY VERIFIED WITH EVIDENCE** for local nine-session HTTP gameplay plus the 2026-09-12 public-service-backed link/code/returning-session/fresh-player browser matrix; **MANUAL VERIFICATION REQUIRED** for nine physical browsers/devices and the deployed fix | Nine physical browsers/devices, reconnect, host transfer, DNF, results, and post-deployment origin smoke |
| Multiplayer source/snapshot parity | **AUTOMATED VERIFIED** — historical snapshot refresh; this repair built in a disposable copy and compared outputs | **MANUAL VERIFICATION REQUIRED** for the deployed Worker | Country snapshot unchanged; only LocalProfile comparison code differs in the generated core. Committed snapshots were not changed; production Worker smoke remains open |
| Desktop layout | **AUTOMATED VERIFIED** — Home/launcher structural CSS contracts | **MANUAL VERIFICATION REQUIRED** | Verify Home, each setup/game/result layer, local globe, SVG map, and constrained laptop height |
| Mobile portrait | **AUTOMATED VERIFIED** — compact first-screen launcher, safe-area, voice control, Friends panel, and 44px coarse-target contracts | **MANUALLY VERIFIED WITH EVIDENCE** at 320×568 and 390×844 in the local browser, including the 2026-09-12 Friends create/join surface; **MANUAL VERIFICATION REQUIRED** for remaining devices | Local captures covered Home, active Find the Country, and Friends with no overlap; check 375×667, 768×1024, safe-area hardware, and physical touch |
| Mobile landscape / short viewport | **AUTOMATED VERIFIED** — compact left launcher, scrollable Friends panel, and 44px primary-control contracts | **MANUALLY VERIFIED WITH EVIDENCE** at 667×375 for Home/setup and 844×390 for Friends create/join with keyboard-revealed controls; **MANUAL VERIFICATION REQUIRED** for physical devices and all result layers | Check active HUD, result, software fallback, and safe-area behavior on hardware |
| Keyboard-only | **AUTOMATED VERIFIED** — typed handler, Friends Enter handler, and local-globe arrow/plus/minus/Home bindings | **MANUALLY VERIFIED WITH EVIDENCE** for formatted room-code submission and short-landscape focus reveal in the 2026-09-12 plan; **MANUAL VERIFICATION REQUIRED** for the remaining app | Verify full focus order, globe keys, game launch/back, and dialogs |
| Screen-reader semantics | No automated check | **MANUAL VERIFICATION REQUIRED** | Landmarks, names, live regions, and dialog focus/return |
| Reduced motion | **AUTOMATED VERIFIED** — selected CSS presence | **MANUAL VERIFICATION REQUIRED** | All motion feedback remains understandable |
| Retired Google 3D and iframe entry | **NOT APPLICABLE** to current entry point | Historical plans preserve earlier evidence | Current `index.html` loads one document, local globe and SVG map; `/legacy/` redirects |
| Home local-globe fallback | **AUTOMATED VERIFIED** — local adapter, shared callback, animation cap, reduced motion, and renderer recovery structure | **MANUAL VERIFICATION REQUIRED** | Verify rotation, drag-versus-click, typed checker, country selection, keyboard rotation/zoom, visibility pause, and low-power responsiveness |
| API/error/offline states | **AUTOMATED VERIFIED** — multiplayer terminal-session clearing, initial connection failure, retry reconciliation, and selected server errors | **MANUALLY VERIFIED WITH EVIDENCE** for missing-room recovery in the 2026-09-12 plan; **MANUAL VERIFICATION REQUIRED** for remaining failures | Friends unavailable/expired/rate-limited, reconnect under real packet loss, and storage failure |
| Accessibility contrast/touch/zoom | **AUTOMATED VERIFIED** — explicit root/GameShell/legend foregrounds, system-font stack, WebKit text fill, visible focus, 44px coarse targets, forced colors, and reduced motion | **MANUALLY VERIFIED WITH EVIDENCE** for local mobile visual contrast and pointer selection; **MANUAL VERIFICATION REQUIRED** for assistive/physical modes | Actual coarse touch, safe-area devices, screen reader, reduced-motion emulation, forced-colors use, and 200% zoom remain open |
| Production deployment smoke | **NOT APPLICABLE** — no deployment in this recovery | **MANUAL VERIFICATION REQUIRED** for a future deployment | Production URL, assets, critical flows and deployed asset versions |

## Existing commands

```sh
node scripts/check-governance.mjs
node --test tests/*.test.cjs
npm --prefix multiplayer-server test
```

The Worker build is `npm --prefix multiplayer-server run build`. It regenerates committed snapshots, so use a disposable copy unless snapshot reconciliation is explicitly in scope. There is no current root lint, typecheck, build, Playwright, Axe, or visual-regression command.

## Minimum manual matrix for user-facing changes

Test every affected game/route at desktop, narrow mobile portrait, and short mobile landscape; repeat the affected flow with keyboard only and reduced motion. Include loading/error/fallback states whenever the change touches network, persistence, microphone, profiles, map/globe, or multiplayer. Record browser, viewport/device, route, result, and evidence location.

## 2026-09-13 multiplayer recovery evidence

**AUTOMATED VERIFIED** — microphone permission/start lifecycle, response-aware polling, parked session retention, and immediate timed-room completion after all players end. **MANUALLY VERIFIED WITH EVIDENCE** — local two-origin gameplay, early DNF results/rematch, Home membership retention/reentry, copyable room code, keyboard Home action, and desktop/portrait/landscape captures in the [execution record](exec-plans/completed/2026-09-13-multiplayer-voice-results-latency.md). **MANUAL VERIFICATION REQUIRED** — physical iPhone speech and permissions, device background behavior, assistive/reduced-motion modes, deployed frontend/Worker, and mobile-network latency.

## 2026-09-13 Flag multiplayer and answer transport

**AUTOMATED VERIFIED** — Flag room validation/hints/replay, nine concurrent answers, redundant poll writes, rate gating, retry/departure isolation, and Quiz speech control lifecycle. **MANUALLY VERIFIED WITH EVIDENCE** — two local browser players in Recall/Match, typed/keyboard answers and hints, reconnect, portrait/landscape layout and Quiz Speak/reveal/next controls. See the [execution record](exec-plans/completed/2026-09-13-fast-answers-flag-multiplayer.md) for measurements and limits. **MANUAL VERIFICATION REQUIRED** — physical microphone, production rollout and live mobile latency.

## 2026-09-22 Safari voice lifecycle

**AUTOMATED VERIFIED** — capture readiness, one callback per event, immediate reuse after a final answer, ten simulated Canada answers, multiword corrections, cancellation and stalled-session recovery; 151 root and 26 server tests passed. **MANUALLY VERIFIED WITH EVIDENCE** — local Chromium typed/keyboard input and simulated voice UI at desktop, portrait and landscape sizes; see the [execution record](exec-plans/completed/2026-09-22-safari-voice-reliability.md). **MANUAL VERIFICATION REQUIRED** — actual Safari transcription on the reported iPhone 15 Pro Max (Canada fails about eight of ten attempts), other physical browser speech, accessibility modes and deployment. Simulated results do not establish hardware latency or recognition accuracy.

## 2026-09-23 P0/P1 defect repairs

See the [repair evidence](exec-plans/completed/2026-09-22-p0-p1-defect-repair.md) for scoped automated and local browser results. That evidence supersedes the older architecture references above; it does not promote physical speech, screen-reader, forced-colors, software-keyboard or production checks to passing. **PLANNED AUTOMATION**: full assistive/browser accessibility regression coverage. **KNOWN DEFECT**: the reported physical Safari voice failure remains unresolved on hardware until the existing lifecycle fix is tested on that device.
