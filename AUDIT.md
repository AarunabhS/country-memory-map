# Country Memory Map audit and reuse record

Audit date: 2026-09-08

## Existing architecture

- **Framework and build:** static HTML, CSS, and browser JavaScript. There is no framework, router, bundler, or dependency-install step. The existing test command is `node --test tests/*.test.cjs`.
- **Routing:** `index.html` is the application entry point. The internal QA surface is a separate `flag-gallery.html` page so it can be opened directly without changing the production game route.
- **Map and geometry:** the world map is rendered by the existing `GameMap` adapter in `game-map.js`, using the single browser-optimized Natural Earth country geometry bundle in `countries-data.js`. `country-borders.js` provides the derived adjacency data used by map gameplay.
- **Datasets:** `countries-data.js` contains the map records; `capitals-data.js` contains the capital records; `game-data.js` builds the playable 195-country model and its existing aliases.
- **Answer matching:** the original map checker used country/capital alias maps and a local normalization helper. The shared `AnswerValidator` in `game-core.js` now owns Unicode-aware normalization, punctuation and apostrophe handling, whitespace cleanup, optional diacritic folding, and explicit common aliases. The legacy checker delegates to it while retaining its existing fallback aliases.
- **Speech input:** the existing browser `SpeechRecognition` / `webkitSpeechRecognition` integration remains in `index.html` and `game-ui.js`. Flag Recall reuses the same speech control and validates the transcript through the shared validator.
- **State and persistence:** `Engine` in `game-core.js` remains the session state machine for setup, questions, retries, scoring, hints, practice, and results. `LocalProfile` continues to persist local progress and history in the existing browser storage path. Multiplayer code remains isolated in the existing UI/controller flow.
- **Presentation:** the existing map and game styles remain in `game.css` and `multiplayer.css`, with the new flag-game presentation isolated in `flag-game.css`. `FlagComponent` is the reusable flag renderer; it uses a reserved frame and native SVG aspect ratio via `object-fit: contain`. `CountryOutlineComponent` reuses the existing GeoJSON and clips its own fixed frame above Flag Match options.

## Baseline behavior capture

- **Desktop:** the existing entry point opened on the game chooser with World Conquest, Find the Country, and Capital Clash choices over the interactive world map. The map, found counter, typed checker, speech control, Reveal Names, Reset, Mark, zoom controls, labels, and map key were all present and usable.
- **Mobile:** the existing responsive layout moved the chooser into a full-width panel, kept map zoom controls touch-sized, allowed horizontal continent navigation, and kept the answer control reachable below the map. The retained map/game styles and keyboard-open handling remain in place; flag rounds use their own centered stage and do not force-focus the answer field below the phone breakpoint.

## Reuse decision

No framework migration was needed. The map renderer, Natural Earth geometry, country/capital records, existing game session lifecycle, scoring model, local profile, speech integration, map controls, Reveal Names, Reset, Mark, and multiplayer flow were preserved. The new flag modes extend `GameSession`/`Engine` through new question types and a flag-specific centered presentation layer.

## Flag inventory and QA

- `flags/` contains 195 self-hosted SVG assets named with lower-case ISO alpha-2 codes. The SVG files retain their native `viewBox` proportions; emoji flags are not used as authoritative assets.
- `flag-gallery.html` renders the complete inventory with search, continent filtering, a dark-surface toggle, load/failure counts, and focused QA badges for Nepal, Switzerland, Vatican City, Qatar, Saudi Arabia, Cambodia, Belize, Turkmenistan, and Bhutan.
- Desktop verification covered Flag Recall and Flag Match, including the centered stage, neutral image alt text, compact country outline, four unique answer cards, wrong-answer feedback, hint removal, and accessible result announcements. Mobile verification covered reserved flag frames, responsive card layout, compact outlines above the cards, and the absence of horizontal overflow. The gallery was checked in light and dark surfaces; all 195 SVGs loaded successfully.

## Verification

- Baseline before the upgrade: 22 tests passing.
- Current suite: 30 tests passing, including alias normalization, Flag Recall, Flag Match distractor selection and uniqueness (including small practice pools), hint/wrong-answer penalties, local SVG inventory coverage, and native-ratio checks for the detailed/unusual flags listed above.
