# Accessibility standard

Accessibility is a protected behavior and a completion criterion, not a visual polish step.

## Required behavior

- All actions are keyboard reachable in a logical order and have a semantic accessible name.
- Native controls and landmarks are preferred. Custom interactive map/globe elements need an equivalent keyboard path.
- Focus is visible, is not trapped or lost during state changes, moves intentionally into dialogs/sheets, and returns sensibly when they close.
- Correct, incorrect, duplicate, loading, error, timer, and completion states are announced without excessive repetition.
- Touch targets meet the responsive standard and do not overlap.
- Text and essential UI graphics meet WCAG AA contrast targets; state is not conveyed by color alone.
- `prefers-reduced-motion: reduce` removes nonessential animation and preserves understandable feedback.
- Images have purpose-appropriate alternatives. Flags in a recognition question must not reveal the answer in alt text; decorative art is hidden from assistive technology.
- Error messages identify the problem and recovery action. Persistence, API, microphone, renderer, and fallback failures remain usable.

## Verification status

- **AUTOMATED VERIFIED**: current Node tests cover selected markup/CSS contracts and neutral flag-question payloads; no general accessibility scanner is installed.
- **MANUAL VERIFICATION REQUIRED**: keyboard-only flow, focus order/return, screen-reader announcements, zoom/reflow, contrast review, reduced motion, touch targets, and map/globe alternatives.
- **PRODUCTION-VERIFIED IMPLEMENTATION** requires checks on the deployed origin; local source inspection or a passing unit test is insufficient.

Do not add Axe, Playwright, or another framework solely for governance v1. A future tooling decision may add one after baseline evaluation and owner approval.
