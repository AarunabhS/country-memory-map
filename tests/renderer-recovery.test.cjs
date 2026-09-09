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

test('usable 3D before the recovery deadline prevents fallback and clears its timer', async () => {
  const { createRendererRecovery, RENDERER_RECOVERY_STATES } = await loadRecovery();
  const timers = fakeTimers();
  const transitions = [];
  const recovery = createRendererRecovery({ setTimeoutFn: timers.set, clearTimeoutFn: timers.clear, onTransition: event => transitions.push(event) });
  recovery.start();
  assert.equal(recovery.activate3d(), true);
  assert.equal(recovery.activate3d(), false);
  assert.equal(recovery.activate2d('late-failure'), false);
  timers.advance(45000);
  assert.equal(recovery.getState(), RENDERER_RECOVERY_STATES.THREE_D_ACTIVE);
  assert.equal(timers.count(), 0);
  assert.deepEqual(transitions.map(event => event.state), [RENDERER_RECOVERY_STATES.THREE_D_ACTIVE]);
});

test('successful readiness may show live 3D, while 2D_ACTIVE locks the status copy to fallback', async () => {
  const { createRendererRecovery, getRendererPresentation, RENDERER_RECOVERY_STATES } = await loadRecovery();
  const liveTimers = fakeTimers();
  const liveRecovery = createRendererRecovery({ setTimeoutFn: liveTimers.set, clearTimeoutFn: liveTimers.clear });
  liveRecovery.start();
  assert.equal(liveRecovery.activate3d(), true);
  assert.deepEqual(getRendererPresentation(liveRecovery.getState(), { live: true }), {
    live: true,
    warning: false,
    label: 'Live 3D Earth',
  });

  const fallbackTimers = fakeTimers();
  const fallbackRecovery = createRendererRecovery({ setTimeoutFn: fallbackTimers.set, clearTimeoutFn: fallbackTimers.clear });
  fallbackRecovery.start();
  assert.equal(fallbackRecovery.activate2d('timeout'), true);
  assert.deepEqual(getRendererPresentation(fallbackRecovery.getState(), { live: true }), {
    live: false,
    warning: true,
    label: '3D unavailable',
  });
  assert.equal(fallbackRecovery.activate3d(), false);
  assert.equal(fallbackRecovery.getState(), RENDERER_RECOVERY_STATES.TWO_D_ACTIVE);
  assert.deepEqual(getRendererPresentation(fallbackRecovery.getState(), { live: true }), {
    live: false,
    warning: true,
    label: '3D unavailable',
  });
});

test('45 seconds without usable 3D activates the retained 2D fallback once', async () => {
  const { createRendererRecovery, RENDERER_RECOVERY_STATES } = await loadRecovery();
  const timers = fakeTimers();
  const transitions = [];
  const recovery = createRendererRecovery({ setTimeoutFn: timers.set, clearTimeoutFn: timers.clear, onTransition: event => transitions.push(event) });
  recovery.start();
  timers.advance(45000);
  timers.advance(45000);
  assert.equal(recovery.getState(), RENDERER_RECOVERY_STATES.TWO_D_ACTIVE);
  assert.deepEqual(transitions, [{ state: RENDERER_RECOVERY_STATES.TWO_D_ACTIVE, reason: 'timeout' }]);
});

test('a definitive failure falls back immediately and late readiness cannot reclaim the session', async () => {
  const { createRendererRecovery, RENDERER_RECOVERY_STATES } = await loadRecovery();
  const timers = fakeTimers();
  const transitions = [];
  const recovery = createRendererRecovery({ setTimeoutFn: timers.set, clearTimeoutFn: timers.clear, onTransition: event => transitions.push(event) });
  recovery.start();
  assert.equal(recovery.activate2d('renderer-failure'), true);
  assert.equal(recovery.activate3d(), false);
  assert.equal(recovery.activate2d('duplicate-failure'), false);
  assert.equal(recovery.getState(), RENDERER_RECOVERY_STATES.TWO_D_ACTIVE);
  assert.deepEqual(transitions, [{ state: RENDERER_RECOVERY_STATES.TWO_D_ACTIVE, reason: 'renderer-failure' }]);
});
