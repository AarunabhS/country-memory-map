# Country Memory Map — Comprehensive Thread Handoff

**Prepared:** 2026-09-10  
**Referenced task:** Confirm Readiness and Constraints  
**Conversation ID:** 6aa0e7a4-8f20-83e8-aa64-a08137b70064  
**Purpose:** Standalone context for the next ChatGPT/Codex thread.

## Critical status at handoff

The previous release must **not** be treated as production-verified.

- The last deployment report claimed frontend main at 6306b11dbefd13b22c0a8879ab97d1bc5a3d7f2d and Worker version 6.
- The user then directly reported that the production site was broken: the live/interactable Earth experience was not working, Explore/Countries/Capitals did not work, and country/capital input on the front page was unusable.
- The user repeated the failure in an incognito/private session. This rules out treating the issue as merely local browser cache.
- No rollback commit, Pages rollback completion, or Worker version-5 restoration was reported after that failure.
- The next thread must first verify whether rollback has already happened. If it has not, perform the emergency rollback before diagnosis or further release work.

The current handoff task did not modify the Country Memory Map repository. This file was written outside the repository at /private/tmp/Country-Memory-Map-Handoff.md.

## Evidence legend

- **USER-OBSERVED:** Direct evidence supplied by the project owner. This is the strongest evidence about the actual user experience.
- **AGENT-REPORTED:** A result stated in a worker report or supervisor response. It may describe a real check, but it was not independently re-run in this handoff and cannot overrule a contradictory user observation.
- **DECISION:** An explicit product, architecture, safety, or delegation decision.
- **UNVERIFIED:** Not established by the available evidence.

The distinction matters here: the deployment agent reported an end-to-end production pass, but the user’s clean-browser experience contradicted that verdict. Therefore the release status is currently **failed/unknown**, not verified.

## 1. Project, repositories, and non-negotiable rules

### Canonical paths

Writable production repository:

~~~text
/Users/Arunabho/Developer/country-memory-map
~~~

Historical repository, read-only evidence only:

~~~text
/Users/Arunabho/Documents/GitHub/country-memory-map
~~~

Production frontend:

~~~text
https://www.arunabhosom.com/country-memory-map/
~~~

Production multiplayer Worker:

~~~text
https://country-memory-friends.arunabh007.chatgpt.site/
~~~

### Operating rules carried through the thread

1. Preserve existing gameplay, rules, scoring, progress, persistence, profiles, multiplayer, flags, data, and working flows.
2. Integrate the existing engines; do not rewrite them.
3. Treat the current repository/runtime as stronger evidence than stale documents or historical code.
4. Treat the historical repository as read-only. Do not copy it wholesale or reset/clean it.
5. Use small, reversible changes with explicit rollback boundaries.
6. Do not hard-code secrets. Google Maps browser-key restrictions, billing, referrer rules, and fallback behavior are release-gate concerns.
7. Design for desktop, mobile portrait, short landscape, touch, keyboard, focus, screen readers, reduced motion, safe areas, and 200% zoom.
8. Do not introduce a framework, a second Engine, a second iframe, duplicate datasets, duplicate gameplay state, or a parallel persistence architecture.
9. Do not claim a test, screenshot, deployment, or production verification unless it was actually performed and evidenced.
10. When a task encounters an architecture, security, persistence, routing, renderer-ownership, or server-rule decision, stop and escalate instead of improvising.

Source-of-truth hierarchy used in the original handoff:

~~~text
Verified current repository/runtime
        ↓
AGENTS.md
        ↓
ARCHITECTURE.md
        ↓
docs/MASTER_PROJECT_INDEX.md
        ↓
Relevant subsystem specifications
        ↓
Approved execution plans / ADRs
        ↓
Agent assumptions
~~~

## 2. Starting context inherited by this thread

The thread was opened because an earlier thread had become cumbersome. The prior handoff said the last independently verified clean baseline was:

~~~text
main = origin/main = e001b009218852223aa38353397af7631309ca19
worktree clean
~~~

The earlier handoff also recorded:

- Governance v1 had been audited, implemented, tested, pushed, PR-reviewed, and merged at 8258b2efdf09720d4ca217ce5ad9edf517b3ea2a.
- Governance v1.1 reconciled documentation at 0f9cc4dff2980a9cad7d256e0804d59e080c96b8.
- main then became e001b009218852223aa38353397af7631309ca19.
- A seven-file historical forensic audit found 15 physical diff hunks and 19 functional changes. It concluded READY FOR SELECTIVE RECOVERY, with no hunk safe to recover wholesale.
- The historical work suggested root navigation, mobile navigation, retained Home, Google click forwarding, and shell tests, but also proved that the historical Home URL and old routing behavior were not safe to copy as-is under GitHub Pages.
- The root cinematic application and retained /legacy/ application were separate surfaces. The retained application contained the existing game engines, game-ui.js, profiles, flags, map logic, and multiplayer.
- The Phase-A Google 3D audit found that the root passed onCountryClick into createMapAdapter() but the adapter dropped it when constructing Google3DAdapter.
- A second bridge defect was found: even with callback forwarding, root submissions could be consumed by the retained controller’s platform state instead of the Free Map checker. The retained app had to be put into its existing Free Map state before it could act as the checker.
- Mode semantics were locked: Explore/Countries may use country-click checking; Capitals must not treat a country click as a capital answer; staged/unknown modes fail closed.
- Map-click submissions needed single-flight behavior, mode revalidation after async preparation, and no queued rapid clicks.

The initial thread supervisor stated that the goal was to reach a real release in the fewest safe cycles, with:

~~~text
Sol = architecture / difficult diagnosis / final review
Terra = implementation / nontrivial coding
Luna = mechanical QA / routine fixes / Git / deployment mechanics
~~~

The supervisor also admitted that model-routing policy had drifted in the earlier thread and recommended resetting the working context before the expensive endgame.

## 3. Full chronology of the thread

The sequence below is ordered from the start of this thread to the current handoff. Results marked as agent-reported are preserved as reports, not upgraded into independent proof.

### 3.1 New control thread opened

The user asked the assistant to read the prior handoff, understand the constraints, and confirm readiness. The assistant accepted the thread as the new production-control thread and restated:

- no engine rewrite;
- cinematic root plus retained /legacy/ integration;
- Google 3D as progressive enhancement;
- playable retained 2D fallback;
- mode-safe country clicks;
- mobile/accessibility requirements;
- no wholesale historical recovery;
- no unsupported remote profile assumptions;
- no secret exposure;
- no unverified claims.

### 3.2 First budget plan: approximately 80% remaining

The user asked what to do next with approximately 80% of allowance remaining. The assistant recommended a **new Codex thread using GPT-5.6 Terra High** on branch codex/fix-root-interaction-recovery.

The supplied implementation prompt, titled MASTER 1 Fallback Implementation, instructed Terra to:

