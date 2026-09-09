const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function loadLifecycle() {
  const source = fs.readFileSync('src/game-lifecycle.js', 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Date.now()}-${Math.random()}`);
}

test('only the latest asynchronous route transition can own the visible surface', async () => {
  const { createGameLifecycle, GAME_LIFECYCLE_STATES } = await loadLifecycle();
  const lifecycle = createGameLifecycle();
  const first = lifecycle.begin();
  const second = lifecycle.begin();
  assert.equal(lifecycle.commit(first, GAME_LIFECYCLE_STATES.SOLO_SETUP), false);
  assert.equal(lifecycle.commit(second, GAME_LIFECYCLE_STATES.MULTIPLAYER), true);
  assert.equal(lifecycle.getState(), GAME_LIFECYCLE_STATES.MULTIPLAYER);
});

test('the lifecycle exposes distinct 3D-home and terminal-2D-home states', async () => {
  const { createGameLifecycle, GAME_LIFECYCLE_STATES } = await loadLifecycle();
  const lifecycle = createGameLifecycle();
  const token = lifecycle.begin(GAME_LIFECYCLE_STATES.HOME_3D);
  assert.equal(lifecycle.commit(token, GAME_LIFECYCLE_STATES.HOME_2D), true);
  assert.equal(lifecycle.getState(), GAME_LIFECYCLE_STATES.HOME_2D);
});
