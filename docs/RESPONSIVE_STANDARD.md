# Responsive standard

## Current baseline

**VERIFIED CURRENT ARCHITECTURE**

- The root cinematic shell contains responsive rules at desktop, tablet/phone, narrow-phone, and mobile-landscape ranges.
- The retained game uses its own phone and short-landscape rules. Flag and profile surfaces add subsystem-specific responsive rules.
- Root mobile layout variables own left/right/bottom safe-area insets, navigation height, the answer-zone height, the deliberate gap, sheet clearance, and the landscape navigation footprint. Portrait places the answer zone above the full bottom navigation clearance; short landscape reserves the left navigation footprint and keeps the answer zone at the safe bottom/right edge.

**NEEDS QA**

- Local in-app-browser checks cover 320, 375, 390, and 768px portrait widths; 667×375 and 844×390 landscape; dynamic viewport contraction; sheet content; focus; 44px controls; and horizontal overflow. Physical-device safe-area orientations, an actual on-screen keyboard, 200% browser zoom, and reduced-motion emulation remain manual requirements.

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

- The current root shell and retained game remain separate until a GameShell migration is approved.
- New one-off breakpoints or fixed overlays require judgment-level review when they interact with header, HUD, stage, answer controls, or navigation.
- Touch targets should be at least 44 by 44 CSS pixels unless a documented equivalent interaction provides the same operability.
- Content must remain usable at 200% browser zoom and with dynamic text where the platform supports it.
- Motion-dependent spatial cues need a reduced-motion equivalent.