- preserve the already completed WP-A/WP-B root-interaction and mobile work;
- make a local checkpoint first;
- implement the Google-3D-to-playable-2D recovery state machine;
- use 3D_STARTING → 3D_ACTIVE | 2D_ACTIVE;
- trigger fallback on definitive failure or approximately 45 seconds without usable 3D;
- make 2D_ACTIVE terminal for the page session;
- prevent late 3D from reclaiming renderer or input ownership;
- reuse the existing retained app rather than create a second game/map/checker;
- preserve storage, profiles, scoring, and gameplay;
- add fake-timer and fallback tests;
- avoid pushing, merging, deploying, or changing secrets/snapshots;
- stop on an architecture-level blocker.

### 3.3 Budget correction: actually approximately 18% remaining

The user corrected the allowance from 80% to 18%. The strategy changed materially:

- use a **new Terra Medium** thread, not Terra High;
- do only the WP-A/WP-B checkpoint plus the playable 2D fallback and focused regression tests;
- defer broad browser QA, screenshots, device testing, MASTER 2, and Sol review;
- leave the fallback implementation uncommitted for later QA.

The replacement prompt, MASTER 1 — Budget-Constrained Fallback Implementation, retained the same locked product contract and added strict budget-saving limits. It explicitly prohibited broad audits, alternative 3D designs, extensive QA, Worker snapshot regeneration, and deployment.

### 3.4 Downloaded Earth model decision

The user asked whether the fallback should be:

- another 3D element;
- the downloaded 3D Earth model attached to the thread;
- a clean bordered 2D country map.

The assistant recommended the **existing clean 2D country map as the authoritative gameplay fallback**. The downloaded model was not used in the fallback path because it would still depend on WebGL/GPU/memory/shader/texture support, would not obviously provide country-level hit-testing, and would duplicate a geographic renderer.

The agreed three-tier concept was:

~~~text
Google photorealistic 3D = premium primary experience
Existing bordered/vector 2D map = reliable authoritative gameplay fallback
Downloaded Earth model = optional future visual/loading asset only
~~~

The model archive was reported as approximately 17.5 MB compressed and 27.8 MB uncompressed, with OBJ/FBX/Blender files and several 2K textures. Its licensing and mesh topology were not verified. It was explicitly not to be introduced into the emergency gameplay-recovery path.

### 3.5 Terra fallback implementation report

The user supplied the implementation result. It reported:

- branch codex/fix-root-interaction-recovery;
- starting main at e001b009218852223aa38353397af7631309ca19;
- WP-A/WP-B checkpoint bd90ce7e2abc4dccdca2e7e56376fb59a7be957f;
- fallback changes in src/main.js, src/renderer-recovery.js, src/root-interactions.js, focused tests, and the active plan;
- one-shot recovery state machine;
- hard failure through the existing Google adapter initialization rejection;
- one coordinator-owned 45-second timer;
- late readiness ignored after 2D_ACTIVE;
- retained iframe exposed and focused when fallback owns input;
- root tests 51/51;
- multiplayer tests 16/16;
- governance and git diff --check passing;
- no browser smoke because the existing local browser tab did not respond and automation reset;
- fallback diff still uncommitted.

The result was NEEDS MANUAL QA, not a production-ready verdict.

### 3.6 Luna browser QA was selected

The assistant recommended a **new Luna High** thread for minimal critical browser QA. The instruction was to test only:

- normal live 3D;
- hard-failure fallback;
- timeout-equivalent fallback;
- late 3D readiness after fallback;
- one mobile fallback smoke;
- basic focus/accessibility ownership.

Luna was told not to redesign or make nontrivial code changes. If a real implementation defect appeared, it had to stop and report TERRA FIX REQUIRED. If browser automation failed again, it had to report MANUAL BROWSER QA STILL REQUIRED rather than modify application code to compensate.

### 3.7 User asked to run the game and see the milestone

The user asked whether the work was going in vain and whether the game should be run before all remaining work was complete. The assistant said yes: after the fallback QA, run a short milestone demonstration, but do not call it the finished product.

The local URL given was:

~~~text
http://127.0.0.1:4173/
~~~

The production URL was kept separate:

~~~text
https://www.arunabhosom.com/country-memory-map/
~~~

The proposed five demonstrations were:

1. fresh cinematic Earth load;
2. typed country and real 3D country click;
3. Capitals mode proving a globe click does not answer a capital;
4. mobile answer/navigation layout;
5. deterministic Google failure leading to playable 2D.

The assistant repeatedly stated that nothing then pointed to a ground-up restart.

### 3.8 Real fallback defect found: false “Live 3D Earth” status

The user supplied a QA stop report:

- normal 3D worked;
- hard failure exposed playable 2D;
- timeout-equivalent fallback exposed playable 2D;
- late 3D did not reclaim the visible/interactable 2D session;
- but late readiness changed the badge to Live 3D Earth while 2D remained authoritative.

The likely area was identified as src/main.js around line 305. Mobile QA was stopped after this defect.

The assistant judged this to be a narrow state/presentation mismatch, not a renderer-architecture failure, and supplied the Surgical MASTER 1 Late-Readiness UI Fix prompt for **Terra Medium**. The instructions were:

- use 2D_ACTIVE as the authority;
- prevent false 3D status after fallback;
- preserve the terminal no-takeover rule;
- add focused automated coverage;
- do not change the 45-second policy, retained gameplay, profiles, multiplayer, secrets, or Worker snapshots;
- do not commit, push, merge, or deploy.

### 3.9 Surgical fix result

The user supplied the result:

- late readiness now respects 2D_ACTIVE;
- status remains “3D unavailable” after fallback;
- late readiness cannot reclaim renderer ownership;
- focused coverage was added;
- root tests 52/52 passed;
- git diff --check passed;
- browser regression was skipped because no deterministic fallback trigger was available without altering runtime state;
- no commit was made.

The assistant correctly treated the browser regression as still pending and recommended not starting further work until the allowance refreshed.

### 3.10 Local server/repository interaction

The user asked for the local game URL again and then asked to restart the local development server. The assistant gave http://127.0.0.1:4173/ and handed the restart to a fresh Work thread so the current uncommitted state would not be reset.

No independent restart result is present in this handoff.

### 3.11 User asked whether the existing games were connected

The user asked whether the existing games had actually been connected to the front UI. The assistant answered **no, not yet fully**:

- MASTER 1 connected root interaction, retained checking, mobile behavior, and fallback;
- it did not yet provide deliberate launching of all five games;
- stable deep-link routing and Home/back/session lifecycle were still missing;
- the complete cinematic GameShell was still future work.

This distinction is important: the project was intentionally staged as MASTER 1 root resilience before MASTER 2 complete game entry.

### 3.12 Only approximately 10% remained

The user said only about 10% remained and asked for one final useful task before the refresh. The assistant recommended a **new Luna High** thread for a mechanical local checkpoint:

- confirm branch and checkpoint;
- rerun root tests and diff checks;
- create one local commit containing the fallback and surgical status fix;
- preserve an explicit note that final browser regression, physical-device, accessibility, and production-origin QA remained pending;
- do not start MASTER 2 or deploy.

The assistant then said it was still operating at full capability in the current thread and recommended staying in the thread through the next implementation report rather than handing off immediately.

### 3.13 MASTER 1 checkpoint created

The user supplied:

