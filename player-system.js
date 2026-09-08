/* Player identity, durable synchronization, and renderer-agnostic feedback. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CountryMemoryPlayers = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  const PLAYERS_KEY = 'country-memory-players-v1';
  const DEVICE_KEY = 'country-memory-device-v1';
  const QUEUE_KEY = 'country-memory-sync-queue-v1';
  const EFFECTS = ['normal', 'reduced', 'off'];
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => Date.now();

  function id() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40; bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    return `local-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  }

  function clean(value) {
    return String(value ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  }

  function validateProfileFields(input = {}) {
    const realName = clean(input.realName), nickname = clean(input.nickname), pin = String(input.pin || '').trim();
    if (!realName || [...realName].length > 80) throw new Error('Your name must be 1 to 80 characters.');
    if ([...nickname].length < 2 || [...nickname].length > 24) throw new Error('Your nickname must be 2 to 24 characters.');
    if (pin && !/^\d{6}$/.test(pin)) throw new Error('Recovery PINs use six digits.');
    return { realName, nickname, pin: pin || null };
  }

  function initialsFor(name, nickname = '') {
    const words = clean(name || nickname).split(/\s+/).filter(Boolean);
    if (words.length >= 2) return `${[...words[0]][0] || ''}${[...words.at(-1)][0] || ''}`.toUpperCase();
    return [...(words[0] || '')].slice(0, 2).join('').toUpperCase() || 'P';
  }

  function emptyStats() {
    return { gamesStarted: 0, gamesCompleted: 0, lifetimeCorrect: 0, lifetimeIncorrect: 0, lifetimeDuplicates: 0, lifetimePlayTimeMs: 0, longestStreak: 0, bestSessionCorrect: 0, lifetimePoints: 0, accuracy: 0 };
  }

  function emptyProfile(fields = {}) {
    const timestamp = new Date().toISOString();
    return { id: fields.id || id(), realName: fields.realName || '', nickname: fields.nickname || '', initials: initialsFor(fields.realName, fields.nickname), createdAt: fields.createdAt || timestamp, updatedAt: timestamp, lastPlayedAt: null, profileVersion: 1, playerCode: null, stats: emptyStats(), modeStats: {}, mastery: { countries: [], capitals: [] }, entityStats: [], sync: 'pending', ...fields };
  }

  function mergeStats(stats = {}) {
    return { ...emptyStats(), ...stats, accuracy: Number(stats.accuracy || 0) };
  }

  function normalizeRemoteProfile(profile) {
    const value = emptyProfile(profile);
    return { ...value, id: profile.id, realName: profile.realName || '', nickname: profile.nickname || '', initials: profile.initials || initialsFor(profile.realName, profile.nickname), createdAt: profile.createdAt || value.createdAt, updatedAt: profile.updatedAt || value.updatedAt, lastPlayedAt: profile.lastPlayedAt || null, playerCode: profile.playerCode || null, stats: mergeStats(profile.stats), modeStats: profile.modeStats || {}, mastery: { countries: [...new Set(profile.mastery?.countries || [])], capitals: [...new Set(profile.mastery?.capitals || [])] }, entityStats: Array.isArray(profile.entityStats) ? profile.entityStats : [], sync: 'synced' };
  }

  function readJson(storage, key, fallback) {
    try { const value = JSON.parse(storage?.getItem(key) || 'null'); return value == null ? fallback : value; } catch { return fallback; }
  }

  class ProfileService {
    constructor({ baseUrl, fetchImpl } = {}) { this.baseUrl = baseUrl || null; this.fetchImpl = fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null); }
    async request(path, input = null, method = input ? 'POST' : 'GET') {
      if (!this.baseUrl || !this.fetchImpl) throw new Error('Stats sync is unavailable right now.');
      const started = Date.now();
      const headers = { ...(input ? { 'Content-Type': 'application/json' } : {}), ...(this.deviceToken ? { Authorization: `Bearer ${this.deviceToken}` } : {}) };
      let response;
      const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined;
      try { response = await this.fetchImpl(`${this.baseUrl}${path}`, { method, headers, body: input ? JSON.stringify(input) : undefined, signal }); }
      catch { throw new Error('Stats are syncing when the connection returns.'); }
      let data = null; try { data = await response.json(); } catch { throw new Error('Stats are syncing when the connection returns.'); }
      if (!response.ok) { const error = new Error(data.message || 'Stats could not be synced.'); error.code = data.error; error.status = response.status; throw error; }
      this.lastServerNow = data.serverNow || Date.now(); this.lastRoundTripMs = Date.now() - started;
      return data;
    }
    setDeviceToken(token) { this.deviceToken = token; }
    listProfiles() { return this.request('/profiles'); }
    createProfile(profile) { return this.request('/profiles', profile); }
    updateProfile(idValue, fields) { return this.request(`/profiles/${encodeURIComponent(idValue)}`, { action: 'update', ...fields }); }
    changePin(idValue, pin) { return this.request(`/profiles/${encodeURIComponent(idValue)}`, { action: 'change_pin', pin }); }
    removeProfile(idValue) { return this.request(`/profiles/${encodeURIComponent(idValue)}`, { action: 'remove' }); }
    deleteProfile(idValue) { return this.request(`/profiles/${encodeURIComponent(idValue)}`, { action: 'delete' }); }
    recover(playerCode, pin) { return this.request('/recover', { playerCode, pin }); }
    startSession(session) { return this.request('/sessions', session); }
    recordAnswer(event) { return this.request(`/sessions/${encodeURIComponent(event.sessionId)}/answers`, event); }
    endSession(session) { return this.request(`/sessions/${encodeURIComponent(session.sessionId)}/end`, session); }
  }

  class ProfileManager {
    constructor(storage, service = null, { clock = now } = {}) {
      this.storage = storage; this.service = service; this.clock = clock; this.listeners = new Set(); this.pendingPins = new Map(); this.syncState = 'idle';
      const fallbackDevice = id();
      const savedDevice = readJson(storage, DEVICE_KEY, null);
      this.deviceToken = typeof savedDevice === 'string' && savedDevice.length >= 20 ? savedDevice : fallbackDevice;
      try { storage?.setItem(DEVICE_KEY, JSON.stringify(this.deviceToken)); } catch {}
      const saved = readJson(storage, PLAYERS_KEY, {});
      this.data = { deviceToken: this.deviceToken, activeProfileId: saved.activeProfileId || null, profiles: Array.isArray(saved.profiles) ? saved.profiles.map(profile => ({ ...emptyProfile(profile), ...profile, stats: mergeStats(profile.stats), mastery: { countries: profile.mastery?.countries || [], capitals: profile.mastery?.capitals || [] } })) : [], settings: { answerEffects: EFFECTS.includes(saved.settings?.answerEffects) ? saved.settings.answerEffects : 'normal' } };
      if (!this.data.activeProfileId && this.data.profiles[0]) this.data.activeProfileId = this.data.profiles[0].id;
      this.service?.setDeviceToken(this.deviceToken);
    }
    get active() { return this.data.profiles.find(profile => profile.id === this.data.activeProfileId) || null; }
    get profiles() { return this.data.profiles; }
    onChange(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    emit() { this.save(); for (const listener of this.listeners) listener(this.active, this.data); }
    save() { try { this.storage?.setItem(PLAYERS_KEY, JSON.stringify(this.data)); } catch {} }
    async initialize() {
      this.emit();
      if (!this.service) return this.active;
      try { this.syncState = 'syncing'; this.emit(); const response = await this.service.listProfiles(); this.mergeRemote(response.profiles || []); this.syncState = 'idle'; this.emit(); await this.syncPending(); }
      catch { this.syncState = 'offline'; this.emit(); }
      return this.active;
    }
    mergeRemote(remoteProfiles) {
      for (const remote of remoteProfiles) {
        const value = normalizeRemoteProfile(remote), local = this.data.profiles.find(profile => profile.id === value.id);
        if (local) Object.assign(local, value); else this.data.profiles.push(value);
      }
      if (!this.active && this.data.profiles.length) this.data.activeProfileId = this.data.profiles[0].id;
    }
    async syncPending() {
      if (!this.service) return;
      for (const profile of [...this.data.profiles]) {
        if (profile.sync === 'pending' || profile.sync === 'dirty') await this.syncProfile(profile);
      }
    }
    async syncProfile(profile) {
      if (!this.service) return;
      try {
        let response;
        if (profile.sync === 'pending') response = await this.service.createProfile({ id: profile.id, realName: profile.realName, nickname: profile.nickname, ...(this.pendingPins.has(profile.id) ? { pin: this.pendingPins.get(profile.id) } : {}) });
        else response = await this.service.updateProfile(profile.id, { realName: profile.realName, nickname: profile.nickname });
        if (response.profile) Object.assign(profile, normalizeRemoteProfile(response.profile));
        profile.sync = 'synced'; this.pendingPins.delete(profile.id); this.syncState = 'idle'; this.emit();
      } catch { profile.sync = profile.sync === 'pending' ? 'pending' : 'dirty'; this.syncState = 'offline'; this.emit(); }
    }
    create(fields) {
      const data = validateProfileFields(fields), profile = emptyProfile({ id: id(), realName: data.realName, nickname: data.nickname });
      if (data.pin) this.pendingPins.set(profile.id, data.pin);
      this.data.profiles.unshift(profile); this.data.activeProfileId = profile.id; this.syncState = this.service ? 'syncing' : 'offline'; this.emit();
      this.syncProfile(profile);
      return profile;
    }
    switchTo(profileId) { if (!this.data.profiles.some(profile => profile.id === profileId)) throw new Error('Player not found on this device.'); this.data.activeProfileId = profileId; this.emit(); return this.active; }
    update(profileId, fields) {
      const profile = this.data.profiles.find(value => value.id === profileId); if (!profile) throw new Error('Player not found on this device.');
      const data = validateProfileFields({ realName: fields.realName ?? profile.realName, nickname: fields.nickname ?? profile.nickname }); Object.assign(profile, data, { initials: initialsFor(data.realName, data.nickname), updatedAt: new Date(this.clock()).toISOString(), sync: 'dirty' }); this.emit(); this.syncProfile(profile); return profile;
    }
    async changePin(profileId, pin) {
      if (!/^\d{6}$/.test(String(pin || ''))) throw new Error('Recovery PINs use six digits.');
      const profile = this.data.profiles.find(value => value.id === profileId); if (!profile) throw new Error('Player not found on this device.');
      if (!this.service) throw new Error('Connect once to set a recovery PIN.');
      const response = await this.service.changePin(profileId, String(pin)); if (response.profile) Object.assign(profile, normalizeRemoteProfile(response.profile)); this.emit(); return profile;
    }
    async recover(playerCode, pin) {
      if (!this.service) throw new Error('Recovery is unavailable while offline.');
      const response = await this.service.recover(String(playerCode || '').trim(), String(pin || '').trim());
      if (!response.profile) throw new Error('Player Code or PIN is incorrect.');
      const profile = normalizeRemoteProfile(response.profile), existing = this.data.profiles.find(value => value.id === profile.id); if (existing) Object.assign(existing, profile); else this.data.profiles.unshift(profile); this.data.activeProfileId = profile.id; this.emit(); return profile;
    }
    async remove(profileId) {
      const index = this.data.profiles.findIndex(profile => profile.id === profileId); if (index < 0) return;
      try { await this.service?.removeProfile(profileId); } catch {}
      this.data.profiles.splice(index, 1); if (this.data.activeProfileId === profileId) this.data.activeProfileId = this.data.profiles[0]?.id || null; this.emit();
    }
    async removePermanently(profileId) {
      const index = this.data.profiles.findIndex(profile => profile.id === profileId); if (index < 0) return;
      if (this.service) await this.service.deleteProfile(profileId);
      this.data.profiles.splice(index, 1); if (this.data.activeProfileId === profileId) this.data.activeProfileId = this.data.profiles[0]?.id || null; this.emit();
    }
    setEffects(value) { if (EFFECTS.includes(value)) { this.data.settings.answerEffects = value; this.emit(); } }
    applySessionStart(profileId, mode) {
      const profile = this.data.profiles.find(value => value.id === profileId); if (!profile) return;
      profile.stats.gamesStarted += 1; profile.stats.accuracy = profile.stats.lifetimeCorrect + profile.stats.lifetimeIncorrect ? 100 * profile.stats.lifetimeCorrect / (profile.stats.lifetimeCorrect + profile.stats.lifetimeIncorrect) : 0;
      profile.modeStats[mode] = { gamesStarted: 0, gamesCompleted: 0, correct: 0, incorrect: 0, duplicates: 0, playTimeMs: 0, longestStreak: 0, bestRun: 0, points: 0, ...(profile.modeStats[mode] || {}) }; profile.modeStats[mode].gamesStarted += 1; this.emit();
    }
    applyAnswer(profileId, mode, event) {
      const profile = this.data.profiles.find(value => value.id === profileId); if (!profile) return;
      const stats = profile.stats, modeStats = profile.modeStats[mode] = { gamesStarted: 0, gamesCompleted: 0, correct: 0, incorrect: 0, duplicates: 0, playTimeMs: 0, longestStreak: 0, bestRun: 0, points: 0, ...(profile.modeStats[mode] || {}) };
      if (event.result === 'correct') { stats.lifetimeCorrect += 1; modeStats.correct += 1; stats.lifetimePoints += Number(event.scoreDelta || 0); modeStats.points += Number(event.scoreDelta || 0); const family = mode.split(':')[0]; const mastery = family === 'capital' ? profile.mastery.capitals : profile.mastery.countries; if (event.entityCode && !mastery.includes(event.entityCode)) mastery.push(event.entityCode); }
      else if (event.result === 'incorrect') { stats.lifetimeIncorrect += 1; modeStats.incorrect += 1; }
      else { stats.lifetimeDuplicates += 1; modeStats.duplicates += 1; }
      stats.longestStreak = Math.max(stats.longestStreak, Number(event.streak || 0)); modeStats.longestStreak = Math.max(modeStats.longestStreak, Number(event.streak || 0)); stats.accuracy = stats.lifetimeCorrect + stats.lifetimeIncorrect ? 100 * stats.lifetimeCorrect / (stats.lifetimeCorrect + stats.lifetimeIncorrect) : 0; modeStats.accuracy = modeStats.correct + modeStats.incorrect ? 100 * modeStats.correct / (modeStats.correct + modeStats.incorrect) : 0; profile.updatedAt = new Date(this.clock()).toISOString(); this.emit();
    }
    applySessionEnd(profileId, mode, session) {
      const profile = this.data.profiles.find(value => value.id === profileId); if (!profile) return; const stats = profile.stats, modeStats = profile.modeStats[mode] || {};
      if (['completed', 'time', 'lives'].includes(session.endReason)) { stats.gamesCompleted += 1; modeStats.gamesCompleted = Number(modeStats.gamesCompleted || 0) + 1; }
      const duration = Number(session.durationMs || 0); stats.lifetimePlayTimeMs += duration; modeStats.playTimeMs = Number(modeStats.playTimeMs || 0) + duration; if (!session.assisted) { stats.bestSessionCorrect = Math.max(stats.bestSessionCorrect, Number(session.correctCount || 0)); modeStats.bestRun = Math.max(Number(modeStats.bestRun || 0), Number(session.correctCount || 0)); }
      profile.updatedAt = new Date(this.clock()).toISOString(); this.emit();
    }
  }

  class StatsSyncQueue {
    constructor(storage, service, manager) {
      this.storage = storage; this.service = service; this.manager = manager; this.items = readJson(storage, QUEUE_KEY, []); this.running = false; this.retryTimer = null; this.retryDelay = 1000;
      manager?.onChange(() => { if (this.items.length) this.flush(); });
      if (typeof window !== 'undefined') window.addEventListener('online', () => this.flush());
    }
    save() { try { this.storage?.setItem(QUEUE_KEY, JSON.stringify(this.items)); } catch {} }
    enqueue(item) { if (!item?.type) return; if (item.type === 'answer' && item.clientEventId && this.items.some(value => value.type === 'answer' && value.clientEventId === item.clientEventId)) return; this.items.push(item); this.items = this.items.slice(-2500); this.save(); this.flush(); }
    async send(item) {
      if (item.type === 'session_start') return this.service.startSession(item);
      if (item.type === 'answer') return this.service.recordAnswer(item);
      if (item.type === 'session_end') return this.service.endSession(item);
      return null;
    }
    async flush() {
      if (this.running || !this.service || !this.items.length) return;
      this.running = true; this.manager.syncState = 'syncing'; this.manager.emit();
      try {
        while (this.items.length) {
          const item = this.items[0];
          try { await this.send(item); this.items.shift(); this.save(); }
          catch { this.manager.syncState = 'offline'; this.manager.emit(); clearTimeout(this.retryTimer); const delay = this.retryDelay; this.retryDelay = Math.min(this.retryDelay * 2, 30000); this.retryTimer = setTimeout(() => this.flush(), delay); return; }
        }
        this.retryDelay = 1000; this.manager.syncState = 'idle'; this.manager.emit();
      } finally { this.running = false; }
    }
  }

  class GameTracker {
    constructor(manager, queue, { clock = now } = {}) { this.manager = manager; this.queue = queue; this.clock = clock; this.session = null; }
    start(config, state) {
      if (this.session) this.finish('mode_change', state);
      const profile = this.manager.active; if (!profile) return;
      const sessionId = id(), mode = `${config.family}:${config.variant}`;
      this.session = { sessionId, profileId: profile.id, mode, difficulty: config.difficulty || 'medium', startedAt: Number(state.startedAt || this.clock()), correctCount: 0, incorrectCount: 0, duplicateCount: 0, bestStreak: 0, finalScore: 0, assisted: false };
      this.manager.applySessionStart(profile.id, mode);
      this.queue.enqueue({ type: 'session_start', id: sessionId, sessionId, profileId: profile.id, mode, difficulty: this.session.difficulty, startedAt: this.session.startedAt, gameVersion: 'country-memory-map-v1' });
    }
    answer(result, event, state) {
      if (!this.session || !this.manager.active || this.session.profileId !== this.manager.active.id) return;
      const entityCode = event.entityCode || event.countryId || state?.currentQuestion?.countryId || null;
      const answerEvent = { type: 'answer', clientEventId: id(), sessionId: this.session.sessionId, profileId: this.session.profileId, result, entityCode, responseMs: event.seconds == null ? null : Math.round(Number(event.seconds) * 1000), scoreDelta: Number(event.gained || 0), streak: Number(state?.streak || 0), occurredAt: this.clock() };
      if (result === 'correct') this.session.correctCount += 1; else if (result === 'incorrect') this.session.incorrectCount += 1; else this.session.duplicateCount += 1;
      this.session.bestStreak = Math.max(this.session.bestStreak, Number(state?.bestStreak || state?.streak || 0)); this.session.finalScore = Number(state?.score || 0); this.manager.applyAnswer(this.session.profileId, this.session.mode, answerEvent); this.queue.enqueue(answerEvent);
    }
    onEvent(event, state, config) {
      if (event.type === 'start') { this.start(config, state); return; }
      if (!this.session) return;
      if (event.type === 'correct') this.answer('correct', event, state);
      else if (event.type === 'wrong') this.answer('incorrect', event, state);
      else if (event.type === 'duplicate') this.answer('duplicate', event, state);
      else if (event.type === 'reveal' && event.reason === 'timeout') this.answer('incorrect', event, state);
      else if (event.type === 'end') this.finish(event.result?.reason || 'abandoned', state, event.result);
    }
    finish(endReason = 'abandoned', state = {}, result = null) {
      const session = this.session; if (!session) return;
      this.session = null; const durationMs = Math.max(0, Math.round(Number(result?.elapsedTime || state?.elapsedTime || 0) * 1000) || this.clock() - session.startedAt);
      const ended = { type: 'session_end', sessionId: session.sessionId, profileId: session.profileId, endReason, durationMs, finalScore: Number(result?.score ?? state?.score ?? session.finalScore), bestStreak: session.bestStreak, correctCount: session.correctCount, incorrectCount: session.incorrectCount, duplicateCount: session.duplicateCount, assisted: session.assisted };
      this.manager.applySessionEnd(session.profileId, session.mode, ended); this.queue.enqueue(ended);
    }
    hasActiveSession() { return !!this.session; }
  }

  class MapFeedbackAdapter {
    constructor(map) { this.map = map; }
    markCountry(idValue) { this.map?.mark?.(idValue); }
    flashCountry(idValue, intensity = 'full') { if (this.map?.flashCountry) this.map.flashCountry(idValue, intensity); else this.map?.feedback?.(idValue, 'good', false, intensity); }
    pulseCapital(idValue, intensity = 'full') { this.map?.pulseCapital?.(idValue, intensity); }
  }

  class GameplayFeedbackController {
    constructor({ adapter, manager, animateHud = () => {}, reducedMotion = () => false } = {}) { this.adapter = adapter; this.manager = manager; this.animateHud = animateHud; this.reducedMotion = reducedMotion; }
    intensity(config = {}) {
      if (this.manager?.data.settings.answerEffects === 'off') return 'off';
      if (this.manager?.data.settings.answerEffects === 'reduced' || this.reducedMotion()) return 'minimal';
      if (config.family === 'conquest') return config.variant === 'relaxed' ? 'full' : config.variant === 'continent' || config.variant === 'sprint' ? 'subtle' : 'minimal';
      if (Number(config.questionTime) <= 10 || ['hard', 'expert'].includes(config.difficulty)) return 'minimal';
      if (Number(config.questionTime) <= 15 || config.difficulty === 'medium') return 'subtle';
      return 'full';
    }
    correct(countryId, config, state) {
      const intensity = this.intensity(config); if (intensity === 'off') this.adapter?.markCountry(countryId); else { this.adapter?.flashCountry(countryId, intensity); if (config.family === 'capital') this.adapter?.pulseCapital(countryId, intensity); }
      this.animateHud('counter', intensity); if ([5, 10, 20, 40].includes(Number(state?.streak))) this.animateHud('streak', intensity);
    }
  }

  class ProfileUI {
    constructor(root, manager, { beforeSwitch = async () => {}, onActiveChange = () => {} } = {}) { this.root = root; this.manager = manager; this.beforeSwitch = beforeSwitch; this.onActiveChange = onActiveChange; this.view = 'profile'; this.manager.onChange(active => { this.render(active); this.onActiveChange(active); }); }
    mount() {
      const header = this.root.querySelector('.platform-header');
      header?.insertAdjacentHTML('beforeend', '<button id="profileChip" class="profile-chip" type="button" aria-haspopup="dialog"><span id="profileAvatar" class="profile-avatar">P</span><span id="profileChipName">Create player</span><span aria-hidden="true">⌄</span></button>');
      this.root.insertAdjacentHTML('beforeend', `<dialog id="profileDialog" class="profile-dialog" aria-labelledby="profileDialogTitle"><div class="profile-dialog-content"><div class="profile-dialog-header"><div><p class="eyebrow">PLAYER MEMORY</p><h2 id="profileDialogTitle">Your profile</h2></div><button id="profileClose" type="button" class="profile-icon-button" aria-label="Close profile">×</button></div><p id="profileStatus" class="profile-status" role="status"></p><section id="profileView" class="profile-view"><div class="profile-hero"><div id="profileLargeAvatar" class="profile-large-avatar">P</div><div><h3 id="profileNickname"></h3><p id="profileRealName"></p><p id="profileMemberSince" class="profile-muted"></p></div></div><div id="profileLifetime" class="profile-stat-grid"></div><div class="profile-mastery"><div><span>Countries</span><strong id="profileCountryMastery">0</strong></div><div><span>Capitals</span><strong id="profileCapitalMastery">0</strong></div></div><div><h3 class="profile-section-title">Modes</h3><div id="profileModes" class="profile-mode-grid"></div></div><div id="profileCodeBox" class="profile-code-box"></div><div class="profile-actions"><button id="profileEdit" type="button">Edit profile</button><button id="profileSwitch" type="button">Switch player</button><button id="profileAdd" type="button">Add player</button><button id="profileRecover" type="button">Recover player</button><button id="profileSettings" type="button">Settings</button></div><button id="profileRemove" type="button" class="profile-danger-link">Remove from this device</button><button id="profileDelete" type="button" class="profile-danger-link">Delete player permanently</button></section><section id="profileCreateView" class="profile-view" hidden><h3>Create Player</h3><p class="profile-muted">Your nickname is what other players will see.</p><form id="profileCreateForm" class="profile-form"><label>Your name<input name="realName" autocomplete="name" maxlength="80" required></label><label>Nickname<input name="nickname" autocomplete="nickname" maxlength="24" minlength="2" required></label><label>Recovery PIN <span>(optional)</span><input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" type="password" placeholder="6 digits"></label><p class="profile-form-error" id="profileCreateError"></p><button type="submit" class="primary-button">CREATE PLAYER</button></form></section><section id="profileSwitchView" class="profile-view" hidden><h3>Switch player</h3><div id="profileList" class="profile-list"></div><button id="profileSwitchAdd" type="button">Add player</button></section><section id="profileRecoverView" class="profile-view" hidden><h3>Recover Player</h3><p class="profile-muted">Use the Player Code and six-digit PIN from that profile.</p><form id="profileRecoverForm" class="profile-form"><label>Player Code<input name="playerCode" autocapitalize="characters" placeholder="CM-7K4P-2M9Q" required></label><label>Recovery PIN<input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" type="password" required></label><p class="profile-form-error" id="profileRecoverError"></p><button type="submit" class="primary-button">RECOVER PLAYER</button></form></section><section id="profileSettingsView" class="profile-view" hidden><h3>Profile settings</h3><form id="profileEditForm" class="profile-form"><label>Your name<input name="realName" maxlength="80" required></label><label>Nickname<input name="nickname" maxlength="24" minlength="2" required></label><p class="profile-form-error" id="profileEditError"></p><button type="submit" class="primary-button">SAVE PROFILE</button></form><form id="profilePinForm" class="profile-form"><label>New recovery PIN<input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" type="password" required></label><p class="profile-form-error" id="profilePinError"></p><button type="submit">CHANGE PIN</button></form><label class="profile-setting-row">Answer effects<select id="profileEffects"><option value="normal">Normal</option><option value="reduced">Reduced</option><option value="off">Off</option></select></label><button id="profileBack" type="button">Back to profile</button></section></div></dialog>`);
      this.dialog = this.root.querySelector('#profileDialog'); this.bind(); this.render(this.manager.active);
    }
    bind() {
      const $ = idValue => this.root.querySelector(`#${idValue}`);
      $('profileChip')?.addEventListener('click', () => this.open(this.manager.active ? 'profile' : 'create'));
      $('profileClose')?.addEventListener('click', () => this.dialog.close());
      $('profileEdit')?.addEventListener('click', () => this.open('settings'));
      $('profileSettings')?.addEventListener('click', () => this.open('settings'));
      $('profileAdd')?.addEventListener('click', () => this.open('create'));
      $('profileSwitchAdd')?.addEventListener('click', () => this.open('create'));
      $('profileSwitch')?.addEventListener('click', () => this.open('switch'));
      $('profileRecover')?.addEventListener('click', () => this.open('recover'));
      $('profileBack')?.addEventListener('click', () => this.open('profile'));
      $('profileEffects')?.addEventListener('change', event => this.manager.setEffects(event.target.value));
      $('profileCreateForm')?.addEventListener('submit', event => { event.preventDefault(); this.submitCreate(new FormData(event.currentTarget)); });
      $('profileEditForm')?.addEventListener('submit', event => { event.preventDefault(); this.submitEdit(new FormData(event.currentTarget)); });
      $('profilePinForm')?.addEventListener('submit', event => { event.preventDefault(); this.submitPin(new FormData(event.currentTarget)); });
      $('profileRecoverForm')?.addEventListener('submit', event => { event.preventDefault(); this.submitRecover(new FormData(event.currentTarget)); });
      $('profileRemove')?.addEventListener('click', () => { if (window.confirm('Remove this player from this device? Their profile can still be recovered with the Player Code and PIN.')) this.manager.remove(this.manager.active?.id).then(() => this.open(this.manager.active ? 'profile' : 'create')); });
      $('profileDelete')?.addEventListener('click', () => { if (window.confirm('Delete this player permanently? Their profile will no longer be recoverable.')) this.manager.removePermanently(this.manager.active?.id).then(() => this.open(this.manager.active ? 'profile' : 'create')).catch(error => this.showError('profileEditError', error)); });
    }
    showError(idValue, error) { const element = this.root.querySelector(`#${idValue}`); if (element) element.textContent = error?.message || String(error); }
    clearErrors() { this.root.querySelectorAll('.profile-form-error').forEach(element => { element.textContent = ''; }); }
    async submitCreate(form) { this.clearErrors(); try { this.manager.create({ realName: form.get('realName'), nickname: form.get('nickname'), pin: form.get('pin') }); this.open('profile'); } catch (error) { this.showError('profileCreateError', error); } }
    async submitEdit(form) { this.clearErrors(); try { this.manager.update(this.manager.active.id, { realName: form.get('realName'), nickname: form.get('nickname') }); this.open('profile'); } catch (error) { this.showError('profileEditError', error); } }
    async submitPin(form) { this.clearErrors(); try { await this.manager.changePin(this.manager.active.id, form.get('pin')); this.open('profile'); } catch (error) { this.showError('profilePinError', error); } }
    async submitRecover(form) { this.clearErrors(); try { await this.manager.recover(form.get('playerCode'), form.get('pin')); this.open('profile'); } catch (error) { this.showError('profileRecoverError', error); } }
    async selectProfile(profileId) { try { await this.beforeSwitch(); this.manager.switchTo(profileId); this.open('profile'); } catch (error) { this.showError('profileStatus', error); } }
    open(view = 'profile') { this.view = view; this.clearErrors(); this.render(this.manager.active); if (!this.dialog.open) this.dialog.showModal(); }
    render(active) {
      if (!this.dialog) return;
      const $ = idValue => this.root.querySelector(`#${idValue}`), views = { profile: $('profileView'), create: $('profileCreateView'), switch: $('profileSwitchView'), recover: $('profileRecoverView'), settings: $('profileSettingsView') };
      Object.entries(views).forEach(([name, element]) => { if (element) element.hidden = this.view !== name; });
      $('profileDialogTitle').textContent = this.view === 'create' ? 'Create Player' : this.view === 'switch' ? 'Switch player' : this.view === 'recover' ? 'Recover Player' : this.view === 'settings' ? 'Profile settings' : 'Your profile';
      $('profileStatus').textContent = this.manager.syncState === 'syncing' ? 'Stats syncing…' : this.manager.syncState === 'offline' ? 'Playing offline. Stats will sync when the connection returns.' : '';
      $('profileAvatar').textContent = active?.initials || 'P'; $('profileChipName').textContent = active?.nickname || 'Create player'; $('profileLargeAvatar').textContent = active?.initials || 'P';
      if (!active) return;
      $('profileNickname').textContent = active.nickname; $('profileRealName').textContent = active.realName; $('profileMemberSince').textContent = active.createdAt ? `Member since ${new Date(active.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}` : '';
      const stats = active.stats || emptyStats(); const metricValues = [['Lifetime Finds', stats.lifetimeCorrect], ['Games Played', stats.gamesStarted], ['Accuracy', `${Number(stats.accuracy || 0).toFixed(1)}%`], ['Longest Streak', stats.longestStreak], ['Best Run', stats.bestSessionCorrect], ['Play Time', formatDuration(stats.lifetimePlayTimeMs)]];
      $('profileLifetime').replaceChildren(...metricValues.map(([label, value]) => { const box = document.createElement('div'), strong = document.createElement('strong'), span = document.createElement('span'); strong.textContent = value; span.textContent = label; box.append(strong, span); return box; }));
      $('profileCountryMastery').textContent = `${active.mastery?.countries?.length || 0} / 195`; $('profileCapitalMastery').textContent = `${active.mastery?.capitals?.length || 0} / 195`;
      const modes = Object.entries(active.modeStats || {}); $('profileModes').replaceChildren(...(modes.length ? modes : [['No rounds yet', { correct: 0, gamesStarted: 0 }]]).map(([mode, value]) => { const card = document.createElement('div'); card.className = 'profile-mode-card'; const title = document.createElement('strong'); title.textContent = mode === 'No rounds yet' ? mode : mode.split(':').map(part => part[0].toUpperCase() + part.slice(1)).join(' · '); const detail = document.createElement('span'); detail.textContent = mode === 'No rounds yet' ? 'Start a round to build your memory.' : `${value.correct || 0} correct · ${value.accuracy ? Number(value.accuracy).toFixed(1) : '0.0'}% accuracy`; card.append(title, detail); return card; }));
      const codeBox = $('profileCodeBox'); codeBox.replaceChildren(); if (active.playerCode) { const label = document.createElement('span'); label.textContent = 'Player Code'; const code = document.createElement('strong'); code.textContent = active.playerCode; const note = document.createElement('small'); note.textContent = 'Keep this with your six-digit PIN for recovery.'; const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy code'; copy.addEventListener('click', async () => { try { await navigator.clipboard?.writeText(active.playerCode); copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy code'; }, 1400); } catch { copy.textContent = active.playerCode; } }); codeBox.append(label, code, note, copy); } else { codeBox.textContent = 'Add a recovery PIN in Settings to create a Player Code.'; }
      $('profileEditForm')?.elements.realName && ($('profileEditForm').elements.realName.value = active.realName); $('profileEditForm')?.elements.nickname && ($('profileEditForm').elements.nickname.value = active.nickname); $('profileEffects').value = this.manager.data.settings.answerEffects;
      $('profileList').replaceChildren(...this.manager.profiles.map(profile => { const button = document.createElement('button'); button.type = 'button'; button.className = `profile-list-item${profile.id === active.id ? ' selected' : ''}`; button.disabled = profile.id === active.id; const avatar = document.createElement('span'); avatar.className = 'profile-avatar'; avatar.textContent = profile.initials; const name = document.createElement('span'); name.textContent = profile.nickname; button.append(avatar, name); button.addEventListener('click', () => this.selectProfile(profile.id)); return button; }));
    }
  }

  function formatDuration(milliseconds) { const total = Math.max(0, Math.floor(Number(milliseconds || 0) / 1000)); const hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60); return hours ? `${hours}h ${minutes}m` : `${minutes}m`; }

  return { EFFECTS, ProfileService, ProfileManager, StatsSyncQueue, GameTracker, MapFeedbackAdapter, GameplayFeedbackController, ProfileUI, validateProfileFields, initialsFor, emptyStats, formatDuration, UUID_RE };
});
