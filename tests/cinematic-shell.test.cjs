const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const adapter = fs.readFileSync('src/map-adapter.js', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const legacy = fs.readFileSync('legacy/index.html', 'utf8');
const runtime = fs.readFileSync('public/runtime-config.js', 'utf8');

test('cinematic shell keeps the production game as its fallback', () => {
  assert.match(html, /class="live-globe"/);
  assert.match(html, /data-src="\.\/legacy\/index\.html(?:\?[^\"]+)?"/);
  assert.match(legacy, /<base href="\.\.\/">/);
  assert.match(runtime, /"renderer":"google3d"/);
});

test('geometry failure activates the retained fallback immediately', () => {
  assert.match(main, /const usable = await hydrateGoogleCountryGeometry\(adapter\);\s+if \(!usable\) \{\s+rendererRecovery\.activate2d\("geometry-failure"\);\s+return adapter;\s+\}/);
});

test('renderer fills the workspace without masking the globe', () => {
  assert.match(css, /\.globe-mount\s*\{\s*position:\s*absolute;\s*inset:\s*0;\s*width:\s*100%;\s*height:\s*100%;\s*aspect-ratio:\s*auto;/);
  assert.doesNotMatch(css, /clip-path:\s*circle\(/);
  assert.match(css, /\.left-rail,\s*\.right-rail\s*\{\s*z-index:\s*10;/);
});

test('mobile layout and camera adapt to portrait screens', () => {
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(adapter, /ResizeObserver/);
  assert.match(adapter, /height \/ width/);
  assert.match(adapter, /viewportRangeFactor/);
});

test('mobile answer controls share safe-area clearance with the navigation', () => {
  assert.match(css, /--mobile-nav-base-height:\s*67px/);
  assert.match(css, /--mobile-nav-height:\s*calc\(var\(--mobile-nav-base-height\) \+ var\(--mobile-safe-bottom\)\)/);
  assert.match(css, /--mobile-answer-dock-height:\s*58px/);
  assert.match(css, /--mobile-answer-zone-height:\s*78px/);
  assert.match(css, /--mobile-answer-clearance:\s*calc\(var\(--mobile-nav-height\) \+ var\(--mobile-nav-gap\)\)/);
  assert.match(css, /--mobile-sheet-clearance:\s*calc\(var\(--mobile-answer-clearance\) \+ var\(--mobile-answer-zone-height\) \+ var\(--mobile-nav-gap\)\)/);
  assert.match(css, /height:\s*var\(--mobile-nav-height\)/);
  assert.match(css, /bottom:\s*var\(--mobile-answer-clearance\)/);
  assert.match(css, /bottom:\s*var\(--mobile-sheet-clearance\)/);
});

test('mobile landscape reserves the navigation footprint and keeps 44px answer targets', () => {
  assert.match(css, /--mobile-landscape-nav-width:\s*240px/);
  assert.match(css, /width:\s*min\(520px, calc\(100% - var\(--mobile-landscape-nav-width\)/);
  assert.match(css, /bottom:\s*calc\(var\(--mobile-nav-gap\) \+ var\(--mobile-safe-bottom\)\)/);
  assert.match(css, /\.input-shell,\s*\n\s*\.answer-button\s*\{\s*\n\s*min-height:\s*44px;\s*\n\s*height:\s*44px;/);
});
