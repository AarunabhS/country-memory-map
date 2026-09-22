const { test } = require('node:test');
const assert = require('node:assert/strict');
const { VoiceInputController, alternativesFor } = require('../voice-input.js');

class FakeRecognition {
  constructor() {
    this.listeners = new Map();
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  emit(type, detail = {}) {
    this.listeners.get(type)?.(detail);
    this[`on${type}`]?.(detail);
  }
  start() { this.startCalls++; }
  stop() { this.stopCalls++; }
  abort() { this.abortCalls++; }
}

function result(alternatives, isFinal) {
  const value = alternatives.map(transcript => ({ transcript }));
  value.isFinal = isFinal;
  return value;
}

test('voice activation acknowledges immediately and cannot create parallel sessions', () => {
  const states = [];
  const controller = new VoiceInputController({ Recognition: FakeRecognition, onState: value => states.push(value.state) });
  assert.equal(controller.start(), true);
  assert.equal(controller.state, 'starting');
  assert.deepEqual(states, ['starting']);
  assert.equal(controller.start(), false);
  assert.equal(controller.recognition.startCalls, 1);
  controller.recognition.emit('start');
  assert.equal(controller.state, 'starting', 'service startup is not audio capture');
  controller.recognition.emit('audiostart');
  assert.equal(controller.state, 'listening');
  assert.equal(controller.stop(), true);
  assert.equal(controller.recognition.stopCalls, 1);
  controller.recognition.emit('end');
});

test('one press previews interim text and delivers one final answer exactly once', () => {
  const previews = [];
  const finals = [];
  const controller = new VoiceInputController({
    Recognition: FakeRecognition,
    onPreview: value => previews.push(value),
    onFinal: values => finals.push(values)
  });
  controller.start();
  const recognition = controller.recognition;
  recognition.emit('audiostart');
  recognition.emit('result', { resultIndex: 0, results: [result(['Ind'], false)] });
  const finalEvent = { resultIndex: 0, results: [result(['India', 'Indie'], true)] };
  recognition.emit('result', finalEvent);
  recognition.emit('result', finalEvent);
  recognition.emit('result', { resultIndex: 1, results: [finalEvent.results[0], result(['Brazil'], true)] });
  assert.deepEqual(previews, ['Ind']);
  assert.deepEqual(finals, [['India', 'Indie']]);
  assert.equal(recognition.stopCalls, 1);
  assert.equal(controller.state, 'idle');
});

test('cancelled starts suppress abort noise and a hung start recovers', () => {
  const errors = [];
  const states = [];
  const timers = [];
  const controller = new VoiceInputController({
    Recognition: FakeRecognition,
    startTimeout: 10,
    setTimer: fn => { timers.push(fn); return timers.length; },
    clearTimer() {},
    onState: value => states.push(value),
    onError: error => errors.push(error.code)
  });
  controller.start();
  const cancelledRecognition = controller.recognition;
  controller.abort();
  assert.equal(controller.state, 'idle');
  cancelledRecognition.emit('error', { error: 'aborted' });
  assert.deepEqual(errors, []);
  assert.equal(controller.state, 'idle');
  assert.equal(states.at(-1).reason, 'cancelled');
  controller.start();
  const stalledRecognition = controller.recognition;
  timers.at(-1)();
  assert.equal(controller.state, 'idle');
  stalledRecognition.emit('end');
  assert.equal(controller.state, 'idle');
  assert.deepEqual(errors, ['start-timeout']);
});

test('unsupported and throwing recognizers fail without trapping the control', () => {
  assert.equal(new VoiceInputController().supported, false);
  class ThrowingRecognition extends FakeRecognition { start() { throw new Error('busy'); } }
  const errors = [];
  const controller = new VoiceInputController({ Recognition: ThrowingRecognition, onError: error => errors.push(error.code) });
  assert.equal(controller.start(), false);
  assert.equal(controller.state, 'idle');
  assert.deepEqual(errors, ['start-failed']);
});

test('default config skips permission branch and starts recognition directly from click', () => {
  const states = [];
  const controller = new VoiceInputController({ Recognition: FakeRecognition, onState: s => states.push(s.state) });
  assert.equal(controller.microphoneReady, true);
  controller.start();
  assert.equal(controller.state, 'starting');
  assert.equal(controller.recognition.startCalls, 1);
  assert.deepEqual(states, ['starting']);
  controller.abort();
});

test('explicit requestMicrophone gates the first start behind a permission flow', async () => {
  let requests = 0, released = 0, grant;
  const states = [];
  const controller = new VoiceInputController({ Recognition: FakeRecognition,
    requestMicrophone: () => { requests++; return new Promise(resolve => { grant = resolve; }); },
    onState: state => states.push(state)
  });
  assert.equal(requests, 0);
  controller.start();
  assert.equal(requests, 1);
  assert.equal(controller.state, 'permission');
  assert.equal(controller.recognition.startCalls, 0);
  assert.equal(controller.start(), false);
  grant({ getTracks: () => [{ stop: () => released++ }] });
  await Promise.resolve();
  assert.equal(released, 1);
  assert.equal(controller.state, 'idle');
  assert.equal(states.at(-1).reason, 'permission-granted');
  assert.equal(controller.recognition.startCalls, 0);
  controller.start();
  assert.equal(controller.recognition.startCalls, 1);
  controller.abort();
});

test('cancel and timeout cannot start a microphone after a late permission grant', async () => {
  for (const cancel of [true, false]) {
    let grant, timeout, stopped = 0;
    const errors = [];
    const controller = new VoiceInputController({ Recognition: FakeRecognition,
      requestMicrophone: () => new Promise(resolve => { grant = resolve; }),
      setTimer: fn => { timeout = fn; return 1; }, clearTimer() {},
      onError: e => errors.push(e.code)
    });
    controller.start();
    if (cancel) controller.abort(); else timeout();
    grant({ getTracks: () => [{ stop: () => stopped++ }] });
    await Promise.resolve();
    assert.equal(stopped, 1);
    assert.equal(controller.state, 'idle');
    assert.equal(controller.microphoneReady, false);
    assert.equal(controller.recognition.startCalls, 0);
    assert.deepEqual(errors, cancel ? [] : ['permission-timeout']);
  }
});

test('denied microphone permissions recover and silent recognition end reports failure', async () => {
  const errors = [];
  const controller = new VoiceInputController({ Recognition: FakeRecognition,
    requestMicrophone: () => Promise.reject({ name: 'NotAllowedError' }), onError: e => errors.push(e.code)
  });
  controller.start();
  await Promise.resolve();
  assert.equal(controller.state, 'idle');
  assert.deepEqual(errors, ['not-allowed']);
  const speech = new VoiceInputController({ Recognition: FakeRecognition, onError: e => errors.push(e.code) });
  speech.start();
  speech.recognition.emit('end');
  assert.equal(speech.state, 'idle');
  assert.equal(errors.at(-1), 'no-speech');
});

test('audio capture acknowledges listening even when the start event is missing', () => {
  const controller = new VoiceInputController({ Recognition: FakeRecognition });
  controller.start();
  controller.recognition.emit('audiostart');
  assert.equal(controller.state, 'listening');
  controller.abort();
});

test('leaving a game rejects late speech results even after a new microphone session starts', () => {
  const finals=[];
  const voice=new VoiceInputController({Recognition:FakeRecognition,onFinal:values=>finals.push(values)});
  voice.start();
  const old=voice.recognition;
  old.emit('start');
  voice.abort();
  old.emit('result',{results:[result(['India'],true)]});
  assert.deepEqual(finals,[]);
  voice.start();
  old.emit('result',{results:[result(['Brazil'],true)]});
  voice.recognition.emit('start');
  voice.recognition.emit('result',{results:[result(['France'],true)]});
  assert.deepEqual(finals,[['France']]);
  voice.abort();
});

test('pre-granted navigator permission sets microphoneReady to true immediately', async () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        mediaDevices: { getUserMedia: () => Promise.resolve() },
        permissions: {
          query: ({ name }) => Promise.resolve({ state: name === 'microphone' ? 'granted' : 'prompt' })
        }
      },
      configurable: true
    });
    const controller = new VoiceInputController({
      Recognition: FakeRecognition,
      requestMicrophone: () => Promise.resolve()
    });
    assert.equal(controller.microphoneReady, false);
    await Promise.resolve();
    assert.equal(controller.microphoneReady, true);
    controller.start();
    assert.equal(controller.state, 'starting');
    assert.equal(controller.recognition.startCalls, 1);
    controller.abort();
  } finally {
    if (originalDescriptor) Object.defineProperty(globalThis, 'navigator', originalDescriptor);
  }
});

