const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { AnswerValidator, Engine, TYPES, selectFlagOptions, normalize } = require('../game-core.js');
const countries = require('../scripts/load-game-data.cjs');

const root = path.join(__dirname, '..');
const idForIso = iso => countries.find(country => country.iso_code === iso).country_id;

function flagGame(config = {}) {
  let now = 1000;
  const events = [];
  const engine = new Engine(countries, { now: () => now, random: () => 0.37, onEvent: event => events.push(event) });
  engine.start({ family: 'flag', variant: 'recall', questionTime: 20, difficulty: 'medium', ...config });
  return { engine, events, advance(ms) { now += ms; engine.tick(); }, now(value) { now = value; } };
}

test('AnswerValidator normalizes Unicode, punctuation, whitespace and explicit country aliases', () => {
  const validator = new AnswerValidator(countries);
  assert.equal(normalize('  Côte\u00a0d’ Ivoire!!  '), 'cote d ivoire');
  const cases = [
    ['USA', 'USA'], ['US', 'USA'], ['United States of America', 'USA'],
    ['UK', 'GBR'], ['Britain', 'GBR'], ['Republic of Korea', 'KOR'], ['DPRK', 'PRK'],
    ['DR Congo', 'COD'], ['DRC', 'COD'], ['Czech Republic', 'CZE'], ['Côte d’Ivoire', 'CIV'],
    ['Ivory Coast', 'CIV'], ['Cape Verde', 'CPV'], ['Timor-Leste', 'TLS'], ['East Timor', 'TLS'],
    ['Burma', 'MMR'], ['Swaziland', 'SWZ'], ['Vatican', 'VAT'], ['Holy See', 'VAT']
  ];
  for (const [alias, iso] of cases) assert.equal(validator.resolve(alias)?.iso_code, iso, alias);
  assert.equal(validator.resolve('not a country'), null);
});

test('Flag Recall accepts aliases but never exposes an answer list in the question payload', () => {
  const { engine } = flagGame({ practiceIds: [idForIso('USA')] });
  const q = engine.state.currentQuestion;
  assert.equal(q.type, TYPES.FLAG_RECALL);
  assert.equal(q.flagCode, 'us');
  assert.equal(q.prompt, 'United States of America');
  assert.deepEqual(Object.keys(q).filter(key => /option|suggest/i.test(key)), []);
  engine.submitText('  United\u00a0States ');
  assert.equal(engine.state.correctAnswers, 1);
  assert.equal(engine.state.score, 130);
});

test('Flag Match keeps the correct answer exactly once and uses unique distractors', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const engine = new Engine(countries, { now: () => 1000, random: () => 0.41 });
    engine.start({ family: 'flag', variant: 'match', difficulty, questionTime: 20, practiceIds: ['USA', 'CAN', 'MEX', 'BLZ', 'FRA', 'GBR', 'BRA'].map(idForIso) });
    const q = engine.state.currentQuestion;
    assert.equal(q.type, TYPES.FLAG_MATCH);
    assert.equal(q.options.filter(id => id === q.countryId).length, 1, difficulty);
    assert.equal(new Set(q.options).size, q.options.length, difficulty);
    assert.ok(q.options.length <= 4 && q.options.length >= 4, difficulty);
  }
});

test('Flag Match keeps four cards for a small practice pool', () => {
  const engine = new Engine(countries, { now: () => 1000, random: () => 0.41 });
  engine.start({ family: 'flag', variant: 'match', difficulty: 'medium', questionTime: 20, practiceIds: [idForIso('NPL')] });
  const q = engine.state.currentQuestion;
  assert.equal(q.options.length, 4);
  assert.equal(q.options.filter(id => id === q.countryId).length, 1);
  assert.equal(new Set(q.options).size, 4);
});

test('Flag difficulty prioritizes a contrasting region, same region, or curated confusable flags', () => {
  const byIso = iso => countries.find(country => country.iso_code === iso);
  const target = byIso('USA');
  const pool = countries.filter(country => ['USA', 'CAN', 'MEX', 'BRA', 'FRA', 'GBR', 'JPN'].includes(country.iso_code));
  const easy = selectFlagOptions(pool, target, 'easy', () => 0.2).map(id => countries.find(c => c.country_id === id));
  const medium = selectFlagOptions(pool, target, 'medium', () => 0.2).map(id => countries.find(c => c.country_id === id));
  assert.ok(easy.filter(country => country.country_id !== target.country_id).every(country => country.continent !== target.continent));
  assert.ok(medium.filter(country => country.country_id !== target.country_id).filter(country => country.continent === target.continent).length >= 2);

  const chad = byIso('TCD');
  const confusablePool = countries.filter(country => ['TCD', 'ROU', 'FRA', 'JPN'].includes(country.iso_code));
  const hard = selectFlagOptions(confusablePool, chad, 'hard', () => 0.2);
  assert.ok(hard.includes(byIso('ROU').country_id));
});

test('Flag hints and wrong attempts are visible in the score model', () => {
  const { engine, events, advance } = flagGame({ practiceIds: ['USA', 'CAN', 'MEX', 'FRA'].map(idForIso), variant: 'match' });
  assert.equal(engine.state.score, 0);
  assert.equal(engine.useHint(), true);
  assert.equal(engine.state.score, -25);
  assert.equal(engine.state.hintsUsed, 1);
  assert.ok(events.some(event => event.type === 'hint' && event.penalty === 25));
  const q = engine.state.currentQuestion;
  const wrong = q.options.find(id => id !== q.countryId);
  engine.submitFlag(wrong);
  engine.submitFlag(q.options.find(id => id !== q.countryId && id !== wrong));
  assert.equal(engine.state.score, -100);
  engine.submitFlag(q.options.find(id => id !== q.countryId && id !== wrong));
  assert.ok(events.some(event => event.type === 'reveal'));
  advance(701);
  assert.equal(engine.state.questionNumber, 2);
});

test('All 195 playable entities have a local ISO alpha-2 SVG with a viewBox', () => {
  assert.equal(countries.length, 195);
  const codes = new Set();
  for (const country of countries) {
    assert.match(country.flag_code, /^[a-z]{2}$/);
    assert.equal(codes.has(country.flag_code), false, country.canonical_name);
    codes.add(country.flag_code);
    const asset = path.join(root, 'flags', `${country.flag_code}.svg`);
    assert.equal(fs.existsSync(asset), true, country.canonical_name);
    const svg = fs.readFileSync(asset, 'utf8');
    assert.match(svg, /<svg\b[^>]*\bviewBox\s*=\s*["'][^"']+["']/i, country.canonical_name);
  }
  assert.equal(codes.size, 195);
});

test('Detailed and non-rectangular flag assets retain different native proportions', () => {
  const viewBox = code => {
    const svg = fs.readFileSync(path.join(root, 'flags', `${code}.svg`), 'utf8');
    const values = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i)[1].trim().split(/\s+/).map(Number);
    return values[2] / values[3];
  };
  assert.ok(viewBox('np') < 1, 'Nepal should remain vertically proportioned');
  assert.equal(viewBox('ch'), 1);
  assert.equal(viewBox('va'), 1);
  assert.ok(viewBox('qa') > 2, 'Qatar should remain wide');
  assert.ok(viewBox('bt') > 1);
});
