# Root interaction recovery execution plan

Status: implemented with automated and local browser evidence; awaiting review and unsupported device/production QA. No commit or deployment authorized.

## Playable 2D fallback impact assessment

```text
Requested change: Automatically expose the existing retained playable 2D game if Google 3D has a definitive initialization failure or is not usable after roughly 45 seconds.
Affected workstreams: root renderer lifecycle, retained iframe presentation and focus ownership, focused root automated tests.
Routes/components affected: cinematic root `/`; retained `legacy/index.html` is reused without modification.
Gameplay impact: 3D country submission is disabled once 2D is active; retained gameplay remains the sole game engine.
Persistence impact: none — existing retained session and storage are reused.
Map/globe impact: Google 3D remains normal path; a one-shot recovery coordinator gates ready/failure transitions.
Mobile impact: none beyond the existing retained iframe becoming the active surface.
Accessibility impact: cinematic answer controls become inert, iframe is exposed and focused, and a status announcement describes the fallback.
Performance impact: one initialization timeout and no new dependency/network request.
Migration risk: low — reversible root presentation/lifecycle wiring only; no data migration.
Rollback path: revert the recovery module and root wiring; retained game, storage, and Maps adapter remain unchanged.
Required QA: focused fake-timer recovery tests, existing root and multiplayer regressions, diff check; limited available-browser smoke only.
Architecture risk: judgment-requiring implementation under the user-locked fallback contract; no new ownership or state-management architecture.
```

## Impact assessment

```text
Requested change: Repair Google 3D country-click delivery and mobile answer-dock/navigation overlap as two separable work packages.
Affected workstreams: root globe adapter/iframe bridge; root responsive layout; governance and QA.
Routes/components affected: cinematic root `/`; direct retained route behavior must remain unchanged.
Gameplay impact: Explore/Countries may mark clicked countries through the existing Free Map checker; Capitals/staged modes remain protected; game rules unchanged.
Persistence impact: none.
Map/globe impact: renderer-neutral callback forwarding and root-owned click policy; geometry/camera/fallback unchanged.
Mobile impact: answer dock, bottom navigation, safe-area ownership, short viewport and keyboard reflow.
Accessibility impact: typed keyboard-equivalent path, mode-correct input name, live feedback, 44px mobile targets, focus/reflow verification.
Performance impact: negligible; no dependency, payload, network, listener, or asset-class growth.
Migration risk: low-to-medium — protected root/retained and globe boundaries, but no data or route migration.
Rollback path: revert WP-A source/tests/ADR independently from WP-B CSS/tests; no irreversible effects.
Required QA: governance/root/multiplayer automation; diff review; desktop/mobile portrait/mobile landscape browser checks; keyboard, reduced-motion, loading/failure, safe-area and zoom checks where supported.
Architecture risk: architecture-authority for WP-A contract; judgment-requiring implementation for WP-B under existing responsive standards.
```

## Acceptance criteria

### WP-A — Google 3D country click

- Factory preserves callback identity and one polygon event emits one renderer-neutral payload.
- Explore/Countries authorize one retained Free Map country submission.
- Capitals, staged, unknown, and future undeclared modes submit nothing.
- The bridge explicitly enters retained Free Map before checking and does not duplicate recognition.
- Only one map answer is unresolved; later inputs are not queued; mode changes cancel pending work.
- Checker and Google initialization failures produce no answer mutation.
- Typed Enter remains available as the keyboard-equivalent path.

### WP-B — mobile dock clearance

- Named CSS properties own navigation height, safe-area insets, answer clearance, gap, and landscape navigation width.
- Portrait dock clears the full navigation plus bottom safe area and deliberate gap.
- Landscape dock reserves the navigation footprint and right/left safe areas without reducing targets below 44px.
- Dynamic viewport contraction does not strand the dock below a fixed minimum-height canvas.
- No unrelated topbar, mobile game-link, shell, fallback, or game changes.

## Ordered implementation

1. Record ADR 0001 and this plan.
2. Implement/test adapter callback forwarding.
3. Implement/test root mode policy, Free Map bridge preparation, single-flight, cancellation, and typed handler.
4. Implement/test shared mobile layout variables and portrait/landscape clearance.
5. Run required automation and diff checks.
6. Perform available browser QA and record exact evidence/gaps.
7. Update governance status documents only to observed verification level.
8. Leave all changes unstaged and uncommitted for review.

## Verification record

- `node scripts/check-governance.mjs` — passed; 21 required files.
- `node --test tests/*.test.cjs` — passed; 47 tests.
- `npm --prefix multiplayer-server test` — passed; 16 tests.
- `git diff --check` — passed.
- `git diff --stat`, `git diff --name-status`, and `git status --short --branch` — reviewed. Thirteen intended tracked/untracked paths are present; no generated multiplayer snapshots, runtime config, environment files, or unexpected assets changed. Separate whitespace checks for all five untracked files also returned no diagnostics.
- Worker build — not run because neither work package changes the Worker or its inputs, and the documented build would regenerate out-of-scope committed snapshots.
- Local in-app browser, root `/`, desktop — live Google 3D and attribution rendered; typed India and Brazil reached retained Free Map; typed Brasília reached the retained Capitals checker; a grounded visible globe click marked Sudan once in Explore/Countries; Capitals and Flag Sprint clicks left the answer field empty and produced non-answering feedback.
- Local in-app browser responsive geometry — 320×568, 375×667, 390×844, 768×1024 portrait and 667×375, 844×390 landscape had no answer/navigation overlap or horizontal document overflow. The answer button measured 44px high; mobile Play/Challenge sheet copy cleared the answer zone and navigation.
- Local in-app browser keyboard/reflow — Enter submitted the typed root answer, Tab moved from the input to Mark Country, a visible focus ring was captured, and a contracted 390×500 viewport retained dock/nav clearance. After retained initialization, focus remained on the root body and the hidden iframe measured `aria-hidden="true"`, `tabIndex=-1`, and zero opacity.
- Evidence location — multiple screenshots and DOM/geometry measurements are attached inline to the Codex task that produced this plan; no repository screenshot artifacts were created.
- Not supported by the available browser tooling and therefore still required: physical touch drag-versus-tap checks, notch/safe-area orientations, an actual on-screen keyboard, 200% browser zoom, reduced-motion emulation, screen-reader use, and a forced live-renderer failure presentation. Google initialization failure/no-callback behavior is automated, and a local non-blocking loading state was captured.
- Production deployment and production-origin QA are explicitly out of scope and were not performed.

## Rollback

- WP-A: revert `src/map-adapter.js`, `src/main.js`, `src/root-interactions.js`, their tests, and ADR/status updates.
- WP-B: independently revert the mobile variables/rules in `styles.css` and their structural tests/status updates.
- No stored data, generated snapshots, remote services, or user accounts require rollback.
