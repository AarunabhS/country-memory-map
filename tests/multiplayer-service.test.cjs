const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const configSource = fs.readFileSync('multiplayer-config.js', 'utf8');
const serviceSource = fs.readFileSync('multiplayer-service.js', 'utf8');
const localApi = 'http://127.0.0.1:8787';
const hostedApi = 'https://country-memory-friends.arunabh007.chatgpt.site';
const hostedSite = 'https://www.arunabhosom.com/country-memory-map/?game=multiplayer';

function readConfig(hostname, override = null) {
  const context = { location: { hostname }, COUNTRY_MEMORY_FRIENDS_API_OVERRIDE: override };
  context.window = context;
  vm.runInNewContext(configSource, context);
  return { api: context.FRIENDS_API, fallback: context.FRIENDS_API_FALLBACK, share: context.FRIENDS_SHARE_URL };
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function serviceHarness({ fetchImpl, session = null, clock = Date, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  const values = new Map(session ? [['country-memory-friend-session-v1', JSON.stringify(session)]] : []);
  const storage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const statuses = [];
  const states = [];
  const context = {
    AbortSignal,
    Date: clock,
    Response,
    URL,
    clearTimeout: clearTimer,
    document: { hidden: false, addEventListener() {} },
    fetch: fetchImpl,
    localStorage: storage,
    location: { origin: 'http://127.0.0.1:8000', pathname: '/' },
    setTimeout: setTimer,
    FRIENDS_API: localApi,
    FRIENDS_API_FALLBACK: hostedApi,
    FRIENDS_SHARE_URL: hostedSite
  };
  context.window = context;
  context.addEventListener = () => {};
  vm.runInNewContext(serviceSource, context);
  const service = new context.FriendService(state => states.push(state), status => statuses.push(status));
  return { service, states, statuses, storage };
}

test('all normal clients use the public persistent room service', () => {
  assert.deepEqual(readConfig('127.0.0.1'), { api: hostedApi, fallback: null, share: hostedSite });
  assert.deepEqual(readConfig('localhost'), { api: hostedApi, fallback: null, share: hostedSite });
  assert.deepEqual(readConfig('[::1]'), { api: hostedApi, fallback: null, share: hostedSite });
  assert.deepEqual(readConfig('www.arunabhosom.com'), { api: hostedApi, fallback: null, share: hostedSite });
});

test('a loopback service requires an exact local developer override', () => {
  assert.deepEqual(readConfig('localhost', localApi), { api: localApi, fallback: hostedApi, share: null });
  assert.deepEqual(readConfig('www.arunabhosom.com', localApi), { api: hostedApi, fallback: null, share: hostedSite });
  assert.deepEqual(readConfig('localhost', 'https://untrusted.example'), { api: hostedApi, fallback: null, share: hostedSite });
});

test('share links use the public website even when the frontend runs on a device', () => {
  const session = { code: 'GEOABC123', token: 'token', api: hostedApi };
  const { service } = serviceHarness({ session, fetchImpl: async () => { throw new Error('No request expected'); } });
  assert.equal(service.invite(), `${hostedSite}&room=GEOABC123`);
  service.suspend();
});

test('room codes normalize common WhatsApp copy and paste formats', () => {
  const { service } = serviceHarness({ fetchImpl: async () => { throw new Error('No request expected'); } });
  assert.equal(service.normalizeCode(' geo abc-123 '), 'GEOABC123');
  assert.equal(service.normalizeCode('https://www.arunabhosom.com/country-memory-map/?game=multiplayer&room=geoabc123'), 'GEOABC123');
  assert.equal(service.validCode('GEO ABC-123'), true);
  assert.equal(service.validCode('bad!'), false);
  service.suspend();
});

test('a different invite pauses the stored room without polling or replacing it', () => {
  let calls = 0;
  const session = { code: 'GEOOLD123', token: 'old-token', api: hostedApi };
  const { service, storage } = serviceHarness({
    session,
    fetchImpl: async () => { calls++; throw new Error('No request expected'); }
  });

  const invite = service.prepareInvite('https://www.arunabhosom.com/country-memory-map/?game=multiplayer&room=GEONEW456');

  assert.equal(invite.code, 'GEONEW456');
  assert.equal(invite.matchesSession, false);
  assert.equal(service.suspended, true);
  assert.equal(calls, 0);
  assert.deepEqual(JSON.parse(storage.getItem('country-memory-friend-session-v1')), session);
});

test('room creation health-checks before falling back and never retries the POST', async () => {
  const calls = [];
  const { service, storage, statuses } = serviceHarness({
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET' });
      if (url === `${localApi}/health`) throw new TypeError('local service is offline');
      if (url === `${hostedApi}/health`) return response({ ok: true, serverNow: 1000 });
      if (url === `${hostedApi}/rooms`) return response({ code: 'GEOABC123', token: 'token', revision: 0, serverNow: 1000 }, 201);
      throw new Error(`Unexpected request: ${url}`);
    }
  });

  const room = await service.create('Player');
  service.suspend();

  assert.equal(room.code, 'GEOABC123');
  assert.deepEqual(calls, [
    { url: `${localApi}/health`, method: 'GET' },
    { url: `${hostedApi}/health`, method: 'GET' },
    { url: `${hostedApi}/rooms`, method: 'POST' }
  ]);
  assert.equal(calls.filter(call => call.method === 'POST').length, 1);
  assert.equal(JSON.parse(storage.getItem('country-memory-friend-session-v1')).api, hostedApi);
  assert.equal(statuses.at(-1), '');
});

test('an established room reuses its persisted service without probing another database', async () => {
  const calls = [];
  const { service } = serviceHarness({
    session: { code: 'GEOABC123', token: 'token', api: hostedApi },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET' });
      return response({ code: 'GEOABC123', revision: 1, serverNow: 1000 });
    }
  });

  await service.poll();
  service.suspend();

  assert.deepEqual(calls, [{ url: `${hostedApi}/rooms/GEOABC123`, method: 'GET' }]);
});

