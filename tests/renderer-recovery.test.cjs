const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function loadRecovery() {
  const source = fs.readFileSync('src/renderer-recovery.js', 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Date.now()}-${Math.random()}`);
}

function fakeTimers() {
  let nextId = 0;
  const timers = new Map();
  return {
    set(callback, delay) { const id = ++nextId; timers.set(id, { callback, delay }); return id; },
    clear(id) { timers.delete(id); },
    advance(milliseconds) {
      for (const [id, timer] of [...timers]) {
        if (timer.delay <= milliseconds) { timers.delete(id); timer.callback(); }
      }
    },
    count() { return timers.size; },
  };
}

test('usable Google 3D before the recovery deadline prevents fallback and clears its timer', async () => {
  const { createRendererRecovery, RENDERER_RECOVERY_STATES } = await loadRecovery();
  const timers = fakeTimers();
  const transitions = [];
  const recovery = createRendererRecovery({
    setTimeoutFn: timers.set,
    clearTimeoutFn: timers.clear,
    onTransition: event => transitions.push(event),
  });
  recovery.start();
  assert.equal(recovery.activate3d(), true);
  assert.equal(recovery.activate3d(), false);
  assert.equal(recovery.activateFallback('late-failure'), false);
  timers.advance(45000);
  assert.equal(recovery.getState(), RENDERER_RECOVERY_STATES.THREE_D_ACTIVE);
  assert.equal(recovery.isInteractive(), true);
  assert.equal(timers.count(), 0);
  assert.deepEqual(transitions.map(event => event.state), [RENDERER_RECOVERY_STATES.THREE_D_ACTIVE]);
});

test('presentation distinguishes preferred Google 3D from the local 3D globe', async () => {
  const { createRendererRecovery, getRendererPresentation } = await loadRecovery();
  const liveTimers = fakeTimers();
  const liveRecovery = createRendererRecovery({ setTimeoutFn: liveTimers.set, clearTimeoutFn: liveTimers.clear });
  liveRecovery.start();
  assert.equal(liveRecovery.activate3d(), true);
  assert.deepEqual(getRendererPresentation(liveRecovery.getState(), { live: true }), {
    live: true,
    local: false,
    warning: false,
    label: 'Google 3D Earth',
  });

  const fallbackTimers = fakeTimers();
  const fallbackRecovery = createRendererRecovery({ setTimeoutFn: fallbackTimers.set, clearTimeoutFn: fallbackTimers.clear });
  fallbackRecovery.start();
  assert.equal(fallbackRecovery.activateFallback('timeout'), true);
  assert.deepEqual(getRendererPresentation(fallbackRecovery.getState(), { live: true }), {
    live: false,
    local: true,
    warning: false,
    label: 'Local 3D globe',
  });
  assert.equal(fallbackRecovery.activate3d(), false);
  assert.equal(fallbackRecovery.isFallbackActive(), true);
  assert.equal(fallbackRecovery.isInteractive(), true);
});

test('45 seconds without usable Google 3D keeps the local globe active once', async () => {
  const { createRendererRecovery, RENDERER_RECOVERY_STATES } = await loadRecovery();
  const timers = fakeTimers();
  const transitions = [];
  const recovery = createRendererRecovery({
    setTimeoutFn: timers.set,
    clearTimeoutFn: timers.clear,
    onTransition: event => transitions.push(event),
  });
  recovery.start();
  timers.advance(45000);
  timers.advance(45000);
  assert.equal(recovery.getState(), RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE);
  assert.deepEqual(transitions, [{ state: RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE, reason: 'timeout' }]);
});

test('a definitive Google failure falls back immediately and late readiness cannot replace the local globe', async () => {
  const { createRendererRecovery, RENDERER_RECOVERY_STATES } = await loadRecovery();
  const timers = fakeTimers();
  const transitions = [];
  const recovery = createRendererRecovery({
    setTimeoutFn: timers.set,
    clearTimeoutFn: timers.clear,
    onTransition: event => transitions.push(event),
  });
  recovery.start();
  assert.equal(recovery.activateFallback('renderer-failure'), true);
  assert.equal(recovery.activate3d(), false);
  assert.equal(recovery.activateFallback('duplicate-failure'), false);
  assert.equal(recovery.getState(), RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE);
  assert.deepEqual(transitions, [{ state: RENDERER_RECOVERY_STATES.LOCAL_GLOBE_ACTIVE, reason: 'renderer-failure' }]);
});