test('permissionStatus onchange dynamically updates microphoneReady state', async () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    const currentStatus = { state: 'prompt', onchange: null };
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        mediaDevices: { getUserMedia: () => Promise.resolve() },
        permissions: {
          query: () => Promise.resolve(currentStatus)
        }
      },
      configurable: true
    });
    const controller = new VoiceInputController({
      Recognition: FakeRecognition,
      requestMicrophone: () => Promise.resolve({ getTracks: () => [] })
    });
    assert.equal(controller.microphoneReady, false);
    await Promise.resolve();
    assert.equal(controller.microphoneReady, false);
    currentStatus.state = 'granted';
    currentStatus.onchange?.();
    assert.equal(controller.microphoneReady, true);
    currentStatus.state = 'denied';
    currentStatus.onchange?.();
    assert.equal(controller.microphoneReady, false);
  } finally {
    if (originalDescriptor) Object.defineProperty(globalThis, 'navigator', originalDescriptor);
  }
});

test('interim results deliver as final answer when engine ends without explicit isFinal', () => {
  const finals = [];
  const errors = [];
  const controller = new VoiceInputController({
    Recognition: FakeRecognition,
    onFinal: val => finals.push(val),
    onError: err => errors.push(err.code)
  });
  controller.start();
  controller.recognition.emit('start');
  controller.recognition.emit('result', { resultIndex: 0, results: [result(['Germany'], false)] });
  controller.recognition.emit('end');
  assert.deepEqual(finals, [['Germany']]);
  assert.deepEqual(errors, []);
  assert.equal(controller.state, 'idle');
});

