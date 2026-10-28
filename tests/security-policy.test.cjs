const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');

test('main document blocks injected scripts and outbound room URL referrers', () => {
  const html = readFileSync('index.html', 'utf8');
  const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];
  assert.ok(policy);
  assert.match(policy, /script-src 'self';/);
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.doesNotMatch(html, /<script\b(?![^>]*\bsrc=)[^>]*>/i);
  const config = readFileSync('multiplayer-config.js', 'utf8');
  assert.match(config, /COUNTRY_MEMORY_SINGLE_APP = true/);
  assert.doesNotMatch(readFileSync('public/runtime-config.js', 'utf8'), /googleMapsApiKey|AIza/);
});
