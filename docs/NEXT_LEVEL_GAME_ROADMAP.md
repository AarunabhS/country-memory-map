# Country Memory Map: next-level product roadmap

Prepared 2026-09-22 against working-tree baseline `88c1f8f`.

**Status: PROPOSED TARGET ARCHITECTURE.** This is a completed audit and planning deliverable. Its recommendations are not approved implementation decisions or shipped behavior. Current behavior and new proposals are distinguished below. No production code, scoring, persistence schema, renderer, or deployed service was changed for this assessment.

## 1. Product direction

Make Country Memory Map a **living memory atlas**: a beautiful, approachable geography game that makes players feel their knowledge growing, gives them a useful next challenge, and lets friends share the experience.

The strongest investment is a connected loop:

**Play a short round → understand a mistake → practise that weakness → see progress on your atlas → return for a fresh challenge or a game with friends.**

The repository already contains much of the foundation. It does not need a wholesale rewrite. The priority is to make the existing experiences consistent and dependable, then build a few distinctive features that reinforce one another.

Recommended signature features, in order:

1. **Memory Atlas:** a personal map showing location, capital, and flag knowledge separately, with short recommended practice sessions.
2. **Confusion Lab:** targeted comparisons of countries or flags a player mixes up, followed by a delayed retest.
3. **Daily Expedition:** a small, curated daily journey with a shared challenge, useful facts, and a compact shareable result.
4. **Passport Journeys:** regional chapters that combine the existing games into a satisfying progression.
5. **Cooperative World Tour:** friends collectively complete a region, with contributions visible and everyone involved.

These are proposed differentiators for this game, not claims that no other game offers similar mechanics. Validate their appeal with players before building the larger versions.

Assumed audience: casual geography learners and small groups of friends, primarily on phones and laptops. Keep immediate guest play and optional profiles. Competitive public rankings, classrooms, and account synchronization can follow once their additional requirements are justified.

## 2. Scope, impact, and evidence

```text
Requested change: inspect the repository and prepare a detailed improvement roadmap.
Affected workstreams: product, game design, presentation, content, QA, performance,
  accessibility, local progression, multiplayer, and release planning.
Routes/components affected: documentation only in this task; recommendations cover
  Home, all solo modes, Explore, profiles, Friends, and shared presentation.
Gameplay impact: none from this deliverable; future rule changes are explicitly scoped.
Persistence impact: none from this deliverable; proposed mastery requires a versioned design.
Map/globe impact: none from this deliverable; preserve local globe and SVG gameplay map.
Mobile impact: none from this deliverable; sampled portrait and landscape during audit.
Accessibility impact: none from this deliverable; fuller verification remains required.
Performance impact: none from this deliverable; asset sizes measured, runtime budgets proposed.
Migration risk: low for this document; medium/high for future shared or persistent features.
Rollback path: remove this roadmap; future slices require their own reversible rollout.
Required QA: source-to-claim review, repository checks, sampled browser inspection,
  documentation-link validation, and final diff review.
Architecture risk: architecture-authority / Level A planning because proposals cross boundaries.
```

Inspected the current architecture and governance documents; entry point, routes and app controller; shared engine and country adapter; SVG map and home globe integration; shell and mode styles; quiz controller and content; profiles; multiplayer client, room engine and Worker; tests; and CI configuration.

**AUTOMATED VERIFIED on 2026-09-22:** 151/151 root tests, 26/26 multiplayer server tests, and the governance check passed. The root and server tests were run against the current working tree. The Worker build was not run: this is a documentation task, and that build regenerates snapshots.

**MANUALLY VERIFIED WITH EVIDENCE:** local in-app browser at `http://127.0.0.1:8000`; Home and solo setup at the default 884×793 viewport; Geo Quiz answer/reveal/completion and results at 390×844; mobile setup at 390×844; active Find the Country at 844×390; Explore typed India at the default viewport. Screenshots, accessibility snapshots, and the captured Quiz exception are in this task's browser tool results, not separate committed image files. Viewport override was reset after inspection.

**MANUAL VERIFICATION REQUIRED:** physical iOS/Android input and microphone, software keyboard, assistive technology, full keyboard journeys, all modes at all sizes, production deployment, real multiplayer sessions, packet-loss behavior, and performance on representative devices. This audit did not create public-service rooms, test every mode end to end, or establish production readiness.

## 3. What already deserves preservation

