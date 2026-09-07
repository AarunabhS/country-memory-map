/* Shared, DOM-independent rules. The clock and randomness are injectable for tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GeographyGame = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const TYPES = Object.freeze({ COUNTRY_TYPING: 'COUNTRY_TYPING', COUNTRY_CLICK: 'COUNTRY_CLICK', CAPITAL_COUNTRY_CLICK: 'CAPITAL_COUNTRY_CLICK', CAPITAL_TYPING: 'CAPITAL_TYPING' });
  const MODES = {
    conquest: { relaxed: {}, sprint: { duration: 180 }, blitz: { duration: 60 }, sudden: { lives: 3 }, continent: {} },
    find: { standard: { questions: 20 }, blitz: { duration: 60 }, continent: { questions: 20 } },
    capital: { classic: { questions: 20 }, blitz: { duration: 60 }, continent: { questions: 20 } }
  };
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/&/g, ' and ').replace(/\bsaint\b/g, 'st').replace(/\bthe\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
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
  class Engine {
    constructor(countries, { now = () => Date.now(), random = Math.random, onEvent = () => {} } = {}) {
      this.countries = countries; this.byId = new Map(countries.map(c => [c.country_id, c]));
      this.aliases = new Map();
      countries.forEach(c => c.accepted_names.forEach(a => { const key = normalize(a); if (!this.aliases.has(key)) this.aliases.set(key, c.country_id); }));
      // An alias from another feature can never take over a canonical country name.
      countries.forEach(c => this.aliases.set(normalize(c.canonical_name), c.country_id));
      this.responseDuration = seconds => seconds; this.now = now; this.random = random; this.onEvent = onEvent; this.state = { gameStatus: 'idle' };
    }
    emit(type, detail = {}) { this.onEvent({ type, ...detail }, this.state); }
    start(config) {
      if (!MODES[config.family]?.[config.variant]) throw new Error('Unknown game mode');
      const rules = MODES[config.family][config.variant];
      this.config = { difficulty: 'medium', region: 'World', ...config };
      const practice = config.practiceIds?.length ? new Set(config.practiceIds) : null;
      this.pool = this.countries.filter(c => (!practice || practice.has(c.country_id)) &&
        (config.variant !== 'continent' || c.continent === config.region) &&
        (config.family !== 'capital' || c.capital.length) &&
        (config.family === 'conquest' || practice || matchesDifficulty(c[config.family === 'capital' ? 'capitalDifficulty' : 'countryLocationDifficulty'], this.config.difficulty)));
      if (!this.pool.length) throw new Error('No countries match this selection. Try another difficulty or region.');
      const started = this.now();
      this.state = { mode: `${config.family}:${config.variant}`, score: 0, streak: 0, bestStreak: 0,
        currentQuestion: null, elapsedTime: 0, remainingTime: rules.duration ?? null, correctAnswers: 0, wrongAnswers: 0,
        completedCountries: new Set(), questionHistory: [], lives: rules.lives ?? null, gameStatus: 'playing',
        startedAt: started, deadline: rules.duration ? started + rules.duration * 1000 : null,
        lastCorrectAt: started, questionStartedAt: null, feedbackUntil: null, mistakes: [],
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
      const type = this.config.family === 'find' ? TYPES.COUNTRY_CLICK : s.questionNumber % 2 === 0 ? TYPES.CAPITAL_TYPING : TYPES.CAPITAL_COUNTRY_CLICK;
      const capital = country.capital[Math.floor(this.random() * country.capital.length)];
      s.questionNumber++; s.questionStartedAt = at; s.feedbackUntil = null;
      s.currentQuestion = { id: `${s.startedAt}-${s.questionNumber}`, type, countryId: country.country_id,
        prompt: type === TYPES.CAPITAL_COUNTRY_CLICK ? capital.name : country.canonical_name,
        role: type === TYPES.CAPITAL_COUNTRY_CLICK ? capital.role : null,
        acceptedAnswers: type === TYPES.CAPITAL_TYPING ? country.capital.flatMap(c => [c.name, ...c.aliases]).map(normalize) : [country.country_id],
        difficulty: country[this.config.family === 'find' ? 'countryLocationDifficulty' : 'capitalDifficulty'],
        timeLimit: 10, deadline: at + 10000, wrongAttempts: 0, resolved: false };
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
    submitText(raw) {
      this.tick(); const s = this.state, answer = normalize(raw);
      if (s.gameStatus !== 'playing' || !answer || s.feedbackUntil !== null) return;
      if (this.config.family === 'conquest') {
        const id = this.aliases.get(answer);
        if (!id || !this.targetIds.has(id)) { this.failConquest(raw, id); return; }
        if (s.completedCountries.has(id)) { this.emit('duplicate', { countryId: id }); return; }
        const at = this.now(), seconds = this.responseDuration(Math.max(0, (at - s.lastCorrectAt) / 1000));
        const gained = this.reward(id, seconds); s.lastCorrectAt = at;
        s.questionHistory.push({ countryId: id, correct: true, responseTime: seconds, wrongAttempts: 0, type: TYPES.COUNTRY_TYPING });
        this.emit('correct', { countryId: id, seconds, gained });
        if ([10, 25, 50, 75, 100, 150].includes(s.completedCountries.size)) this.emit('milestone', { count: s.completedCountries.size });
        if (s.completedCountries.size === this.pool.length) this.finish('complete', at);
      } else if (s.currentQuestion?.type === TYPES.CAPITAL_TYPING) {
        if (s.currentQuestion.acceptedAnswers.includes(answer)) this.resolveQuestion(true, this.now(), 'correct');
        else this.failQuestion({ answer: raw });
      }
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
      s.questionHistory.push({ countryId: q.countryId, type: q.type, correct, responseTime: seconds, wrongAttempts: q.wrongAttempts, reason });
      s.feedbackUntil = this.now() + 700;
      this.emit(correct ? 'correct' : 'reveal', { countryId: q.countryId, gained, seconds, reason });
    }
    finish(reason = 'manual', at = this.now()) {
      const s = this.state; if (s.gameStatus !== 'playing') return;
      s.elapsedTime = Math.max(0, (at - s.startedAt) / 1000);
      s.remainingTime = s.deadline === null ? null : Math.max(0, (s.deadline - at) / 1000);
      if (s.currentQuestion && !s.currentQuestion.resolved) {
        s.wrongAnswers++; s.streak = 0; s.currentQuestion.resolved = true;
        s.questionHistory.push({ countryId: s.currentQuestion.countryId, type: s.currentQuestion.type, correct: false,
          responseTime: Math.max(0, (at - s.questionStartedAt) / 1000), wrongAttempts: s.currentQuestion.wrongAttempts, reason });
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
  return { TYPES, MODES, Engine, LocalProfile, calculateScore, normalize, matchesDifficulty, seededRandom };
});
