# Universal Cinematic GameShell specification

Status: thin adapter and retained-suite integration are **VERIFIED CURRENT ARCHITECTURE**; production/device verification remains **NEEDS QA**. Further component-library expansion is **PROPOSED TARGET ARCHITECTURE**.

`game-shell.js` currently provides the engine-independent presentation contract and `game-shell.css` applies it to the retained scored-game suite, profiles, results, and multiplayer surroundings. It is not a game store and is not production-verified.

## Goals

- Preserve game-owned mechanics while giving game pages a consistent cinematic environment, layout, accessibility contract, and responsive behavior.
- Support map, globe, flag, typed-answer, click-answer, practice, profile, and multiplayer presentations without coupling their rules to the shell.
- Make loading, failure, fallback, feedback, and results explicit states.

## Conceptual responsibilities

| Layer | Shell responsibility | Game-owned responsibility |
|---|---|---|
| Environment | Background, safe areas, viewport and renderer slots | Choosing the required game surface |
| Game header | Identity, title, navigation/end controls | Game/mode wording and allowed actions |
| Stage | Stable layout slot and state announcements | Map, globe, flag, outline, or custom stage content |
| HUD | Shared containers, hierarchy, responsive collapse | Score, timer, lives, progress, and metric meanings |
| Interaction layer | Input placement, focus order, touch/keyboard contract | Answer validation, target selection, hints, rules |
| Feedback | Accessible status channel and visual-motion hooks | Correct/incorrect/duplicate semantics and score effects |
| Result layer | Dialog/page structure, focus return, responsive layout | Result calculations, bests, practice targets, replay data |

## Required contracts

- The shell receives serializable display state and callbacks; it does not calculate score, select countries, mutate persistence, or import game-engine internals.
- Map/globe renderers are supplied through an adapter slot. The shell does not import Google Maps directly.
- Every 3D-dependent game declares a playable fallback state. A decorative Earth is not a playable fallback.
- Game state remains authoritative through transitions; shell animation cannot delay deadlines or accept late answers.
- Shell components expose semantic names, live-region behavior, visible focus, keyboard order, touch sizing, contrast, and reduced-motion variants.
- Mobile portrait and landscape define separate space allocations for header, stage, HUD, answer dock, and navigation controls so they cannot overlap.
- Existing verified routes and deep links remain stable during incremental migration unless a separately approved routing decision says otherwise. No per-game legacy deep-link contract is current; adding one requires that routing decision.

## Verification and future adoption gates

1. The current adapter must remain shallow, serializable, and independent of engine, persistence, routing, and renderer ownership.
2. Automated engine and shell contracts must remain green; desktop/mobile/accessibility/fallback QA must be recorded for user-facing changes.
3. Further shared components or tokens require architecture approval instead of one-off competing game primitives.
4. Rollback must restore the prior presentation without data migration.
5. Only a deployed and checked slice may be labelled **PRODUCTION-VERIFIED IMPLEMENTATION**.
