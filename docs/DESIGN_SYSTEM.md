# Design system status

This document separates the current thin cinematic GameShell treatment from a future full shared-component framework.

Status labels follow the canonical vocabulary in [`MASTER_PROJECT_INDEX.md`](MASTER_PROJECT_INDEX.md).

## VERIFIED CURRENT ARCHITECTURE

- The root shell uses the dark cinematic space/Earth identity in `styles.css`, with translucent panels, bright cyan/green accents, compact HUD/stat surfaces, and responsive desktop/mobile arrangements.
- The retained game's base styles remain in `legacy/index.html`, `game.css`, profile styles, multiplayer styles, and flag-specific styles; `game-shell.css` now supplies their explicit dark cinematic override.
- Root and retained layers share a cinematic direction but still use separate typography, spacing, controls, HUDs, modal/dialog patterns, and responsive rules.
- Visible focus styles, minimum touch sizing in responsive rules, and reduced-motion media queries exist on several current surfaces. Coverage is not presumed complete.
- Flag assets render from self-hosted SVGs in reserved frames; native proportions are preserved. Country outlines use their own clipped frame.
- `game-shell.js` and `game-shell.css` provide one current engine-independent presentation adapter and explicit high-contrast styling across retained setup, HUD, stages, results, profiles, and multiplayer surroundings. It is not a general component library.

These are observations, not permission to copy incidental values into a new global standard.

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
