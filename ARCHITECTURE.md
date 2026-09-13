# Current application architecture

Updated 2026-09-13. Implemented in the working tree; deployment is a separate step. This replaces the former root/iframe architecture described in earlier design documents.

Status: **VERIFIED CURRENT ARCHITECTURE** in the working tree.

## One document and controller

`index.html` loads the country data, map runtime, shared game controller, voice controller, and room client directly. `src/app.js` handles home, game links, invites, and browser history. `CountryMemoryApp` is the controller's in-page navigation API; it does not cross a document boundary. `/legacy/index.html` only redirects old URLs.

The home globe uses the local canvas renderer. Google Maps is not loaded. Gameplay uses the existing SVG map for country picking, territory handling, labels, regional zoom, and small-country/keyboard targets. The home globe stops animation and interaction away from home. Neither renderer owns game rules.

## Rules and multiplayer

`game-core.js` owns solo rules and scoring. `game-data.js` adapts the shared country/capital/flag dataset. `game-ui.js` renders solo state or server-provided multiplayer state using the same controls. `game-shell.js` is presentation only.

The room server owns membership, readiness, match configuration, timing, answer validation, and ranking. Clients send completed answers, never keystrokes. Rooms include Flag Recall and Flag Match using the existing engine choices and hints. Scheduled polls pause during answer submission; independent database reads overlap, and unchanged room polls avoid writes until the five-second presence refresh. `multiplayer-service.js` stores the room token locally, polls state, retries reconnects, and ignores stale revisions. Session generations prevent late responses from restoring a room after departure. Leave clears the local session immediately and sends a best-effort authenticated departure request; an offline player is also subject to server disconnect expiry.

Room codes update browser history without restarting a match. Home can suspend the visible game while preserving a room for return. **Leave room** explicitly departs and stops voice. Async invite loading is invalidated on navigation so it cannot reopen a dismissed screen.

## UI and data

`app.css` owns navigation and home/room layout. `game-shell.css` supplies shared colors and controls; mode styles own their particular game layouts. The visual viewport and safe-area insets constrain mobile controls. Profiles are optional and never open automatically on first load.

Country geometry, flags, aliases, and capital data remain local assets. `src/world-map-runtime.js` and `world-map.css` contain the extracted map implementation, not another application. `scripts/load-game-data.cjs` reads this runtime for server snapshot generation.

## Verification boundaries

Automated suites cover rules, country/capital coverage, voice lifecycle, room transitions, retries, and stale departure responses. Browser QA checks real room creation/joining, readiness, scoring, reconnects, results, and responsive layouts. Microphone transcription additionally requires testing on a physical device with microphone permission. A local frontend test does not establish production deployment status.

Status notes for the project index: **VERIFIED CURRENT DEFECT** describes the former iframe split, now removed. There is no separate **PROPOSED TARGET ARCHITECTURE** or second application to migrate into. **NEEDS QA**: real-device microphone transcription and production rollout.
