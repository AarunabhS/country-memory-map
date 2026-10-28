# GPT-6 development-workflow migration

Status: **APPROVED FUTURE WORK** for Codex-assisted development, approved by the project owner on 2026-09-23. Model pilot and rollout have not started.

## Migration boundary

This plan treats “migrate this project” as moving Codex-assisted development for Country Memory Map to appropriate GPT-6 models. Repository inspection found no OpenAI SDK, OpenAI API request, model configuration, or LLM-backed production feature. The browser game and multiplayer service therefore have no runtime model to replace.

**Proposed selection:** `gpt-6-sol` is the default for ordinary project work; `gpt-6-astra` handles Level A architecture and protected-boundary decisions; `gpt-6-luna` may handle fully specified Level C mechanical work after it passes a pilot. Level B implementation stays on Sol. Escalate the task and model when a lower-tier task reveals ambiguity or protected-boundary impact. This operational mapping follows the existing capability tiers in [AI_MODEL_ROUTING.md](../../AI_MODEL_ROUTING.md); it does not change their authority or task authorization. OpenAI Docs describes Astra as the highest-capability model, Sol as balancing intelligence and cost, and Luna as efficient for focused, repeatable work. The pilot must validate this mapping for this repository. Sources: [GPT-6 guidance](https://developers.openai.com/api/docs/guides/latest-model), [model catalog](https://developers.openai.com/api/docs/models).

Adding AI-powered gameplay or an OpenAI API dependency is outside this migration. That would be a separate Level A product, security, cost, and architecture decision.

Official baseline: [OpenAI GPT-6 model guidance](https://developers.openai.com/api/docs/guides/latest-model).

## Impact assessment

```text
Requested change: Plan a migration of Codex-assisted project work to appropriate GPT-6 models.
Affected workstreams: agent execution settings, repository instruction audit, representative-task evaluation, rollout documentation.
Routes/components affected: no production route or component; AGENTS.md records the owner's standing instruction, while docs/AI_MODEL_ROUTING.md remains capability-based.
Gameplay impact: none — no runtime code or game rules are changed.
Persistence impact: none.
Map/globe impact: none.
Mobile impact: none.
Accessibility impact: none in the migration itself; representative-task review must continue enforcing the existing accessibility standard.
Performance impact: no shipped bundle, network, or memory impact; Codex task latency and token cost are rollout metrics.
Migration risk: low for runtime, medium for development quality — changed agent behavior may affect scope control and verification.
Rollback path: return Codex tasks to the previously selected model/settings and revert only migration-specific instruction edits, if any.
Required QA: instruction-conflict audit, representative-task pilot, existing governance/root/multiplayer checks on any pilot code change, diff review, and cost/latency comparison.
Architecture risk: architecture-authority for any repository-wide routing change; operational model selection follows the existing tiers.
```

## Verified current state

- The frontend is static HTML, CSS, and browser JavaScript; the multiplayer backend is a Node/Cloudflare Worker package.
- Searches across source, tests, manifests, workflows, hidden project files, and deployment configuration found no OpenAI client or model request.
- `docs/AI_MODEL_ROUTING.md` deliberately routes by capability and architectural risk rather than commercial model branding. Preserve that durable policy.
- `AGENTS.md` already defines source precedence, protected behavior, required inspection, proportional verification, and stop conditions. These are important because Astra follows long instruction sets closely.
- The worktree was clean when this plan was first revised on 2026-09-23. A later migration implementation must preserve any then-current user changes.
- The local Codex user configuration inspected on 2026-09-23 has `model = "gpt-6-sol"` and `model_reasoning_effort = "high"` as global defaults. The effective model/effort of every future task and availability of a project-specific control still need verification at pilot time. No host setting was changed for this plan.

## Official compatibility rules to carry into any future runtime use

These rules are not production changes for the current repository, but they become gates if an OpenAI-backed feature is later added:

1. Choose the exact model ID for the future workload: `gpt-6-astra`, `gpt-6-sol`, or `gpt-6-luna`.
2. Use the Responses API for reasoning with tools. GPT-6 tool-calling support in Chat Completions depends on model and reasoning effort.
3. Preserve the current effective reasoning effort where supported. Astra does not support `none`; use `low` instead. For a current `minimal` setting, start at `low` and compare results. Sol and Luna support `none`.
4. When reasoning effort is not `none`, remove `temperature`, `top_p`, and `top_logprobs`; for Chat Completions also remove `logprobs`; for Responses remove `message.output_text.logprobs` from `include`.
5. If migrating from GPT-5.5 or earlier, replace `prompt_cache_retention` with `prompt_cache_options.ttl: "30m"`.
6. With EU data residency, use Standard processing for GPT-6 Astra, Sol, or Luna.

## Acceptance criteria

1. New Codex work for each pilot explicitly selects its tier's proposed model; the exact host/account mechanism is recorded because it is not stored in this repository today.
2. Existing repository authority, risk tiers, protected behavior, and QA requirements remain unchanged.
3. Representative pilots demonstrate that Astra, Sol, and Luna meet the respective Level A, B, and C scope, correctness, protected-boundary, and proportional-verification gates at least as well as the current workflow.
4. The pilot records reasoning effort, elapsed time, input/output usage when available, clarification pauses, test behavior, and human review findings.
5. The owner-requested standing instruction is recorded in AGENTS.md; any later instruction edit is justified by an observed pilot failure, is narrowly scoped, and passes repository governance checks.
6. No OpenAI package, secret, browser credential, network request, or production feature is introduced.
7. Rollback can be completed by selecting the prior Codex model/settings and reverting migration-only documentation changes.

## Ordered implementation

### Phase 1 — Capture the operational baseline

1. Record the current Codex model and effective reasoning effort used for this project. Do not infer these from historical notes or repository prose.
2. Record where the selection lives: per-task model picker, saved project setting, host configuration, or another account-level control.
3. Choose three representative, reviewable tasks without production deployment:
   - Level C: a small mechanical documentation or test maintenance task with explicit acceptance criteria.
   - Level B: a contained implementation task that crosses several files but stays within an approved boundary.
   - Level A: an architecture review or plan that must identify protected boundaries and stop before unauthorized implementation.
4. Capture baseline outcomes under the existing model/settings when comparable prior task evidence is unavailable.

### Phase 2 — Audit the instruction surface

1. Review `AGENTS.md`, `ARCHITECTURE.md`, `docs/MASTER_PROJECT_INDEX.md`, `docs/DEVELOPMENT_PROTOCOL.md`, `docs/AI_MODEL_ROUTING.md`, and the relevant subsystem specification as the intended instruction chain.
2. Check for duplicate, contradictory, stale, or overly broad instructions, especially around autonomy, approvals, subagents, testing, and architecture authority.
3. Keep historical narratives and completed plan evidence out of the default prompt context unless a task needs them. Do not treat model recommendations in historical prose as active configuration.
4. Do not rewrite instructions pre-emptively. Propose the smallest edit only when a pilot failure has direct evidence and an existing instruction cannot resolve it.

### Phase 3 — Run tiered GPT-6 pilots

1. Select `gpt-6-astra` for Level A, `gpt-6-sol` for Level B, and `gpt-6-luna` for Level C. If Luna cannot meet the C gate without substantial reviewer correction, retain Sol for Level C.
2. Preserve the current effective reasoning effort where supported. If the baseline is `none`, start Astra at `low`; if it is `minimal`, start all three models at `low` and compare results. Otherwise use the same effective effort. When no baseline is available, start Sol at `medium` and Luna at `low`, then adjust only from pilot evidence.
3. Run the tasks in isolated branches or worktrees when they change files. Keep each diff independently reviewable.
4. Score each result against:
   - instruction and scope adherence;
   - preservation of gameplay, persistence, routes, map/globe, profiles, and multiplayer boundaries;
   - correctness and completeness;
   - unnecessary clarification or approval pauses;
   - proportionality of tests and commentary;
   - diff size and unrelated changes;
   - elapsed time and usage/cost data available from the host.
5. For any pilot code change, run the checks required by `docs/DEVELOPMENT_PROTOCOL.md` and record exact pass/fail/skip results. Run the multiplayer build only in a disposable copy when snapshot reconciliation is outside scope.

### Phase 4 — Tune only from evidence

1. If a model pauses unnecessarily, first check whether a task constraint calls for it; clarify existing autonomy/approval language only when a concrete instruction conflict is shown.
2. If it over-tests small changes, add a concise proportional-verification clarification while retaining required checks.
3. If output is too verbose or heavily formatted, add a short project communication preference rather than task-specific prompt patches.
4. If a task needs more reasoning, change effort or select a higher-capability tier before changing shared instructions. Do not make delegation mandatory as part of this model cutover.
5. Re-run the pilot case that exposed an issue, then the three-case gate if a shared instruction changed.

### Phase 5 — Cut over and observe

1. Confirm `gpt-6-sol` remains the effective default for new project tasks through the verified host control, or select it per task if no project-wide control exists. Use Astra explicitly for Level A and Luna only for Level C after its pilot passes.
2. Keep `docs/AI_MODEL_ROUTING.md` capability-based. Record the dated operational mapping and pilot results here so model churn does not rewrite architectural policy.
3. Review the next three real, non-deployment tasks against the same quality, latency, and usage metrics.
4. Roll back immediately for repeated scope violations, degraded correctness, materially unacceptable cost/latency, or incompatibility with the host workflow.
5. After the observation window passes, mark this plan completed with actual evidence. Do not label the game or deployment “migrated” because the runtime contains no model.

## Verification matrix

| Gate | Evidence required |
|---|---|
| Repository inventory | Search results showing no OpenAI runtime integration or model configuration |
| Instruction audit | Reviewed files plus concrete conflict findings, or an explicit “none found” |
| Level C Luna pilot | Explicit acceptance criteria, clean diff, applicable automated checks, no substantial rework; otherwise use Sol |
| Level B Sol pilot | Diff review, applicable automated checks, and relevant manual QA plan/evidence |
| Level A Astra pilot | Correct boundary map, alternatives/tradeoffs, rollback, QA plan, and appropriate stop/escalation behavior |
| Operational comparison | Model, reasoning effort, elapsed time, usage/cost when available, clarification count, and reviewer outcome |
| Rollback drill | Verified ability to select the prior model/settings without repository or production changes |

## Rollback

Change the Codex project/task selection back to the recorded prior model and reasoning effort. Revert only instruction or operational-documentation commits created by this migration. Pilot branches/worktrees remain isolated and can be discarded through the project’s normal review workflow. No production data, deployed code, persistent browser state, multiplayer schema, or API secret is involved.

## Unresolved decisions

- Which effective model and reasoning effort form each pilot's comparison baseline; the inspected local global defaults are Sol/high, but a task may override them.
- Whether the Codex host supports a saved project-wide Sol default or requires per-task selection.
- Which real upcoming tasks are suitable for the Level B and Level A pilot without inventing work.
- What cost/latency threshold the project owner considers unacceptable.
