# Responsive standard

## Current baseline

**VERIFIED CURRENT ARCHITECTURE**

- The root cinematic shell contains responsive rules at desktop, compact portrait, narrow-phone, and short-landscape ranges.
- The single-document scored suite uses phone and short-landscape rules. Flag and profile surfaces add subsystem-specific responsive rules.
- Home offers Friends, Solo and Explore beside a local globe. Solo has six catalog choices and focused setup. Setup content scrolls inside a bounded panel with a persistent Start footer. Active games allocate separate HUD, stage and answer-dock space with viewport/safe-area constraints.

**NEEDS QA**

- Local viewport evidence is recorded in completed execution plans; it does not establish physical-device behavior. Desktop/laptop height, 320/375/390px portrait, 667×375 and 844×390 landscape, dynamic viewport contraction, focus, overflow, physical-device safe areas, an on-screen keyboard, 200% zoom, and reduced-motion emulation remain manual requirements.

## Required review for user-facing work

Check at minimum:

- desktop with enough height and a constrained laptop-height viewport;
- mobile portrait at a narrow width;
- mobile landscape with short height;
- touch and on-screen keyboard open/close behavior;
- long translated-like labels, validation messages, and result content;
- safe-area insets, fixed/sticky controls, dialogs/sheets, and zoomed text;
- no horizontal overflow and no control hidden behind navigation, browser chrome, or an answer dock.

Do not infer mobile success from responsive CSS alone. Record viewport/device, browser, route, and result for manual QA.

## Layout ownership

- Home and games are views of one document. The scored-game suite consumes the current thin GameShell presentation adapter; renderer and game-engine ownership remain outside it.
- New one-off breakpoints or fixed overlays require judgment-level review when they interact with header, HUD, stage, answer controls, or navigation.
- Touch targets should be at least 44 by 44 CSS pixels unless a documented equivalent interaction provides the same operability.
- Content must remain usable at 200% browser zoom and with dynamic text where the platform supports it.
- Motion-dependent spatial cues need a reduced-motion equivalent.
