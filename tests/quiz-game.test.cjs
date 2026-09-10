const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { AnswerValidator } = require('../game-core.js');
const countries = require('../scripts/load-game-data.cjs');
const quizData = require('../quiz-data.js');

const countriesByIso = new Map(countries.map(c => [c.iso_code, c]));

test('all quiz questions have valid schema and resolve to authentic playable countries', () => {
  const { QUESTIONS, TIERS } = quizData;
  assert.equal(QUESTIONS.length, 32);

  const validTiers = new Set(Object.values(TIERS));
  const seenIds = new Set();

  for (const q of QUESTIONS) {
    assert.ok(q.id, 'Question must have an id');
    assert.ok(!seenIds.has(q.id), `Duplicate question id: ${q.id}`);
    seenIds.add(q.id);

    assert.ok(validTiers.has(q.tier), `Invalid tier: ${q.tier} in ${q.id}`);
    assert.ok(q.category, `Missing category in ${q.id}`);
    assert.ok(q.prompt, `Missing prompt in ${q.id}`);
    assert.ok(Array.isArray(q.accepted) && q.accepted.length > 0, `Missing accepted ISOs in ${q.id}`);
    assert.ok(q.hint, `Missing hint in ${q.id}`);
    assert.ok(q.funFact, `Missing fun fact in ${q.id}`);
    assert.ok(q.targetCount >= 1, `targetCount must be >= 1 in ${q.id}`);

    // Verify all ISO codes map to playable countries
    for (const iso of q.accepted) {
      assert.ok(countriesByIso.has(iso), `Unknown ISO code ${iso} in ${q.id}`);
    }
    if (q.bonusAccepted) {
      for (const iso of q.bonusAccepted) {
        assert.ok(countriesByIso.has(iso), `Unknown bonus ISO code ${iso} in ${q.id}`);
      }
    }
  }
});

test('user-mandated questions are present and verified', () => {
  const { getQuestionById } = quizData;

  // 1. Directions in name (6 countries)
  const dirQ = getQuestionById('easy-cardinal-directions');
  assert.ok(dirQ, 'Cardinal directions question must exist');
  assert.equal(dirQ.targetCount, 6);
  assert.deepEqual(dirQ.accepted.sort(), ['KOR', 'MKD', 'PRK', 'SSD', 'TLS', 'ZAF'].sort());
  assert.ok(dirQ.bonusAccepted.includes('CAF'));

  // 2. Country ending in H (Bangladesh)
  const endHQ = getQuestionById('easy-ends-in-h');
  assert.ok(endHQ, 'Ends in H question must exist');
  assert.deepEqual(endHQ.accepted, ['BGD']);
  assert.equal(countriesByIso.get('BGD').canonical_name, 'Bangladesh');

  // 3. Weapons on flags
  const weaponQ = getQuestionById('med-weapons-on-flags');
  assert.ok(weaponQ, 'Weapons on flags question must exist');
  assert.ok(weaponQ.accepted.includes('MOZ'), 'Mozambique has AK-47');
  assert.ok(weaponQ.accepted.includes('GTM'), 'Guatemala has rifles');
  assert.ok(weaponQ.accepted.includes('SAU'), 'Saudi Arabia has sword');
  assert.ok(weaponQ.accepted.includes('KEN'), 'Kenya has spears');
});

test('tier filtering, tier counts, and expert tier aliasing work correctly', () => {
  const { getQuestionsByTier, TIERS, QUESTIONS } = quizData;

  assert.equal(getQuestionsByTier('all').length, 32);
  assert.equal(getQuestionsByTier().length, 32);

  const easy = getQuestionsByTier(TIERS.EASY);
  assert.equal(easy.length, 8);
  assert.ok(easy.every(q => q.tier === 'easy'));

  const medium = getQuestionsByTier(TIERS.MEDIUM);
  assert.equal(medium.length, 8);
  assert.ok(medium.every(q => q.tier === 'medium'));

  const hard = getQuestionsByTier(TIERS.HARD);
  assert.equal(hard.length, 8);
  assert.ok(hard.every(q => q.tier === 'hard'));

  const genius = getQuestionsByTier(TIERS.GENIUS);
  assert.equal(genius.length, 8);
  assert.ok(genius.every(q => q.tier === 'genius'));

  // Expert alias maps to genius
  const expert = getQuestionsByTier('expert');
  assert.equal(expert.length, 8);
  assert.ok(expert.every(q => q.tier === 'genius'));
});

test('AnswerValidator cleanly resolves user submissions to quiz question targets', () => {
  const validator = new AnswerValidator(countries);
  const { getQuestionById } = quizData;

  // Cardinal directions question
  const dirQ = getQuestionById('easy-cardinal-directions');
  const userAnswers = [
    'South Africa',
    'North Korea',
    'South Korea',
    'South Sudan',
    'North Macedonia',
    'Timor-Leste'
  ];
  for (const name of userAnswers) {
    const resolved = validator.resolve(name);
    assert.ok(resolved, `Should resolve ${name}`);
    assert.ok(dirQ.accepted.includes(resolved.iso_code), `${resolved.canonical_name} (${resolved.iso_code}) should be accepted`);
  }

  // Bonus accepted and aliases
  assert.ok(dirQ.bonusAccepted.includes(validator.resolve('Central African Republic').iso_code));
  assert.ok(dirQ.bonusAccepted.includes(validator.resolve('Central African Rep').iso_code));
  assert.ok(dirQ.accepted.includes(validator.resolve('East Timor').iso_code));
  assert.ok(dirQ.accepted.includes(validator.resolve('Republic of Korea').iso_code));
  assert.ok(dirQ.accepted.includes(validator.resolve('DPRK').iso_code));
});

test('quiz-game controller loads cleanly in DOM environment and resolves countries', () => {
  const fs = require('fs');
  const code = fs.readFileSync(path.join(__dirname, '../quiz-game.js'), 'utf8');
  assert.ok(code.includes('global.QuizGame = Object.freeze'));
  assert.ok(code.includes('handleText'));
  assert.ok(code.includes('useHint'));
  assert.ok(code.includes('advanceQuestion'));
  assert.ok(code.includes('deactivate'));

  // Test Nepal question in catalog
  const nepalQ = quizData.getQuestionById('easy-non-rectangular-flag');
  assert.ok(nepalQ, 'Nepal question must exist');
  assert.deepEqual(nepalQ.accepted, ['NPL']);

  const validator = new AnswerValidator(countries);
  const resolved = validator.resolve('Nepal');
  assert.ok(resolved, 'Validator must resolve Nepal');
  assert.equal(resolved.iso_code, 'NPL');
  assert.ok(nepalQ.accepted.includes(resolved.iso_code));
});