test('an expired stored room is cleared and no longer announced as active', async () => {
  const session = { code: 'GEOOLD123', token: 'token', api: hostedApi };
  const { service, states, statuses, storage } = serviceHarness({
    session,
    fetchImpl: async () => response({
      error: 'ROOM_EXPIRED',
      message: 'THIS ROOM HAS EXPIRED',
      serverNow: 1000
    }, 410)
  });

  const result = await service.poll();

  assert.equal(result, null);
  assert.equal(service.session, null);
  assert.equal(service.room, null);
  assert.equal(storage.getItem('country-memory-friend-session-v1'), null);
  assert.deepEqual({ ...states.at(-1) }, {
    error: 'ROOM_EXPIRED',
    message: 'THIS ROOM HAS EXPIRED',
    code: 'GEOOLD123'
  });
  assert.equal(statuses.at(-1), '');
});

test('a stored session cannot redirect its bearer token to an unconfigured API', async () => {
  const calls = [];
  const { service } = serviceHarness({
    session: { code: 'GEOABC123', token: 'token', api: 'https://untrusted.example' },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET', authorization: options.headers?.Authorization });
      if (url === `${localApi}/health`) throw new TypeError('local service is offline');
      if (url === `${hostedApi}/health`) return response({ ok: true, serverNow: 1000 });
      if (url === `${hostedApi}/rooms/GEOABC123`) return response({ code: 'GEOABC123', revision: 1, serverNow: 1000 });
      throw new Error(`Unexpected request: ${url}`);
    }
  });

  await service.poll();
  service.suspend();

  assert.ok(calls.every(call => !call.url.startsWith('https://untrusted.example')));
  assert.equal(calls.at(-1).authorization, 'Bearer token');
});

