/* Shared, DOM-independent rules. The clock and randomness are injectable for tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GeographyGame = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const TYPES = Object.freeze({
    COUNTRY_TYPING: 'COUNTRY_TYPING',
    COUNTRY_CLICK: 'COUNTRY_CLICK',
    CAPITAL_COUNTRY_CLICK: 'CAPITAL_COUNTRY_CLICK',
    CAPITAL_TYPING: 'CAPITAL_TYPING',
    FLAG_RECALL: 'FLAG_RECALL',
    FLAG_MATCH: 'FLAG_MATCH'
  });
  const MODES = {
    conquest: { relaxed: {}, sprint: { duration: 180 }, blitz: { duration: 60 }, sudden: { lives: 3 }, continent: {} },
    find: { standard: { questions: 20 }, blitz: { duration: 60 }, continent: { questions: 20 } },
    capital: { classic: { questions: 20 }, blitz: { duration: 60 }, continent: { questions: 20 } },
    flag: { recall: { questions: 20 }, match: { questions: 20 } },
    quiz: { trivia: { questions: 10 } }
  };

  /*
   * User-entered answers are compared in this canonical form. NFKC handles
   * compatibility characters, while the punctuation pass keeps names such as
   * Cote d'Ivoire and Côte d’Ivoire equivalent. Diacritics are optional for
   * callers that need a stricter locale-sensitive comparison.
   */
  function normalize(value, options = {}) {
    const stripDiacritics = options.diacritics !== false;
    let text = String(value ?? '').normalize('NFKC')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .replace(/[\u2010-\u2015\u2212]/g, '-')
      .replace(/&/g, ' and ')
      .replace(/\bsaint\b/gi, 'st')
      .replace(/\bthe\b/gi, ' ');
    if (stripDiacritics) text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return text.toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim().replace(/\s+/g, ' ');
  }

  /*
   * These groups are deliberately explicit. The country dataset still owns
   * its canonical display names; this table only guarantees that common,
   * unambiguous alternatives continue to resolve to the same country.
   */
  const COMMON_ALIAS_GROUPS = Object.freeze([
    ['United States of America', 'USA', 'US', 'United States'],
    ['United Kingdom', 'UK', 'Britain'],
    ['South Korea', 'Republic of Korea'],
    ['North Korea', 'DPRK'],
    ['Democratic Republic of the Congo', 'DR Congo', 'DRC'],
    ['Czechia', 'Czech Republic'],
    ["Côte d'Ivoire", 'Ivory Coast'],
    ['Cape Verde', 'Cabo Verde'],
    ['Timor-Leste', 'East Timor'],
    ['Myanmar', 'Burma'],
    ['Eswatini', 'Swaziland'],
    ['Vatican', 'Vatican City', 'Holy See']
  ]);

  /*
   * Checks whether two normalized strings differ by at most one single-letter
   * edit (substitution, insertion, or deletion).
   */
  function isOneEditAway(s1, s2) {
    if (s1 === s2) return true;
    const len1 = s1.length;
    const len2 = s2.length;
    if (Math.abs(len1 - len2) > 1) return false;

    let i = 0;
    let j = 0;
    let diffFound = false;

    while (i < len1 && j < len2) {
      if (s1[i] !== s2[j]) {
        if (diffFound) return false;
        diffFound = true;
        if (len1 > len2) {
          i++;
        } else if (len2 > len1) {
          j++;
        } else {
          i++;
          j++;
        }
      } else {
        i++;
        j++;
      }
    }
    return true;
  }

  class AnswerValidator {
    constructor(entries = [], { aliasGroups = COMMON_ALIAS_GROUPS } = {}) {
      this.entries = new Map();
      this.aliases = new Map();
      this.canonicalAliases = new Map();
      this.aliasGroups = aliasGroups;
      for (const entry of entries) this.register(entry);
      this.applyExplicitAliases();
    }

    register(rawEntry) {
      const entry = rawEntry || {};
      const id = entry.id ?? entry.country_id ?? entry.countryId;
      const canonicalName = entry.canonicalName ?? entry.canonical_name ?? entry.name;
      if (id == null || !canonicalName) return null;
      const normalizedCanonical = normalize(canonicalName);
      const names = [...new Set([
        canonicalName,
        ...(Array.isArray(entry.aliases) ? entry.aliases : []),
        ...(Array.isArray(entry.accepted_names) ? entry.accepted_names : []),
        ...(Array.isArray(entry.acceptedNames) ? entry.acceptedNames : [])
      ].map(value => String(value ?? '').trim()).filter(Boolean))];
      const registered = { ...entry, id, country_id: entry.country_id ?? id, canonicalName, accepted_names: names };
      this.entries.set(id, registered);
      for (const name of names) {
        const key = normalize(name);
        if (key && !this.aliases.has(key)) this.aliases.set(key, id);
      }
      if (normalizedCanonical) {
        this.canonicalAliases.set(normalizedCanonical, id);
        this.aliases.set(normalizedCanonical, id);
      }
      return registered;
    }

    applyExplicitAliases() {
      for (const group of this.aliasGroups || []) {
        const keys = group.map(normalize).filter(Boolean);
        let id = keys.map(key => this.canonicalAliases.get(key) ?? this.aliases.get(key)).find(value => value != null);
        if (!id) continue;
        for (const key of keys) this.aliases.set(key, id);
      }
    }

    resolve(value, { allowFuzzy = false } = {}) {
      const normalized = normalize(value);
      if (!normalized) return null;
      const directId = this.aliases.get(normalized);
      if (directId != null) return this.entries.get(directId) || null;

      if (allowFuzzy) {
        for (const [alias, id] of this.aliases) {
          if (alias.length > 5 && isOneEditAway(normalized, alias)) {
            return this.entries.get(id) || null;
          }
        }
      }
      return null;
    }

    resolveId(value, options) {
      return this.resolve(value, options)?.id ?? null;
    }

    matches(value, target, { allowFuzzy = false } = {}) {
      const targetId = typeof target === 'object' ? target?.id ?? target?.country_id : target;
      if (targetId == null) return false;
      const normalized = normalize(value);
      if (!normalized) return false;
      if (this.resolveId(value) === targetId) return true;
      if (allowFuzzy) {
        const targetNames = this.namesFor(targetId);
        for (const name of targetNames) {
          const normName = normalize(name);
          if (normName.length > 5 && isOneEditAway(normalized, normName)) {
            return true;
          }
        }
      }
      return false;
    }

    namesFor(id) {
      const entry = this.entries.get(id);
      const names = new Set(entry?.accepted_names || []);
      for (const [alias, aliasId] of this.aliases) if (aliasId === id) names.add(alias);
      return [...names];
    }
  }
  function calculateScore(correctness, responseTime, streak, difficulty = 1) {
    if (!correctness) return 0;
    const speed = responseTime < 2 ? 1.3 : responseTime < 4 ? 1.2 : responseTime <= 7 ? 1.1 : 1;
    const chain = streak >= 40 ? 1.3 : streak >= 20 ? 1.2 : streak >= 10 ? 1.1 : streak >= 5 ? 1.05 : 1;
    // Difficulty is deliberately neutral until a calibrated weighting is introduced.
    return Math.round(100 * speed * chain);
  }
  const matchesDifficulty = (value, choice) => choice === 'easy' ? value === 1 : choice === 'hard' ? value >= 3 : choice === 'expert' ? value === 4 : true;
  function seededRandom(seed) {
    let state = seed >>> 0 || 1;
    return { next() { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }, get state() { return state >>> 0; }, set state(value) { state = value >>> 0; } };
  }
  function shuffle(items, random) {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
  }

  function flagSimilarity(candidate, target, difficulty) {
    const confusable = new Set((target.flagConfusableWith || []).map(String).map(value => value.toLowerCase()));
    const candidateCode = String(candidate.flag_code || candidate.flagCode || '').toLowerCase();
    const targetColors = new Set((target.flagColors || []).map(String).map(value => value.toLowerCase()));
    const candidateColors = new Set((candidate.flagColors || []).map(String).map(value => value.toLowerCase()));
    const sharedColors = [...candidateColors].filter(color => targetColors.has(color)).length;
    const sameRegion = candidate.continent && target.continent && candidate.continent === target.continent;
    const isConfusable = confusable.has(candidateCode) || (candidate.flagConfusableWith || []).map(String).map(value => value.toLowerCase()).includes(String(target.flag_code || '').toLowerCase());
    if (difficulty === 'hard' || difficulty === 'expert') return (isConfusable ? 100 : 0) + (sameRegion ? 16 : 0) + sharedColors * 4;
    if (difficulty === 'medium') return (sameRegion ? 48 : 0) + (isConfusable ? 12 : 0) + sharedColors * 3;
    return (!sameRegion ? 48 : 0) + (!isConfusable ? 18 : -12) + (sharedColors === 0 ? 12 : -sharedColors * 3);
  }

  /* Returns country ids, never country objects, so the question payload stays
     small and the UI can render each option from the shared country model. */
  function selectFlagOptions(pool, target, difficulty = 'medium', random = Math.random) {
    const candidates = pool.filter(country => country.country_id !== target.country_id && country.flag_code);
    const ranked = candidates.map((country, index) => ({
      country,
      score: flagSimilarity(country, target, difficulty) + (candidates.length - index) / Math.max(1, candidates.length) * 0.001 + random() * 0.01
    })).sort((a, b) => b.score - a.score);
    const selected = ranked.slice(0, 3).map(item => item.country.country_id);
    return shuffle([...new Set([target.country_id, ...selected])], random);
  }

  class Engine {
    constructor(countries, { now = () => Date.now(), random = Math.random, onEvent = () => {} } = {}) {
      this.countries = countries;
      this.byId = new Map(countries.map(c => [c.country_id, c]));
      this.validator = new AnswerValidator(countries);
      // Keep the old public alias map as a compatibility surface for the
      // multiplayer adapter and the retained free-map checker.
      this.aliases = this.validator.aliases;
      this.responseDuration = seconds => seconds; this.now = now; this.random = random; this.onEvent = onEvent; this.state = { gameStatus: 'idle' };
    }
    emit(type, detail = {}) { this.onEvent({ type, ...detail }, this.state); }
    start(config) {
      if (!MODES[config.family]?.[config.variant]) throw new Error('Unknown game mode');
      const rules = MODES[config.family][config.variant];
      this.config = { difficulty: 'medium', region: 'World', ...config };
      this.config.questionTime = [10,15,20,30].includes(Number(this.config.questionTime)) ? Number(this.config.questionTime) : 10;
      const practice = config.practiceIds?.length ? new Set(config.practiceIds) : null;
      this.pool = this.countries.filter(c => (!practice || practice.has(c.country_id)) &&
        (config.variant !== 'continent' || c.continent === config.region) &&
        (config.family !== 'capital' || c.capital.length) &&
        (config.family === 'conquest' || config.family === 'flag' || practice || matchesDifficulty(c[config.family === 'capital' ? 'capitalDifficulty' : 'countryLocationDifficulty'], this.config.difficulty)) &&
        (config.family !== 'flag' || c.flag_code));
      if (!this.pool.length) throw new Error('No countries match this selection. Try another difficulty or region.');
      const started = this.now();
      this.state = { mode: `${config.family}:${config.variant}`, score: 0, streak: 0, bestStreak: 0,
        currentQuestion: null, elapsedTime: 0, remainingTime: rules.duration ?? null, correctAnswers: 0, wrongAnswers: 0,
        completedCountries: new Set(), questionHistory: [], lives: rules.lives ?? null, gameStatus: 'playing',
        startedAt: started, deadline: rules.duration ? started + rules.duration * 1000 : null,
        lastCorrectAt: started, questionStartedAt: null, feedbackUntil: null, mistakes: [], hintsUsed: 0, hintPenalty: 0,
        questionNumber: 0, questionLimit: practice ? this.pool.length : rules.questions ? ([10,20,30].includes(config.questionCount) ? config.questionCount : rules.questions) : null, personalBest: null };
      this.targetIds = new Set(this.pool.map(c => c.country_id)); this.queue = []; this.lastCountryId = null;
      this.emit('start');
      if (config.family !== 'conquest') this.nextQuestion(started);
      else this.emit('question', { question: { type: TYPES.COUNTRY_TYPING, prompt: 'Name a country' } });
      return this.state;
    }
    nextQuestion(at = this.now()) {
      const s = this.state;
      if (s.gameStatus !== 'playing') return;
      if (s.questionLimit && s.questionNumber >= s.questionLimit) { this.finish('complete', at); return; }
      if (!this.queue.length) {
        this.queue = shuffle(this.pool, this.random);
        if (this.queue.length > 1 && this.queue[0].country_id === this.lastCountryId) this.queue.push(this.queue.shift());
      }
      const country = this.queue.shift(); this.lastCountryId = country.country_id;
      const isFlag = this.config.family === 'flag';
      const type = isFlag
        ? this.config.variant === 'match' ? TYPES.FLAG_MATCH : TYPES.FLAG_RECALL
        : this.config.family === 'find' ? TYPES.COUNTRY_CLICK : s.questionNumber % 2 === 0 ? TYPES.CAPITAL_TYPING : TYPES.CAPITAL_COUNTRY_CLICK;
      const capital = country.capital[Math.floor(this.random() * country.capital.length)];
      s.questionNumber++; s.questionStartedAt = at; s.feedbackUntil = null;
      const question = { id: `${s.startedAt}-${s.questionNumber}`, type, countryId: country.country_id,
        prompt: type === TYPES.CAPITAL_COUNTRY_CLICK ? capital.name : isFlag && type === TYPES.FLAG_MATCH ? country.canonical_name : country.canonical_name,
        role: type === TYPES.CAPITAL_COUNTRY_CLICK ? capital.role : null,
        acceptedAnswers: type === TYPES.CAPITAL_TYPING ? country.capital.flatMap(c => [c.name, ...c.aliases]).map(normalize) : [country.country_id],
        difficulty: isFlag ? null : country[this.config.family === 'find' ? 'countryLocationDifficulty' : 'capitalDifficulty'],
        flagCode: isFlag ? country.flag_code : null,
        timeLimit: this.config.questionTime, deadline: at + this.config.questionTime * 1000, wrongAttempts: 0, resolved: false,
        hintUsed: false, hintPenalty: 0 };
      if (isFlag && type === TYPES.FLAG_MATCH) {
        // Practice and continent pools can be smaller than four. Keep the
        // target in scope, but borrow global distractors to preserve the
        // match game's four-card contract.
        const optionPool = this.pool.length >= 4 ? this.pool : this.countries;
        question.options = selectFlagOptions(optionPool, country, this.config.difficulty, this.random);
      }
      s.currentQuestion = question;
      this.emit('question', { question: s.currentQuestion });
    }
    tick(at = this.now()) {
      const s = this.state;
      if (s.gameStatus !== 'playing') return;
      s.elapsedTime = Math.max(0, (at - s.startedAt) / 1000);
      s.remainingTime = s.deadline === null ? null : Math.max(0, (s.deadline - at) / 1000);
      if (s.deadline !== null && at >= s.deadline) { this.finish('time', s.deadline); return; }
      if (s.feedbackUntil !== null) {
        if (at >= s.feedbackUntil) this.nextQuestion(at);
      } else if (s.currentQuestion && at >= s.currentQuestion.deadline) {
        s.wrongAnswers++; s.streak = 0;
        this.resolveQuestion(false, s.currentQuestion.deadline, 'timeout');
      }
      this.emit('tick');
    }
    isFuzzyAllowed() {
      return this.config?.difficulty === 'easy' || this.config?.variant === 'relaxed';
    }
    submitText(raw) {
      this.tick(); const s = this.state, answer = normalize(raw);
      if (s.gameStatus !== 'playing' || !answer || s.feedbackUntil !== null) return;
      const allowFuzzy = this.isFuzzyAllowed();
      if (this.config.family === 'conquest') {
        const id = this.validator.resolveId(raw, { allowFuzzy });
        if (!id || !this.targetIds.has(id)) { this.failConquest(raw, id); return; }
        if (s.completedCountries.has(id)) { this.emit('duplicate', { countryId: id }); return; }
        const at = this.now(), seconds = this.responseDuration(Math.max(0, (at - s.lastCorrectAt) / 1000));
        const gained = this.reward(id, seconds); s.lastCorrectAt = at;
        s.questionHistory.push({ countryId: id, correct: true, responseTime: seconds, wrongAttempts: 0, type: TYPES.COUNTRY_TYPING });
        this.emit('correct', { countryId: id, seconds, gained });
        if ([10, 25, 50, 75, 100, 150].includes(s.completedCountries.size)) this.emit('milestone', { count: s.completedCountries.size });
        if (s.completedCountries.size === this.pool.length) this.finish('complete', at);
      } else if (s.currentQuestion?.type === TYPES.FLAG_RECALL) {
        if (this.validator.matches(raw, s.currentQuestion.countryId, { allowFuzzy }) && this.targetIds.has(s.currentQuestion.countryId)) this.resolveQuestion(true, this.now(), 'correct');
        else this.failQuestion({ answer: raw });
      } else if (s.currentQuestion?.type === TYPES.CAPITAL_TYPING) {
        if (s.currentQuestion.acceptedAnswers.includes(answer)) this.resolveQuestion(true, this.now(), 'correct');
        else this.failQuestion({ answer: raw });
      }
    }

    submitFlag(id) {
      this.tick(); const s = this.state;
      if (s.gameStatus !== 'playing' || s.feedbackUntil !== null || s.currentQuestion?.type !== TYPES.FLAG_MATCH) return;
      if (id === s.currentQuestion.countryId) this.resolveQuestion(true, this.now(), 'correct');
      else this.failQuestion({ countryId: id });
    }

    useHint() {
      this.tick(); const s = this.state, q = s.currentQuestion;
      if (s.gameStatus !== 'playing' || s.feedbackUntil !== null || !q || q.resolved || q.hintUsed) return false;
      const penalty = 25;
      q.hintUsed = true; q.hintPenalty = penalty;
      s.hintsUsed++; s.hintPenalty += penalty; s.score -= penalty;
      let detail = '';
      if (q.type === TYPES.FLAG_RECALL) {
        const country = this.byId.get(q.countryId);
        const firstLetter = [...country.canonical_name].find(char => /\p{L}/u.test(char)) || '';
        detail = `Hint: the answer starts with “${firstLetter.toUpperCase()}”.`;
      } else if (q.type === TYPES.FLAG_MATCH) {
        const removable = (q.options || []).find(optionId => optionId !== q.countryId);
        q.hintRemoveId = removable || null;
        detail = removable ? 'Hint: one incorrect flag has been removed.' : 'Hint unavailable for this question.';
      }
      this.emit('hint', { countryId: q.countryId, penalty, hint: detail, removeId: q.hintRemoveId || null, score: s.score });
      return true;
    }
    submitCountry(id, clickedName = null) {
      this.tick(); const s = this.state;
      if (s.gameStatus !== 'playing' || s.feedbackUntil !== null || !s.currentQuestion || ![TYPES.COUNTRY_CLICK, TYPES.CAPITAL_COUNTRY_CLICK].includes(s.currentQuestion.type)) return;
      if (id === s.currentQuestion.countryId) this.resolveQuestion(true, this.now(), 'correct');
      else this.failQuestion({ countryId: id, clickedName });
    }
    failConquest(raw, id) {
      const s = this.state; s.wrongAnswers++; s.streak = 0;
      s.mistakes.push(String(raw));
      if (s.lives !== null) s.lives--;
      this.emit('wrong', { answer: raw, countryId: id, reason: id ? 'region' : 'unrecognised', penalty: 0 });
      if (s.lives === 0) this.finish('lives');
    }
    failQuestion(detail) {
      const s = this.state, q = s.currentQuestion;
      s.wrongAnswers++; s.streak = 0; q.wrongAttempts++;
      const penalty = q.wrongAttempts === 1 ? 25 : q.wrongAttempts === 2 ? 50 : 0;
      s.score -= penalty;
      this.emit('wrong', { ...detail, penalty, attempts: q.wrongAttempts });
      if (q.wrongAttempts >= 3) this.resolveQuestion(false, this.now(), 'attempts');
    }
    reward(id, seconds) {
      const s = this.state; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak);
      const gained = calculateScore(true, seconds, s.streak, s.currentQuestion?.difficulty);
      s.score += gained; s.correctAnswers++; s.completedCountries.add(id); return gained;
    }
    resolveQuestion(correct, at, reason) {
      const s = this.state, q = s.currentQuestion;
      if (!q || q.resolved) return;
      q.resolved = true;
      const seconds = correct ? this.responseDuration(Math.max(0, (at - s.questionStartedAt) / 1000)) : Math.max(0, (at - s.questionStartedAt) / 1000);
      const gained = correct ? this.reward(q.countryId, seconds) : 0;
      if (!correct) s.streak = 0;
      s.questionHistory.push({ countryId: q.countryId, type: q.type, correct, responseTime: seconds, wrongAttempts: q.wrongAttempts, reason, hintPenalty: q.hintPenalty || 0 });
      s.feedbackUntil = this.now() + 700;
      this.emit(correct ? 'correct' : 'reveal', { countryId: q.countryId, gained, seconds, reason, hintPenalty: q.hintPenalty || 0 });
    }
    finish(reason = 'manual', at = this.now()) {
      const s = this.state; if (s.gameStatus !== 'playing') return;
      s.elapsedTime = Math.max(0, (at - s.startedAt) / 1000);
      s.remainingTime = s.deadline === null ? null : Math.max(0, (s.deadline - at) / 1000);
      if (s.currentQuestion && !s.currentQuestion.resolved) {
        s.wrongAnswers++; s.streak = 0; s.currentQuestion.resolved = true;
        s.questionHistory.push({ countryId: s.currentQuestion.countryId, type: s.currentQuestion.type, correct: false,
          responseTime: Math.max(0, (at - s.questionStartedAt) / 1000), wrongAttempts: s.currentQuestion.wrongAttempts, reason,
          hintPenalty: s.currentQuestion.hintPenalty || 0 });
      }
      s.gameStatus = 'ended'; s.feedbackUntil = null;
      this.result = this.makeResult(reason); this.emit('end', { result: this.result });
    }
    makeResult(reason) {
      const s = this.state, history = s.questionHistory;
      const successes = history.filter(q => q.correct);
      const questionMisses = history.filter(q => !q.correct).length;
      const questionAccuracy = history.length ? Math.round(100 * successes.length / history.length) : 0;
      const attemptAccuracy = s.correctAnswers + s.wrongAnswers ? Math.round(100 * s.correctAnswers / (s.correctAnswers + s.wrongAnswers)) : 0;
      const times = successes.map(q => q.responseTime);
      const missed = this.config.family === 'conquest' ? this.pool.filter(c => !s.completedCountries.has(c.country_id)).map(c => c.country_id)
        : [...new Set(history.filter(q => !q.correct || q.wrongAttempts > 0).map(q => q.countryId))];
      const regions = [...new Set(this.pool.map(c => c.continent))].map(name => {
        const targets = this.pool.filter(c => c.continent === name);
        const attempts = history.filter(q => this.byId.get(q.countryId)?.continent === name);
        const correct = this.config.family === 'conquest' ? targets.filter(c => s.completedCountries.has(c.country_id)).length : attempts.filter(q => q.correct).length;
        const total = this.config.family === 'conquest' ? targets.length : attempts.length;
        return { name, correct, total, ratio: total ? correct / total : 0 };
      }).filter(r => r.total > 0).sort((a, b) => b.ratio - a.ratio || b.correct - a.correct);
      const isConquest = this.config.family === 'conquest';
      return { config: { ...this.config }, endedAt: new Date(this.now()).toISOString(), reason,
        score: s.score, correct: s.correctAnswers, wrong: isConquest ? s.wrongAnswers : questionMisses,
        incorrectAttempts: s.wrongAnswers, missedQuestions: isConquest ? null : questionMisses,
        countriesFound: s.completedCountries.size,
        total: isConquest ? this.pool.length : history.length,
        accuracy: isConquest ? attemptAccuracy : questionAccuracy,
        bestStreak: s.bestStreak, elapsedTime: s.elapsedTime,
        averageResponseTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
        fastestAnswer: times.length ? Math.min(...times) : null,
        strongestRegion: regions.find(r => r.correct > 0) || null,
        weakestRegion: [...regions].reverse().find(r => r.correct < r.total) || null,
        missedCountries: missed, mistakes: [...s.mistakes], questionHistory: [...history],
        hintsUsed: s.hintsUsed, hintPenalty: s.hintPenalty,
        completed: reason === 'complete', personalBest: false };
    }
  }
  class LocalProfile {
    constructor(storage) { this.storage = storage; this.key = 'country-memory-profile-v1'; this.available = true; this.data = { bests: {}, recent: [], difficulty: 'medium', lastMode: { family: 'conquest', variant: 'relaxed' } }; try { const saved = JSON.parse(storage?.getItem(this.key) || 'null'); if (saved && typeof saved === 'object') { this.data.bests = saved.bests && typeof saved.bests === 'object' ? saved.bests : {}; this.data.recent = Array.isArray(saved.recent) ? saved.recent.slice(0, 20) : []; if (['easy','medium','hard','expert'].includes(saved.difficulty)) this.data.difficulty = saved.difficulty; if (MODES[saved.lastMode?.family]?.[saved.lastMode?.variant]) this.data.lastMode = saved.lastMode; } } catch { this.available = false; } }
    persist() { try { if (!this.storage) throw new Error('No storage'); this.storage.setItem(this.key, JSON.stringify(this.data)); } catch { this.available = false; } }
    select(config) { this.data.difficulty = config.difficulty; this.data.lastMode = { family: config.family, variant: config.variant }; this.persist(); }
    record(result) {
      const c = result.config, key = [c.family,c.variant,c.variant === 'continent' ? c.region : 'World', c.family === 'conquest' ? 'all' : c.difficulty, c.practiceIds ? 'practice' : 'game'].join(':');
      const previous = this.data.bests[key];
      const completionRace = c.family === 'conquest' && ['relaxed','continent'].includes(c.variant);
      const better = completionRace ? result.completed && (!previous || result.elapsedTime < previous.elapsedTime) :
        !previous || result.correct > previous.correct || (result.correct === previous.correct && result.score > previous.score);
      if (better && result.correct > 0 && !c.practiceIds) { result.personalBest = true; this.data.bests[key] = { correct: result.correct, score: result.score, elapsedTime: result.elapsedTime }; }
      this.data.recent.unshift({ ...result, questionHistory: undefined }); this.data.recent = this.data.recent.slice(0, 20); this.persist();
      return result;
    }
  }
  return { TYPES, MODES, Engine, LocalProfile, AnswerValidator, COMMON_ALIAS_GROUPS, calculateScore, normalize, matchesDifficulty, seededRandom, selectFlagOptions, isOneEditAway };
});
