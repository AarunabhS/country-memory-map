# Country Memory Map

Static geography games, published from `main` at https://www.arunabhosom.com/country-memory-map/. The main page uses Google 3D Earth when available and retains a playable 2D implementation at `legacy/`. The current root failure path shows a cinematic Earth preview but does not expose that retained app as a playable fallback. No account is required; run `python3 -m http.server 8000` for local testing.

## Games

- **World Conquest:** Relaxed, 3-minute Sprint, 60-second Blitz, three-life Sudden Death, Continent.
- **Find the Country:** 20-question Standard, 60-second Blitz, 20-question Continent.
- **Capital Clash:** 20-question Classic (10 typed, 10 clicked), 60-second alternating Blitz, 20-question Continent.
- **Flag Recall:** identify an authentic country flag by typing its country or territory name; normal recall has no answer suggestions.
- **Flag Match:** choose the correct flag from four unique flag cards. Easy, Medium and Hard alter distractor selection, including same-region and curated confusable-flag preferences.
- **Free map:** the original country and capital recognition modes, aliases, territories, labels, filters, zoom, touch gestures and speech.

All games use the same 195-country classification as the original checker. Small pools repeat only after every eligible country has been served. Practice Missed uses exactly the countries missed or answered with retries and is separate from personal-best comparisons.

## Architecture

- `index.html`, `styles.css`, `src/`: cinematic shell, responsive full-workspace Google 3D renderer, and the narrow typed-answer bridge into the retained game. Several root controls and game modes remain staged rather than complete route-backed flows.
- `legacy/index.html`: retained map renderer and free checker; a document base keeps its existing scripts, flags, profiles, and multiplayer modules at their canonical root paths.
- `game-data.js`: projects the existing map/capital sources into one country model. Capitals are arrays of name, aliases, role and coordinates. Geography, capital, flag and shape difficulty fields are independent. Editorial v1 difficulty metadata can be replaced by performance statistics without changing question logic.
- `game-core.js`: DOM-independent `Engine`, shared question types, scoring, state, deadlines, result aggregation and `LocalProfile` persistence. Clock and randomness are injectable. Future question types can reuse `submitCountry`, `resolveQuestion`, and the results model.
- `flag-data.js` / `flags/`: curated flag metadata and 195 self-hosted SVG assets using ISO alpha-2 filenames. `flag-component.js` renders each asset in a reserved, native-proportion frame.
- `country-outline.js`: reuses the existing country GeoJSON to render a compact, native-proportion border silhouette above Flag Match options. The outline has its own clipped frame so it cannot cover or intercept answer cards.
- `flag-game.css` / `flag-gallery.html`: centered flag-game presentation and the internal complete-inventory QA gallery. The gallery supports search, continent filtering, light/dark surfaces and focused checks for detailed flags.
- `AnswerValidator` in `game-core.js`: shared normalization and explicit aliases for map, typed-game and flag answers.
- `game-map.js`: map feedback, region dimming, small-country targets, touch-safe selection and keyboard selection. Broad regional views appear for small targets; successful typed answers never move or zoom the view.
- `game-ui.js` / `game.css`: shared setup, HUD, live feedback and results. The interface ticks the engine every 50ms; every answer also checks absolute deadlines before validation. A delayed/background tick cannot admit a late answer. Successful/failed questions transition after 700ms, which remains part of timed sessions.
- `country-borders.js`: shared-edge adjacency derived from retained Natural Earth geometry. Regenerate with `python3 scripts/derive-borders.py`. It reflects that geometry and is not an independent legal boundary source.

Timers and result response times use seconds; internal deadlines use milliseconds. In question games, accuracy is correctly answered questions divided by questions played. In World Conquest, it is accepted country names divided by accepted plus incorrect entries. Duplicates and blank submissions are excluded. Average and fastest answer times use successful responses and include any retry time before the correct response. Streak multipliers include the newly completed answer (the fifth answer gets ×1.05). Wrong question attempts deduct 25 then 50 points; scores may be negative. The third error reveals the answer without another deduction. Manual endings count an unresolved question as missed. Strongest/weakest regions compare completion proportions, with counts shown for context.

Relaxed/Continent World Conquest bests require completion and compare elapsed time. Other formats compare correct count, then score. Bests are scoped to game, format, region and relevant difficulty. Recent results (20 maximum), last format and difficulty are saved under `country-memory-profile-v1`; storage failure falls back to the current visit. `LocalProfile` is the persistence boundary for a future backend.

## Capital data and arrangements

The existing `capitals-data.js` includes 207 entries covering all 195 countries. Capital Clash explicitly accepts listed capital/administrative arrangements rather than silently selecting one. One-capital prompts preserve that entry's role (including claimed or de facto arrangements). Indonesia explicitly accepts the current government seat or designated future capital during transition. Historical capitals such as Malabo or Rangoon are not accepted for their successors. Some aliases are alternative names of the same present city, not historical capital cities.

Representative current arrangements were checked on 2026-09-07 against primary sources:

- [South African Government: three capitals](https://www.gov.za/south-africa-glance).
- [Equatorial Guinea government: Ciudad de la Paz proclamation, 2 January 2026](https://www.guineaecuatorialpress.com/index.php/noticias/el_presidente_de_la_republica_proclama_la_ciudad_de_la_paz_como_capital_de_la_republica_de_guinea_ecuatorial_con_la_firma_de_un_decreto_ley).
- [Nusantara Capital Authority: transition toward the 2028 political-capital target](https://ikn.go.id/id/posts/pembangunan-tahap-ii-ikn-terus-berjalan-otorita-ikn-lakukan-evaluasi-berkala).

These checks complement the existing dataset's 2026-09-01 validation. They are not a claim that every entry was independently re-researched this time.

## Validation

Run `node --test tests/*.test.cjs`. The tests cover every mode, all 195 canonical answers, every accepted capital spelling, timing/scoring thresholds, third-error elimination, duplicates, practice, region and difficulty coverage, persistence failure, flag-answer aliases, flag distractor uniqueness, hint penalties, local SVG coverage and native flag ratios. Manual browser QA is still required for phone, tablet and desktop layouts, actual map clicks, game selection, shared results, retries, free-map compatibility, countdown locking, Flag Recall, Flag Match and the complete flag gallery. Physical-device microphone permissions remain browser-controlled; no voice recordings are stored by this app. See [AUDIT.md](AUDIT.md) for the pre-change inventory and reuse record, and [CONTRIBUTING.md](CONTRIBUTING.md) for contributor guidance.