test('initial connection failure is not announced as a room reconnect', async () => {
  const calls = [];
  const { service, statuses } = serviceHarness({
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET' });
      throw new TypeError('offline');
    }
  });

  await assert.rejects(
    service.create('Player'),
    /Could not connect to Play with Friends/
  );

  assert.deepEqual(calls.map(call => call.url), [`${localApi}/health`, `${hostedApi}/health`]);
  assert.equal(statuses.at(-1), 'PLAY WITH FRIENDS UNAVAILABLE · Check your connection.');
});

test('a lost answer response reconciles an authoritative server commit instead of reporting failure', async () => {
  const calls = [];
  const session = { code: 'GEOABC123', token: 'token', api: hostedApi };
  const { service, states, statuses } = serviceHarness({
    session,
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET' });
      if ((options.method || 'GET') === 'POST') throw new TypeError('response lost after commit');
      return response({
        code: session.code,
        revision: 8,
        match: { id: 'match-1' },
        nextSeq: 2,
        game: { gameStatus: 'playing' },
        serverNow: 1000
      });
    }
  });

  const room = await service.action('answer', { matchId: 'match-1', seq: 1, kind: 'text', value: 'India' });
  service.suspend();

  assert.equal(room.nextSeq, 2);
  assert.equal(states.at(-1).revision, 8);
  assert.equal(statuses.at(-1), '');
  assert.deepEqual(calls.map(call => call.method), ['POST', 'POST', 'GET']);
});

test('an uncommitted answer still reports failure after retry and reconciliation poll', async () => {
  const session = { code: 'GEOABC123', token: 'token', api: hostedApi };
  let postCalls = 0;
  const { service } = serviceHarness({
    session,
    fetchImpl: async (_url, options = {}) => {
      if ((options.method || 'GET') === 'POST') {
        postCalls++;
        throw new TypeError('offline');
      }
      return response({ code: session.code, revision: 2, match: { id: 'match-1' }, nextSeq: 1, serverNow: 1000 });
    }
  });

  await assert.rejects(
    service.action('answer', { matchId: 'match-1', seq: 1, kind: 'text', value: 'India' }),
    /Connection lost/
  );
  service.suspend();
  assert.equal(postCalls, 2);
});

test('slow responses do not add a full polling interval and background membership uses eight seconds', async () => {
  let now = 100000, timer;
  const delays = [];
  const session = { code: 'GEOLAT123', token: 'test-token', api: hostedApi };
  const { service, storage } = serviceHarness({ session, clock: { now: () => now },
    setTimer: (fn, delay) => { timer = fn; delays.push(delay); return 1; }, clearTimer() {},
    fetchImpl: async () => { now += 750; return response({ code: session.code, revision: now, serverNow: now, state: 'RESULTS', game: { gameStatus: 'ended' } }); }
  });
  await service.poll();
  assert.equal(delays.at(-1), 750);
  assert.equal(750 + delays.at(-1), 1500, 'cadence remains bounded at 40 foreground polls/minute');
  service.suspend({ keepAlive: true });
  assert.equal(delays.at(-1), 8000);
  assert.equal(JSON.parse(storage.getItem(service.key)).token, session.token);
  await timer();
  assert.equal(delays.at(-1), 8000);
  assert.equal(service.session.code, session.code);
  await service.resume();
  assert.equal(service.background, false);
  assert.equal(delays.at(-1), 750);
  service.suspend();
  assert.equal(service.suspended, true);
});

test('very slow transport has a retry floor instead of creating a polling storm', async () => {
  let now = 100000, delay;
  const { service } = serviceHarness({ session: { code: 'GEOSLO123', token: 'test', api: hostedApi },
    clock: { now: () => now }, setTimer: (fn, value) => { delay = value; return 1; }, clearTimer() {},
    fetchImpl: async () => { now += 2000; return response({ code: 'GEOSLO123', revision: 1 }); }
  });
  await service.poll();
  assert.equal(delay, 250);
  service.suspend();
});
