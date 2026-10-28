# Room privacy and public asset hardening

Status: **COMPLETE IN THE ISOLATED CHECKOUT**. Deployment and production verification remain separate.

Requested change: Audit and fix high-impact repository security issues without changing gameplay.
Affected workstreams: multiplayer room API, invite previews, public assets, browser policy, build dependency, security regression coverage.
Routes/components affected: `/rooms`, `/rooms/:code`, root invite route, `index.html`, `multiplayer-config.js`, `public/runtime-config.js`, local preview instructions, multiplayer package metadata.
Gameplay impact: Room rules, scoring, and player actions stay the same; new invite codes gain entropy and invite previews reveal less data.
Persistence impact: No schema change; existing room codes remain accepted.
Map/globe impact: The active local globe is unchanged; an unused Google Maps key is removed from a public asset.
Mobile impact: The invite screen retains host, game, and capacity information.
Accessibility impact: Invite labels and status stay in place.
Performance impact: No added runtime dependency or network request; preview responses become smaller.
Migration risk: Low — existing rooms and tokens remain valid; new room codes use the existing accepted length range; Drizzle is schema tooling only.
Rollback path: Revert the focused source and test changes; no data migration is required.
Required QA: governance, root and multiplayer tests, disposable Worker build, invite and action authorization probes, diff and secret review, desktop/mobile invite smoke where available.
Architecture risk: architecture-authority (multiplayer security boundary).

## Current-state map and decision

The Worker owns room creation, membership, actions, and D1 persistence. The browser sends a per-room bearer token for actions. `GET /rooms/:code` is used before joining to show an invite preview. Before this change, unauthenticated reads returned the full public room view and could persist deadline synchronization. An explicit mid-match departure marked the player as left but allowed that token to reactivate them on a later poll. The invite code is intended to authorize joining, not inspecting other players' standings or submitting actions.

Keep the invitation flow. Limit unauthenticated reads to fields used by the invite screen; never persist a room mutation from an unauthenticated read. Treat explicit departure as terminal for that bearer token while retaining the player record through an in-progress match. Continue accepting old codes while issuing longer new codes. Remove the unused Maps key from the published static file; key restriction or revocation remains a provider-side operation. The root document uses only local scripts and styles plus the configured room API, so a source-only Content Security Policy can block injected scripts without adding a request. A no-referrer policy prevents room URLs from appearing in outbound Referer headers.

## Findings and implementation

- Network inspection of the live canonical game URL showed GitHub Pages delivery, and the public friends API showed Cloudflare delivery. No non-loopback server IP literal, peer connection, STUN endpoint, or client-side API response containing the visitor's address was found in tracked application source. The reported owner-IP disclosure could not be reproduced without the address or network trace that showed it.
- The documented Python preview command listened on all interfaces by default. Both READMEs now bind it to `127.0.0.1`, keeping local testing off the LAN unless a developer deliberately chooses a different binding.
- All room actions continue through `member(room, authHash)` in the Worker. A missing token and a token from another room are rejected before a state write. Tests now cover every action. A token for a player who explicitly left also fails membership, including on GET polls. JSON requests are now capped while streaming, before the full body is buffered; the existing 250,000-character limit remains.
- Anonymous invite reads now return only the host name, game family and variant, room state, capacity, readiness counts, and timing needed by the existing invite screen. They never persist timer transitions. The browser accepts the new count fields and the older roster response during rollout.
- New codes have eight base-32 characters (40 bits) after `GEO`; old six-character codes remain accepted.
- The root document sets a no-referrer policy and a strict script Content Security Policy. Its former inline bootstrap moved into an existing same-origin script. An unused public runtime configuration no longer contains the Google Maps browser key.
- `drizzle-orm` was raised from 0.44.7 to 0.45.3 to clear the high-severity npm advisory. It is used only by schema tooling, not the Worker runtime. Four moderate advisories remain in `drizzle-kit`'s development-only `@esbuild-kit` chain; the audit's suggested fix is a major downgrade to an older CLI, so no forced downgrade was applied.

## Verification performed

- `node scripts/check-governance.mjs`: passed, 21 required files.
- `node --test tests/*.test.cjs`: passed, 158 tests.
- `npm test` in a disposable copy of `multiplayer-server`, followed by the focused server suite after the streaming limit change: passed, 30 tests.
- `npm run db:generate` with the upgraded lockfile in that copy: passed, no schema changes.
- `npm run build` in that copy: passed; the bundle contains the new authorization and preview code.
- Final npm advisory query: 0 critical, 0 high, 4 moderate, 0 low; remaining findings are in development tooling.
- Local browser smoke with a 127.0.0.1 frontend and room service: Friends screen, anonymous invite preview, two-origin host/guest join, guest Ready, host readiness, and room close worked under the new Content Security Policy. Keyboard entry into a solo game worked.
- `git diff --check`: passed. Source and diff reviewed for credentials, generated files, and unrelated changes. No generated snapshot or schema file was changed in the isolated checkout.

## Remaining external work

Publish the static frontend and rebuilt Worker together, then verify the deployed invite and game flows. Rotate or restrict the formerly published Google Maps browser key in its provider account and review usage/quota there; removing it from the current file does not revoke an existing key or erase Git history. Mobile device, screen-reader, and production smoke were not performed in this checkout.