- branch codex/fix-root-interaction-recovery;
- new checkpoint 36d1f020c7cdec7f5ebe02f661765206cc92127f;
- prior WP-A/WP-B checkpoint confirmed;
- root tests 52/52;
- governance passed;
- git diff --check passed;
- worktree clean;
- no push, merge, deploy, or browser QA in that checkpoint operation.

The assistant recorded the protected baseline:

~~~text
e001b009218852223aa38353397af7631309ca19
        ↓
bd90ce7e2abc4dccdca2e7e56376fb59a7be957f
        ↓
36d1f020c7cdec7f5ebe02f661765206cc92127f
~~~

The remaining MASTER 1 work was characterized as final browser/device/accessibility/production QA, not a foundational rewrite.

### 3.14 Sol architecture pass

After the capacity refresh, the user supplied the Sol architecture result as an attachment. The result was summarized as:

~~~text
COUNTRY MEMORY MAP — LAUNCH INTEGRATION EXECUTION SPEC
Status: APPROVED FUTURE WORK
Architecture classification: Level A — architecture authority
Baseline: 36d1f020c7cdec7f5ebe02f661765206cc92127f
Final verdict: READY FOR TERRA IMPLEMENTATION
~~~

Sol’s key decisions are detailed in Section 8 below. The assistant explicitly said not to send the problem back to Sol for routine implementation.

### 3.15 Context-window question

The user asked whether the thread was becoming too long and whether a new thread would be safer. The assistant said it was not close to a context limit and recommended continuing through the Terra MASTER 2 report, while recognizing MASTER 3 as a natural future boundary.

### 3.16 MASTER 2 implementation by Terra

Terra was instructed in a new thread, at **High**, to implement the locked MASTER 2 — Complete Game Entry contract from 36d1f020.

The user supplied the result:

- canonical ?game= routing;
- history and deep-link recovery;
- transition race protection;
- all nine launchers;
- distinct Flag Recall and Flag Match;
- singleton retained iframe and narrow host API;
- Explore/Countries/Capitals kept as cinematic bridge/checker behavior;
- multiplayer URL handoff, room normalization, polling suspension, and canonical invite URLs;
- documentation and tests;
- root tests 57 passing;
- multiplayer tests 16 passing;
- governance passed;
- no commit, push, merge, or deployment;
- an isolated Worker build attempt failed only because a temporary copy lacked esbuild; no repository snapshots changed.

The assistant classified this as READY FOR LUNA QA.

### 3.17 Budget was formalized: at most two strong prompts from this point

The user stated that approximately 58% of quota remained, that the work had to finish before 50%, that the last approximately 8% should be preserved for Luna deployment or a generic task, and that all strong-model use had to fit within two prompts.

The assistant changed the plan to:

~~~text
Luna High: MASTER 2 QA
Terra High: complete MASTER 3 in one coherent run = strong prompt #1
Luna High: MASTER 3/full-product QA
Strong prompt #2: Sol final review OR Terra surgical repair, only if justified
Luna High: release-candidate QA
Luna High: final deployment and production verification
~~~

The assistant explicitly rejected separate Terra runs for Golden Game and then remaining-game migrations because that would spend two strong implementation prompts before the final gate.

### 3.18 MASTER 2 QA and checkpoint

Luna’s MASTER 2 QA report stated:

- all nine canonical routes opened correctly with canonical URLs;
- exactly one retained iframe was used;
- World Conquest, Find the Country, Capital Clash, Flag Recall, and Flag Match gameplay smoke passed;
- live 3D, typed answers, an authorized Sudan click, and Capitals click protection passed;
- Back, Forward, launcher switching, unknown-route recovery, deep links, and refresh-to-setup passed;
- multiplayer room normalization, canonical root invite URLs, session resumption, and explicit Leave Room passed;
- desktop, 390×844, and 844×390 checks passed without horizontal overflow or critical overlap;
- accessibility smoke passed;
- one narrow root-control resynchronization fix was made after healthy 3D activation;
- post-fix governance 21/21, root 57/57, multiplayer 16/16, and diff check passed;
- checkpoint bcd4141f61355efc1ac5e857fc6f7d89403b1bf3;
- worktree clean;
- nothing pushed, merged, or deployed.

Remaining final-QA items included forced 2D presentation, physical devices, screen readers, reduced motion, 200% zoom, production origin, and a nonfatal gestureHandling: NONE warning.

### 3.19 MASTER 3 implementation by Terra

Terra was instructed in a new thread, at **High**, to execute one strong implementation run:

1. create a thin GameShell;
2. implement Capital Clash as the Golden Game;
3. verify it;
4. if the shared boundary held, migrate the remaining existing games in the same run;
5. leave the complete work ready for Luna.

The user supplied the implementation report:

- added game-shell.js and game-shell.css;
- wired existing controller events in game-ui.js;
- loaded the shell through legacy/index.html;
- Capital Clash Classic setup, typed answer, HUD, map-answer transition, and keyboard map selection were verified;
- the same shell covered World Conquest, Find the Country, Flag Recall, Flag Match, Free Map/checker presentation, profiles, results, and multiplayer surrounding UI;
- root tests 59/59;
- multiplayer tests 16/16;
- governance and git diff --check passed;
- desktop and representative mobile views had no overflow;
- no engine, route, persistence, or multiplayer-authority rewrite;
- no checkpoint, push, merge, or deployment;
- full results/replay, physical devices, screen reader/reduced motion, live 3D after restart, multiplayer rooms, and production-origin behavior were not yet verified.

The assistant instructed a new Luna High QA thread and said not to spend the second strong-model prompt automatically.

### 3.20 MASTER 3 QA and checkpoint

Luna’s MASTER 3 QA report stated:

- governance passed;
- root tests 59/59;
- multiplayer tests 16/16;
- git diff --check passed;
- Capital Clash Classic typed/map transitions, feedback, HUD, results, replay, and Practice Missed passed; Blitz and Continent smoke-started;
- World Conquest relaxed answer and duplicate handling passed; other variants smoke-started;
- Find the Country standard pointer/keyboard/feedback paths passed; Blitz and Continent smoke-tested;
- Flag Recall rendering, unusual-ratio containment, correct/wrong answers, and results passed;
- Flag Match choices, neutral accessibility labels, keyboard selection, feedback, and results passed;
- Explore/Countries/Capitals live 3D, typed checker flows, and Capitals non-answering globe clicks passed;
- deterministic fallback tests passed; browser-forced failure was not reproduced;
- existing AR Zordan profile and recent results survived refresh and game switching;
- local multiplayer room creation, invite, join, readiness, start, remote answer, standings, suspend/resume, results, and Leave Room passed;
- responsive checks passed at 390×844, 844×390, and 320px narrow portrait;
- keyboard and focus smoke passed;
- reduced-motion emulation was unavailable;
- 200% zoom was not verified;
- no fixes were needed;
- checkpoint 735776f681b14d38f126962cd7f1ad4c5f8b81a3;
- worktree clean;
- nothing pushed, merged, or deployed.

The assistant classified MASTER 3 as QA-passed and moved the project to release-gate work.

### 3.21 Sol final release gate

