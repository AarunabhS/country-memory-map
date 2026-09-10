const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const adapter = fs.readFileSync('src/map-adapter.js', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const legacy = fs.readFileSync('legacy/index.html', 'utf8');
const runtime = fs.readFileSync('public/runtime-config.js', 'utf8');
const gameMap = fs.readFileSync('game-map.js', 'utf8');

function colorToken(source, name) {
  return source.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
}

function contrastRatio(foreground, background) {
  const luminance = (hex) => {
    const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('Home shows a local rotating globe before optional Google 3D', () => {
  assert.match(html, /<canvas[^>]+class="local-globe"[^>]+id="local-globe"/s);
  assert.match(html, /class="live-globe"/);
  assert.doesNotMatch(html, /class="earth-preview"/);
  assert.match(adapter, /class LocalGlobeAdapter/);
  assert.match(adapter, /requestAnimationFrame/);
  assert.match(adapter, /prefers-reduced-motion: reduce/);
  assert.match(runtime, /"renderer":"google3d"/);
});

test('the retained app stays a hidden singleton engine bridge and scored-game surface', () => {
  assert.match(html, /data-src="\.\/legacy\/index\.html(?:\?[^"]+)?"/);
  assert.match(html, /src="\.\/legacy\/index\.html(?:\?[^"]+)?"/);
  assert.match(legacy, /<base href="\.\.\/">/);
  assert.match(css, /#app-shell\[data-surface="retained"\] \.legacy-map-frame/);
  assert.match(main, /prepareRetainedBridge/);
  assert.match(main, /Some browsers restore a cached iframe/);
  assert.doesNotMatch(main, /new MutationObserver/);
  assert.doesNotMatch(main, /setLegacyFallbackVisible|requestRetainedFallback|activateRetainedFallback/);
});

test('Explore uses a structured retained answer contract without fixed-delay DOM scraping', () => {
  assert.match(legacy, /submitFreeMapGuess/);
  assert.match(main, /await submitRetainedFreeMapGuess/);
  assert.doesNotMatch(main, /setTimeout\(resolve, 100\)/);
  assert.doesNotMatch(main, /querySelector\("#message"\)/);
  assert.match(html, /id="voice-button"/);
});

test('an active solo run uses an in-app navigation confirmation instead of being torn down on popstate', () => {
  assert.match(html, /<dialog[^>]+id="session-exit-dialog"/);
  assert.match(html, /class="stay-button"/);
  assert.match(html, /class="leave-button"/);
  assert.match(main, /shouldConfirmSessionExit/);
  assert.match(main, /sessionExitDialog\.showModal\(\)/);
  assert.match(main, /writeRoute\(state\.activeRoute, "push"\)/);
});

test('the browser ships one compact geometry bundle and preserves mobile small-country targets', () => {
  assert.equal(fs.existsSync('countries.geojson'), false);
  assert.ok(fs.statSync('countries-data.js').size < 2_500_000);
  assert.doesNotMatch(gameMap, /view\.w > 350/);
  assert.match(gameMap, /coarsePointer \? 22 : 18/);
  assert.match(gameMap, /game-hit-marker/);
});

test('Home game cards hand off to the canonical retained host route', () => {
  assert.match(main, /const route = GAME_ROUTES\[button\.dataset\.game\]/);
  assert.match(main, /navigateToRoute\(route, \{ reason: "launcher" \}\)/);
  assert.match(main, /ready\.host\.openGame\(\{ family: route\.family, variant: route\.variant, label: route\.label \}\)/);
  assert.match(main, /setSurface\("retained"\)/);
});

test('Home exposes exactly five scored games and nests both checkers in Explore', () => {
  const gameList = html.match(/<nav class="game-list"[\s\S]*?<\/nav>\s*<\/aside>/)?.[0] || '';
  assert.equal((gameList.match(/class="game-card"/g) || []).length, 5);
  for (const slug of ['world-conquest', 'find-country', 'capital-clash', 'flag-recall', 'flag-match']) {
    assert.match(gameList, new RegExp(`data-game="${slug}"`));
  }
  const explore = html.match(/<section class="explore-panel"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(explore, /data-game="countries"/);
  assert.match(explore, /data-game="capitals"/);
});

test('Home contains no placeholder navigation, fabricated metrics, or staged actions', () => {
  assert.doesNotMatch(html, /Daily Challenge|World Progress|Your session|Learn more|data-action=|data-footer=|data-nav=|mobile-bottom-nav/);
  assert.doesNotMatch(main, /staged|production content pass|game engine connection pending|No presence service/);
});

test('responsive layout keeps the full launcher visible and maintains touch targets', () => {
  assert.match(css, /@media \(max-width: 760px\) and \(orientation: portrait\)/);
  assert.match(css, /height: 214px/);
  assert.match(css, /grid-template-rows: repeat\(3, 1fr\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /\.live-globe:not\(\[hidden\]\)/);
  assert.match(css, /bottom: calc\(222px \+ var\(--safe-bottom\)\)/);
  assert.match(css, /bottom: calc\(250px \+ var\(--safe-bottom\)\)/);
  assert.match(css, /@media \(max-height: 500px\) and \(min-width: 600px\)/);
});

test('root colors are explicit across system themes and forced-colors mode', () => {
  assert.match(css, /color-scheme: dark/);
  assert.match(css, /-webkit-text-fill-color: var\(--text\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline: 3px solid var\(--focus\)/);
  const panel = colorToken(css, '--panel-solid');
  assert.ok(contrastRatio(colorToken(css, '--text'), panel) >= 7);
  assert.ok(contrastRatio(colorToken(css, '--muted'), panel) >= 7);
});