test('alternativesFor handles item() method, iterator, and single transcript fallback', () => {
  assert.deepEqual(alternativesFor(null), []);
  assert.deepEqual(alternativesFor({ length: 0 }), []);
  const itemBased = { length: 2, item: i => (i === 0 ? { transcript: ' France ' } : { transcript: 'Paris' }) };
  assert.deepEqual(alternativesFor(itemBased), ['France', 'Paris']);
  const single = { transcript: 'Spain' };
  assert.deepEqual(alternativesFor(single), ['Spain']);
});

test('setTimer and clearTimer are invoked safely without illegal invocation', () => {
  const strictTimer = function() {
    if (this && this.constructor && this.constructor.name === 'VoiceInputController') {
      throw new TypeError('Illegal invocation');
    }
    return 123;
  };
  const strictClear = function() {
    if (this && this.constructor && this.constructor.name === 'VoiceInputController') {
      throw new TypeError('Illegal invocation');
    }
  };
  const controller = new VoiceInputController({
    Recognition: FakeRecognition,
    setTimer: strictTimer,
    clearTimer: strictClear
  });
  assert.doesNotThrow(() => {
    controller.start();
  });
  assert.doesNotThrow(() => {
    controller.abort();
  });
});
function timedVoice(options = {}) {
  let nextId = 0;
  const timers = new Map();
  const events = { states: [], finals: [], previews: [], errors: [] };
  const controller = new VoiceInputController({
    Recognition: FakeRecognition,
    setTimer: (fn, ms) => { timers.set(++nextId, { fn, ms }); return nextId; },
    clearTimer: id => timers.delete(id),
    onState: value => events.states.push(value),
    onFinal: value => events.finals.push(value),
    onPreview: value => events.previews.push(value),
    onError: value => events.errors.push(value.code),
    ...options
  });
  const expire = () => {
    assert.equal(timers.size, 1);
    const [id, timer] = timers.entries().next().value;
    timers.delete(id);
    timer.fn();
  };
  return { controller, timers, events, expire };
}

test('start without audio capture stays cancellable and still times out', () => {
  const { controller: voice, timers, events, expire } = timedVoice();
  voice.start();
  const old = voice.recognition;
  old.emit('start');
  assert.equal(voice.state, 'starting');
  expire();
  assert.equal(old.abortCalls, 1);
  assert.equal(voice.state, 'idle');
  old.emit('audiostart');
  old.emit('result', { results: [result(['India'], true)] });
  assert.deepEqual(events.finals, []);
  assert.deepEqual(events.errors, ['start-timeout']);
  assert.equal(timers.size, 0);
});

test('speech end requests finalization and retains corrected multiword alternatives', () => {
  const { controller: voice, timers, events } = timedVoice();
  voice.start();
  const speech = voice.recognition;
  speech.emit('audiostart');
  speech.emit('result', { results: [result(['United'], false)] });
  assert.deepEqual(events.finals, []);
  speech.emit('result', { results: [result(['United King'], false)] });
  speech.emit('speechend');
  speech.emit('audioend');
  assert.equal(speech.stopCalls, 1);
  assert.equal(voice.state, 'processing');
  assert.equal(voice.start(), false);
  assert.deepEqual(events.finals, []);
  speech.emit('result', { results: [result(['United Kingdom', 'United kingdoms'], true)] });
  assert.deepEqual(events.finals, [['United Kingdom', 'United kingdoms']]);
  assert.equal(voice.active, false);
  assert.equal(timers.size, 0);
});

test('next press starts immediately after a final; late end and errors cannot reset it', () => {
  const { controller: voice, events, timers } = timedVoice();
  voice.start();
  const old = voice.recognition;
  old.emit('result', { results: [result(['India'], true)] });
  assert.equal(voice.start(), true);
  const current = voice.recognition;
  assert.notEqual(current, old);
  assert.equal(current.startCalls, 1);
  old.emit('end');
  old.emit('error', { error: 'aborted' });
  old.emit('result', { results: [result(['Brazil'], true)] });
  assert.equal(voice.state, 'starting');
  current.emit('result', { results: [result(['France'], true)] });
  assert.deepEqual(events.finals, [['India'], ['France']]);
  assert.deepEqual(events.errors, []);
  assert.equal(timers.size, 0);
});