| Existing asset | Evidence | Why it matters |
| --- | --- | --- |
| One document and controller | `index.html`, `src/app.js`, `ARCHITECTURE.md` | A coherent base for improving navigation without another app migration. |
| Six solo choices | `game-ui.js`, `src/game-routes.js` | World Conquest, Find the Country, Capital Clash, Flag Recall, Flag Match, and Geo Quiz already provide variety. |
| Shared rules and deterministic engine for the main scored suite | `game-core.js`, server engine | Reuse validated mechanics; Geo Quiz is currently a separate controller. |
| Practice Missed, recent rounds, personal-best comparison | `game-core.js`, `game-ui.js` | Extend an existing learning loop; do not propose these as wholly new features. |
| Local profiles and cumulative statistics | `player-system.js` | Progression has a starting point, although its mastery semantics need refinement. |
| Private rooms for up to nine players, readiness, host transfer, results, rematch | multiplayer client/server | Keep the friendly, account-free social experience. |
| Asynchronous challenges with solo replay validation | `multiplayer-server/room-engine.mjs`, `multiplayer-ui.js` | Build daily and ghost experiences on existing challenge concepts. |
| Local SVG flags, aliases, capitals, border adjacency, outlines | country/flag modules | Distinctive teaching and new modes can reuse owned assets. |
| Enlarged small-country targets and keyboard map selection | `game-map.js` | Improve precision without discarding working interaction contracts. |
| Local home globe and working SVG map | `src/app.js`, map runtime | Preserve fast, provider-independent play. Google Maps is not loaded by the current entry point. |
| Existing CI and behavioral tests | `.github/workflows/quality.yml`, `tests/`, server tests | Broaden meaningful coverage instead of replacing the test system. |

The Home screen already has a clear visual identity and three understandable actions. The sampled landscape map layout also uses a sensible side panel and map split. Refine these strengths rather than replacing them simply to look different.

## 4. Findings that should shape the roadmap

P0 means fix before expanding the affected experience. P1 means high-value work in the next product release. P2 is a later investment or an experiment.

| ID | Priority and evidence | Finding | Recommended response |
| --- | --- | --- | --- |
| F01 | P0 · **VERIFIED CURRENT DEFECT**, reproduced | Completing Geo Quiz leaves “Practice Missed” enabled; clicking it throws `Cannot read properties of null (reading 'missedCountries')` at `game-ui.js:735`. `QuizGame.finishRound()` fills the dialog without supplying the outer controller's `result`. | Give results explicit capabilities and callbacks. Initially hide unsupported actions; then implement real quiz review/practice. Cover a full quiz completion in behavioral tests. |
| F02 | P0 · source demonstrated | Quiz bypasses the main engine's result/profile-recording path. Its finish handler does not call `LocalProfile.record` or the shared tracker. “Challenge Friends” depends on `result?.replay`, which Quiz does not set. | Add a normalized result/event boundary for Quiz; do not silently force its distinct mechanics into the existing engine. Make unsupported challenge behavior explicit. |
| F03 | P1 · **VERIFIED CURRENT DEFECT**, reproduced | Selecting Geo Quiz or Find the Country from the solo catalog changes the UI/title but leaves `?game=world-conquest` in the address bar. | Route catalog selection through the host navigation contract. Verify reload, Back/Forward, and copied game links. Avoid restarting an active round just to synchronize a URL. |
| F04 | P1 · observed UX issue | At 390×844, the tall six-card catalog puts the Start button below the initial visible setup area. The default desktop setup also requires scrolling. | Separate choosing a game from configuring it; show a persistent primary action and concise settings. Ensure keyboard focus reveals the selected control. |
| F05 | P1 · source demonstrated | Shared “Scoring & rules” describes the core engine's bonuses, while Quiz uses different speed/streak thresholds and category-answer semantics. | Render mode-specific rule explanations. Show the basis for points, hints, and accuracy; preserve current rules unless a separate rule change is approved. |
| F06 | P1 · source demonstrated | `LocalProfile.record()` comparison keys omit question time and question count. Its storage is device-wide, separately from named player profiles. | Define comparable result categories before expanding bests or rankings. Include material settings and rule/content version; distinguish device records from player records. Preserve old records as legacy categories. |
| F07 | P1 · source demonstrated product limitation | Profile “mastery” is a set of entities answered correctly at least once. Flag answers are grouped into country mastery; this is not a durable memory estimate. | Keep historical achievements intact, but introduce separate location/capital/flag evidence and a clearly defined review state. Avoid presenting one success as proven retention. |
| F08 | P1 · source and runtime evidence | `src/country-facts.js` and population data exist, but the active entry/app graph does not wire in a country facts surface. Explore typing India produced a highlight and “Marked India,” with no fact card. | Integrate an optional country notebook into the current controller; reuse existing data with a tested adapter for its differing field names. |
| F09 | P1 · source demonstrated content mismatch | Quiz asks for North/South/East/West in a country's name but explicitly accepts Central African Republic as a bonus. Another prompt says capital/country names are “exactly” equal while its own hint permits adding “City.” | Editorially reconcile wording and accepted answers. The CAF allowance has an explicit test described as user-mandated, so preserve the intended allowance and clarify the prompt unless its policy is deliberately revised. |
| F10 | P1 · source demonstrated | The 52-question bank has prompts, hints and facts but no per-question source/review metadata. Current tests validate schema and listed answers, not independent factual truth. | Add provenance, naming conventions, review dates, accepted-answer rationale and a content review checklist. Expand only after auditing existing questions. |
| F11 | P1 · observed/design assessment | Dark shells surround a bright pastel map, while many secondary controls are bright filled buttons. Multiple header layers, repeated titles and always-visible continent controls in Quiz compete with the actual question. | Establish shared visual roles and calmer hierarchy. Prototype map styling without altering recognition, geometry, territory semantics or hit testing. Remove irrelevant controls by mode. |
| F12 | P1 · source demonstrated measurement gap | `index.html` eagerly loads all mode scripts/styles and the geometry before the module entry. There is no measured production performance baseline. | Measure first, then defer optional features while preserving the current global boot dependencies. No framework rewrite is justified by this alone. |
| F13 | P1 · **NEEDS QA** | Speech lifecycle tests pass, but the latest execution record explicitly leaves real iPhone transcription unverified. Broader screen-reader and device checks are also open. | Treat physical voice and accessibility checks as release work, not completed capabilities inferred from tests. Keep typed/touch input immediately available. |
| F14 | P1 · documentation defect | Design, performance and QA documents still contain iframe/retained-app/Google-path descriptions; README omits Geo Quiz. Current source contradicts portions of that baseline. | Reconcile current documentation and mark historical sections. Do not base new implementation on retired architecture. |

