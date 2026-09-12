# Multiplayer invite and room-code reliability

Status: completed locally on 2026-09-12. The production defect was reproduced before implementation; the updated client is automated-verified and manually verified against the public room service. No deployment was authorized or performed.

## Impact assessment

```text
Requested change: Make shared multiplayer links reliably open the intended room for returning and first-time players, make room-code joining explicit, and prevent locally opened frontends from creating device-only rooms that remote friends cannot reach.
Affected workstreams: multiplayer route activation, stored-session recovery, endpoint selection, invitation and room-code UI, focused automated coverage, operator documentation, and production/local QA evidence.
Routes/components affected: ?game=multiplayer&room=<code>; multiplayer-config.js, multiplayer-service.js, multiplayer-ui.js, game-ui.js Friends-route profile suppression, legacy/index.html cache-bust references, multiplayer tests, and multiplayer-server/README.md. The room engine, D1 schema, gameplay rules, maps/globes, profile data/controls, and scored-game routes are unchanged.
Gameplay impact: none — room capacity, readiness, game configuration, questions, scoring, timers, ranking, host transfer, results, and rematch behavior remain unchanged.
Persistence impact: low and backward-compatible — the existing friend-session key remains; terminal stale sessions are removed instead of remaining active, and a newly accepted invite continues to replace the prior single-device room session. No remote schema migration.
Map/globe impact: none — the retained multiplayer surface and existing adapters remain unchanged.
Mobile impact: WhatsApp/deep-link ingress must prioritize the requested room, manual codes tolerate common spacing/hyphen formatting, and link/code actions remain usable in portrait and short landscape.
Accessibility impact: invitation failures must remain within the multiplayer panel with a specific recovery action; room-code inputs and copy actions need semantic names, keyboard activation, visible focus, and live status feedback.
Performance impact: no new dependency or polling interval; direct invites avoid an unnecessary poll of an unrelated stored room. Normal room creation uses one shared public service endpoint.
Migration risk: low — client control-flow and endpoint-default changes only; existing public-service sessions remain readable, while obsolete localhost sessions fail closed without sending their bearer token to an unconfigured origin.
Rollback path: revert the named client/config/cache-bust/test/documentation files and this plan; no database or stored-room rollback is required.
Required QA: reproduce stale-session invite hijacking before the change; focused route/session/endpoint/UI tests; governance; all root tests; multiplayer server tests; JavaScript syntax and diff checks; local direct-link, manual-code, stale/expired/not-found, reconnect, multi-client capacity, mobile portrait, short-landscape, keyboard, reduced-motion, and production service smoke. Deployment and post-deployment physical-device verification remain separate.
Architecture risk: architecture-authority — this repairs protected multiplayer routing, transport, and persistence boundaries while retaining their existing owners and public room contract.
```

## Verified current state

- On the production origin, room creation and a public cross-client join both succeeded against the configured persistent service.
- A live Chrome profile with an active stored session for `GEO3TGNH6` opened a different valid invite for `GEOV4AYLX`; the application polled the stored room first and rewrote the top-level URL back to `GEO3TGNH6`. This is the returning-player failure reported by users.
- Before this change, `CountryMemoryMultiplayer.open()` called `service.resume()` before honoring its `room` argument. A successful stale-room poll rendered and published that old code to the root route; a terminal stale-room poll left the stale session in storage and could display `THIS ROOM HAS EXPIRED` over the generic create/join screen.
- Before this change, loopback frontends preferred the device-local room database whenever port 8787 was reachable. Such rooms could not be joined by remote phones opening the public website.
- A fresh browser could also open the local profile-creation dialog while a direct Friends invitation was loading, temporarily obscuring a flow advertised as requiring no account.
- The existing server already creates a non-confusing nine-character code beginning with `GEO`, stores rooms in D1, supports one host plus eight friends atomically, and exposes code-based inspection/join endpoints. No schema or room-engine change was required for the reproduced defect.

## Acceptance criteria

