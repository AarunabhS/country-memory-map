const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { VoiceInputController } = require('../voice-input.js');

// Exercise the actual shared Speak wiring used by Explore, solo and rooms.
const source = fs.readFileSync('src/world-map-runtime.js', 'utf8');
const wiring = source.slice(source.indexOf('    function stopVoiceInput('), source.indexOf('    function createLegend('));
function harness(game = true) {
  const timers = new Map(), classes = new Set(), attributes = new Map(), answers = [], guesses = [], dialogs = [];
  let id = 0;
  class Speech {
    constructor() { this.events = new Map(); this.starts = 0; }
    addEventListener(type, fn) { this.events.set(type, fn); }
    emit(type, detail) { this.events.get(type)?.(detail); this[`on${type}`]?.(detail); }
    start() { this.starts++; }
    stop() {}
    abort() { this.emit('error', { error: 'aborted' }); }
  }
  const context = {
    recognition: null, isListening: false, quizMode: 'countries', input: { value: '' },
    voiceButton: {
      textContent: 'Speak',
      classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) },
      setAttribute: (key, value) => attributes.set(key, value)
    },
    window: {
      SpeechRecognition: Speech, CountryMemoryVoice: { VoiceInputController }, isSecureContext: true,
      setTimeout: (fn, ms) => { timers.set(++id, { fn, ms }); return id; }, clearTimeout: key => timers.delete(key),
      gameController: { previewVoice: () => game, handleVoice: values => { if (game) answers.push(values); return game; } }
    },
    navigator: { language: 'en-IN' }, location: { protocol: 'https:', hostname: 'example.test' },
    setMessage: (text, type) => { context.feedback = { text, type }; },
    showVoiceDialog: detail => dialogs.push(detail),
    countryAnswerValidator: { resolve: value => value === 'India' }, capitalByAlias: new Map([['New Delhi', true]]),
    normalize: value => value, handleGuess: value => guesses.push(value),
    message: { classList: { contains: () => false } }, focusInput() {}
  };
  vm.createContext(context);
  vm.runInContext(wiring, context);
  context.setupVoiceInput();
  return { context, classes, attributes, answers, guesses, dialogs, timers };
}
function transcript(text, isFinal = true) {
  const result = [{ transcript: text }]; result.isFinal = isFinal;
  return { results: [result], resultIndex: 0 };
}

test('Speak shows startup until capture, then processing, then resets before browser end', () => {
  const h = harness(), c = h.context;
  c.startVoiceInput();
  const speech = c.recognition.recognition;
  assert.equal(speech.starts, 1, 'start remains synchronous in the click');
  assert.equal(c.voiceButton.textContent, 'Starting…');
  assert.equal(h.attributes.get('aria-busy'), 'true');
  assert.equal(h.attributes.get('aria-pressed'), 'true');
  assert.equal(h.classes.has('listening'), false);
  assert.match(c.feedback.text, /wait for Listening/);
  speech.emit('start');
  assert.equal(c.voiceButton.textContent, 'Starting…');
  speech.emit('audiostart');
  assert.equal(c.voiceButton.textContent, '● Listening');
  assert.equal(h.attributes.get('aria-busy'), 'false');
  speech.emit('result', transcript('Ind', false));
  assert.equal(c.input.value, 'Ind');
  assert.deepEqual(h.answers, []);
  speech.emit('speechend');
  assert.equal(c.voiceButton.textContent, 'Finishing…');
  speech.emit('result', transcript('India'));
  assert.deepEqual(h.answers, [['India']]);
  assert.equal(c.voiceButton.textContent, 'Speak');
  assert.equal(h.attributes.get('aria-busy'), 'false');
  assert.equal(h.attributes.get('aria-pressed'), 'false');
  assert.equal(h.classes.size, 0);
  c.startVoiceInput();
  assert.equal(c.recognition.recognition.starts, 1);
  speech.emit('end');
  assert.equal(c.voiceButton.textContent, 'Starting…');
  c.stopVoiceInput();
  assert.equal(h.timers.size, 0);
});

test('second click cancels startup and processing without submitting speech', () => {
  for (const processing of [false, true]) {
    const h = harness(), c = h.context;
    c.startVoiceInput();
    const speech = c.recognition.recognition;
    if (processing) { speech.emit('result', transcript('India', false)); speech.emit('speechend'); }
    c.startVoiceInput();
    speech.emit('result', transcript('India'));
    speech.emit('end');
    assert.deepEqual(h.answers, []);
    assert.equal(c.voiceButton.textContent, 'Speak');
    assert.match(c.feedback.text, /Microphone stopped/);
    assert.equal(h.timers.size, 0);
  }
});

test('timeout retains editable text and restores the Speak control', () => {
  const h = harness(), c = h.context;
  c.startVoiceInput();
  c.recognition.recognition.emit('result', transcript('United', false));
  assert.equal(h.timers.size, 1);
  h.timers.values().next().value.fn();
  assert.equal(c.input.value, 'United');
  assert.equal(c.voiceButton.textContent, 'Speak');
  assert.match(c.feedback.text, /Check any text above/);
  assert.deepEqual(h.answers, []);
});

test('Explore still sends country and capital alternatives through its existing checkers', () => {
  for (const [mode, name] of [['countries', 'India'], ['capitals', 'New Delhi']]) {
    const h = harness(false), c = h.context;
    c.quizMode = mode;
    c.startVoiceInput();
    c.recognition.recognition.emit('result', transcript(name));
    assert.deepEqual(h.guesses, [name]);
    assert.equal(c.input.value, '');
    assert.deepEqual(h.answers, []);
  }
});

test('permission errors show help once with iPhone Safari instructions', () => {
  const h = harness(), c = h.context;
  c.startVoiceInput();
  const speech = c.recognition.recognition;
  speech.emit('error', { error: 'not-allowed' });
  speech.emit('end');
  assert.equal(h.dialogs.length, 1);
  assert.match(h.dialogs[0].message, /iPhone Safari/);
  assert.equal(c.voiceButton.textContent, 'Speak');
  assert.equal(h.timers.size, 0);
});