Source locations above are repository-relative. See the source map at the end for clickable files. F01 and F03 are direct browser reproductions; other source findings have not all received exhaustive runtime reproduction.

## 5. Make the existing game feel professional

### 5.1 One clear journey into play

Keep Home's current Friends / Solo / Explore entry points. For a new solo player, offer “Quick start: 10 locations” and an optional three-question tutorial. Returning players can see “Continue practising” and their last mode. Introduce Daily only when it is ready; do not crowd Home with future features.

Replace the long setup overlay with a compact game catalog and a focused setup view. Each game card should communicate the action, typical session length, input method, and whether friends can play. Use a small real map/flag/outline preview rather than generic decorative thumbnails. Put advanced timing and region choices behind an expandable section. Keep Start visible and show the chosen rules directly above it.

Use one meaning for Home, Games, Back, End round, and Leave room. “Choose game” currently returns to Home in the sampled results flow; either change the destination or the wording. Preserve room parking versus explicit departure. Provide a resume-room card if a room remains active.

Acceptance: a first-time tester can begin a suitable solo round without instruction; all six games are discoverable; the primary action is reachable at 320px width and short landscape; navigation, URLs, reload and browser history agree.

### 5.2 A shared cartographic visual language

Recommended art direction: retain midnight navy, warm white text and restrained mint/cyan accents; emphasize crisp cartography and generous space. Use stars/glow mainly on Home and results. During play, the question, map/flag and answer feedback should dominate.

Approve shared tokens in `game-shell.css` before migrating mode styles: type hierarchy, spacing, surfaces, borders, focus, control states, HUD layout and motion. Numerical values should come from prototypes and visual checks, not become standards merely because they appear in this plan.

Specific changes:

- Replace duplicated game headings with one compact identity row. Use tabular numerals for scores/timers and stable spaces for changing values.
- Reserve the strongest filled button treatment for the next main action. Give secondary navigation, hints and map tools quieter but clearly interactive treatments.
- Prototype a muted ocean and restrained continent fills; use border/outline emphasis for selection and distinct patterns/icons for found, wrong and revealed states. Keep the existing readable map as a fallback until contrast and device QA pass.
- Reduce unnecessary panel borders and nested cards. Use a consistent shape and spacing vocabulary across setup, Quiz, flags, rooms, profiles and results.
- Replace interface emoji with a small consistent local icon set where they function as controls or branding. Preserve authentic flag SVGs and their proportions.
- Give empty, loading, offline, reconnecting and unavailable states the same visual care as success states.

Acceptance: a visual comparison sheet covers Home, setup, live play, answer feedback, results, profile and Friends at desktop/portrait/landscape. Existing game-specific rules and renderer ownership remain unchanged. Shell remains presentation-only.

### 5.3 Better moment-to-moment feedback

Use a predictable answer sequence: immediate local receipt, pending verification where needed, authoritative result, then next question. Multiplayer may acknowledge receipt immediately but must not award speculative points.

