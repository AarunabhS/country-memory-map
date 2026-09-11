/* ==========================================================================
   Geo Quiz Game Controller
   Manages trivia rounds, interactive target chips, hints, and fact reveals.
   ========================================================================== */

(function (global) {
  'use strict';

  let active = false;
  let currentRound = null;
  let timerInterval = null;
  let questionStartTime = 0;
  let roundStartTime = 0;
  let validator = null;
  let countriesByIso = new Map();
  let ui = {};

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function initUI() {
    if (ui.view) return;
    const app = document.querySelector('.app');
    if (!app) return;

    let view = document.getElementById('quizGameView');
    if (!view) {
      view = document.createElement('section');
      view.id = 'quizGameView';
      view.className = 'quiz-game-view';
      view.setAttribute('aria-label', 'Geography quiz stage');
      view.hidden = true;

      view.innerHTML = `
        <div class="quiz-header-bar">
          <div class="quiz-meta-group">
            <span id="quizTierBadge" class="quiz-badge tier-easy">Easy</span>
            <span id="quizCategoryBadge" class="quiz-badge">Trivia</span>
          </div>
          <span id="quizProgressText" class="quiz-progress-text">Question 1 of 10</span>
        </div>

        <div class="quiz-prompt-card">
          <div id="quizCategoryKicker" class="quiz-category-kicker">Geography Trivia</div>
          <h2 id="quizPromptTitle" class="quiz-prompt-title">Prompt question goes here...</h2>
          <div id="quizTargetsStage" class="quiz-targets-stage" role="group" aria-label="Answers list"></div>
        </div>

        <div class="quiz-tools-bar">
          <button type="button" id="quizHintButton" class="quiz-tool-button">
            <span>💡 Use Hint</span>
            <span aria-hidden="true" style="opacity:0.75; font-size:0.8em;">(−25)</span>
          </button>
          <button type="button" id="quizRevealButton" class="quiz-tool-button skip-button">
            <span>Reveal & Next →</span>
          </button>
        </div>

        <div id="quizHintCard" class="quiz-hint-card" hidden role="status" aria-live="polite"></div>

        <div id="quizFactCard" class="quiz-fact-card" hidden role="region" aria-label="Did you know?">
          <div class="quiz-fact-header">
            <span class="quiz-fact-title">
              <span aria-hidden="true">🌍</span> DID YOU KNOW?
            </span>
          </div>
          <p id="quizFactText" class="quiz-fact-text"></p>
          <button type="button" id="quizNextButton" class="quiz-next-button">Next Question <span aria-hidden="true">→</span></button>
        </div>
      `;

      // Place quiz stage inside map-shell or main content area
      const stageParent = document.querySelector('.map-shell') || app;
      stageParent.appendChild(view);
    }

    ui = {
      view,
      tierBadge: document.getElementById('quizTierBadge'),
      categoryBadge: document.getElementById('quizCategoryBadge'),
      progressText: document.getElementById('quizProgressText'),
      categoryKicker: document.getElementById('quizCategoryKicker'),
      promptTitle: document.getElementById('quizPromptTitle'),
      targetsStage: document.getElementById('quizTargetsStage'),
      hintButton: document.getElementById('quizHintButton'),
      revealButton: document.getElementById('quizRevealButton'),
      hintCard: document.getElementById('quizHintCard'),
      factCard: document.getElementById('quizFactCard'),
      factText: document.getElementById('quizFactText'),
      nextButton: document.getElementById('quizNextButton'),
      hudScore: document.getElementById('gameScore'),
      hudStreak: document.getElementById('gameStreak'),
      hudTime: document.getElementById('gameTime'),
      hudProgress: document.getElementById('gameProgress'),
      hudProgressLabel: document.getElementById('progressLabel'),
      guessInput: document.getElementById('guessInput'),
      guessForm: document.getElementById('guessForm'),
      message: document.getElementById('message'),
      resultsDialog: document.getElementById('resultsDialog')
    };

    ui.hintButton.addEventListener('click', useHint);
    ui.revealButton.addEventListener('click', revealCurrentQuestion);
    ui.nextButton.addEventListener('click', advanceQuestion);
  }

  function ensureCountryData(providedList) {
    let list = providedList;
    if (!list || !list.length) {
      if (global.CountryMemoryCountries && global.CountryMemoryCountries.length > 0) {
        list = global.CountryMemoryCountries;
      } else if (global.GeographyGame?.countries && global.GeographyGame.countries.length > 0) {
        list = global.GeographyGame.countries;
      } else if (typeof global.buildGameCountries === 'function' && global.GameMap?.countries?.length) {
        list = global.buildGameCountries(global.GameMap);
        if (global.GeographyGame) global.GeographyGame.countries = list;
        global.CountryMemoryCountries = list;
      }
    }
    if (list && list.length) {
      if (countriesByIso.size === 0 || list.length > countriesByIso.size) {
        countriesByIso.clear();
        list.forEach(c => countriesByIso.set(c.iso_code, c));
      }
      if (!validator || !validator.entries || validator.entries.size === 0) {
        if (global.GeographyGame?.AnswerValidator) {
          validator = new global.GeographyGame.AnswerValidator(list);
        }
      }
    }
    return list || [];
  }

  function resolveCountry(text) {
    ensureCountryData();
    const allowFuzzy = !currentRound || currentRound.tier === 'easy' || currentRound.tier === 'all';
    if (validator) {
      const resolved = validator.resolve(text, { allowFuzzy });
      if (resolved) return resolved;
    }
    const norm = global.GeographyGame?.normalize ? global.GeographyGame.normalize(text) : String(text || '').trim().toLowerCase();
    for (const c of countriesByIso.values()) {
      const canonicalNorm = global.GeographyGame?.normalize ? global.GeographyGame.normalize(c.canonical_name) : String(c.canonical_name || '').trim().toLowerCase();
      if (canonicalNorm === norm) return c;
      if (allowFuzzy && canonicalNorm.length > 5 && global.GeographyGame?.isOneEditAway?.(norm, canonicalNorm)) return c;
      if (Array.isArray(c.accepted_names)) {
        const matched = c.accepted_names.some(n => {
          const aNorm = global.GeographyGame?.normalize ? global.GeographyGame.normalize(n) : String(n || '').trim().toLowerCase();
          return aNorm === norm || (allowFuzzy && aNorm.length > 5 && global.GeographyGame?.isOneEditAway?.(norm, aNorm));
        });
        if (matched) return c;
      }
    }
    return null;
  }

  function startRound(config = {}) {
    initUI();
    const dataModule = global.GeographyQuizData;
    if (!dataModule) throw new Error('Quiz questions dataset is unavailable.');

    const tier = config.tier === 'expert' ? 'genius' : (config.tier || 'all');
    const allQuestions = dataModule.getQuestionsByTier(tier);
    if (!allQuestions || !allQuestions.length) throw new Error('No questions found for this tier.');

    const count = Math.min(Number(config.questionCount) || 10, allQuestions.length);
    const selectedQuestions = shuffle(allQuestions).slice(0, count);

    ensureCountryData(config.countries);

    currentRound = {
      tier,
      questions: selectedQuestions,
      currentIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctCount: 0,
      totalTargets: 0,
      totalFound: 0,
      history: [],
      hintsUsed: 0,
      current: null
    };

    active = true;
    roundStartTime = Date.now();

    // Show quiz view and hide other platforms
    const app = document.querySelector('.app');
    if (app) {
      app.classList.add('platform', 'quiz-platform');
      app.classList.remove('choosing', 'round-ended', 'flag-platform', 'map-question');
    }

    const mapShell = document.querySelector('.map-shell');
    if (mapShell?.style) mapShell.style.display = 'flex';
    const mapSvg = document.getElementById('map');
    if (mapSvg?.style) mapSvg.style.display = 'none';
    const flagView = document.getElementById('flagGameView');
    if (flagView) flagView.hidden = true;

    if (ui.view) ui.view.hidden = false;

    // Show HUD
    const hud = document.querySelector('.game-hud');
    if (hud) hud.hidden = false;
    const endGame = document.getElementById('endGame');
    if (endGame) endGame.hidden = false;
    const freeMap = document.getElementById('freeMap');
    if (freeMap) freeMap.hidden = true;

    // Setup input
    const control = document.querySelector('.control');
    if (control) control.hidden = false;
    if (ui.guessForm) ui.guessForm.hidden = false;
    if (ui.guessInput) {
      ui.guessInput.disabled = false;
      ui.guessInput.placeholder = 'Type a country name…';
      ui.guessInput.setAttribute('aria-label', 'Type a country name');
      ui.guessInput.value = '';
    }

    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimerHUD, 500);

    loadQuestion(0);
  }

  function loadQuestion(index) {
    if (!currentRound || index >= currentRound.questions.length) {
      finishRound();
      return;
    }

    currentRound.currentIndex = index;
    const q = currentRound.questions[index];
    questionStartTime = Date.now();

    currentRound.current = {
      data: q,
      foundIsos: new Set(),
      revealed: false,
      hintUsed: false,
      wrongAttempts: 0
    };

    // Update Meta & Headings
    ui.tierBadge.className = `quiz-badge tier-${q.tier}`;
    ui.tierBadge.textContent = q.tier.toUpperCase();
    ui.categoryBadge.textContent = q.category || 'Trivia';
    ui.categoryKicker.textContent = `${q.category || 'Geography Challenge'} · Tier: ${q.tier}`;
    ui.promptTitle.textContent = q.prompt;
    ui.progressText.textContent = `Question ${index + 1} of ${currentRound.questions.length}`;

    // Reset Tool Cards
    ui.hintCard.hidden = true;
    ui.hintCard.textContent = '';
    ui.hintButton.disabled = false;
    ui.revealButton.disabled = false;
    ui.revealButton.hidden = false;
    ui.factCard.hidden = true;
    ui.factText.textContent = '';

    // Render Target Chips
    ui.targetsStage.replaceChildren();
    const count = q.targetCount || (q.format === 'multi' ? q.accepted.length : 1);
    for (let i = 0; i < count; i++) {
      const chip = document.createElement('div');
      chip.className = 'quiz-target-chip';
      chip.dataset.index = i;
      chip.textContent = count > 1 ? `${i + 1}: ?` : '?';
      ui.targetsStage.appendChild(chip);
    }

    if (ui.guessInput) {
      ui.guessInput.disabled = false;
      ui.guessInput.value = '';
      ui.guessInput.focus();
    }

    setMessage(count > 1 ? `Find ${count} countries for this question!` : 'Type your answer and press Enter.');
    updateHUD();
  }

  function setMessage(msg, type = 'normal') {
    if (!ui.message) return;
    ui.message.textContent = msg;
    ui.message.className = `message ${type}`;
  }

  function updateTimerHUD() {
    if (!active || !currentRound) return;
    const elapsed = Math.floor((Date.now() - roundStartTime) / 1000);
    if (ui.hudTime) ui.hudTime.textContent = formatTime(elapsed);
  }

  function updateHUD() {
    if (!currentRound) return;
    if (ui.hudScore) ui.hudScore.textContent = currentRound.score.toLocaleString();
    if (ui.hudStreak) ui.hudStreak.textContent = currentRound.streak;
    if (ui.hudProgressLabel) ui.hudProgressLabel.textContent = 'Question';
    if (ui.hudProgress) ui.hudProgress.textContent = `${currentRound.currentIndex + 1} / ${currentRound.questions.length}`;
  }

  function handleText(raw) {
    if (!active || !currentRound || !currentRound.current || currentRound.current.revealed) return false;
    const text = String(raw || '').trim();
    if (!text) return false;

    // Resolve country via AnswerValidator with fallback
    const country = resolveCountry(text);
    if (!country) {
      setMessage(`“${text}” is not recognized as a country. Check spelling!`, 'bad');
      animateInputError();
      return true;
    }

    const currentQ = currentRound.current;
    const qData = currentQ.data;
    const iso = country.iso_code;

    const isAccepted = (qData.accepted && qData.accepted.includes(iso)) ||
                       (qData.bonusAccepted && qData.bonusAccepted.includes(iso));

    if (!isAccepted) {
      currentQ.wrongAttempts++;
      currentRound.streak = 0;
      setMessage(`“${country.canonical_name}” does not match this category. Streak reset!`, 'bad');
      animateInputError();
      updateHUD();
      return true;
    }

    if (currentQ.foundIsos.has(iso)) {
      setMessage(`“${country.canonical_name}” was already found!`, 'pending');
      return true;
    }

    // Valid, un-found answer!
    currentQ.foundIsos.add(iso);
    currentRound.totalFound++;
    currentRound.streak++;
    if (currentRound.streak > currentRound.bestStreak) currentRound.bestStreak = currentRound.streak;

    // Speed bonus
    const responseSeconds = (Date.now() - questionStartTime) / 1000;
    const speedMultiplier = responseSeconds < 3 ? 1.3 : responseSeconds < 7 ? 1.15 : 1.0;
    const streakMultiplier = currentRound.streak >= 10 ? 1.25 : currentRound.streak >= 5 ? 1.1 : 1.0;
    const points = Math.round(100 * speedMultiplier * streakMultiplier);
    currentRound.score += points;

    // Update Chip
    const chips = [...ui.targetsStage.querySelectorAll('.quiz-target-chip:not(.is-found)')];
    if (chips.length > 0) {
      const chip = chips[0];
      chip.classList.add('is-found');
      chip.innerHTML = `<span class="quiz-chip-flag">${country.flag || '🏳'}</span> ${country.canonical_name} <span class="quiz-chip-check">✓</span>`;
    }

    const needed = qData.targetCount || qData.accepted.length;
    const remaining = needed - currentQ.foundIsos.size;

    if (remaining <= 0) {
      // Question complete!
      currentRound.correctCount++;
      setMessage(`Brilliant! All answers found! (+${points} pts)`, 'good');
      showFactCard();
    } else {
      setMessage(`Correct: ${country.canonical_name}! (+${points} pts) — ${remaining} left to find!`, 'good');
    }

    updateHUD();
    return true;
  }

  function useHint() {
    if (!active || !currentRound || !currentRound.current || currentRound.current.hintUsed || currentRound.current.revealed) return;
    const currentQ = currentRound.current;
    currentQ.hintUsed = true;
    currentRound.hintsUsed++;
    currentRound.score = Math.max(0, currentRound.score - 25);

    ui.hintCard.hidden = false;
    ui.hintCard.innerHTML = `<strong>Hint:</strong> ${currentQ.data.hint || 'No specific hint available for this question.'}`;
    ui.hintButton.disabled = true;

    setMessage('Hint revealed (−25 pts)', 'pending');
    updateHUD();
  }

  function revealCurrentQuestion() {
    if (!active || !currentRound || !currentRound.current || currentRound.current.revealed) return;
    const currentQ = currentRound.current;
    currentQ.revealed = true;
    currentRound.streak = 0;

    // Reveal un-found answers on remaining chips
    const unFoundIsos = currentQ.data.accepted.filter(iso => !currentQ.foundIsos.has(iso));
    const emptyChips = [...ui.targetsStage.querySelectorAll('.quiz-target-chip:not(.is-found)')];

    emptyChips.forEach((chip, i) => {
      if (i < unFoundIsos.length) {
        const iso = unFoundIsos[i];
        const country = countriesByIso.get(iso);
        const name = country ? country.canonical_name : iso;
        const flag = country ? country.flag : '🏳';
        chip.classList.add('is-revealed');
        chip.innerHTML = `<span class="quiz-chip-flag">${flag}</span> ${name}`;
      }
    });

    setMessage('Answers revealed.', 'bad');
    showFactCard();
    updateHUD();
  }

  function showFactCard() {
    if (!currentRound || !currentRound.current) return;
    const qData = currentRound.current.data;
    if (ui.guessInput) ui.guessInput.disabled = true;
    ui.hintButton.disabled = true;
    ui.revealButton.hidden = true;

    ui.factCard.hidden = false;
    ui.factText.textContent = qData.funFact || 'Great job exploring the globe!';
    ui.nextButton.focus();
  }

  function advanceQuestion() {
    if (!currentRound) return;
    loadQuestion(currentRound.currentIndex + 1);
  }

  function animateInputError() {
    if (!ui.guessInput) return;
    ui.guessInput.classList.add('is-error');
    setTimeout(() => ui.guessInput.classList.remove('is-error'), 400);
  }

  function finishRound() {
    active = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    const r = currentRound;
    if (!r) return;

    const totalQuestions = r.questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((r.correctCount / totalQuestions) * 100) : 0;
    const totalTime = Math.floor((Date.now() - roundStartTime) / 1000);

    // Populate Results Dialog if available
    const dialog = ui.resultsDialog;
    if (dialog) {
      const modeTitle = document.getElementById('resultsMode');
      if (modeTitle) modeTitle.textContent = `Geo Quiz · ${global.GeographyQuizData?.TIER_LABELS[r.tier] || 'Trivia'}`;
      const resultsTitle = document.getElementById('resultsTitle');
      if (resultsTitle) resultsTitle.textContent = 'Quiz Complete!';

      const stats = document.getElementById('resultStats');
      if (stats) {
        stats.innerHTML = `
          <div class="hud-stat"><span>Score</span><strong>${r.score.toLocaleString()}</strong></div>
          <div class="hud-stat"><span>Accuracy</span><strong>${accuracy}%</strong></div>
          <div class="hud-stat"><span>Questions</span><strong>${r.correctCount} / ${totalQuestions}</strong></div>
          <div class="hud-stat"><span>Best Streak</span><strong>${r.bestStreak}</strong></div>
          <div class="hud-stat"><span>Time</span><strong>${formatTime(totalTime)}</strong></div>
        `;
      }

      const note = document.getElementById('resultNote');
      if (note) {
        note.textContent = accuracy === 100
          ? 'Legendary geography mastery! A flawless round!'
          : accuracy >= 70
          ? 'Splendid trivia knowledge! Ready for the next tier?'
          : 'Great exploration! Keep playing to uncover more world secrets.';
      }

      const missedDetails = document.getElementById('missedDetails');
      if (missedDetails) missedDetails.hidden = true;
      const mistakes = document.getElementById('finalMistakes');
      if (mistakes) mistakes.innerHTML = '';

      dialog.showModal();
    }
  }

  function deactivate() {
    active = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (ui.view) ui.view.hidden = true;
    const mapSvg = document.getElementById('map');
    if (mapSvg?.style) mapSvg.style.display = 'block';
  }

  global.QuizGame = Object.freeze({
    start: startRound,
    handleText,
    useHint,
    revealCurrentQuestion,
    advanceQuestion,
    isActive: () => active,
    deactivate
  });

})(typeof window === 'undefined' ? globalThis : window);
