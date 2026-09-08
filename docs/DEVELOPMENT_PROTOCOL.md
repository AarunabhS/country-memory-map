# Development protocol

Use this protocol for every material change. A material change affects production code, behavior, data, dependencies, deployment, shared documentation, or a protected boundary.

## 1. Impact assessment

Write this short block in the active execution plan or task notes before implementation:

```text
Requested change:
Affected workstreams:
Routes/components affected:
Gameplay impact: none / describe
Persistence impact: none / describe
Map/globe impact: none / describe
Mobile impact: none / describe
Accessibility impact: none / describe
Performance impact: none / describe
Migration risk: none / low / medium / high — why
Rollback path:
Required QA:
Architecture risk: mechanical / judgment-requiring / architecture-authority
```

Use “none” only after inspecting the relevant boundary.

## 2. Inspect and classify

- Trace the current implementation, inputs, consumers, persistence keys, generated outputs, tests, and deployment path.
- Apply the precedence and status vocabulary in `MASTER_PROJECT_INDEX.md`.
- Select the capability tier in `AI_MODEL_ROUTING.md`. Mechanical executors must follow an established pattern and escalate missing architectural choices.
- For user-facing work, identify desktop, mobile portrait, mobile landscape, keyboard, screen-reader, reduced-motion, error, and loading implications.

## 3. Implement safely

- Keep the change narrow, reversible, and internally coherent.
- Avoid unrelated cleanup and opportunistic migrations.
- Do not hand-edit generated multiplayer snapshots.
- Do not add a dependency, network request, persistent field, route, global primitive, map provider import, or shared UI abstraction without the corresponding review.
- Preserve browser-delivered Maps API keys as public credentials with minimum required API permissions, authorized website/referrer restrictions, and monitoring/quota controls where appropriate. Never introduce private/server secrets into client assets.

## Stop and escalate

Stop before editing further when any of these emerges unexpectedly:

- protected gameplay or a working flow must change outside the request;
- a local or remote persistence migration is required;
- routing, game-engine, map/globe, multiplayer-core, or cross-system ownership must be decided;
- a planned component would be presented as already implemented;
- a generated snapshot differs and reconciling it could alter production behavior;
- work would obstruct implementing the known root playable-fallback defect, or would break that contract after it becomes production-verified;
- the change needs a new framework, major dependency, build system, or test system;
- the requested acceptance criteria conflict with verified runtime behavior;
- rollback is unclear or production data could be lost.

Report the evidence, affected systems, available choices, and the smallest decision needed.

## 4. Verify and review

Run the commands applicable to the changed surface:

```sh
node scripts/check-governance.mjs
node --test tests/*.test.cjs
npm --prefix multiplayer-server test
npm --prefix multiplayer-server run build
```

The root app currently has no lint, typecheck, or production-build command. The multiplayer build regenerates snapshots, so run it in a disposable copy when snapshot reconciliation is outside the task. Do not make snapshot-parity a required gate until the baseline is deliberately reconciled.

Then review the diff for protected behavior, unexpected source/generated changes, secret exposure, documentation status labels, and rollback accuracy. Use `QA_MATRIX.md` for manual checks. Record exactly what passed, failed, was skipped, or remains unverified.

## 5. Finish

Move the execution plan from `active/` to `completed/`, update decision documentation only for decisions actually made, and report known limitations. Deployment and production verification are separate explicit actions.
