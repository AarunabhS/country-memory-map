# GPT-6 Astra development-workflow migration

Status: proposed; implementation and rollout have not started.

## Migration boundary

This plan treats “migrate this project” as moving Codex-assisted development for Country Memory Map to `gpt-6-astra`. Repository inspection found no OpenAI SDK, OpenAI API request, model configuration, or LLM-backed production feature. The browser game and multiplayer service therefore have no runtime model to replace.

Adding AI-powered gameplay or an OpenAI API dependency is outside this migration. That would be a separate Level A product, security, cost, and architecture decision.

Official baseline: [OpenAI GPT-6 Astra model guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra).

## Impact assessment

```text
Requested change: Plan a migration of Codex-assisted project work to GPT-6 Astra.
Affected workstreams: agent execution settings, repository instruction audit, representative-task evaluation, rollout documentation.
Routes/components affected: no production route or component; AGENTS.md and docs/AI_MODEL_ROUTING.md are reviewed as instruction inputs, with edits only if the pilot proves a concrete need.
Gameplay impact: none — no runtime code or game rules are changed.
Persistence impact: none.
Map/globe impact: none.
Mobile impact: none.
Accessibility impact: none in the migration itself; representative-task review must continue enforcing the existing accessibility standard.
Performance impact: no shipped bundle, network, or memory impact; Codex task latency and token cost are rollout metrics.
Migration risk: low — the runtime product has no model dependency; principal risk is changed agent behavior causing broader or less predictable repository changes.
Rollback path: return Codex tasks to the previously selected model/settings and revert only migration-specific instruction edits, if any.
Required QA: instruction-conflict audit, representative-task pilot, existing governance/root/multiplayer checks on any pilot code change, diff review, and cost/latency comparison.
Architecture risk: judgment-requiring — selecting the execution model is operational, while any change to repository-wide authority or routing remains architecture-authority.
```

## Verified current state

- The frontend is static HTML, CSS, and browser JavaScript; the multiplayer backend is a Node/Cloudflare Worker package.
- Searches across source, tests, manifests, workflows, hidden project files, and deployment configuration found no OpenAI client or model request.
- `docs/AI_MODEL_ROUTING.md` deliberately routes by capability and architectural risk rather than commercial model branding. Preserve that durable policy.
- `AGENTS.md` already defines source precedence, protected behavior, required inspection, proportional verification, and stop conditions. These are important because Astra follows long instruction sets closely.
- The current worktree contains unrelated user changes. A later migration implementation must not modify, revert, or absorb them.

## Official compatibility rules to carry into any future runtime use

These rules are not production changes for the current repository, but they become gates if an OpenAI-backed feature is later added:

1. Use the exact model ID `gpt-6-astra`.
2. Use the Responses API for tool calling. Chat Completions remains supported only where tool calling is not needed.
3. Preserve the current effective reasoning effort; if it is `none` or `minimal`, begin the Astra comparison at `low`. Astra does not support `none`.
4. Remove `temperature`, `top_p`, and `top_logprobs`; for Chat Completions also remove `logprobs`; for Responses remove `message.output_text.logprobs` from `include`.
5. If migrating from GPT-5.5 or earlier, replace `prompt_cache_retention` with `prompt_cache_options.ttl: "30m"`.
6. With EU data residency, use Standard processing; Astra Fast/Priority processing is not supported there.

## Acceptance criteria

1. New Codex work for the pilot explicitly selects `gpt-6-astra`; the exact host/account mechanism is recorded because it is not stored in this repository today.
2. Existing repository authority, risk tiers, protected behavior, and QA requirements remain unchanged.
3. A representative pilot demonstrates that Astra follows scope, preserves protected boundaries, handles instructions, and verifies proportionately at least as well as the current workflow.
4. The pilot records reasoning effort, elapsed time, input/output usage when available, clarification pauses, test behavior, and human review findings.
5. Any instruction edit is justified by an observed Astra failure, is narrowly scoped, and passes repository governance checks.
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

### Phase 2 — Audit Astra’s instruction surface

1. Review `AGENTS.md`, `ARCHITECTURE.md`, `docs/MASTER_PROJECT_INDEX.md`, `docs/DEVELOPMENT_PROTOCOL.md`, `docs/AI_MODEL_ROUTING.md`, and the relevant subsystem specification as the intended instruction chain.
2. Check for duplicate, contradictory, stale, or overly broad instructions, especially around autonomy, approvals, subagents, testing, and architecture authority.
3. Keep historical narratives and completed plan evidence out of the default prompt context unless a task needs them. Do not treat model recommendations in historical prose as active configuration.
4. Do not rewrite instructions pre-emptively. Propose the smallest edit only when a pilot failure has direct evidence and an existing instruction cannot resolve it.

### Phase 3 — Run the Astra pilot

1. Select `gpt-6-astra` for each pilot task.
2. Preserve the current effective reasoning effort. If the baseline is `none` or `minimal`, start Astra at `low`; otherwise use the same effective effort.
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

1. If Astra pauses unnecessarily, clarify the existing autonomy/approval language without weakening destructive-action or protected-boundary controls.
2. If it over-tests small changes, add a concise proportional-verification clarification while retaining required checks.
3. If output is too verbose or heavily formatted, add a short project communication preference rather than task-specific prompt patches.
4. If it under-delegates, change delegation guidance only after the project owner decides multi-agent use is desirable; do not make delegation mandatory as part of this model cutover.
5. Re-run only the pilot case that exposed the issue, then the full three-case gate after the instruction stabilizes.

### Phase 5 — Cut over and observe

1. Set `gpt-6-astra` as the default for new project tasks using the verified host control.
2. Keep `docs/AI_MODEL_ROUTING.md` capability-based. Document a dated operational mapping separately only if the team needs a shared record, so model churn does not rewrite architectural policy.
3. Use Astra for the next three real, non-deployment tasks and review the same quality, latency, and usage metrics.
4. Roll back immediately for repeated scope violations, degraded correctness, materially unacceptable cost/latency, or incompatibility with the host workflow.
5. After the observation window passes, mark this plan completed with actual evidence. Do not label the game or deployment “migrated” because the runtime contains no model.

## Verification matrix

| Gate | Evidence required |
|---|---|
| Repository inventory | Search results showing no OpenAI runtime integration or model configuration |
| Instruction audit | Reviewed files plus concrete conflict findings, or an explicit “none found” |
| Level C pilot | Diff review and applicable automated checks |
| Level B pilot | Diff review, applicable automated checks, and relevant manual QA plan/evidence |
| Level A pilot | Correct boundary map, alternatives/tradeoffs, rollback, QA plan, and appropriate stop/escalation behavior |
| Operational comparison | Model, reasoning effort, elapsed time, usage/cost when available, clarification count, and reviewer outcome |
| Rollback drill | Verified ability to select the prior model/settings without repository or production changes |

## Rollback

Change the Codex project/task selection back to the recorded prior model and reasoning effort. Revert only instruction or operational-documentation commits created by this migration. Pilot branches/worktrees remain isolated and can be discarded through the project’s normal review workflow. No production data, deployed code, persistent browser state, multiplayer schema, or API secret is involved.

## Unresolved decisions

- Which current model and reasoning effort form the comparison baseline; the repository does not encode them.
- Whether the Codex host supports a saved project-wide Astra default or requires per-task selection.
- Which real upcoming tasks are suitable for the Level B and Level A pilot without inventing work.
- What cost/latency threshold the project owner considers unacceptable.

