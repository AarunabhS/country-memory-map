# Design system status

This document separates the current thin cinematic GameShell treatment from a future full shared-component framework.

Status labels follow the canonical vocabulary in [`MASTER_PROJECT_INDEX.md`](MASTER_PROJECT_INDEX.md).

## VERIFIED CURRENT ARCHITECTURE

- One document uses `app.css` for Home/navigation and `game-shell.css` for the shared cinematic controls, tokens, HUD, profiles and results.
- `world-map.css`, `game.css`, `flag-game.css`, `quiz-game.css`, profile and multiplayer styles own their particular layouts. `/legacy/index.html` is a redirect, not a retained application.
- Setup uses a scrollable content area with a persistent Start footer. Catalog cards lead to focused setup. Secondary controls use existing panel tokens; Quiz hides irrelevant map chrome.
- Visible focus styles, minimum touch sizing in responsive rules, and reduced-motion media queries exist on several current surfaces. Coverage is not presumed complete.
- Flag assets render from self-hosted SVGs in reserved frames; native proportions are preserved. Country outlines use their own clipped frame.
- `game-shell.js` and `game-shell.css` provide one current engine-independent presentation adapter and explicit high-contrast styling across shared setup, HUD, stages, results, profiles, and multiplayer surroundings. It is not a general component library.

These are observations, not permission to copy incidental values into a new global standard.

## Orbital arcade treatment — 2026-09-23

**VERIFIED CURRENT ARCHITECTURE** in the working tree. [ADR 0006](architecture/0006-orbital-arcade-presentation.md) records the dedicated visual refresh within the existing thin shell.

- Shared tokens use off-white `#f2f2e8`, muted `#bcc9bf`, ink/forest panels `#111c18`, lime `#c7f575`, and dark controls `#1c2a23`. System typography avoids external font loading.
- Home uses the local globe with noninteractive orbital decoration and six illustrated links to the existing solo routes. Decorative inline SVGs have no game-data or renderer ownership.
- Setup, HUD, answer controls, Friends, profiles and results consume the same shell. Map continent colors and authentic flag assets remain unchanged; the water/frame treatment follows the new palette.
- Short landscape uses a compact left-side HUD/answer area and a bounded right-side stage. Flag Match keeps its four choices together; additional stage content can scroll.
- Hover motion is restrained and respects reduced motion. Native focus, buttons, links and field semantics remain in use. Local screenshots and exact remaining accessibility/device gaps are in the [execution record](exec-plans/completed/2026-09-23-orbital-arcade-ui.md).

## PROPOSED TARGET ARCHITECTURE

The Universal Cinematic Game UI Framework should eventually provide approved tokens and shared patterns for:

- typography and type scale;
- color, elevation, borders, and focus indicators;
- spacing, safe areas, and responsive breakpoints;
- buttons, inputs, status messages, HUDs, dialogs, sheets, and result layers;
- motion duration/easing plus reduced-motion equivalents;
- an environment/stage contract that can host map, globe, flag, and future game-specific content.

Token names and numerical values must be derived through a dedicated design-system task and visual QA, not invented during migration.

## APPROVED FUTURE WORK

- The responsibility model in `GAME_SHELL_SPEC.md` governs the current thin adapter and future staged work.
- Each implementation slice still requires architecture-authority approval, an impact assessment, a rollback path, and proof that gameplay and working flows remain unchanged.
- Games must migrate incrementally; no big-bang shell replacement is approved.

## PRODUCTION-VERIFIED IMPLEMENTATION

No shared primitive library or completed cross-game design-system migration has this status as of 2026-09-10. The local thin GameShell implementation is not production-verified.
