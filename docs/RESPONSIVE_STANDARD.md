# Responsive standard

## Current baseline

**VERIFIED CURRENT ARCHITECTURE**

- The root cinematic shell contains responsive rules at desktop, compact portrait, narrow-phone, and short-landscape ranges.
- The retained game uses its own phone and short-landscape rules. Flag and profile surfaces add subsystem-specific responsive rules.
- Root compact portrait keeps a fixed-height first-screen launcher containing Explore plus all five games, with the globe HUD and answer dock directly above it. Short landscape places the compact launcher at left and reserves the remaining stage for the globe, HUD, and answer dock. Both use viewport and safe-area insets and retain 44px primary controls.

**NEEDS QA**

- The current compact Home composition has structural automated coverage but has not received new viewport screenshots or interaction measurements. Desktop/laptop height, 320/375/390px portrait, 667×375 and 844×390 landscape, dynamic viewport contraction, focus, overflow, physical-device safe areas, an on-screen keyboard, 200% zoom, and reduced-motion emulation remain manual requirements.

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

- The root Home shell and retained game remain separate surfaces. The retained scored-game suite consumes the current thin GameShell presentation adapter; renderer and game-engine ownership remain outside it.
- New one-off breakpoints or fixed overlays require judgment-level review when they interact with header, HUD, stage, answer controls, or navigation.
- Touch targets should be at least 44 by 44 CSS pixels unless a documented equivalent interaction provides the same operability.
- Content must remain usable at 200% browser zoom and with dynamic text where the platform supports it.
- Motion-dependent spatial cues need a reduced-motion equivalent.