1. A valid room in a shared link always takes precedence over a different stored session and cannot be replaced by the old room during initial route activation.
2. A returning member opens their matching active room; an expired, missing, or removed stored session is cleared and does not keep showing an obsolete “active room” action or toast.
3. Direct-link inspection failures stay on the multiplayer surface, retain the attempted code, and offer retry/manual-code/new-room recovery instead of falling back to Home.
4. Normal production and loopback room creation use the same public persistent service. Local service use remains an explicit developer override rather than an automatic choice.
5. The lobby prominently exposes both the invite link and room code, with Copy Link, Share, and Copy Code actions; the Home surface clearly separates Create a Room from Join a Room.
6. Manual code entry accepts uppercase/lowercase plus common pasted spaces or hyphens, submits from the mobile keyboard, and rejects malformed input before a request.
7. Existing nine-player gameplay, privacy, retry/idempotency, capacity, CORS, routes, profiles, maps, and solo games remain unchanged.

## Implementation

1. Direct-invite activation now pauses unrelated room polling and inspects the requested code first; a stored session resumes only when its normalized code matches.
2. Terminal stale sessions are cleared in the transport, polling resumes only after create/join succeeds, and bearer-token origin validation remains intact.
3. All normal clients default to the persistent public service; an allowlisted explicit localhost developer override remains available for isolated service testing.
4. The Friends UI clearly separates creation and joining, adds copy-code and keyboard/paste-friendly code handling, renders recoverable invitation errors in place, and prevents the local profile dialog from interrupting a Friends route.
5. Behavioral and source-contract coverage protects the reproduced race, stale-session recovery, endpoint selection, code normalization, updated controls, and Friends/profile boundary.

## Verification evidence

### Automated

- `node scripts/check-governance.mjs` — passed; 21 required files.
- `node --test tests/*.test.cjs` — passed; 113/113 tests.
- `npm --prefix multiplayer-server test` — passed; 18/18 tests, including one host plus eight friends, atomic tenth-player rejection, reconnect, host transfer, privacy, expiration, retry/idempotency, CORS, results, and challenges.
- `node --check game-ui.js`, `node --check multiplayer-config.js`, `node --check multiplayer-service.js`, and `node --check multiplayer-ui.js` — passed during focused verification.
- `git diff --check` — passed before documentation closeout and again in final review.
- The Worker build was not run because no room-engine, Worker, canonical game-core, country-data, or generated snapshot input changed. The server suite exercised the unchanged engine/API boundary.

### Manual browser and service

- Reproduced the original returning-player failure on the deployed frontend: a browser stored in active room `GEO3TGNH6` opened valid room `GEOV4AYLX`, polled the stored room, and rewrote the requested route back to the old code.
- With the updated local client using the public persistent service, created room `GEOX7CLGZ` from a device-hosted frontend. Its lobby exposed public invite `https://www.arunabhosom.com/country-memory-map/?game=multiplayer&room=GEOX7CLGZ` rather than the loopback browser address.
- From a browser retaining `GEOX7CLGZ`, opened `GEOV4AYLX`; the requested route remained authoritative, rendered `Join QA Host 0912’s room`, and successfully joined without resuming or publishing the stored room.
- Joined the same public room from another origin by entering `geo v4a-ylx` and pressing Enter. The code normalized to `GEOV4AYLX`, and four independent participants were visible in the lobby.
- Opened missing room `GEOQAT999`; the route and attempted code remained visible with Try Again, Enter a Different Code, and Create New Room actions instead of falling back to Home or retaining an expired-room toast.
- On a fresh browser origin with no player profile, a direct invitation reached the named Join Room screen with the name field focused and no profile dialog interruption.
- Captured and inspected Friends creation/joining at 390×844 portrait and 844×390 short landscape. The panel stayed within the phone viewport; landscape content remained internally scrollable, and keyboard focus revealed the code input and Join Room button.

### Remaining external verification

- The repository changes have not been deployed. Post-deployment public-origin smoke, WhatsApp opening on physical Android/iOS phones, Indian mobile-carrier/Wi-Fi latency and packet-loss behavior, safe-area hardware, screen reader, reduced-motion emulation, and nine simultaneous physical devices remain **MANUAL VERIFICATION REQUIRED**.
- Temporary QA rooms use the normal server expiry policy and were left to expire; no user room or production data was deleted.

## Rollback

Revert the files named in the impact assessment. Existing D1 rooms and browser storage remain compatible; no data repair or migration rollback is needed.