Correct feedback should briefly connect the answer to its map position and explain points when requested. Wrong feedback should identify the selected/expected distinction without repeatedly shaking the whole screen. Avoid long celebrations between rapid answers. Provide reduced/off effects globally, including guest play.

Add optional lightweight sound cues for correct, wrong, countdown and completion after a user gesture. Include independent sound and motion controls; voice capture should duck or suppress game sounds. Haptics are an optional enhancement where supported, never a requirement. No autoplay soundtrack is needed for the first release.

Review end-of-round presentation: one headline achievement, comparable best, accuracy definition, two or three concrete learning opportunities, and a clear next action. Keep full statistics expandable. Share cards should show mode/settings and assistance honestly and reveal no answers to an unfinished daily challenge.

Acceptance: feedback never delays deadlines or accepts late answers; no duplicate score updates; no layout shift from score text; audio failure does not affect play; results actions work for each mode.

### 5.4 Fair, understandable gameplay

Preserve current competition rules while separating “Learn” from “Challenge” configurations. Learning can offer unlimited time, optional hints and explanatory review. Comparable challenge records should use fixed, visible settings. Adaptive practice must not quietly alter the pool or difficulty of a ranked/shared challenge.

Difficulty currently uses editorial country lists and curated flag confusions. Improve these with observed anonymous aggregate performance only after instrumentation is approved; do not assume such data exists. Keep small pools from repeating early, and review regional coverage rather than continually serving only familiar countries.

Add a clear explanation when an alias, alternate capital, duplicate or territory is accepted differently. Preserve the established 195-country scoring policy. Include an accessible explanation of map coverage and territory treatment instead of changing classification during a redesign.

Acceptance: the same seed/configuration/rules version gives the same competitive challenge; practice and assisted results do not contaminate comparable records; all answer forms use the established country recognition contract.

## 6. Distinctive features with implementation plans

### A. Memory Atlas — highest strategic priority

**Experience:** choose Location, Capitals or Flags and see “New,” “Learning,” “Ready to review,” and “Confident” places on a personal atlas. A button offers a short session such as “Review five countries you mixed up recently.” Clicking a country shows its recent learning evidence and a useful next exercise.

**MVP:** existing engine modes only; local storage; separate evidence per country and skill; a bounded review queue; a readable list alternative to the map. Record correctness, retry/hint use, response time, last practice and next review. Treat assisted success differently from unaided retrieval. Label confidence as a game estimate, not a scientific diagnosis of memory.

**Implementation:** add an approved progression module fed by normalized answer/results events. `game-core.js` continues to own rules; the progression module chooses practice configuration, not live competitive outcomes. Extend versioned profile data through `player-system.js`. New atlas display uses the existing map adapter with separate styling. A map-click answer, typed country name and flag recognition must not all imply the same skill.

**Dependencies:** F01/F02 event/results boundary, best-category definition, persistence ADR. Start with simple inspectable scheduling rather than a machine-learning service.

**Acceptance:** review order is deterministic for a fixed clock/history; missed/hinted answers enter practice; old profiles load without loss; switching players isolates new mastery; denied storage still permits play; a textual list exposes the same actions. Preserve old mastery sets as historical “identified” achievements without inventing dated evidence.

**Measure:** review-session completion, next-day unaided success on reviewed items, and return visits. Compare like-for-like items; more practice clicks alone do not establish better learning.

### B. Confusion Lab — strongest near-term novelty

**Experience:** after confusing similar flags or neighboring countries, see a compact side-by-side comparison, one distinguishing clue, a locate/identify exercise, and a retest later. Examples can be selected from the existing curated flag-confusion relationships after editorial review.

**MVP:** start with 8–12 reviewed flag pairs. Include canonical SVGs, distinguishing features and one follow-up question. Expand later into country location and capital confusions. Make it a results/practice destination, not a popup during timed play.

**Implementation:** reuse `flag-data.js`, `flag-component.js`, result mistakes and question history. Store only the compact evidence needed to suggest a lesson; no new remote service. Use reviewed authored explanations rather than live generated facts.

**Acceptance:** all comparisons preserve flag proportions; hints do not leak into competitive rounds; display and explanation are usable without color alone; a subsequent test checks the confusion rather than memorization of button position.

**Measure:** repeat-confusion rate and delayed accuracy compared with ordinary missed-country practice. Continue investment only if the extra explanation helps.

### C. Daily Expedition — repeatable reason to return

**Experience:** a three-to-five-minute daily mission with a theme, a small set of questions and a spoiler-free route stamp. Initial themes might use a reviewed region, flag pattern or existing trivia category. Offer a friendly private comparison link.