The user supplied the Sol final release-gate document. Sol’s decision was **CONDITIONAL GO**, not unconditional release approval.

The gate said the candidate was structurally sound but not safe to deploy exactly as-is because remote profile synchronization was enabled/advertised even though the configured Worker did not implement the required /profiles, /recover, and /sessions contract.

The two mandatory pre-deployment items were:

1. Disable/degrade unsupported remote profile synchronization while preserving local profiles.
2. Regenerate and validate the generated multiplayer snapshots that the production Worker bundles.

Sol also decided:

- local profiles, statistics, mastery, settings, recent results, and refresh persistence should remain enabled;
- remote profile sync should default off, with truthful “Saved on this device” copy;
- profile-only controls such as PIN, Player Code, Recover Player, and remote permanent delete should be hidden;
- generated multiplayer-server/shared/game-core.cjs and multiplayer-server/shared/countries.json should be regenerated through the documented build, not hand-edited;
- multiplayer public access should be **verified during deployment**, not assumed from local tests;
- if the two-session production multiplayer smoke failed but solo play was healthy, hide multiplayer rather than weaken security or hold the solo release hostage;
- no additional architecture review would be needed after the bounded Luna changes and successful production smoke.

### 3.22 Final pre-deployment release-candidate work by Luna

The assistant supplied the Final Pre-Deployment Release Candidate prompt for a new Luna High thread. It prohibited redesign, new features, reopening MASTER 1–3, deployment, and architecture changes.

The user supplied the result:

- remote profile sync default-off;
- local profiles, stats, mastery, settings, results, and persistence retained;
- profile changes in multiplayer-config.js, game-ui.js, player-system.js, player-profile.css, legacy/index.html, and profile tests;
- focused profile tests 5/5;
- root tests 64/64;
- no ProfileService or StatsSyncQueue constructed on the disabled path;
- deterministic network stubs observed zero unsupported requests and no queue accumulation;
- remote-only UI hidden and copy changed to “Saved on this device”;
- regenerated exactly multiplayer-server/shared/game-core.cjs and multiplayer-server/shared/countries.json;
- generated files matched canonical source parity;
- Worker build passed;
- multiplayer tests 16/16 before and after build;
- governance 21/21;
- diff check passed;
- local smoke passed across live root, World Conquest, Flag Recall, keyboard map gameplay, local profile persistence, 390px mobile, multiplayer host/join/leave, and Home;
- checkpoint 6306b11dbefd13b22c0a8879ab97d1bc5a3d7f2d;
- worktree clean;
- nothing pushed, merged, or deployed at that moment;
- verdict RELEASE CANDIDATE READY FOR DEPLOYMENT.

### 3.23 User asked whether it was time to share the URL

Before deployment, the assistant correctly answered **not yet**:

- MASTER 1–3 and release-candidate QA were ready;
- the candidate was still local;
- it had not yet been pushed to main;
- GitHub Pages had not yet deployed it;
- the Worker had not yet been deployed;
- production-origin smoke had not yet been done.

The assistant supplied a final Luna High deployment prompt, Country Memory Map — Production Deployment and Smoke, with the required sequence:

~~~text
verify candidate
→ record rollback baselines
→ merge/push normally
→ wait for Pages deployment
→ deploy Worker
→ test actual production origin
→ roll back immediately on release-blocking failure
~~~

### 3.24 Multiplayer enablement decision

The user asked why multiplayer was being considered for disablement for a small group of five or six people.

The assistant clarified:

- there was nothing inherently wrong with enabling multiplayer for five or six people;
- the preferred release was Google 3D plus 2D resilience plus all games plus local profiles plus multiplayer;
- the fallback of hiding multiplayer was only for a production CORS/access/configuration failure;
- local QA had passed room creation, invitation, join, ready, start, answer, standings, suspend/resume, results, and Leave Room;
- the Worker appeared to support public guest access, but the full public chain still had to be proven in two independent production sessions;
- security rules must not be weakened to force multiplayer into release.

### 3.25 Production deployment report

The user supplied a report claiming:

1. Candidate branch codex/fix-root-interaction-recovery at 6306b11dbefd13b22c0a8879ab97d1bc5a3d7f2d; worktree clean.
2. Governance, root tests 64, Worker tests 16, Worker build, and diff checks passed.
3. Frontend rollback anchor e001b009218852223aa38353397af7631309ca19.
4. Worker rollback anchor: version 5, source bba20ef225446c98d8db4b305b85e391ebcfe4dd.
5. main fast-forwarded to 6306b11.
6. Candidate and main pushed without force; PR integration returned 403, so a safe direct fast-forward was used.
7. GitHub Pages build/deploy reportedly succeeded as run 34386588626.
8. Worker version 6 reportedly deployed from source 4d4641ca615c0d0c444305ebedaddb79c96e7a6c.
9. The production frontend URL reportedly loaded.
10. Google 3D, Explore, one 3D country click, Countries, and Capitals behavior reportedly passed.
11. Canonical routes, Home, Back/Forward, and refresh reportedly passed.
12. Representative gameplay reportedly passed for World Conquest, Find the Country, Capital Clash, Flag Recall, and Flag Match.
13. Fresh local profile creation, gameplay statistics, results, and refresh persistence reportedly passed.
14. No /profiles, /recover, or /sessions traffic was reportedly observed.
15. Mobile checks at 390×844 and 844×390 reportedly had no horizontal overflow.
16. Two-session multiplayer reportedly passed through room creation, invitation, join, readiness, start, shared India answer, standings, reload/reconnect, results, and leaving.
17. Fallback reportedly passed after a real Maps quota failure; retained 2D stayed playable, Japan/input worked, and delayed 3D did not take over.
18. No private credential leakage, profile retry storm, CSP/CORS failure, or app-level 404/5xx was reportedly observed.
19. Console warnings included Maps quota exhaustion, invalid gestureHandling: NONE, and boundary-overlay warnings.
20. No production source or credential changes were reportedly made after deployment.
21. Final frontend SHA was reported as 6306b11; Worker version as 6; main...origin/main clean.
22. Rollback performed: none.
23. The only listed follow-up was GOOGLE CLOUD OWNER CHECK REQUIRED.

The report ended with PRODUCTION RELEASE VERIFIED.

This is **AGENT-REPORTED**, not accepted final truth, because the user’s direct browser experience immediately contradicted the functional claims.

### 3.26 Assistant incorrectly treated the deployment as released

The assistant accepted the report and told the user:

- the game was live;
- the production URL could be shared;
- the release was end-to-end verified;
- multiplayer should remain enabled;
- the release baseline was frontend main at 6306b11 and Worker version 6.

The assistant specifically encouraged distributing the URL. This recommendation was later retracted.

### 3.27 User’s real-browser failure report

**USER-OBSERVED:** The user reported:

1. “The live planet earth is gone.”
2. Explore, Countries, and Capitals buttons did not work.
3. The user could not type capital or country names on the front page.
4. The user questioned whether the correct URL was being used.

The attached screenshot visually showed a loaded cinematic shell with:

- Country Memory Map branding;
- Home/Progress/Friends/Settings navigation;
- a visible Live 3D-style badge;
- Explore, Countries, Capitals, and other game cards;
- a large photorealistic Earth image;
- a bottom country input and “Mark Country” button.

