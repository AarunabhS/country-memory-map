const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function loadRoutes() {
  const source = fs.readFileSync('src/game-routes.js', 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Date.now()}-${Math.random()}`);
}

test('every supported launcher has one canonical query route', async () => {
  const { GAME_ROUTES, buildGameUrl, parseGameRoute } = await loadRoutes();
  const expected = ['explore', 'countries', 'capitals', 'world-conquest', 'find-country', 'capital-clash', 'flag-recall', 'flag-match', 'multiplayer'];
  assert.deepEqual(Object.keys(GAME_ROUTES), expected);
  for (const slug of expected) {
    const url = buildGameUrl(GAME_ROUTES[slug], { pathname: '/country-memory-map/' });
    assert.equal(url, `/country-memory-map/?game=${slug}`);
    assert.deepEqual(parseGameRoute(new URL(url, 'https://example.test').search).route.slug, slug);
  }
});

test('multiplayer room input is uppercase and canonical only on the multiplayer route', async () => {
  const { GAME_ROUTES, buildGameUrl, parseGameRoute } = await loadRoutes();
  assert.equal(buildGameUrl({ ...GAME_ROUTES.multiplayer, room: 'ab12cd' }, { pathname: '/app/' }), '/app/?game=multiplayer&room=AB12CD');
  assert.deepEqual(parseGameRoute('?room=ab12cd'), {
    route: { ...GAME_ROUTES.multiplayer, room: 'AB12CD' }, canonical: false, reason: 'room-ingress',
  });
  assert.equal(parseGameRoute('?game=multiplayer&room=not-valid').canonical, false);
  assert.equal(parseGameRoute('?game=explore&room=ABC123').route, null);
  assert.equal(parseGameRoute('?game=explore&utm_source=test').canonical, false);
});

test('unknown and malformed routes fail closed to a clean home URL', async () => {
  const { buildGameUrl, parseGameRoute } = await loadRoutes();
  assert.equal(parseGameRoute('?game=flag-sprint').route, null);
  assert.equal(parseGameRoute('?game=flag-sprint').canonical, false);
  assert.equal(buildGameUrl(null, { pathname: '/country-memory-map/' }), '/country-memory-map/');
});