test('silent listening and missing final/end events release the microphone without scoring partial speech', () => {
  for (const phase of ['listening', 'interim', 'processing']) {
    const { controller: voice, events, timers, expire } = timedVoice();
    voice.start();
    const speech = voice.recognition;
    speech.emit('audiostart');
    if (phase !== 'listening') speech.emit('result', { results: [result(['United'], false)] });
    if (phase === 'processing') speech.emit('speechend');
    expire();
    assert.equal(voice.state, 'idle');
    assert.equal(speech.abortCalls, 1);
    assert.deepEqual(events.finals, []);
    assert.deepEqual(events.errors, ['recognition-timeout']);
    speech.emit('end');
    speech.emit('error', { error: 'aborted' });
    assert.equal(events.errors.length, 1);
    assert.equal(timers.size, 0);
    assert.equal(voice.start(), true);
    voice.abort();
  }
});

test('cancel while finalizing suppresses both final and fallback answers and clears timers', () => {
  const { controller: voice, events, timers } = timedVoice();
  voice.start();
  const speech = voice.recognition;
  speech.emit('result', { results: [result(['India'], false)] });
  speech.emit('speechend');
  voice.abort();
  speech.emit('result', { results: [result(['India'], true)] });
  speech.emit('end');
  assert.deepEqual(events.finals, []);
  assert.deepEqual(events.errors, []);
  assert.equal(timers.size, 0);
});

test('end fallback uses only current interim text and never a withdrawn result', () => {
  for (const withdrawal of [[], [result([], false)]]) {
    const { controller: voice, events } = timedVoice();
    voice.start();
    const speech = voice.recognition;
    speech.emit('result', { results: [result(['Georgia'], false)] });
    speech.emit('result', { results: withdrawal });
    speech.emit('end');
    assert.deepEqual(events.finals, []);
    assert.deepEqual(events.errors, ['no-speech']);
  }
});

test('IDL-only engines and item-based results retain one preview and one final', () => {
  class IDLRecognition extends FakeRecognition {
    constructor() { super(); this.addEventListener = undefined; }
  }
  const { controller: voice, events } = timedVoice({ Recognition: IDLRecognition });
  voice.start();
  const speech = voice.recognition;
  speech.emit('audiostart');
  speech.emit('result', { results: { length: 1, item: () => result(['New'], false) } });
  speech.emit('result', { results: { length: 1, item: () => result(['New Zealand'], true) } });
  assert.deepEqual(events.previews, ['New']);
  assert.deepEqual(events.finals, [['New Zealand']]);
});

test('errors dispatch once and synchronous abort events cannot overwrite the error', () => {
  class SyncAbort extends FakeRecognition {
    abort() { super.abort(); this.emit('error', { error: 'aborted' }); this.emit('end'); }
  }
  const { controller: voice, events, timers } = timedVoice({ Recognition: SyncAbort });
  voice.start();
  voice.recognition.emit('error', { error: 'not-allowed' });
  assert.deepEqual(events.errors, ['not-allowed']);
  assert.equal(voice.state, 'idle');
  assert.equal(timers.size, 0);
});

test('ten consecutive Canada answers each need one press even with delayed end events', () => {
  const { controller: voice, events, timers } = timedVoice();
  let previous;
  for (let attempt = 0; attempt < 10; attempt++) {
    assert.equal(voice.start(), true);
    const speech = voice.recognition;
    previous?.emit('end');
    previous?.emit('error', { error: 'aborted' });
    speech.emit('start');
    assert.equal(voice.state, 'starting');
    speech.emit('audiostart');
    speech.emit('result', { results: [result(['Canada'], false)] });
    assert.equal(events.finals.length, attempt);
    speech.emit('speechend');
    speech.emit('result', { results: [result(['Canada'], true)] });
    assert.equal(events.finals.length, attempt + 1);
    assert.equal(speech.startCalls, 1);
    assert.equal(voice.state, 'idle');
    previous = speech;
  }
  assert.deepEqual(events.finals, Array.from({ length: 10 }, () => ['Canada']));
  assert.deepEqual(events.errors, []);
  assert.equal(timers.size, 0);
});

test('explicit graceful stop still allows the browser final, while abort discards it', () => {
  const { controller: voice, events, timers } = timedVoice();
  voice.start();
  const speech = voice.recognition;
  speech.emit('audiostart');
  voice.stop();
  speech.emit('result', { results: [result(['Canada'], true)] });
  assert.deepEqual(events.finals, [['Canada']]);
  assert.equal(timers.size, 0);
});