**MVP:** one engine family per daily challenge, fixed seed/configuration and a curated content manifest. Build on the existing asynchronous challenge/replay concepts. Start with local completion and private sharing; a public leaderboard is a separate trust project. Mixed-mode expeditions come later, since a shared cross-mode score is not currently defined.

**Implementation:** identify a challenge by date/timezone policy, seed, rules version and content version. Specify archive availability, retries, hints, clock changes and offline behavior. A casual local completion may be device-based; an official competitive attempt needs a server-owned manifest/start and validated answers. Existing offline creator replay is not proof of identity or an attested timeline.

**Acceptance:** everyone on the same version sees the same challenge; boundaries around midnight are tested; past results remain interpretable; shares contain no room token or unrevealed answer; guest users can play immediately.

**Measure:** daily completion and voluntary return over seven days. Avoid punitive streak loss and notification prompts in the MVP.

### D. Passport Journeys — progression with purpose

**Experience:** complete regional chapters containing locate, flag and capital exercises, then demonstrate recall in a short mixed review. Earn a map stamp and a brief country/region story. A player can see a meaningful next destination.

**MVP:** one chapter with three existing-mode missions and a review. Keep all current free-play modes accessible. Rewards are visual milestones, not power advantages or restrictions on learning content.

**Implementation:** a declarative campaign manifest references mode configurations; completion uses normalized results. Specify assisted/unaided requirements and version chapter content. Reuse Memory Atlas evidence instead of creating a second mastery store. Do not combine unlike scores into an unexplained total.

**Acceptance:** incomplete chapters survive reload; old progress survives content updates; players can revisit lessons; the chapter works with keyboard/touch and optional voice. Validate one chapter with beginners and experienced players before authoring a world-sized campaign.

### E. Cooperative World Tour — later social flagship

**Experience:** two to nine friends fill a shared map. Rotate regional or skill responsibilities, celebrate complementary strengths, and show every player's contribution. Offer a relaxed group goal so slower players remain useful.

**MVP:** one short cooperative mode with shared completion and individual contributions, built on existing rooms. Specify whether teammates may answer the same target, how duplicate answers behave, who can reveal/hint, and what happens on disconnect or host transfer.

**Implementation:** server-owned team state and idempotent actions in `room-engine.mjs`; rendering through existing client/shell contracts. Start without chat, spectators or public matchmaking. These add separate moderation and load concerns.

**Acceptance:** simultaneous answers cannot double-count progress; every player receives the same shared state; reconnect and host transfer preserve the tour; all players can contribute; unfair late-answer advantages are tested.

**Measure:** group completion, participation distribution, and rematch rate. Existing competitive rooms remain available with unchanged behavior.

### Other worthwhile experiments, after the core roadmap

| Idea | Value | Boundary / reason to defer |
| --- | --- | --- |
| Border Relay: travel between countries using valid land borders | Turns existing adjacency into a spatial puzzle | Review border definitions, islands and territories; do not silently change the current classification. |
| Outline Detective: identify a shape, then locate it | Reuses country outlines in a new skill sequence | Define rotation/scale assistance and separate difficulty; first prove demand through a small prototype. |
| Ghost race against your own previous round | Makes improvement visible without needing live friends | Reuse replay data; compare identical settings/version and distinguish an offline replay from verified competition. |
| Custom practice packs | Lets players focus on a region, weak flags or a personal trip | Explicit pack identity and separate best categories; sharing is a later feature. |
| Classroom mode | Useful teacher-led group play | Needs roster/privacy, larger-room load, accessibility and teacher controls; private nine-player rooms are not already a classroom platform. |
| Localization | Broadens accessibility and audience | Externalize UI strings and establish language-specific aliases and geography terminology; pilot one language rather than auto-translating the answer model. |

## 7. Reliability, accessibility, content and operations

### Responsive and accessible play

Keep the current desktop/landscape map split as a useful starting point. For portrait, reserve space deliberately for header, prompt, stage and answer dock; the on-screen keyboard must not cover input or feedback. Use a sheet for secondary controls, with visible affordances for overflow. Do not make landscape a requirement.

Preserve 44px primary/coarse-pointer controls as the project target. WCAG 2.2's AA minimum target criterion is 24×24 CSS pixels with exceptions; these are different standards, and geography maps need equivalent usable interactions rather than mechanically inflating every country polygon. See [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Provide non-color cues for answer states and atlas progress, as described in [W3C use-of-color guidance](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html). Test dialog focus/return, readable status announcements and zoom. Do not announce every timer tick.

