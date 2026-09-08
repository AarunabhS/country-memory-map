# Design system status

This document separates observed visual behavior from the proposed Universal Cinematic Game UI Framework. It does not claim that shared primitives or a GameShell already exist.

Status labels follow the canonical vocabulary in [`MASTER_PROJECT_INDEX.md`](MASTER_PROJECT_INDEX.md).

## VERIFIED CURRENT ARCHITECTURE

- The root shell uses the dark cinematic space/Earth identity in `styles.css`, with translucent panels, bright cyan/green accents, compact HUD/stat surfaces, and responsive desktop/mobile arrangements.
- The retained game has its own established light map/game presentation in `legacy/index.html`, `game.css`, profile styles, multiplayer styles, and flag-specific styles.
- Root and retained layers currently use separate typography, spacing, controls, HUDs, modal/dialog patterns, and responsive rules.
- Visible focus styles, minimum touch sizing in responsive rules, and reduced-motion media queries exist on several current surfaces. Coverage is not presumed complete.
- Flag assets render from self-hosted SVGs in reserved frames; native proportions are preserved. Country outlines use their own clipped frame.

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

- The responsibility model in `GAME_SHELL_SPEC.md` is approved as the direction for future staged work.
- Each implementation slice still requires architecture-authority approval, an impact assessment, a rollback path, and proof that gameplay and working flows remain unchanged.
- Games must migrate incrementally; no big-bang shell replacement is approved.

## PRODUCTION-VERIFIED IMPLEMENTATION

No Universal Cinematic GameShell, shared primitive library, or completed cross-game design-system migration has this status as of 2026-09-09. Existing production visuals may be verified individually, but they do not constitute the proposed framework.
