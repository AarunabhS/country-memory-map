const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function loadInteractions() {
  const source = fs.readFileSync('src/root-interactions.js', 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Date.now()}-${Math.random()}`);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test('only Explore and Countries authorize root country-click answers', async () => {
  const { modeAllowsCountryClickAnswer } = await loadInteractions();
  assert.equal(modeAllowsCountryClickAnswer('Explore'), true);
  assert.equal(modeAllowsCountryClickAnswer('Countries'), true);
  for (const mode of ['Capitals', 'Flag Sprint', 'World Conquest', 'Play with Friends', 'Future Mode', undefined]) {
    assert.equal(modeAllowsCountryClickAnswer(mode), false, String(mode));
  }
});

test('an inactive cinematic renderer cannot submit a country answer', async () => {
  const { createCountryClickHandler } = await loadInteractions();
  const submissions = [];
  const handler = createCountryClickHandler({
    getMode: () => 'Explore',
    isActive: () => false,
    prepareChecker: async () => ({ mode: 'free-map' }),
    submitCountry: (_checker, name) => submissions.push(name),
  });
  assert.equal((await handler({ id: 'IND-1', name: 'India' })).status, 'inactive');
  assert.deepEqual(submissions, []);
});

test('Explore and Countries each submit one country while non-answering modes submit none', async () => {
  const { createCountryClickHandler } = await loadInteractions();
  for (const mode of ['Explore', 'Countries', 'Capitals', 'Flag Sprint', 'World Conquest', 'Play with Friends', 'Future Mode']) {
    const submissions = [];
    const handler = createCountryClickHandler({
      getMode: () => mode,
      prepareChecker: async () => ({ mode: 'free-map' }),
      submitCountry: (checker, name) => submissions.push({ checker, name }),
    });
    const result = await handler({ id: 'IND-1', name: 'India' });
    assert.equal(submissions.length, ['Explore', 'Countries'].includes(mode) ? 1 : 0, mode);
    assert.equal(result.status, ['Explore', 'Countries'].includes(mode) ? 'submitted' : 'non-answering', mode);
  }
});

test('a second answer-producing click is ignored while checker preparation is unresolved', async () => {
  const { createCountryClickHandler } = await loadInteractions();
  const preparation = deferred();
  const submissions = [];
  const handler = createCountryClickHandler({
    getMode: () => 'Explore',
    prepareChecker: () => preparation.promise,
    submitCountry: (checker, name) => submissions.push({ checker, name }),
  });

  const first = handler({ id: 'IND-1', name: 'India' });
  const second = await handler({ id: 'BRA-1', name: 'Brazil' });
  assert.equal(second.status, 'busy');
  preparation.resolve({ mode: 'free-map' });
  assert.equal((await first).status, 'submitted');
  assert.deepEqual(submissions.map(item => item.name), ['India']);

  const laterRepeat = await handler({ id: 'IND-1', name: 'India' });
  assert.equal(laterRepeat.status, 'submitted');
  assert.deepEqual(submissions.map(item => item.name), ['India', 'India']);
});

test('mode change during checker preparation cancels the pending country answer', async () => {
  const { createCountryClickHandler } = await loadInteractions();
  const preparation = deferred();
  const submissions = [];
  const cleared = [];
  let mode = 'Countries';
  const handler = createCountryClickHandler({
    getMode: () => mode,
    prepareChecker: () => preparation.promise,
    submitCountry: (checker, name) => submissions.push({ checker, name }),
    clearSelection: id => cleared.push(id),
  });

  const pending = handler({ id: 'IND-1', name: 'India' });
  mode = 'Capitals';
  preparation.resolve({ mode: 'free-map' });
  assert.equal((await pending).status, 'cancelled');
  assert.equal(submissions.length, 0);
  assert.deepEqual(cleared, ['IND-1']);
});

test('retained bridge activates Free Map before submitting to its checker', async () => {
  const { activateRetainedFreeMap, submitRetainedFreeMapGuess } = await loadInteractions();
  const order = [];
  let state = { state: 'setup' };
  const host = {
    openFreeMap: ({ checker }) => { order.push(`free-map:${checker}`); state = { state: 'free-map', checker }; },
    getLifecycleState: () => state,
    submitFreeMapGuess: ({ value, checker }) => { order.push(`submit:${checker}:${value}`); return { message: `Marked ${value}.`, kind: 'good', accepted: true }; },
  };
  const frameDocument = { defaultView: { CountryMemoryRetained: host } };

  activateRetainedFreeMap(frameDocument, { checker: 'countries' });
  const result = await submitRetainedFreeMapGuess(frameDocument, 'India', { checker: 'countries' });
  assert.deepEqual(order, ['free-map:countries', 'submit:countries:India']);
  assert.deepEqual(result, { message: 'Marked India.', kind: 'good', accepted: true });
});

test('retained bridge waits until the existing Free Map control is fully wired', async () => {
  const { prepareRetainedFreeMap } = await loadInteractions();
  let attempts = 0;
  let time = 0;
  let state = { state: 'setup' };
  const frameDocument = { defaultView: {} };

  await prepareRetainedFreeMap(frameDocument, {
    checker: 'countries',
    timeoutMs: 100,
    retryMs: 10,
    now: () => time,
    delay: async milliseconds => {
      time += milliseconds;
      if (time >= 10) frameDocument.defaultView.CountryMemoryRetained = {
        openFreeMap: ({ checker }) => { attempts++; state = { state: 'free-map', checker }; },
        getLifecycleState: () => state,
        submitFreeMapGuess: () => ({ message: 'Marked India.' }),
      };
    },
  });
  assert.equal(attempts, 1);
});

test('checker preparation failure clears transient UI and produces no gameplay submission', async () => {
  const { createCountryClickHandler } = await loadInteractions();
  const submissions = [];
  const clearedSelections = [];
  const clearedInputs = [];
  const notifications = [];
  const handler = createCountryClickHandler({
    getMode: () => 'Explore',
    prepareChecker: async () => { throw new Error('checker unavailable'); },
    submitCountry: (checker, name) => submissions.push({ checker, name }),
    clearSelection: id => clearedSelections.push(id),
    clearInput: name => clearedInputs.push(name),
    notify: event => notifications.push(event),
  });

  const result = await handler({ id: 'IND-1', name: 'India' });
  assert.equal(result.status, 'error');
  assert.equal(submissions.length, 0);
  assert.deepEqual(clearedSelections, ['IND-1']);
  assert.deepEqual(clearedInputs, ['India']);
  assert.equal(notifications.at(-1).type, 'error');
});

test('retained bridge fails without a complete structured host contract', async () => {
  const { activateRetainedFreeMap, submitRetainedFreeMapGuess } = await loadInteractions();
  const incompleteDocument = { defaultView: { CountryMemoryRetained: { openFreeMap() {} } } };
  assert.throws(() => activateRetainedFreeMap(incompleteDocument), /Free Map checker is unavailable/);
  await assert.rejects(submitRetainedFreeMapGuess(incompleteDocument, 'India'), /answer engine is unavailable/);
});

test('typed form submission remains a single keyboard-equivalent checker submission', async () => {
  const { createTypedAnswerHandler } = await loadInteractions();
  const submissions = [];
  const disabled = [];
  let prevented = false;
  let cleared = 0;
  let focused = 0;
  const handler = createTypedAnswerHandler({
    getValue: () => ' India ',
    setDisabled: value => disabled.push(value),
    clearValue: () => { cleared++; },
    focus: () => { focused++; },
    submit: async value => submissions.push(value),
  });

  const result = await handler({ preventDefault: () => { prevented = true; }, key: 'Enter' });
  assert.equal(result.status, 'submitted');
  assert.equal(prevented, true);
  assert.deepEqual(submissions, ['India']);
  assert.deepEqual(disabled, [true, false]);
  assert.equal(cleared, 1);
  assert.equal(focused, 1);
});