That image proves only that the shell and visual Earth were rendered in that captured state. It does **not** prove that the Earth was live/interactable or that any controls worked. The user’s behavioral report is the decisive evidence.

The assistant corrected the release status:

~~~text
URL correct: yes
Deployment present: reported yes
Actual user-facing release acceptable: no
~~~

Possible causes were listed, but none was proven:

- mixed or stale GitHub Pages assets;
- production-only initialization race;
- root controls left inert after a surface-state transition;
- 3D renderer falling into a visual/static state while status remained misleading;
- service/browser caching or different asset graph.

The assistant asked for one incognito test before choosing rollback.

### 3.28 Incognito reproduced the failure

**USER-OBSERVED:** The user replied same in incognito.

The assistant then:

- accepted that the earlier PRODUCTION RELEASE VERIFIED verdict had been over-trusted;
- stopped recommending in-place production debugging;
- invoked the project’s rollback criteria;
- recommended an emergency rollback using **Luna High in a new thread**;
- explicitly said not to use Terra or Sol for the rollback;
- said the failed release must be preserved for later forensic diagnosis.

## 4. Checkpoint and version ledger

| Milestone | SHA/version | What it represents | Status/evidence |
|---|---|---|---|
| Governance v1 | 8258b2efdf09720d4ca217ce5ad9edf517b3ea2a | Governance implementation | Reported audited, tested, pushed, PR-reviewed, merged |
| Governance v1.1 | 0f9cc4dff2980a9cad7d256e0804d59e080c96b8 | Documentation reconciliation | Reported merged |
| Pre-MASTER baseline | e001b009218852223aa38353397af7631309ca19 | main/origin/main before this launch sequence | Last independently verified clean baseline in the inherited handoff; later deployment state must be checked |
| WP-A/WP-B | bd90ce7e2abc4dccdca2e7e56376fb59a7be957f | 3D interaction bridge and mobile layout checkpoint | Reported clean; root tests 47 at that stage, multiplayer 16 |
| MASTER 1 | 36d1f020c7cdec7f5ebe02f661765206cc92127f | Resilient root, terminal playable 2D fallback, late-readiness status fix | Reported clean; root 52/52; no push/merge/deploy |
| MASTER 2 | bcd4141f61355efc1ac5e857fc6f7d89403b1bf3 | Complete game entry/routing/lifecycle | Reported clean after Luna QA; root 57/57; multiplayer 16/16; no push/merge/deploy |
| MASTER 3 | 735776f681b14d38f126962cd7f1ad4c5f8b81a3 | Universal cinematic GameShell integration | Reported clean after Luna QA; root 59/59; multiplayer 16/16; no push/merge/deploy |
| Release candidate | 6306b11dbefd13b22c0a8879ab97d1bc5a3d7f2d | Profile sync default-off, regenerated Worker snapshots, candidate ready | Reported clean; root 64/64; Worker build/tests passed; initially not pushed |
| Reported deployed frontend | 6306b11dbefd13b22c0a8879ab97d1bc5a3d7f2d | Claimed main and Pages release | Agent/user-pasted report only; contradicted by user’s production behavior |
| Reported deployed Worker | Version 6, source 4d4641ca615c0d0c444305ebedaddb79c96e7a6c | Claimed production Worker | Agent/user-pasted report only; rollback to v5 not verified |

Rollback anchors:

~~~text
Frontend: e001b009218852223aa38353397af7631309ca19
Worker: version 5
Worker source: bba20ef225446c98d8db4b305b85e391ebcfe4dd
~~~

## 5. MASTER 1 implementation and QA outcome

### Intended architecture

~~~text
3D_STARTING
    ├─ usable Google 3D → 3D_ACTIVE
    ├─ definitive renderer failure → 2D_ACTIVE
    └─ approximately 45 seconds without usable 3D → 2D_ACTIVE
~~~

Once 2D_ACTIVE is entered:

- the retained 2D application becomes visible and authoritative;
- cinematic/root answer controls become inert or non-authoritative;
- focus moves into the retained application;
- recognition, scoring, profiles, persistence, and progression remain owned by the existing retained application;
- late 3D cannot take back renderer or gameplay ownership during that page session;
- status text must remain consistent with the authoritative renderer.

### What was implemented

- Google 3D country-click forwarding and retained checker bridge from WP-A;
- mode-safe country-click semantics;
- single-flight async submission and mode revalidation;
- mobile answer/navigation/safe-area layout work from WP-B;
- hard-failure and timeout fallback;
- terminal fallback ownership;
- late-readiness no-takeover behavior;
- late-readiness status fix;
- focused root/recovery tests.

### What was actually established

Agent QA reported:

- live 3D works;
- typed country/capital checking works;
- authorized country clicks work;
- Capitals and staged modes fail closed;
- hard failure exposes playable 2D;
- timeout-equivalent failure exposes playable 2D;
- late 3D does not reclaim 2D.

The late-readiness badge defect was found in browser QA, then fixed and covered by tests. The final browser recheck of that exact status fix was skipped because the available fallback trigger was not deterministic without changing runtime state. The M1 checkpoint was therefore a development checkpoint with later QA exclusions, not production proof.

## 6. MASTER 2 implementation and QA outcome

### Architecture

Sol selected one root-owned query-string route:

~~~text
?game=<canonical-slug>
~~~

Canonical slugs:

| Experience | Slug | Existing authority |
|---|---|---|
| Explore / Free Map | explore | Retained Free Map plus cinematic 3D bridge |
| Countries | countries | Unscored Free Map country checker |
| Capitals | capitals | Unscored Free Map capital checker |
| World Conquest | world-conquest | Existing conquest Engine family |
| Find the Country | find-country | Existing find Engine family |
| Capital Clash | capital-clash | Existing capital Engine family |
| Flag Recall | flag-recall | Existing flag family, recall variant |
| Flag Match | flag-match | Existing flag family, match variant |
| Play with Friends | multiplayer | Existing FriendService/multiplayer controller |

The displayed Flag Sprint label was resolved to Flag Recall, with a distinct Flag Match launcher. No fictional Flag Sprint engine was to be invented.

### Ownership contract

Root route coordinator:

- URL parsing/building;
- history and canonicalization;
- route activation;
- visible surface;
- retained iframe activation;
- transition race protection;
- cross-surface focus.

Retained controller:

- setup;
- Engine lifecycle;
- gameplay;
- scoring;
- results/replay/practice;
- Free Map;
- profiles and local persistence;
- game-local focus.

Renderer recovery:

- 3D active state;
- terminal 2D active state.

Routing must never reset, bypass, or override terminal 2D_ACTIVE.

### URL/lifecycle rules

