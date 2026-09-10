# Explore country selection and facts

Status: completed 2026-09-11. This is a Level A map-boundary change implemented within the existing renderer-neutral adapter and retained-checker contracts.

## Impact assessment

```text
Requested change: Make typed, spoken, and clicked Explore answers visibly highlight the resolved country and show a concise country fact card.
Affected workstreams: root Explore shell, retained Free Map response contract, local/Google globe camera and selection presentation, country reference data, responsive UI, focused tests.
Routes/components affected: Home/Explore countries and capitals; root answer dock, globe adapters, retained checker bridge, new fact card. Scored and multiplayer game routes are presentation-isolated and unchanged.
Gameplay impact: none; game rules, scoring, questions, timers, progression, and retained game-map feedback are unchanged.
Persistence impact: none; the current Explore selection remains in memory only.
Map/globe impact: both root renderers receive the same resolved geometry ID, selection state, and camera focus through MapAdapter methods.
Mobile impact: the fact card becomes a compact, dismissible overlay above the existing mobile HUD/dock/launcher stack without adding a new fixed breakpoint.
Accessibility impact: the card is a labelled complementary region with live updates and a keyboard-accessible dismiss action; map selection is also announced in the existing live status.
Performance impact: one small static population lookup is added; there is no selection-time network request, duplicate geometry, or new dependency.
Migration risk: medium — the structured same-origin bridge gains additive country metadata and both renderer implementations gain an implemented focusCountry method.
Rollback path: remove the fact-card markup/styles/data module and selection coordinator, restore the prior bridge response and no-op focusCountry behavior.
Required QA: governance, root tests, focused bridge/adapter/data tests, JavaScript syntax checks, diff validation, local HTTP smoke, and manual desktop/mobile/short-landscape Explore checks when browser QA is authorized.
Architecture risk: architecture-authority — this crosses the retained checker, root Explore UI, shared map-adapter, and reference-data boundaries; the change remains additive and renderer-neutral.
```

## Acceptance criteria

- An accepted typed or spoken country/capital resolves to one canonical country ID, highlights that country, and moves the active globe camera so the highlight is visible.
- Clicking a country uses the same accepted-result path and shows the same fact card.
- The card shows a concise country name, population with source year, capital, and region information, with truthful unavailable states.
- Only the root Explore surface presents the card; scored and multiplayer routes retain their existing behavior.
- A later renderer activation reapplies the current Explore selection.
- The layout remains operable on desktop, mobile portrait, and short mobile landscape without covering the answer controls.

## Verification evidence

- `node scripts/check-governance.mjs` passed (21 required files).
- `node --test tests/*.test.cjs` passed (80/80).
- `npm test` in `multiplayer-server/` passed (17/17).
- Focused fact, adapter, bridge, and shell tests passed (30/30).
- `node --check` passed for the changed runtime, generated population, fact, adapter, and generator modules.
- `git diff --check` passed.
- The updated root document, root controller, fact formatter, generated population lookup, and retained checker each returned HTTP 200 from the retained local preview server; the existing preview handoff was refreshed without browser interaction testing.
- The generated lookup contains valid positive population records for 194 of 195 playable countries. Vatican City is the single documented World Bank-unavailable record and uses the explicit unavailable state.
- The multiplayer build was not run because this change touches no canonical multiplayer rule/data input and that command regenerates snapshots; the unchanged multiplayer tests passed.
- Browser visual/interaction testing was not performed because it was not explicitly requested. Desktop, portrait, short-landscape, physical microphone/touch, production Google 3D, and production deployment remain manual checks.

## Unresolved decisions

None. Population values use a compact generated World Bank snapshot with per-record observation years and an explicit unavailable state rather than a runtime third-party request.
