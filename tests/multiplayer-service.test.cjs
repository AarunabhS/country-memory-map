const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const configSource = fs.readFileSync('multiplayer-config.js', 'utf8');
const serviceSource = fs.readFileSync('multiplayer-service.js', 'utf8');
const localApi = 'http://127.0.0.1:8787';
const hostedApi = 'https://country-memory-friends.arunabh007.chatgpt.site';

function readConfig(hostname) {
  const context = { location: { hostname } };
  context.window = context;
  vm.runInNewContext(configSource, context);
  return { api: context.FRIENDS_API, fallback: context.FRIENDS_API_FALLBACK };
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function serviceHarness({ fetchImpl, session = null } = {}) {
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
    Date,
    Response,
    clearTimeout,
    document: { hidden: false, addEventListener() {} },
    fetch: fetchImpl,
    localStorage: storage,
    location: { origin: 'http://127.0.0.1:8000', pathname: '/' },
    setTimeout,
    FRIENDS_API: localApi,
    FRIENDS_API_FALLBACK: hostedApi
  };
  context.window = context;
  context.addEventListener = () => {};
  vm.runInNewContext(serviceSource, context);
  const service = new context.FriendService(state => states.push(state), status => statuses.push(status));
  return { service, states, statuses, storage };
}

test('loopback configuration keeps local service first and hosted service as fallback', () => {
  assert.deepEqual(readConfig('127.0.0.1'), { api: localApi, fallback: hostedApi });
  assert.deepEqual(readConfig('localhost'), { api: localApi, fallback: hostedApi });
  assert.deepEqual(readConfig('[::1]'), { api: localApi, fallback: hostedApi });
  assert.deepEqual(readConfig('www.arunabhosom.com'), { api: hostedApi, fallback: null });
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