- Keep the existing project pathname; do not hard-code /country-memory-map/.
- Use query-string routes because GitHub Pages has no server rewrite support.
- pushState for user launch, game switch, and Home.
- popstate applies a destination without writing another history entry.
- replaceState only for canonicalization, room-code normalization, stale-room removal, and invalid-route recovery.
- Normalize room codes to uppercase and accept them only with game=multiplayer.
- Reuse one same-origin retained iframe and one controller.
- Direct scored-game links open setup; they do not auto-start a round.
- Back/Forward do not resurrect an abandoned in-memory round.
- Refresh loses active in-memory play by design but preserves completed local results.
- Home ends a solo route through the established mode_change path and suppresses abandoned results.
- Multiplayer Home/Back suspends polling without silently sending Leave Room; explicit Leave Room clears the stored session.

### QA outcome

The reported QA passed route matrices, gameplay-family smoke, live 3D bridge semantics, history/deep links, mobile layouts, keyboard/focus behavior, multiplayer entry/exit, and one-iframe ownership. One narrow root-control synchronization fix was made.

Checkpoint:

~~~text
bcd4141f61355efc1ac5e857fc6f7d89403b1bf3
~~~

Still outstanding at that point:

- forced 2D browser presentation;
- physical touch/safe-area testing;
- full screen-reader certification;
- reduced-motion emulation;
- reliable 200% zoom verification;
- production-origin verification;
- a nonfatal gestureHandling: NONE warning.

## 7. MASTER 3 implementation and QA outcome

### GameShell contract

GameShell was explicitly designed as a thin presentation adapter. It could own:

- common page structure;
- navigation presentation;
- title/status placement;
- HUD layout;
- input placement and focus order;
- map/flag/outline stage slots;
- feedback/live-region presentation;
- results structure;
- profile and multiplayer presentation slots;
- loading/error presentation;
- responsive, safe-area, reduced-motion, and focus structure.

GameShell could not own:

- scoring;
- question selection;
- answer validation;
- aliases/recognition;
- progression;
- timers/deadlines;
- persistence;
- Google Maps;
- renderer recovery;
- route/history;
- multiplayer transport/server state;
- country/flag datasets.

### Golden Game

Sol and the Terra prompt selected **Capital Clash** because it combines:

- typed capital answers;
- map-country selection;
- prompt, timer, score, streak, and progress;
- feedback/reveal;
- results/replay;
- profile tracking;
- responsive input;
- keyboard map interaction;
- multiplayer compatibility.

The Golden Game gate was: if Capital Clash required changing gameplay or shared ownership, stop and escalate; if the shell held, migrate the remaining games in the same Terra run.

### Implementation

Reported changes:

- game-shell.js;
- game-shell.css;
- game-ui.js display-state wiring;
- legacy/index.html loading;
- focused GameShell tests;
- documentation/plan updates.

The report explicitly stated that GameShell did not own Engine, map, route, persistence, or multiplayer authority, and that no second engine or iframe was created.

### QA

Reported results:

- root 59/59;
- multiplayer 16/16;
- governance and diff checks passed;
- all five major game families were smoke-tested;
- Explore/Countries/Capitals semantics were preserved;
- local profile/results persistence survived refresh and switching;
- local two-session multiplayer flow passed;
- responsive checks passed at desktop, 390×844, 844×390, and 320px narrow portrait;
- keyboard/focus smoke passed;
- browser-forced renderer failure was not reproduced, although deterministic fallback tests passed;
- reduced-motion emulation was unavailable;
- 200% zoom was not verified;
- no fixes were required.

Checkpoint:

~~~text
735776f681b14d38f126962cd7f1ad4c5f8b81a3
~~~

This was still local. Nothing was pushed, merged, or deployed at the time.

## 8. Sol architecture and release-gate decisions

### First Sol architecture pass: launch integration

Status:

~~~text
APPROVED FUTURE WORK
READY FOR TERRA IMPLEMENTATION
Baseline: 36d1f020c7cdec7f5ebe02f661765206cc92127f
~~~

The architecture pass locked:

- one query-string route family;
- one retained same-origin iframe;
- one retained controller;
- explicit bridge/full surface modes;
- root/retained/renderer-recovery ownership separation;
- monotonic transition tokens for late iframe/async events;
- all canonical game mappings;
- multiplayer room URL normalization and compatibility ingress;
- unchanged profile/storage keys;
- no remote profile repair in MASTER 2;
- mobile/accessibility/focus requirements;
- rollback by removing launch wiring and retained-host adapter without data migration;
- Capital Clash as the Golden Game for MASTER 3.

The main stop conditions were: second iframe/Engine/renderer, gameplay-rule changes, persistence migration, route-ownership changes, renderer-recovery changes, multiplayer server/security changes, or a GameShell boundary different from the approved thin adapter.

### Final Sol release gate

The final gate was **CONDITIONAL GO**:

- structurally sound candidate;
- strong automated and local-browser evidence;
- not safe to deploy unchanged until two bounded items were completed.

At that review point, Sol recorded the candidate as four commits and 28 changed files ahead of main, with current main/origin/main still at e001b009218852223aa38353397af7631309ca19. GitHub Pages was public, HTTPS-enforced, and configured from main:/; the frontend required no compilation. Main branch protection was not enabled, so the release gate was procedural.

Mandatory pre-deployment items:

1. **Default remote profile synchronization off.**
   - Preserve local profiles and local statistics.
   - Do not construct the unsupported remote ProfileService or persistent sync queue when disabled.
   - Hide unsupported PIN/Player Code/Recover/remote delete controls.
   - Use truthful “Saved on this device” language.
   - Prove no /profiles, /recover, or /sessions traffic.
2. **Regenerate Worker snapshots.**
   - Use the documented build mechanism.
   - Regenerate multiplayer-server/shared/game-core.cjs.
   - Regenerate multiplayer-server/shared/countries.json.
   - Review generated diff.
   - Run multiplayer tests before and after Worker build.

The snapshot drift was considered material: the report described 205 additions and 22 deletions in the generated game-core snapshot and flag-field additions across all 195 country records, with five accepted_names differences. This was a source-parity/build task, not permission to change server rules.

Sol’s other decisions:

- Public multiplayer access was **VERIFY DURING DEPLOYMENT**. Sol’s report cited a production health response of 200, a production-origin CORS preflight of 204 allowing https://www.arunabhosom.com, unauthenticated room creation/join, hashed 256-bit bearer tokens for subsequent actions, rate limits, origin restrictions, expiry, and room-capacity enforcement. A real production two-session room was still required.
- If multiplayer failed in production while solo play was healthy, hide/disable multiplayer through a simple reversible path; never weaken security.
- Google Cloud verification must confirm the browser referrer restriction, API restriction, billing/quota/alerts, no private credential exposure, 3D production loading, correct clicks, and 3D-to-2D fallback.
- Full screen-reader, 200% zoom, reduced-motion, and physical-device coverage were limitations unless they exposed a material blocker.
- No additional architecture review was needed after the bounded Luna changes and successful production smoke.

The gate also listed non-blocking operational limitations: polling and casual guest identities rather than authenticated accounts, a documented one-second high-latency compensation limit for speed bonuses, stale README/governance descriptions, possible Pages cache propagation of approximately ten minutes, and the absence of production-origin QA at that time.

## 9. Model-budget and delegation rules

The budget strategy changed as the user clarified remaining allowance. The percentages were planning estimates, not exact consumption telemetry.

### Evolution