The existing keyboard map cursor helps sighted keyboard users, but a positional cursor alone does not demonstrate a usable screen-reader geography task. Test this with assistive technology; design an equivalent learning interaction when spatial identification is inaccessible, and label its scoring category honestly. Flag alt text must not give away an answer; offer a distinct text-based geography alternative where the visual recognition task itself cannot be equivalent.

Voice must remain optional. Expose Starting, Listening, Processing and Retry states clearly, preserve editable transcripts when uncertain, and never score transport failures as wrong answers. The latest physical Safari verification remains an explicit release gate.

### Content quality and discovery

Audit all 52 Quiz questions before expanding the bank. Record prompt ID, scope/naming convention, accepted aliases, bonus rationale, source URL, source date, last review, reviewer and content version. Distinguish population estimates by year. Give ambiguous questions explicit wording and explain capital variants. Keep existing territory policy and flag attribution.

Add an Explore notebook using existing facts, flags, capitals and neighbors. Begin with local data and a small panel containing “Practise this country.” Never show notebook answers over an active challenge. A reviewed “Why this answer?” link is more valuable than a large unverified fact feed.

Improve public presentation with a proper local app icon/favicon, description, share metadata, clear game descriptions and an About/data-sources page. A shared result image should communicate the game without requiring an account. Check the actual deployment path before implementing asset URLs. Do not add a tracking or font service as an incidental design dependency.

### Performance and offline behavior

Measured source sizes: `countries-data.js` is 1,792,471 bytes, 642,642 bytes with local Python gzip; `game-ui.js` is 58,122 bytes; `src/world-map-runtime.js` is 65,450 bytes. These are file-size measurements, not observed wire transfer, runtime memory or load times. Compression settings explain small differences from older documented gzip values.

