const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.js', 'utf8');
const redirect = fs.readFileSync('legacy/index.html', 'utf8');
const gameMap = fs.readFileSync('game-map.js', 'utf8');

test('the app loads one game document and routes old URLs into it', () => {
  assert.doesNotMatch(html, /<iframe|src\/main\.js|maps\.googleapis/);
  assert.equal((html.match(/src="game-ui\.js/g) || []).length, 1);
  assert.match(html, /src="src\/app\.js(?:\?v=[^"]+)?"/);
  assert.match(redirect, /location\.replace\('\.\.\/'\+location\.search\+location\.hash\)/);
  assert.doesNotMatch(redirect, /game-ui|GameMap|<iframe/);
});
test('home prioritizes rooms and uses a local optional globe', () => {
  assert.match(html, /id="welcomeFriends"/);
  assert.match(html, /id="welcomeSolo"/);
  assert.match(html, /id="welcomeExplore"/);
  assert.match(app, /new LocalGlobeAdapter/);
  assert.doesNotMatch(app, /GoogleGlobeAdapter|googleMapsApiKey|loadLegacyEngine/);
});
test('room code changes update the URL without restarting a round', () => {
  const branch = app.slice(app.indexOf("if (payload.type === 'multiplayer-room')"), app.indexOf("void show(payload.type"));
  assert.match(branch, /write\(route, true\)/);
  assert.doesNotMatch(branch, /show\(|deactivate\(|openMultiplayer/);
});
test('the compact country geometry and accessible small-country targets are retained', () => {
  assert.ok(fs.statSync('countries-data.js').size < 2_500_000);
  assert.match(gameMap, /coarsePointer \? 22 : 18/);
  assert.match(gameMap, /Keyboard alternative/);
});
