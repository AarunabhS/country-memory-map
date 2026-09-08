# Universal Cinematic GameShell specification

Status: **PROPOSED TARGET ARCHITECTURE**. Direction authorization: **APPROVED FUTURE WORK**.

The GameShell is a future shared presentation contract. Governance v1 does not implement it, migrate a game to it, or certify it as production behavior.

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
- Mobile portrait and landscape define separate space allocations for header, stage, HUD, answer dock, and bottom navigation so they cannot overlap.
- Existing verified routes and deep links remain stable during incremental migration unless a separately approved routing decision says otherwise. No per-game legacy deep-link contract is current; adding one requires that routing decision.

## Adoption gates

1. Architecture authority approves tokens, component ownership, adapter contracts, and migration order.
2. A reference implementation proves one representative game without changing its mechanics.
3. Automated engine tests remain green; desktop/mobile/accessibility/fallback QA is recorded.
4. Rollback can restore the prior game presentation without data migration.
5. Only a deployed and checked slice may be labelled **PRODUCTION-VERIFIED IMPLEMENTATION**.
