# ADR 0006 — Orbital arcade presentation within the existing shell

Date: 2026-09-23
Status: accepted for the user-requested visual redesign; working-tree implementation, not production verification.

## Context

The user requested a modern game-inspired UI. The verified app has one document, a thin GameShell presentation adapter, Home canvas globe and SVG gameplay. Rules, persistence, navigation lifecycle and room ownership already work and remain protected.

## Decision

Keep `app.css` as the Home/navigation/responsive-layout owner and `game-shell.css` as the shared presentation owner. Evolve the existing shell tokens to warm off-white on ink/forest surfaces with lime primary actions. Use the existing system font stack, restrained corner radii, tabular score numerals, visible focus, and transform/opacity-oriented hover effects. Decorative Home and catalog icons are small inline SVGs, explicitly isolated from the interactive map's global SVG styles.

Home exposes the six existing solo routes as semantic links. Ordinary clicks use the existing navigation lifecycle; modified clicks retain native link behavior. The existing Friends/Solo/Explore actions remain. Short landscape allocates controls on the left and the bounded game stage on the right for maps, flags and Quiz; four flag choices share one row. Stages retain scrolling when additional hints/room standings need it.

No new framework, font request, image payload, renderer, animation loop, store, persistence key, route definition, or service contract. Country fills, authentic flags, game mechanics and answer handlers remain with their existing owners.

## Alternatives and tradeoffs

- A replacement UI/component framework would expand migration risk and ownership; defer it.
- A raster hero would add payload and replace the useful interactive globe; retain the local globe with CSS orbital decoration.
- A single vertical landscape layout leaves too little stage space after navigation/HUD/answer controls; use the established map two-column approach for the remaining stages.

## Consequences and rollback

This is a visual treatment of the thin shell, not completion of the proposed universal component library. Shared CSS requires route/viewport inspection, and physical-device/accessibility/production checks remain separate. Revert the associated HTML/CSS/display-markup/navigation-link patch to roll back; no data migration is needed.

See the [execution record](../exec-plans/completed/2026-09-23-orbital-arcade-ui.md) for exact verification evidence and limitations.
