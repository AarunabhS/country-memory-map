# Multiplayer microphone, results navigation, and latency repair

Status: completed locally; no deployment performed. Physical-device microphone and production-origin verification remain open.

## Impact assessment

Requested change: Repair Speak startup, remove room-code instructions, return Home without leaving a finished room, and reduce multiplayer delay.
Affected workstreams: shared voice lifecycle, retained multiplayer UI/transport, room completion, focused tests and QA.
Routes/components affected: existing Home/Explore and multiplayer routes; no new route.
Gameplay impact: timed rooms enter RESULTS when all players finish, including DNF; scoring, deadlines, host-only rematch and readiness remain unchanged.
Persistence impact: existing room/session keys and server schema preserved; keep a finished room alive while its player browses Home.
Map/globe impact: renderer and checker ownership unchanged; existing retained navigation bridge used.
Mobile impact: microphone permission/retry and compact room/results controls, portrait and landscape.
Accessibility impact: cancellable microphone permission/start, clear status, keyboard-operable Home/code controls, DNF spacing.
Performance impact: compensate polling cadence for request duration without exceeding the existing foreground frequency; suppress hidden room rendering. Measure before/after with deterministic slow transport and local service; external latency remains separate.
Migration risk: medium — shared speech and multiplayer state transitions.
Rollback path: revert this slice's source/test/documentation changes; rebuild prior Worker. No data migration.
Required QA: voice lifecycle regressions, timed/manual/disconnected room completion, session retention, delayed transport timing, root/server/governance suites, disposable Worker build, local browser desktop/mobile checks. Physical iOS permission/speech and deployed-origin latency remain external gates.
Architecture risk: architecture-authority — bounded requested changes inside existing voice, routing bridge, transport and room-engine owners.

## Decisions and scope

- Keep the existing browser SpeechRecognition provider. Add explicit on-click microphone permission preparation, release the permission stream, and use a fresh click for speech start so browser gesture requirements remain satisfied. Never start recording on page load or auto-restart after cancellation.
- Complete a live timed round once everyone has ended; do not wait for unused timer time. Preserve finish/DNF scoring and host-only rematch.
- Home navigation preserves session credentials and keeps room presence at the existing background cadence. Background updates cannot reopen multiplayer or overwrite solo/Explore UI.
- Keep server-authoritative answers and bounded retries. Do not introduce WebSockets, alter latency compensation, or increase the configured polling rate.
- Remove the instruction card; show a compact copyable room code using existing GameShell colors.

## Verification

- `node --test tests/*.test.cjs`: passed 119/119. The first full run caught the stylesheet cache-version assertion after the required asset bump; its expected version was updated and the suite passed.
- `npm --prefix multiplayer-server test`: passed 20/20, including new all-finished timed-room and all-disconnected regressions.
- `npm --prefix multiplayer-server run build`: passed in disposable copy `/var/folders/1f/bdc4nn3x7y75sg4ygp4bdpp00000gn/T/cmm-build-59eoc4gh`; canonical snapshots in the working tree were not regenerated.
- JavaScript syntax checks passed for voice-input.js, multiplayer-service.js, multiplayer-ui.js, and src/main.js.
- Voice tests cover permission only on click, stream release before the next speech gesture, denial, cancellation, late permission grant, startup timeout, duplicate final suppression, silent end, and missing start with audiostart delivery. Physical microphone access was not requested in browser QA.
- Deterministic 750ms-response transport test: ordinary foreground request cadence changes from 2250ms (750ms request + 1500ms sleep) to 1500ms (750ms + 750ms). A 2000ms request keeps a 250ms sleep floor. Parked membership stays at eight seconds after a response; credentials survive and foreground resume works. These are simulated transport timings, not deployed latency gains.
- Read-only public curl measurements from the desktop: `/health` HTTP 200 in 3.212367s; two missing-room lookups HTTP 404 in 0.747816s and 0.780825s. Network/cache/warmth were uncontrolled; these three observations are diagnostic samples, not a latency baseline or mobile-carrier measurement.
- Local Chromium browser QA used `http://127.0.0.1:8013` for host and `http://localhost:8013` for guest, with isolated SQLite `/tmp/cmm-qa-0913.sqlite` and a temporary HTTP test harness injecting the existing allowlisted localhost override. No public room was created or altered.
- Room GEODKAD3F: host and guest joined, readied, and started two rounds. A typed India answer was accepted and scored. Both ended early as DNF; Final results and host Rematch / Change Game appeared while over 30 seconds remained. No Waiting for 0 players screen appeared.
- Guest Back to Home retained membership; background updates left Home visible. Host rematch retained both members; the guest returned through Play with Friends to the same room without entering a code/name again and explicitly readied for the next round.
- Inspected screenshots in this task: desktop 1280×720 results, phone 390×844 Home/lobby/results, and landscape 844×390 results. The room card displays only the copyable code; DNF no longer runs into player names. Landscape panel bounds were top 60px/bottom 382px, with 515px scroll content in 320px client height. Back to Home was reachable at the top and keyboard Enter activated it. Temporary viewport override reset.
- Existing manual limitations: physical iPhone Safari permission prompt and actual speech, hardware keyboard/touch/safe areas, reduced-motion emulation, screen readers, production deployment, and mobile-network latency remain MANUAL VERIFICATION REQUIRED.

## Delivery and rollback

Both static frontend assets and the rebuilt Worker must be published for the full repair. The frontend alone cannot change server RESULTS transitions. No push, merge, deployment, key change, schema change, or production data operation was performed. The unrelated Astra migration plan remains untouched.

The first microphone press explicitly requests access and releases the permission stream. After permission succeeds, the UI asks the player to tap Speak again; recognition starts directly in that new click. This follows the browser API's [click-triggered start pattern](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/start), but actual iOS speech success is not claimed. Revert this slice and rebuild the prior Worker to roll back; room and browser data remain compatible.