First establish cold/warm performance on a representative mid-range Android device and laptop, plus iPhone Safari. Measure first usable action, LCP, INP, CLS, request count/transfer, long tasks, map response and repeated-navigation memory. Set production goals of p75 LCP ≤2.5s, INP ≤200ms and CLS ≤0.1, following [Web Vitals guidance](https://web.dev/articles/vitals); these are targets, not present results.

Then defer optional Quiz/profile/room/outline work and unnecessary assets only where measurement shows a gain. The current boot requires `GameMap` and country data even before the full controller is available, so moving script tags is not a safe lazy-loading design by itself. Trace consumers and loading/error states first. Preserve a single geometry payload and existing globe visibility pause.

An installable offline experience is a later delivery improvement: cache versioned app assets and selected practice packs, show what is downloaded, and offer a controlled update between rounds. Do not cache authenticated room responses or present offline scores as server-verified. Keep an immediate recovery path from a broken cache; preserve the repository's growth budgets.

### Multiplayer quality and trust

Improve the lobby with room presets, clearer readiness, a copyable code and optional QR invitation, accessible player states, and a post-round rematch flow. Copy/share/rematch already exist; polish them rather than reimplementing their transports.

Measure answer acknowledgment p50/p95, reconnect success, room creation-to-start time, and database/polling cost. Current foreground polling targets about 1.5 seconds and speed compensation is capped; do not describe it as fully real-time or latency-neutral. Consider a transport change only if measured experience or cost warrants it, with the existing polling route retained during rollout.

Guest sessions and offline creator replays suit casual friends. Public rankings would additionally require a clear identity policy, abuse controls, server-owned attempt timing, tie/latency policy, retention and operational monitoring. No public leaderboard should be presented as cheat-proof.

### Maintainability and release confidence

Create small explicit contracts for results, events and supported actions before adding progression or campaigns. Incrementally extract presentation helpers from the large controllers where the approved feature requires it. Avoid a repository-wide rewrite or formatting pass mixed into functional changes.

Reconcile stale architecture references. Add browser journey tests for high-value transitions: setup → answer → results → practice/replay; Quiz completion; mode switching/history; profile switching; invite/reconnect/departure. Some present tests inspect source strings, which cannot catch every runtime integration error. Browser/visual/accessibility tooling is **PLANNED AUTOMATION** and needs the repository's tooling review before adding dependencies.

Introduce a lightweight release checklist, explicit frontend/backend version identification, staged smoke testing, and a rollback record. If diagnostics are added, capture error codes and timings rather than raw answers, microphone transcripts, names, or room tokens. Analytics/network additions require a scoped architecture and privacy decision; no telemetry was added in this task.

## 8. Delivery sequence and acceptance gates

Effort ranges below are planning estimates for one experienced engineer with periodic design/content/QA support. They include focused implementation and regression work, not procurement, recruiting testers or waiting for approvals. Budget additional contingency after prototypes; this is not a delivery commitment.

| Phase | Scope and dependencies | Estimate | Gate before continuing |
| --- | --- | --- | --- |
| 0. Close correctness gaps | F01–F03, Quiz action capabilities, route consistency, truthful mode rules, documentation baseline | 4–7 engineer-days | Reproduce then eliminate Quiz crash; every visible result action works; mode links reload correctly; current suites and targeted behavioral checks pass. |
| 1. Unify play presentation | Approved shared tokens/patterns, focused setup, persistent Start, HUD/results hierarchy, relevant controls, mobile/a11y pass | 8–12 days | Six game setups and representative play/results at all agreed sizes; unchanged rule outcomes; physical keyboard/touch review; no material performance regression. |
| 2. Build the learning loop | Comparable result categories, Memory Atlas MVP, versioned local evidence, Confusion Lab pilot, Explore notebook | 12–18 days | Lossless old-profile migration; per-player/per-skill isolation; accurate review scheduling; explainable progress; small user study confirms comprehension. |
| 3. Add a reason to return | Daily Expedition MVP using one engine family, versioned manifest, private comparison/share card | 6–10 days | Deterministic content, timezone/retry policy, honest assisted/official status, and usable guest flow. |
| 4. Test deeper progression | One Passport chapter and one small Cooperative World Tour prototype | 10–16 days | First chapter completion and group participation evidence justify expansion; concurrency/reconnect tests pass before broader multiplayer release. |
| 5. Harden and release | Measured performance work, selected offline capability if justified, production/device smoke and diagnostics | 5–8 days | Real-device acceptance, frontend/Worker compatibility, deployed critical-flow check and demonstrated rollback. |

Total indicative engineering effort: **45–71 days**, roughly **9–14 working weeks** before calendar contingency. Content production, extensive localization, public ranked play and accounts are outside that estimate. Performance baselining and device checks start early and recur; Phase 5 is final hardening, not the first quality review.

Ship Phases 0 and 1 as a meaningful release. Phase 2 is the main product differentiator. Re-evaluate Daily, Passport and co-op scope using player feedback rather than treating every idea as mandatory.

### First ten working days

| Days | Concrete deliverable |
| --- | --- |
| 1–2 | Reproduction tests for Quiz result actions and mode/URL mismatch; explicit result capabilities; fix the crash and unsupported buttons without inventing new rules. |
| 3–4 | Quiz result/tracker integration design and targeted implementation; mode-specific rule copy; comparable-best policy proposal; document current architecture accurately. |
| 5 | Browser regression through all result actions; physical Safari voice session and accessibility sampling where devices are available; record any unresolved blockers honestly. |
| 6–7 | Two visual prototypes using existing assets: focused setup and unified play/results. Approve shared patterns after mobile/contrast review. |
| 8–9 | Implement the selected setup/Start treatment and pilot shared shell changes in one map game and one flag game. |
| 10 | Before/after review with five target players, regression check and a scoped next slice. Complete remaining Phase 0 work before expanding the shell migration. |

### Architecture decisions needed at the relevant phase

| Decision | Recommended default | Authority / rollback |
| --- | --- | --- |
| Quiz integration | Result/event adapter with explicit capabilities; preserve its category mechanics | Level A; roll back adapter/UI slice without altering engine rules. |
| Shared visual primitives | Expand existing GameShell incrementally | Level A contract, Level B migration; revert mode adoption separately. |
| Progress ownership and best categories | Local, per-player, per-skill evidence; retain legacy device records | Level A persistence ADR; additive versioned storage, backup/migration tests, never overwrite old data blindly. |
| Daily challenge | Versioned fixed challenge; private/casual comparison first | Level A route/data/server review; disable new entry while old modes and results remain readable. |
| Cooperative state | Server authoritative, separate room mode | Level A multiplayer ADR; feature flag creation, preserve ongoing room/version compatibility. |
| Browser testing and observability | Small targeted toolset based on known gaps | Tooling/network review; no always-on third-party service by default. |

These are decisions for scoped implementation tasks, not a request to approve the entire roadmap at once. Each material slice needs the repository's impact assessment, acceptance criteria, QA and rollback plan. Mechanical migrations may be Level C only after their pattern is established.

## 9. Definition of a successful upgrade

Baseline these measures before setting growth targets:

| Outcome | Measure | Initial acceptance / experiment |
| --- | --- | --- |
| Players understand how to start | Time and errors from Home to first meaningful answer | At least 4/5 first-time usability participants start unaided; test time-to-answer rather than only clicks. |
| Rounds feel dependable | Start, completion, results-action and restart success by mode | No known blocking defects in the agreed browser/device matrix. |
| Learning is visible and useful | Review completion and delayed unaided accuracy | Compare reviewed items and comparable difficulty; look for improvement rather than simply longer sessions. |
| New features earn their place | Atlas/Confusion Lab use and player comprehension | Pilot with 5–8 mixed-skill players; retain features that users understand and voluntarily revisit. |
| Friends can get into a game | Invite-to-join and room-to-start completion, rematch rate | Record failure reasons and connection conditions before assigning percentage targets. |
| The game remains fast | Field p75 Web Vitals, answer feedback and acknowledgment latency | Meet the proposed Web Vitals targets; set interaction/network targets after a measured baseline. |
| Accessibility survives polish | Keyboard, screen-reader, zoom, motion, contrast, physical touch | All affected journeys have recorded results; a CSS rule's existence is not a pass. |

For local pilot sessions, record observations manually. Any production measurement implementation must be separately scoped and minimize collected data. Do not infer improvement from synthetic tests or a few screenshots alone.

Required regression matrix for each release: Home and every setup; correct/wrong/duplicate/hint/timeout/manual-end; results/replay/practice; profile switch/reload/storage failure; Explore; room create/join/ready/start/reconnect/host transfer/leave/rematch; desktop, portrait and short landscape; keyboard, screen reader, 200% zoom and reduced motion. Speech additionally requires physical devices and permission/error cases. Run Worker builds in a disposable checkout when snapshot reconciliation is outside scope.

## 10. Work to defer deliberately

- A new frontend framework or another app-shell rewrite without a measured need.
- Reintroducing a Google/3D dependency into gameplay or making a cinematic transition block a round.
- A public global leaderboard before identity, scoring comparability and abuse controls are defined.
- Cross-device account sync merely by enabling the existing remote-profile flag; the documented API mismatch requires a real backend contract and migration plan.
- Open chat, large public lobbies, spectator streams or tournaments before operational capacity and moderation are designed.
- Live generated facts, a large unreviewed question-bank expansion, and expensive art/audio packs before core content and interaction quality are established.
- Several new game modes at once. Prove the learning loop and one new social mode first.
- Reward mechanics that punish missed days or hide existing learning content behind progression.

## 11. Source map

| Concern | Repository sources |
| --- | --- |
| Constitution and workflow | [AGENTS.md](../AGENTS.md), [development protocol](DEVELOPMENT_PROTOCOL.md), [risk routing](AI_MODEL_ROUTING.md) |
| Current runtime and navigation | [architecture](../ARCHITECTURE.md), [entry point](../index.html), [app controller](../src/app.js), [routes](../src/game-routes.js) |
| Shared rules and results | [game core](../game-core.js), [game UI](../game-ui.js), [normalized country model](../game-data.js) |
| Quiz integration/content | [Quiz controller](../quiz-game.js), [question bank](../quiz-data.js), [Quiz tests](../tests/quiz-game.test.cjs) |
| Presentation | [app styles](../app.css), [GameShell](../game-shell.js), [shell styles](../game-shell.css), [design status](DESIGN_SYSTEM.md) |
| Maps and facts | [map interaction adapter](../game-map.js), [map runtime](../src/world-map-runtime.js), [country facts](../src/country-facts.js), [country populations](../src/country-populations.js) |
| Progression | [player system](../player-system.js), [profile tests](../tests/profile-system.test.cjs) |
| Friends | [client transport](../multiplayer-service.js), [room UI](../multiplayer-ui.js), [server rules](../multiplayer-server/room-engine.mjs), [Worker](../multiplayer-server/worker.mjs), [service boundaries](../multiplayer-server/README.md) |
| Quality and release | [QA matrix](QA_MATRIX.md), [performance budget](PERFORMANCE_BUDGET.md), [accessibility standard](ACCESSIBILITY_STANDARD.md), [CI](../.github/workflows/quality.yml), [latest voice evidence](exec-plans/completed/2026-09-22-safari-voice-reliability.md) |

Audit conclusion: the next release should close the Quiz/navigation gaps and unify the player journey; the next major product step should turn existing results, practice and country assets into a trustworthy personal learning atlas. That sequence provides visible polish immediately and a coherent reason to keep playing.

## 14. Defect repair follow-up — 2026-09-23

The finding table above is the historical audit, not the current defect status. The user subsequently authorized P0/P1 defects only. Both P0 defects and the bounded source/UI/content defects are repaired locally; see the [execution record](exec-plans/completed/2026-09-22-p0-p1-defect-repair.md) for F01–F14 outcomes and evidence. F07 uses honest historical labels rather than introducing a new learning system; F11 retains existing map styling. F10 metadata/source checks are implemented but independent review of all trivia remains open. F12 now has local measurements and lazy Quiz loading; production performance is not measured. F13 physical speech/accessibility remains a release gate. New features in this roadmap are still proposals, not implemented work.
