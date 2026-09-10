# Flag transition, multiplayer contrast, and autofill suppression

Status: completed 2026-09-10. This was a Level B, judgment-requiring UI correction within the established GameShell and retained-input boundaries.

## Impact assessment

```text
Requested change: Remove the stale world-view message shown while a flag round starts, make the setup Play With Friends banner readable, and suppress browser suggestion/history popups on geography answer fields.
Affected workstreams: retained GameShell transition state, multiplayer setup CTA styling, root and retained answer-input browser hints/focus behavior, focused tests.
Routes/components affected: ?game=flag-recall, ?game=flag-match, retained setup panels, root Explore answer dock, legacy #guessInput, #playFriends.
Gameplay impact: no rules, question, timer, score, progression, or answer-recognition changes; new questions no longer force focus into an answer field that the player was not already using.
Persistence impact: none; browser autofill is explicitly disabled only for geography-answer inputs, not profile identity forms.
Map/globe impact: none; the existing map restore remains intact while its stale feedback surface is hidden during flag countdown.
Mobile impact: reduces keyboard/autofill overlays; no layout or touch-target change.
Accessibility impact: prevents unexpected focus movement and keeps existing labels, keyboard reachability, live feedback, and visible focus.
Performance impact: none; no bulk flag preloading or new requests.
Migration risk: low — reversible attribute, focus-policy, visibility, and color changes inside established components.
Rollback path: revert the focused HTML, GameShell/controller, multiplayer CSS, and test changes; no stored data changes.
Required QA: governance, root tests, JavaScript syntax, diff check, local HTTP smoke, and inspection of the three source contracts.
Architecture risk: judgment-requiring — shared GameShell presentation is touched, but no ownership or public contract changes.
```

## Acceptance criteria

- Flag countdown/loading never exposes “World view restored. Choose a continent before revealing names.” or its empty message panel.
- `Play With Friends` uses an explicit high-contrast foreground, including WebKit text fill, against its banner background.
- Root and retained geography answer inputs opt out of browser autofill/history; starting a question does not auto-focus a previously inactive answer field.
- Profile-name and multiplayer-name semantics remain unchanged.
- Existing gameplay and automated checks remain green.

## Verification evidence

- **AUTOMATED VERIFIED** — `node scripts/check-governance.mjs` passed with all 21 required files.
- **AUTOMATED VERIFIED** — `node --test tests/*.test.cjs` passed all 76 root tests, including the new flag-transition, CTA foreground, and geography-input contracts.
- **AUTOMATED VERIFIED** — `npm test` in `multiplayer-server/` passed all 17 Worker tests.
- **AUTOMATED VERIFIED** — `node --check game-ui.js` and `git diff --check` passed.
- **AUTOMATED VERIFIED** — localhost returned HTTP 200 for `/?game=flag-recall`, the cache-busted retained document, `multiplayer.css`, and `game-ui.js`; served byte counts matched the current workspace files.
- **MANUALLY VERIFIED WITH EVIDENCE** — in the Codex in-app browser at approximately 886×793, `/?game=find-country` rendered `Play With Friends` with a clearly visible white foreground and cyan outline.
- **MANUALLY VERIFIED WITH EVIDENCE** — on `/?game=flag-recall`, the captured transition 120 ms after Start showed no stale world-view message or empty control panel; after the first question appeared, the local flag rendered and the accessibility focus remained on the document rather than moving into the answer field. No saved-address popup appeared.
- **MANUAL VERIFICATION REQUIRED** — physical mobile browsers and other saved-autofill profiles remain part of the broader device matrix; browsers retain ultimate control over autofill UI.

## Outcome

The retained control is hidden only while a flag round is between setup and its first real question, then restored for question feedback. The setup multiplayer CTA now overrides both normal text color and WebKit glyph fill. Geography answer fields carry no address-like name, opt out of autocomplete, and do not receive unsolicited game-start focus; explicit Free Map entry and active typing still retain their prior focus behavior.

## Unresolved decisions

- None for this correction. Chrome ultimately controls autofill UI, so physical devices with other saved-autofill profiles remain in the broader manual QA matrix.
