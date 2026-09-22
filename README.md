# Country Memory Map

A single-page geography game with private multiplayer rooms, solo games, optional voice answers, and a mobile layout. No account is required.

Run `python3 -m http.server 8000`, then open `http://localhost:8000`.

Home offers **Play with friends**, **Play solo**, and **Explore the map**. The bordered home globe renders locally without Google Maps or an API key. Rounds use the interactive country map, including keyboard navigation and enlarged small-country targets. The former `/legacy/` URL redirects to the same app and preserves invite parameters.

## Games

- **World Conquest:** Relaxed, 3-minute Sprint, 60-second Blitz, three-life Sudden Death, Continent.
- **Find the Country:** 20-question Standard, 60-second Blitz, 20-question Continent.
- **Capital Clash:** 20-question Classic (10 typed, 10 clicked), 60-second alternating Blitz, 20-question Continent.
- **Flag Recall:** identify an authentic country flag by typing its country or territory name; normal recall has no answer suggestions.
- **Flag Match:** choose the correct flag from four unique flag cards. Easy, Medium and Hard alter distractor selection, including same-region and curated confusable-flag preferences.
- **Geo Quiz:** 52 category questions across four tiers; Easy/Medium rounds use 10 questions, Hard/Expert use 8. Typed or spoken answers, hints and fact review use the existing Quiz scoring. Results and profile statistics are saved locally; Quiz has no Practice Missed or friend challenge.
- **Free map:** the original country and capital recognition modes, aliases, territories, labels, filters, zoom, touch gestures and speech.

All games use the same 195-country classification as the original checker. Small pools repeat only after every eligible country has been served. For engine-backed games, Practice Missed uses exactly the countries missed or answered with retries and is separate from device-best comparisons. Device bests separate timing, length, difficulty and hint use; named-player profiles do not own this shared best store.

## Play with Friends

Create a room to receive both a public invite link and a room code. Friends can open the link, or choose **Play with Friends → Join a Room** and enter the code. Normal rooms use the public persistent friends service even when the frontend is previewed on a development device. When the page is opened from localhost or a LAN address, share **Copy Invite Link**, **Share**, or **Copy Room Code** rather than copying the browser address, which is reachable only on that device or network.

## Code map

- `index.html`, `src/app.js`, `app.css`: one document, navigation, home, and persistent room exit.
- `src/world-map-runtime.js`, `world-map.css`: country recognition, map drawing, labels, geography filters, and voice wiring, extracted from the former embedded document.
- `game-core.js`, `game-data.js`: shared rules, scoring, questions, and country model.
- `quiz-data.js`, `quiz-game.js`: lazy-loaded Quiz content and rules, integrated with shared results/profiles.
- `game-ui.js`, `game-map.js`, `game-shell.*`: one game controller and shared presentation for solo and multiplayer rounds.
- `multiplayer-service.js`: room transport, authentication, polling, reconnection, and immediate local departure. Late responses cannot restore a departed session.
- `multiplayer-ui.js`, `multiplayer.css`: room creation, codes, invites, readiness, settings, standings, results, and rematches.
- `voice-input.js`: optional browser speech recognition. Unsupported or blocked microphones leave typed input available.
- `multiplayer-server/`: persistent room API and authoritative multiplayer rules.

See [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries. Older design and migration documents describe previous implementations and are not the current app structure.

## Checks

```sh
node --test tests/*.test.cjs
node --test multiplayer-server/test/*.test.mjs
node scripts/check-governance.mjs
```

Build the service with `cd multiplayer-server && npm ci && npm run build`. The build refreshes generated rule/data snapshots; review those changes before deploying. Normal frontend previews use the public persistent room service. An explicit localhost API override is available in `multiplayer-config.js` for isolated development.
