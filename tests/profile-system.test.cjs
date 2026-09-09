const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { ProfileService, ProfileManager, GameTracker, profileDialogMarkup } = require('../player-system.js');

class MemoryStorage {
  constructor(seed = {}) { this.values = new Map(Object.entries(seed)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

function localManager(storage, clock = () => 1700000000000) {
  return new ProfileManager(storage, null, { clock, remoteSyncEnabled: false });
}

test('release configuration defaults remote profile sync off', () => {
  const source = fs.readFileSync('multiplayer-config.js', 'utf8');
  const context = { window: {}, location: { hostname: 'release.example' } };
  vm.runInNewContext(source, context);
  assert.equal(context.window.COUNTRY_MEMORY_FLAGS.REMOTE_PROFILE_SYNC_ENABLED, false);
  assert.match(fs.readFileSync('game-ui.js', 'utf8'), /remoteProfileSyncEnabled/);
});

test('local profile creation, selection, and refresh persistence remain available', () => {
  const storage = new MemoryStorage();
  const manager = localManager(storage);
  const first = manager.create({ realName: 'Ada Lovelace', nickname: 'Ada' });
  const second = manager.create({ realName: 'Grace Hopper', nickname: 'Grace' });

  assert.equal(manager.active.id, second.id);
  manager.switchTo(first.id);
  assert.equal(manager.active.id, first.id);
  manager.setEffects('reduced');
  const savedPlayers = JSON.parse(storage.getItem('country-memory-players-v1'));
  const restored = localManager(storage);

  assert.equal(restored.active.id, first.id);
  assert.equal(restored.data.settings.answerEffects, 'reduced');
  assert.deepEqual(JSON.parse(storage.getItem('country-memory-players-v1')), savedPlayers);
  assert.deepEqual(restored.profiles.map(profile => profile.nickname), ['Grace', 'Ada']);
});

test('local gameplay updates statistics and never persists a remote queue', () => {
  const storage = new MemoryStorage();
  const manager = localManager(storage);
  const profile = manager.create({ realName: 'Katherine Johnson', nickname: 'KJ' });
  const tracker = new GameTracker(manager, null, { clock: () => 1700000000000 });

  tracker.onEvent({ type: 'start' }, { startedAt: 1700000000000 }, { family: 'find', variant: 'standard', difficulty: 'medium' });
  tracker.onEvent({ type: 'correct', entityCode: 'C1', gained: 130, seconds: 1 }, { score: 130, streak: 1, bestStreak: 1 });
  tracker.onEvent({ type: 'end', result: { reason: 'completed', elapsedTime: 2, score: 130 } }, { score: 130, elapsedTime: 2 });

  assert.equal(profile.stats.gamesStarted, 1);
  assert.equal(profile.stats.gamesCompleted, 1);
  assert.equal(profile.stats.lifetimeCorrect, 1);
  assert.equal(profile.stats.lifetimePoints, 130);
  assert.deepEqual(profile.mastery.countries, ['C1']);
  assert.equal(storage.getItem('country-memory-sync-queue-v1'), null);
  assert.equal(localManager(storage).active.stats.lifetimeCorrect, 1);
});

test('disabled remote operations make no unsupported requests or destructive remote changes', async () => {
  let requestCount = 0;
  const service = new ProfileService({
    baseUrl: 'https://unsupported.example',
    fetchImpl: async () => { requestCount += 1; throw new Error('request should be disabled'); }
  });
  const storage = new MemoryStorage();
  const manager = new ProfileManager(storage, service, { remoteSyncEnabled: false });
  const profile = manager.create({ realName: 'Mae Jemison', nickname: 'Mae', pin: '123456' });

  assert.equal(manager.remoteSyncEnabled, false);
  assert.equal(manager.service, null);
  await manager.initialize();
  manager.update(profile.id, { nickname: 'Mae J' });
  assert.equal((await manager.changePin(profile.id, '654321')).id, profile.id);
  assert.equal(await manager.recover('CM-LOCAL', '654321'), null);
  assert.equal((await manager.removePermanently(profile.id)).id, profile.id);
  assert.equal(requestCount, 0);
  assert.equal(manager.profiles.length, 1);
  assert.equal(storage.getItem('country-memory-sync-queue-v1'), null);
});

test('disabled profile markup omits remote-only controls and uses truthful local copy', () => {
  const localMarkup = profileDialogMarkup(false);
  assert.match(localMarkup, /Saved on this device/);
  assert.doesNotMatch(localMarkup, /profileCodeBox|profileRecover|profilePinForm|profileDelete|Player Code|Recovery PIN|Stats syncing/);

  const remoteMarkup = profileDialogMarkup(true);
  assert.match(remoteMarkup, /profileCodeBox/);
  assert.match(remoteMarkup, /profileRecover/);
  assert.match(remoteMarkup, /profilePinForm/);
  assert.match(remoteMarkup, /profileDelete/);
});
