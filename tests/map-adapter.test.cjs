const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function loadAdapterModule() {
  const geometrySource = fs.readFileSync('src/country-geometry.js', 'utf8');
  const geometryUrl = `data:text/javascript;base64,${Buffer.from(geometrySource).toString('base64')}`;
  const adapterSource = fs.readFileSync('src/map-adapter.js', 'utf8')
    .replace('"./country-geometry.js"', JSON.stringify(geometryUrl));
  return import(`data:text/javascript;base64,${Buffer.from(adapterSource).toString('base64')}#${Date.now()}-${Math.random()}`);
}

test('map adapter factory preserves the exact country-click callback', async () => {
  const { createMapAdapter, Google3DAdapter } = await loadAdapterModule();
  const callback = () => {};
  const adapter = createMapAdapter({
    renderer: 'google3d',
    googleMapsApiKey: 'test-key',
    onCountryClick: callback,
  });
  assert.ok(adapter instanceof Google3DAdapter);
  assert.equal(adapter.onCountryClick, callback);
});

test('local globe uses the same renderer-neutral country-click callback boundary', async () => {
  const { createMapAdapter, LocalGlobeAdapter } = await loadAdapterModule();
  const callback = () => {};
  const adapter = createMapAdapter({
    renderer: 'local-globe',
    onCountryClick: callback,
  });
  assert.ok(adapter instanceof LocalGlobeAdapter);
  assert.equal(adapter.onCountryClick, callback);
  assert.equal(adapter.kind, 'local-globe');
});

test('local globe caps raster and animation work more aggressively on constrained devices', async () => {
  const { getLocalRenderProfile } = await loadAdapterModule();
  assert.deepEqual(getLocalRenderProfile(), { renderLimit: 440, frameInterval: 50 });
  assert.deepEqual(getLocalRenderProfile({ coarsePointer: true }), { renderLimit: 300, frameInterval: 66 });
  assert.deepEqual(getLocalRenderProfile({ deviceMemory: 4 }), { renderLimit: 300, frameInterval: 66 });
  assert.deepEqual(getLocalRenderProfile({ hardwareConcurrency: 2 }), { renderLimit: 300, frameInterval: 66 });
  assert.deepEqual(getLocalRenderProfile({ saveData: true }), { renderLimit: 300, frameInterval: 66 });
});

test('one polygon gmp-click emits one renderer-neutral country payload without fan-out', async () => {
  const { Google3DAdapter } = await loadAdapterModule();
  const payloads = [];
  const appended = [];

  class FakePolygon extends EventTarget {
    constructor(options) {
      super();
      Object.assign(this, options);
      this.attributes = new Map();
      this.style = {};
    }
    setAttribute(name, value) { this.attributes.set(name, value); }
  }

  const adapter = new Google3DAdapter({ onCountryClick: payload => payloads.push(payload) });
  adapter.map = { append: polygon => appended.push(polygon) };
  adapter.Polygon3DInteractiveElement = FakePolygon;
  const feature = { properties: { ADMIN: 'Testland' } };
  adapter.addCountry({
    id: 'TST-1',
    name: 'Testland',
    feature,
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [1, 0], [1, 1], [0, 0]]],
        [[[2, 2], [3, 2], [3, 3], [2, 2]]],
      ],
    },
  });

  assert.equal(appended.length, 2);
  const event = new Event('gmp-click');
  event.position = { lat: 0.5, lng: 0.5, altitude: 0 };
  appended[0].dispatchEvent(event);

  assert.equal(payloads.length, 1);
  assert.deepEqual(payloads[0], {
    id: 'TST-1',
    name: 'Testland',
    feature,
    position: event.position,
  });
});

test('Google 3D initialization failure emits no country callback', async () => {
  const { Google3DAdapter } = await loadAdapterModule();
  let callbacks = 0;
  const adapter = new Google3DAdapter({ onCountryClick: () => { callbacks++; } });
  await assert.rejects(adapter.initialize({ container: {} }), /restricted Google Maps key/);
  assert.equal(callbacks, 0);
});

test('Google 3D interaction gating uses DOM pointer events without an unsupported gesture value', async () => {
  const { Google3DAdapter } = await loadAdapterModule();
  const attributes = new Map();
  const adapter = new Google3DAdapter();
  adapter.map = {
    style: {},
    setAttribute(name, value) { attributes.set(name, value); },
  };

  adapter.setInteractionEnabled(false);
  assert.equal(adapter.map.style.pointerEvents, 'none');
  assert.equal(attributes.get('aria-disabled'), 'true');
  adapter.setInteractionEnabled(true);
  assert.equal(adapter.map.style.pointerEvents, 'auto');
  assert.equal(attributes.get('aria-disabled'), 'false');
});
