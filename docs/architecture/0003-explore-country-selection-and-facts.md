# ADR 0003: Explore country selection and facts

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

The root Explore shell submits typed and speech-recognized text to the retained Free Map checker, while Google and local globe clicks already emit the same canonical geometry ID. The checker reports that a typed country was marked, but its structured response does not identify the resolved country. As a result, typed and spoken answers cannot update the visible globe even though both root renderers already support country-state styling.

Explore also has no compact country context after a selection. The requested experience needs population and a few useful facts without changing scored games, duplicating recognition, adding a large payload, or making each selection depend on a third-party request.

## Decision

- The retained Free Map response additively returns a canonical country summary after an accepted country or capital: geometry ID, display name, ISO codes, continent, subregion, and current capital records. Recognition remains owned by the retained checker.
- Root Explore owns one in-memory selected-country state. Accepted typed, spoken, and clicked answers all flow through the same response handler.
- The root applies the resolved geometry ID to both root renderers through their existing renderer-neutral state methods. `focusCountry(id)` is implemented by both adapters so the active camera exposes the highlighted country; inactive or not-yet-ready renderers reapply the selection when they become active.
- A compact, dismissible Explore fact card presents the resolved name, population, capital, continent, subregion, and ISO code. It is part of the root globe stage and is therefore absent from scored-game and multiplayer presentation.
- Population values are a compact local snapshot of World Bank indicator `SP.POP.TOTL`, using the most recent non-empty observation returned for each playable ISO-3 country. The snapshot is regenerated explicitly and selection performs no runtime data request. Missing values are displayed as unavailable rather than inferred.

This decision does not change country acceptance, scoring, progression, persistence, game-map styling, routes, multiplayer, or the root/retained ownership split.

## Alternatives

- **Resolve typed names again in the root:** rejected because it would duplicate the authoritative retained recognition and alias rules.
- **Scrape the retained map’s marked DOM state:** rejected because it recreates the asynchronous bridge failure already removed from Explore.
- **Request a public country API after every selection:** rejected because facts would depend on third-party latency, connectivity, CORS behavior, and service availability.
- **Move the fact card into scored games:** rejected because the request is Explore-only and games own their own feedback and pacing.
- **Persist selections:** rejected because no cross-session behavior was requested and it would introduce a migration and stale-data questions.

## Consequences

- All three Explore input methods converge on one canonical highlight and fact presentation.
- The response contract grows only by additive JSON-like fields; existing consumers of message, kind, checker, and accepted remain compatible.
- The static population module adds roughly 11 KiB uncompressed and no runtime dependency or request. Values are snapshots and must show their observation year.
- Vatican City currently has no value in the selected World Bank feed and is shown truthfully as unavailable.
- Camera focus is renderer-specific but remains behind the existing adapter method.
- The card is responsive, dismissible, and announced, while the selected map state remains visible after dismissal.

## Affected systems

- Root Explore markup, styles, live status, answer result handling, and renderer activation.
- Retained Free Map response metadata only; checker recognition and map marking remain unchanged.
- Local and Google root globe adapter camera behavior and country selection state.
- New local population snapshot and fact-formatting module.
- Focused adapter, bridge, shell, and fact-data tests plus architecture/performance/QA documentation.
- Scored games, multiplayer, persistence, profiles, canonical routes, and generated Worker snapshots are unchanged.

## Migration

No route, persistence, dependency, API key, server, or generated multiplayer migration is required. Ship the additive retained response, both adapter methods, root selection coordinator, fact data, and fact presentation together. Older consumers can ignore the additional response field.

## Rollback

Remove the fact-card markup/styles/modules and root selection coordinator, restore `focusCountry` to its no-op base behavior, and remove the additive retained response metadata. Existing checker behavior and stored data remain valid.

## Verification

- `node scripts/check-governance.mjs`
- `node --test tests/*.test.cjs`
- `npm --prefix multiplayer-server test`
- JavaScript syntax and diff checks.
- Focused tests for population coverage/formatting, additive bridge metadata, common adapter focus behavior, and Explore-only fact-card structure.
- Manual desktop, narrow portrait, and short-landscape checks for typed, spoken, and clicked selections, close behavior, input clearance, highlighted-country visibility, keyboard order, and unavailable population copy.
- Production-origin Google 3D and physical microphone/touch checks remain required after a separately authorized frontend deployment.

Population data source: [World Bank Indicators API, population total (`SP.POP.TOTL`)](https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrnev=1&per_page=400).
