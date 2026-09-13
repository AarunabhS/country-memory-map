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
  emit(type, detail = {}) { this.listeners.get(type)?.(detail); }
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
  assert.equal(controller.state, 'listening');
  assert.equal(controller.stop(), true);
  assert.equal(controller.recognition.stopCalls, 1);
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
  controller.recognition.emit('start');
  controller.recognition.emit('result', { resultIndex: 0, results: [result(['Ind'], false)] });
  const finalEvent = { resultIndex: 0, results: [result(['India', 'Indie'], true)] };
  controller.recognition.emit('result', finalEvent);
  controller.recognition.emit('result', finalEvent);
  controller.recognition.emit('result', { resultIndex: 1, results: [finalEvent.results[0], result(['Brazil'], true)] });
  assert.deepEqual(previews, ['Ind']);
  assert.deepEqual(finals, [['India', 'Indie']]);
  assert.equal(controller.recognition.stopCalls, 1);
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

