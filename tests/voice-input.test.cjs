const { test } = require('node:test');
const assert = require('node:assert/strict');
const { VoiceInputController } = require('../voice-input.js');

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