1. Around 80% remaining: Terra High was initially proposed for M1 fallback.
2. Corrected to around 18%: Terra Medium was selected for the narrow fallback implementation.
3. Around 10% remaining: Luna High was selected for checkpoint/QA; no MASTER 2.
4. After refresh and M1 checkpoint: Sol High was used for launch architecture.
5. At around 58% remaining, the user imposed a hard rule: no more than two strong-model prompts, finish the main work before approximately 50%, preserve the last approximately 8% for Luna.
6. The planned strong prompts were:
   - Terra High: one coherent MASTER 3 implementation run;
   - second prompt only if necessary: Sol final release review or Terra surgical repair.
7. Luna owned all routine QA, checkpointing, release-candidate preparation, merge/deploy mechanics, and production smoke.

### Model roles

**GPT-5.6 Sol High**

- architecture;
- cross-system decisions;
- genuine difficult diagnosis;
- final release gate;
- security/persistence/server/routing/renderer escalation.

Sol should normally stop after producing a locked specification or decision. It should not spend scarce capacity on repetitive coding, screenshots, ordinary QA, or Git mechanics.

**GPT-5.6 Terra**

- implementation from an approved contract;
- cross-file coding;
- nontrivial but bounded debugging;
- fallback/routing/GameShell work;
- coordinated responsive fixes.

Terra must be told that architecture is locked. It must stop if the requested change crosses ownership, gameplay, persistence, security, route, renderer, or server boundaries.

**GPT-5.6 Luna**

- mechanical QA;
- prescribed test execution;
- screenshots;
- routine accessibility/responsive checks;
- straightforward CSS/focus/copy fixes;
- local checkpoints;
- release-candidate preparation;
- merge/push/deployment mechanics when explicitly assigned;
- production-origin smoke.

Luna must not improvise architecture. If a bounded task becomes architectural, it must stop and report escalation.

### General prompt discipline

Every worker prompt was supposed to:

- read AGENTS.md;
- state the exact branch and expected checkpoint;
- define the narrow scope;
- prohibit resets, cleaning, discarding, or branch switching;
- prohibit secrets and unrelated source changes;
- specify exact tests;
- specify stop conditions;
- state whether commit/push/merge/deploy is allowed;
- require an evidence-based final report.

## 10. Prompt and instruction summary

This section consolidates the major prompts supplied during the thread. The full prompts were long writing blocks; the operational content is summarized here so a new thread does not need the entire prior conversation.

| Prompt/task | Model | Required behavior |
|---|---|---|
| MASTER 1 Fallback Implementation (64218) | Terra High | Preserve WP-A/WP-B; create a checkpoint; implement terminal 2D fallback on hard failure/45-second timeout; add fake-timer tests; no deploy |
| MASTER 1 Budget-Constrained Fallback Implementation (37142) | Terra Medium | Same fallback contract under 18% allowance; minimal files/tests only; no broad QA, no snapshots, no MASTER 2 |
| MASTER 1 browser QA | Luna High | Test normal 3D, hard/timeout fallback, late readiness, one mobile fallback, focus/accessibility; stop on real defect |
| Surgical MASTER 1 Late-Readiness UI Fix (41726) | Terra Medium | Make 2D_ACTIVE authoritative for status copy; add focused regression; no architecture or deployment |
| MASTER 1 Final Local Checkpoint (52741) | Luna High | Verify branch/checks and create one local M1 checkpoint; preserve pending manual-QA note; no deployment |
| Launch Integration Architecture (28463) | Sol High | Inspect current architecture; lock MASTER 2 routing/lifecycle and MASTER 3 GameShell boundary; no code/commit/deploy |
| MASTER 2 Complete Game Entry (63817) | Terra High | Implement query-string routes, singleton retained host API, lifecycle/history, game launchers, multiplayer URL semantics, mobile/accessibility; do not implement GameShell |
| MASTER 2 Integration QA (76421) | Luna High | Verify all nine routes, game families, history, refresh, 3D bridge, multiplayer, responsive/focus; make only straightforward fixes; checkpoint if green |
| MASTER 3 Universal Cinematic GameShell (31974) | Terra High | One strong run: thin GameShell → Capital Clash Golden Game → gate → migrate remaining games if architecture holds; preserve all existing authority |
| MASTER 3 Full QA and Checkpoint (59214) | Luna High | Full game-family QA, results/replay, profiles, multiplayer, fallback regression, responsive/accessibility evidence; checkpoint if green |
| Final Pre-Deployment Release Candidate (80643) | Luna High | Only profile-sync degradation plus snapshot regeneration, direct tests/docs, full local gates; do not push/merge/deploy |
| Production Deployment and Smoke (68142) | Luna High | Verify candidate, record baselines, merge/push normally, wait for Pages, deploy Worker, test actual production, roll back on release blocker |
| Emergency rollback | Luna High | Do not debug/fix the failed release; restore known frontend/Worker baselines using normal rollback mechanisms; verify incognito production; preserve failed branch |

### Common hard boundaries in those prompts

- Do not rewrite game-core.js or gameplay rules.
- Do not alter recognition, scoring, question generation, deadlines, profiles, or storage schemas.
- Do not create a second Engine, iframe, renderer, dataset, or state store.
- Do not change multiplayer server/security rules.
- Do not weaken Google Maps restrictions.
- Do not hand-edit generated Worker snapshots.
- Do not add remote profile functionality to the initial release.
- Do not claim formal screen-reader certification without performing it.
- Do not use a broken automation environment as evidence that product code is broken.
- Do not deploy from a merely local checkpoint.

## 11. Pre-deployment release candidate details

The release candidate at 6306b11 reportedly included:

- all MASTER 1–3 work;
- remote profile sync default-off;
- local-only profile UI and persistence;
- regenerated multiplayer snapshots;
- Worker build;
- root tests 64/64;
- multiplayer tests 16/16;
- governance 21/21;
- local smoke;
- clean worktree.

This candidate was suitable for a deployment attempt according to the agent report, but it did not become an accepted production release merely because the deployment report ended with PRODUCTION RELEASE VERIFIED.

The Sol gate still required:

- actual Google Cloud key/referrer/API verification;
- actual production-origin smoke;
- public two-session multiplayer proof;
- explicit rollback readiness.

## 12. Production deployment: reported facts versus accepted facts

### Reported deployment facts

The deployment report claimed:

~~~text
Frontend main: 6306b11dbefd13b22c0a8879ab97d1bc5a3d7f2d
GitHub Pages run: 34386588626
Worker: version 6
Worker source: 4d4641ca615c0d0c444305ebedaddb79c96e7a6c
Frontend URL: https://www.arunabhosom.com/country-memory-map/
Worker URL: https://country-memory-friends.arunabh007.chatgpt.site/
Rollback performed: none
~~~

It also claimed full production functional, mobile, multiplayer, fallback, and security/network verification.

### What is accepted as current release evidence

Accepted:

- The URL named in the report is the intended production URL.
- A deployment attempt was reported.
- The user’s browser did load enough of the shell to display the screenshot.
- The user directly observed core interaction failure.
- The failure reproduced in incognito.

Not accepted:

