# Safari voice readiness and recovery

Status: completed locally. Physical iPhone transcription and production rollout are NEEDS QA; the reported Safari failure rate is not claimed resolved on hardware.

## Impact assessment

Requested change: inspect inconsistent/slow voice input, especially iPhone Safari, while preserving working functions.
Affected workstreams: shared voice lifecycle and its existing input/status wiring; regression tests.
Routes/components affected: existing Speak control in Explore, solo and multiplayer; static asset versions.
Gameplay impact: no rule, country/capital matcher, penalty, timing or scoring changes; preserve one answer per press and final transcript alternatives.
Persistence impact: none; no storage or schema changes.
Map/globe impact: voice wiring lives in world-map-runtime.js; renderer, geometry, selection and controller boundaries unchanged.
Mobile impact: distinguish startup from capture; prevent stalled sessions from trapping Speak; preserve cancellation and typed input in portrait/landscape.
Accessibility impact: accurate live status, pressed/busy labels and keyboard cancellation; no new animation.
Performance impact: eliminate duplicate event dispatch work and redundant recognition allocation; release completed sessions without waiting for delayed end; bounded timers cleaned up at completion/cancellation.
Migration risk: low — shared browser speech lifecycle, with event-order regressions required across all consumers.
Rollback path: revert this plan's source, tests and asset-version changes; no migration or Worker deployment.
Required QA: controller and real consumer tests; all root/server/governance checks, disposable Worker build; local browser smoke and mobile layout checks. Physical Safari/Chrome/Brave iPhone plus Android/Windows speech remain separate manual checks.
Architecture risk: judgment-requiring (Level B) — bounded lifecycle repair within the existing owner; no new provider, shared architecture, network or dependency.

## Inspection and acceptance

- Current code starts speech synchronously in the click handler with no getUserMedia preflight. Preserve this; the September 13 plan describes a historical two-tap flow, not current behavior.
- User device evidence: iPhone 15 Pro Max; speaking "Canada" reportedly fails about eight of ten times in Safari while Chrome on the same phone succeeds. iOS version is unspecified. This is the physical acceptance case, not a reproduced local measurement.
- VERIFIED CURRENT DEFECT: UI treats starting as listening; both addEventListener and on* register every callback; after final delivery UI says Speak while controller remains active until end; no timeout after listening starts.
- WebKit's [SpeechRecognizer implementation](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/speech/SpeechRecognizer.cpp) dispatches start before startCapture. Wait for audiostart (or sound/speech/result evidence) before telling the user to speak. [Web Speech events and stop](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) distinguish capture, service lifecycle and finalization.
- Preserve interim preview without guessing/auto-submitting a partial country during a pause. End-of-session interim fallback remains compatible, but withdrawn interim text must not be submitted.
- Stop after the browser signals speechend, allow final corrections, and recover from missing result/end events. Cancellation, navigation and stale callbacks never submit an answer.
- Completed results unlock the next click immediately; late callbacks cannot overwrite it. Keep unsupported/blocked microphone fallback and explicit optional permission support.

## Execution

1. Add deterministic regressions for delayed capture/final/end, duplicate delivery, cancellation and consumer UI.
2. Repair lifecycle and status/error wiring; bump only changed frontend assets.
3. Run applicable checks, inspect desktop/mobile locally and review diff; record physical-device limits honestly.

## Verification

- **AUTOMATED VERIFIED**: root tests passed 151/151, including 25 controller tests and five tests executing the real shared UI wiring with stubbed browser events. Coverage includes delayed/missing audio readiness, ten consecutive Canada answers, multiword corrections, final/end reordering, cancellation, withdrawn interim results, permission errors, IDL-only recognition, typed fallback and timer cleanup. Speech events are simulated; this does not measure transcription quality.
- Four focused regression checks fail against the original `HEAD:voice-input.js` and pass against the patch: start prematurely marks listening, speechend does not request finalization, the next start is rejected while waiting for end, and permission errors dispatch twice. Baseline log: `/tmp/cmm-baseline-voice-failures-0922.log`.
- Multiplayer tests passed 26/26. Worker build passed in disposable copy `/var/folders/1f/bdc4nn3x7y75sg4ygp4bdpp00000gn/T/cmm-build-0922-qe3otr82`; repository snapshots were not regenerated. Governance, JavaScript syntax checks and `git diff --check` passed.
- **MANUALLY VERIFIED WITH EVIDENCE**: local Codex in-app Chromium browser, actual frontend at `http://127.0.0.1:8022/?game=explore`, typed India marked successfully. At `http://127.0.0.1:8023`, a temporary server injected an EventTarget-based recognizer solely for QA (no real audio or permission request). Fixture: `/tmp/cmm-voice-preview-0922.py`; its temporary QA toolbar is not application code.
- Portrait 390×844 Explore: Starting status and wrapped instruction fit; service start alone does not show Listening. Injected audiostart, interim "United", speechend and final "United Kingdom" show Listening, preview, Finishing and exactly one marked country. Screenshots and accessibility snapshots are recorded in this task's browser tool results.
- Landscape 844×390 Explore: input/voice/Mark controls remain visible; keyboard Enter starts and cancels recognition; typed Brazil marks after cancellation. The landscape screenshot shows idle controls; state transitions are evidenced by accessibility snapshots.
- Desktop 1280×720 World Conquest: typed Canada scored 100; simulated final United Kingdom produced the second country, total score 230 and streak 2. Home during interim recognition cancels it; a later simulated final leaves Home unchanged. No captured console warnings/errors. Temporary viewport override reset and QA tab closed.
- Performance evidence: deterministic duplicate callbacks reduced from two to one; the next start succeeds immediately after final delivery instead of waiting for end. No device/network latency benchmark claimed. Source size: voice-input.js 11,561 → 12,811 bytes (local gzip 2,792 → 3,144); runtime 64,458 → 65,450 (gzip 15,771 → 15,972). Combined gzip growth 553 bytes; no dependency/network request added. Watchdogs allow 15 seconds for startup, listening and finalization; expiration retains text for manual editing/submission and never scores it automatically.

## Remaining device acceptance and delivery

**MANUAL VERIFICATION REQUIRED**: on the user's iPhone 15 Pro Max, compare ten Canada attempts each in Safari and Chrome on the same HTTPS deployment, after load and on repeated taps. Record iOS version, permissions, tap-to-Listening time, speech-to-preview/final time and accepted/failed attempts. Wait for Listening before speaking; repeated-country feedback counts as recognition and must not add score. Repeat with United Kingdom/New Zealand, cancellation, denied permission and typed input. Chrome/Brave on iPhone, Android Chrome and Windows Chrome/Edge speech remain physical regression checks. Native keyboards, VoiceOver, reduced motion and hardware safe areas were not tested.

Browser capture startup, speech service and network can still delay or fail; this patch fixes confirmed application lifecycle defects and does not guarantee hardware transcription. No audio warmup, persistent recording, auto-restart, provider switch or interim-word guessing was introduced.

Only `index.html`, `voice-input.js` and `src/world-map-runtime.js` need frontend publication. Asset versions are bumped for the two changed scripts. No commit, push, merge, deployment or production verification was performed. Revert these files and their tests/documentation to roll back; scoring, country/capital matching, storage and Worker code are unchanged.
