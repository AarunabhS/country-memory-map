const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('game-shell.js', 'utf8');

// Run the complete production adapter. Only DOM/event surfaces are substituted;
// availability and expansion state remain owned by its real mounted handlers.
class Element extends EventTarget {
  constructor() {
    super();
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    const classes = new Set();
    this.classList = {
      add: value => classes.add(value),
      contains: value => classes.has(value),
      toggle(value, enabled) {
        const next = enabled === undefined ? !classes.has(value) : enabled;
        if (next) classes.add(value); else classes.delete(value);
        return next;
      },
    };
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  toggleAttribute(name, enabled) {
    if (enabled) this.setAttribute(name, ''); else this.attributes.delete(name);
  }
  prepend(child) { this.children.unshift(child); }
  click() { this.dispatchEvent(new Event('click')); }
}

function harness({ desktop = true, page = 'game' } = {}) {
  const root = new Element(), button = new Element(), stage = new Element(), input = new Element();
  root.dataset.page = page;
  const elements = new Map([
    ['#mapExpandButton', button],
    ['.map-shell, #flagGameView', stage],
    ['#guessInput', input],
  ]);
  root.querySelector = selector => elements.get(selector) ?? null;
  const media = new EventTarget();
  media.matches = desktop;
  const observers = [];
  let mediaQueries = 0;
  const window = { matchMedia() { mediaQueries++; return media; } };
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target, options) { this.target = target; this.options = options; }
  }
  vm.runInNewContext(source, { window, document: { createElement: () => new Element() }, MutationObserver });
  const render = (display = {}, callbacks = {}) => window.GameShell.render({
    root, display: { phase: 'playing', family: 'find', stage: 'map-answer', ...display }, callbacks,
  });
  return {
    root, button, input, render, shell: window.GameShell, observers,
    mediaQueries: () => mediaQueries,
    setDesktop(matches) { media.matches = matches; media.dispatchEvent(new Event('change')); },
    setPage(value) {
      root.dataset.page = value;
      for (const observer of observers) {
        if (observer.target === root) observer.callback([{ target: root, type: 'attributes', attributeName: 'data-page' }]);
      }
    },
  };
}

test('map expansion is available for active map views, not setup or non-map games', () => {
  for (const [display, available] of [
    [{ phase: 'playing', stage: 'map-answer' }, true],
    [{ phase: 'feedback', stage: 'map' }, true],
    [{ phase: 'free-map', stage: 'map' }, true],
    [{ phase: 'free-map', stage: 'flag' }, true],
    [{ phase: 'free-map', stage: 'quiz' }, true],
    [{ phase: 'setup', stage: 'map' }, false],
    [{ phase: 'countdown', stage: 'map-answer' }, false],
    [{ phase: 'results', stage: 'map' }, false],
    [{ phase: 'playing', stage: 'flag' }, false],
    [{ phase: 'playing', stage: 'quiz' }, false],
  ]) {
    const h = harness();
    h.render(display);
    assert.equal(h.button.hidden, !available, JSON.stringify(display));
    assert.equal(h.button.getAttribute('aria-pressed'), 'false');
  }
  const mobile = harness({ desktop: false });
  mobile.render();
  assert.equal(mobile.button.hidden, true);
});

test('expanding and restoring are reversible and never invoke controller actions', () => {
  const h = harness(), calls = [];
  const callbacks = Object.fromEntries(['home', 'endGame', 'submitAnswer', 'resetZoom'].map(name => [name, () => calls.push(name)]));
  h.render({}, callbacks);
  assert.equal(h.button.textContent, 'Expand map');
  h.button.click();
  assert.equal(h.root.classList.contains('map-expanded'), true);
  assert.equal(h.button.getAttribute('aria-pressed'), 'true');
  assert.equal(h.button.textContent, 'Restore layout');
  h.button.click();
  assert.equal(h.root.classList.contains('map-expanded'), false);
  assert.equal(h.button.getAttribute('aria-pressed'), 'false');
  assert.equal(h.button.textContent, 'Expand map');
  assert.deepEqual(calls, []);
});

test('question and feedback rerenders preserve the chosen expanded layout', () => {
  const h = harness();
  h.render({ answerDescription: 'Find India' });
  h.button.click();
  h.render({ phase: 'feedback', answerDescription: 'Correct' });
  h.render({ answerDescription: 'Find Brazil' });
  assert.equal(h.input.getAttribute('aria-description'), 'Find Brazil');
  assert.equal(h.root.classList.contains('map-expanded'), true);
  assert.equal(h.button.getAttribute('aria-pressed'), 'true');
  assert.equal(h.button.hidden, false);
});

test('Explore can expand after a flag or quiz game leaves its previous stage metadata', () => {
  for (const stage of ['flag', 'quiz']) {
    const h = harness();
    h.render({ family: stage, stage });
    assert.equal(h.button.hidden, true, stage);
    h.render({ phase: 'free-map', family: stage, stage });
    assert.equal(h.button.hidden, false, stage);
    h.button.click();
    assert.equal(h.root.classList.contains('map-expanded'), true, stage);
    assert.equal(h.button.getAttribute('aria-pressed'), 'true', stage);
    h.render({ phase: 'free-map', family: stage, stage });
    assert.equal(h.root.classList.contains('map-expanded'), true, stage);
    h.button.click();
    assert.equal(h.root.classList.contains('map-expanded'), false, stage);
  }
});

test('results, non-map views and Home clear expansion without restoring it on return', () => {
  for (const leave of [
    h => h.render({ phase: 'results' }),
    h => h.render({ stage: 'flag' }),
    h => h.render({ stage: 'quiz' }),
    h => h.setPage('home'),
  ]) {
    const h = harness();
    h.render(); h.button.click();
    leave(h);
    assert.equal(h.root.classList.contains('map-expanded'), false);
    assert.equal(h.button.hidden, true);
    assert.equal(h.button.getAttribute('aria-pressed'), 'false');
    h.setPage('game'); h.render();
    assert.equal(h.root.classList.contains('map-expanded'), false);
    assert.equal(h.button.hidden, false);
  }
});

test('leaving the desktop media range restores the normal layout and clears the preference', () => {
  const h = harness();
  h.render(); h.button.click();
  h.setDesktop(false);
  assert.equal(h.root.classList.contains('map-expanded'), false);
  assert.equal(h.button.hidden, true);
  assert.equal(h.button.getAttribute('aria-pressed'), 'false');
  h.setDesktop(true);
  assert.equal(h.button.hidden, false);
  assert.equal(h.root.classList.contains('map-expanded'), false);
  assert.equal(h.button.textContent, 'Expand map');
});

test('repeated mounting installs one expansion control and one page observer', () => {
  const h = harness();
  h.shell.mount(h.root); h.shell.mount(h.root); h.render(); h.shell.mount(h.root);
  assert.equal(h.root.children.length, 1);
  assert.equal(h.observers.length, 1);
  assert.equal(h.mediaQueries(), 1);
  h.button.click();
  assert.equal(h.root.classList.contains('map-expanded'), true);
  h.setPage('home');
  assert.equal(h.root.classList.contains('map-expanded'), false);
});