- PRODUCTION RELEASE VERIFIED;
- the claim that all controls worked for a real user;
- the claim that production was equivalent to the tested local release;
- the claim that current deployed assets are a coherent single version;
- the claim that frontend and Worker rollback have occurred.

## 13. Unresolved risks and current uncertainty

### Immediate blockers

1. Core user-facing production behavior is broken according to direct normal and incognito observation.
2. Rollback has not been verified.
3. The actual current frontend SHA served by Pages is unknown.
4. The actual current Worker version is unknown.
5. No rollback commit SHA exists in the thread.
6. No post-rollback production smoke exists.
7. No root cause has been proven.

### Plausible but unproven causes

- mixed/stale Pages HTML/CSS/JavaScript/module assets;
- cache propagation or an incomplete rollout;
- root controls left inert after a surface-state transition;
- root initialization race;
- Google 3D visual/status state diverging from interaction state;
- retained iframe/controller readiness mismatch;
- production-only base-path or asset loading issue;
- a mismatch between the deployed frontend and Worker versions.

Do not choose among these by speculation. Restore the known baseline first, then compare offline.

### Older risks to revisit after rollback

- Google Maps browser-key referrer restriction must cover:

  ~~~text
  https://www.arunabhosom.com/country-memory-map/*
  ~~~

- API restrictions, billing, quotas, monitoring, and abuse alerts need owner verification.
- The gestureHandling: NONE and boundary-overlay warnings remain known.
- Pages cache propagation can take approximately ten minutes.
- main was reported as unprotected; procedural release gates must be followed.
- Physical touch/safe-area, screen-reader, reduced-motion, and 200% zoom coverage was incomplete.
- Remote profile synchronization must stay disabled until a separate architecture project supplies a real backend contract.
- Generated Worker source/snapshot parity must remain enforced after the new baseline.

## 14. Exact next-thread starting procedure

### Before any action

Open a **new Codex thread** using **GPT-5.6 Luna, High**.

Do not use Terra or Sol for the rollback. Do not start diagnosis, fixes, redesign, or a new deployment.

The new thread must:

1. Read AGENTS.md.
2. Confirm the canonical repository path.
3. Inspect current branch, HEAD, main, origin/main, worktree, and the preserved release branch.
4. Determine whether a rollback commit already exists.
5. Determine the actual Pages deployment state and actual Worker version.
6. If rollback already happened, verify it rather than applying a duplicate rollback.
7. If rollback did not happen, follow the exact emergency procedure below.

Never use reset, force-push, history rewriting, git clean, destructive restoration, or branch deletion.

### Copyable emergency rollback prompt

~~~text
EMERGENCY PRODUCTION ROLLBACK — COUNTRY MEMORY MAP

Repository:
/Users/Arunabho/Developer/country-memory-map

This is an emergency rollback operation.

DO NOT debug the new release.
DO NOT modify production code.
DO NOT redesign anything.
DO NOT create fixes.
DO NOT force-push or rewrite public history.

The newly deployed production release is broken in a real clean/incognito browser session.

Observed production failures:

1. The intended live/interactable Google 3D Earth experience is not functioning correctly.
2. Explore does not work correctly.
3. Countries does not work correctly.
4. Capitals does not work correctly.
5. The user cannot reliably use the front-page country/capital input flows.

This reproduces in incognito, so do NOT attribute it to local browser cache.

CURRENT RELEASE:

Frontend:
6306b11dbefd13b22c0a8879ab97d1bc5a3d7f2d

Worker:
Version 6
Source:
4d4641ca615c0d0c444305ebedaddb79c96e7a6c

KNOWN PRE-RELEASE ROLLBACK BASELINES:

Frontend:
e001b009218852223aa38353397af7631309ca19

Worker:
Version 5
Source:
bba20ef225446c98d8db4b305b85e391ebcfe4dd

TASK

1. Confirm current main/origin/main and production deployment state.

2. Preserve the broken release commits in Git history.
   Do NOT reset or force-push main.

3. Revert the production frontend release safely using normal Git history so the effective frontend source returns to the pre-release baseline behavior represented by:
   e001b009218852223aa38353397af7631309ca19

4. Push the rollback normally.

5. Wait for GitHub Pages to ACTUALLY finish redeploying.

6. Restore Worker version 5 using the existing deployment rollback/version mechanism.
   Do not rebuild or alter Worker source.

7. Verify the ACTUAL public URL:

https://www.arunabhosom.com/country-memory-map/

Use a new/incognito session.

VERIFY ONLY:

- site loads;
- original working map/game appears;
- country entry works;
- capital entry works where supported;
- primary navigation works;
- no fatal console/runtime errors.

Do not perform cosmetic QA or development work.

8. Confirm the deployed frontend SHA/version and Worker version after rollback.

9. Do not delete the release branch:
codex/fix-root-interaction-recovery

We need the failed release preserved exactly for forensic diagnosis later.

10. Do not start fixing the failed release.

FINAL REPORT

Return:

- pre-rollback main SHA;
- rollback commit SHA;
- Pages deployment result;
- restored Worker version;
- production URL result;
- country/capital input result;
- final main/origin/main state;
- confirmation release branch remains preserved.

Finish with exactly:

ROLLBACK VERIFIED

or

ROLLBACK FAILED
~~~

### Required interpretation of the rollback result

ROLLBACK VERIFIED is acceptable only if:

- the frontend rollback was actually pushed and Pages completed;
- Worker version 5 was actually restored;
- the public URL was tested in a clean/incognito session;
- country and capital entry worked where supported;
- primary navigation worked;
- the final frontend and Worker versions were recorded;
- the failed release branch remained preserved.

If any of these is missing, report ROLLBACK FAILED or an explicit incomplete state; do not claim success.

## 15. After rollback: stop, then diagnose offline

Once the old production version is verified:

1. Stop deployment and feature work.
2. Do not immediately redeploy 6306b11.
3. Preserve codex/fix-root-interaction-recovery.
4. Compare, offline and without production mutation:
   - what the QA agent actually tested;
   - what was committed and pushed;
   - what Pages actually served;
   - which HTML/CSS/JS/module assets were fetched;
   - root control enabled/inert state;
   - Google renderer readiness/state;
   - retained iframe/controller state;
   - base-path and cache behavior;
   - Worker/frontend version pairing.
5. Use a new implementation/fix prompt only after the defect is reproduced and its ownership is known.

The earlier assistant’s hypothesis was that this looked more like a root initialization/state-ownership or mixed-deployment regression than a failure of the underlying five games. That is an inference, not a proven root cause.

## 16. Explicit non-claims

This handoff does **not** claim:

- that the current production release is healthy;
- that the reported Pages build is still the version being served;
- that Worker v6 is still active;
- that rollback has occurred;
- that 6306b11 is safe to redeploy;
- that the exact browser defect has been isolated;
- that physical-device or formal accessibility certification is complete;
- that the downloaded Earth model is production-licensed or suitable for gameplay.

The only safe immediate objective is:

~~~text
Establish actual current deployment state
→ roll back if necessary
→ verify old production in incognito
→ stop
→ diagnose the failed release offline
~~~

## End of handoff
