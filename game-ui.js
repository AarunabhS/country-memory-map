/* Shared setup, HUD, feedback and results for every game configuration. */
(function () {
  'use strict';
  function boot() {
    if (!window.GameMap?.countries.length || window.gameController) return;
    const { Engine, LocalProfile, TYPES, MODES } = GeographyGame;
    const { ProfileService, ProfileManager, StatsSyncQueue, GameTracker, MapFeedbackAdapter, GameplayFeedbackController, ProfileUI } = window.CountryMemoryPlayers || {};
    const flags = window.COUNTRY_MEMORY_FLAGS || {}, profilesEnabled = flags.PLAYER_PROFILES_ENABLED !== false, statsEnabled = flags.PLAYER_STATS_ENABLED !== false, feedbackEnabled = flags.ANSWER_FEEDBACK_ENABLED !== false;
    const countries = buildGameCountries(GameMap), byId = new Map(countries.map(c => [c.country_id, c]));
    let storage; try { storage = window.localStorage; } catch { storage = null; }
    const profile = new LocalProfile(storage);
    const playerService = profilesEnabled && ProfileService ? new ProfileService({ baseUrl: window.FRIENDS_API }) : null;
    const players = profilesEnabled && ProfileManager ? new ProfileManager(storage, playerService) : null;
    const syncQueue = profilesEnabled && statsEnabled && players && StatsSyncQueue ? new StatsSyncQueue(storage, playerService, players) : null;
    const tracker = profilesEnabled && statsEnabled && players && syncQueue && GameTracker ? new GameTracker(players, syncQueue) : null;
    const app = document.querySelector('.app'), input = document.querySelector('#guessInput'), form = document.querySelector('#guessForm');
    const voice = document.querySelector('#voiceButton'), message = document.querySelector('#message');
    const families = { conquest: 'World Conquest', find: 'Find the Country', capital: 'Capital Clash', flag: 'Flag Games' };
    const variants = { relaxed:'Relaxed', sprint:'Sprint', blitz:'Blitz', sudden:'Sudden Death', continent:'Continent', standard:'Standard', classic:'Classic', recall:'Flag Recall', match:'Flag Match' };
    let remote = null, remoteKey = null, lastRemoteEvent = null, soloReplay = null, queuedText = null, queuedCountry = null;
    let family = profile.data.lastMode.family, lastConfig = null, result = null, platform = true, feedbackTimer, startToken = 0, suppressResults = false;
    app.insertAdjacentHTML('afterbegin', `
      <header class="platform-header"><div><span class="brand-kicker">COUNTRY MEMORY MAP</span><h1 id="gameTitle">Choose your game</h1></div><button id="endGame" type="button" hidden>End round</button><button id="freeMap" type="button">Free map</button></header>
      <section class="game-hud" aria-label="Game statistics" hidden>
        <div class="hud-stat"><span id="progressLabel">Found</span><strong id="gameProgress">0 / 195</strong></div>
        <div class="hud-stat"><span>Score</span><strong id="gameScore">0</strong></div>
        <div class="hud-stat"><span>Streak</span><strong id="gameStreak">0</strong></div>
        <div class="hud-stat timer-stat"><span id="timerLabel">Elapsed</span><strong id="gameTime">0:00</strong></div>
        <div id="gameLives" aria-label="Lives remaining" hidden></div>
      </section>
      <section id="flagGameView" class="flag-game-view" aria-label="Flag quiz" hidden>
        <div class="flag-round-heading"><span id="flagQuestionLabel">FLAG RECALL</span><span id="flagQuestionNumber"></span><span id="flagQuestionTime" aria-label="Time remaining"></span></div>
        <div id="flagStage" class="flag-stage"></div>
        <h2 id="flagPrompt" class="flag-prompt"></h2>
        <div id="flagOutlineStage" class="flag-outline-stage" role="img" aria-label="Country outline" hidden></div>
        <div id="flagChoices" class="flag-choices" role="group" aria-label="Flag choices" hidden></div>
        <div class="flag-tools"><button id="flagHintButton" type="button">Use a hint <span aria-hidden="true">−25</span></button><p id="flagHintText" class="flag-hint" role="status" aria-live="polite"></p></div>
      </section>
      <section class="setup-panel" aria-label="Choose a game">
        <p class="eyebrow">THE WORLD IS YOUR PLAYGROUND</p><h2>Where will you begin?</h2>
        <div class="game-choices" role="group" aria-label="Game">
          <button type="button" data-family="conquest"><b>World Conquest</b><span>Name countries. Build your streak.</span></button>
          <button type="button" data-family="find"><b>Find the Country</b><span>See the name. Find it on the map.</span></button>
          <button type="button" data-family="capital"><b>Capital Clash</b><span>Connect countries and their capitals.</span></button>
          <button type="button" data-family="flag" data-flag-variant="recall"><b>Flag Recall</b><span>See a flag. Type the country.</span></button>
          <button type="button" data-family="flag" data-flag-variant="match"><b>Flag Match</b><span>See a name. Pick the flag.</span></button>
        </div>
        <div class="setup-fields"><label>Format<select id="gameVariant"></select></label><label id="difficultyField">Difficulty<select id="gameDifficulty"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="expert">Expert</option></select></label><label id="questionTimeField">Time per question<select id="gameQuestionTime"><option value="30">30 seconds</option><option value="20" selected>20 seconds</option><option value="15">15 seconds</option><option value="10">10 seconds · challenging</option></select></label><label id="regionField" hidden>Continent<select id="gameRegion"></select></label></div>
        <p id="gameRules" class="game-rules"></p><p id="setupError" role="status"></p>
        <button type="button" id="startGame" class="primary-button">Start playing <span aria-hidden="true">↗</span></button>
        <details class="rules-details"><summary>Scoring & rules</summary><p>New answer: 100 points × speed bonus × streak bonus, rounded. Under 2s: ×1.30; under 4s: ×1.20; up to 7s: ×1.10. Streaks of 5 / 10 / 20 / 40 earn ×1.05 / ×1.10 / ×1.20 / ×1.30.</p><p>World Conquest: duplicates change nothing. Invalid submissions reset your streak, and accuracy measures accepted entries. Other games: choose 10, 15, 20, or 30 seconds per question; wrong attempts cost 25 then 50 points. A third mistake or timeout reveals the answer, and accuracy measures questions answered correctly.</p><p>Flag games use the same transparent scoring. Each hint removes 25 points; wrong attempts cost 25, then 50. Flag Match options are unique, with Easy using contrasting choices, Medium favouring the same region, and Hard favouring visually confusable flags.</p></details>
        <details id="recentPanel" class="rules-details"><summary>Recent rounds on this device</summary><div id="recentResults"></div></details>
        <p class="storage-note" id="storageNote"></p>
      </section>
      <dialog id="resultsDialog" aria-labelledby="resultsTitle"><div class="results-content"><p class="eyebrow" id="resultsMode"></p><h2 id="resultsTitle">Round complete</h2><p id="personalBest" class="personal-best" hidden>NEW PERSONAL BEST</p><div id="resultStats" class="result-stats"></div><p id="resultRegions"></p><p id="resultNote" class="result-note"></p><details id="missedDetails"><summary id="missedSummary">Countries to practise</summary><div id="missedList"></div></details><div id="finalMistakes"></div><div class="result-actions"><button type="button" id="playAgain" class="primary-button">Play Again</button><button type="button" id="practiceMissed">Practice Missed</button><button type="button" id="chooseGame">Choose game</button><button type="button" id="challengeFriends">Challenge Friends</button></div></div></dialog>
    `);
    const shell = document.querySelector('.map-shell');
    shell.insertAdjacentHTML('beforeend','<div id="milestone" class="milestone" role="status" hidden></div>');
    shell.insertAdjacentHTML('beforeend','<div id="soloCountdown" class="solo-countdown" role="status" hidden></div>');
    form.insertAdjacentHTML('beforebegin','<div id="questionPanel" class="question-panel" hidden><div class="question-heading"><span id="questionLabel"></span><span id="questionTime"></span></div><h2 id="questionPrompt"></h2><p id="questionHint"></p><div class="question-track"><div id="questionBar"></div></div></div>');
    const $ = id => document.getElementById(id);
    const flagView = $('flagGameView'), flagStage = $('flagStage'), flagPrompt = $('flagPrompt'), flagOutlineStage = $('flagOutlineStage'), flagChoices = $('flagChoices');
    const engine = new Engine(countries, { onEvent });
    const map = createGameMap(GameMap, (id, regionName) => {
      if (!platform || engine.state.gameStatus !== 'playing') return;
      if (!id && regionName) { if(remote)remote.submit('country','');else {soloReplay?.actions.push({kind:'country',value:'',at:Date.now()-engine.state.startedAt});engine.submitCountry(null, regionName);} return; }
      if (remote) {
        const name=byId.get(id)?.canonical_name||'selection';
        map.pending(id);map.enableClick(false);textFeedback(`Checking ${name}…`,'pending');
        Promise.resolve(remote.submit('country', id)).then(ok=>{
          map.clearPending();
          if(!ok){textFeedback('Could not submit. Tap the country again.','bad');if(engine.state.feedbackUntil===null)map.enableClick(true);}
        });
        return;
      }
      tickSolo();
      if (engine.state.feedbackUntil !== null) { queuedCountry = id; textFeedback('Next location queued…','pending'); return; }
      if (engine.state.gameStatus === 'playing') soloReplay?.actions.push({ kind:'country',value:id,at:Date.now()-engine.state.startedAt });
      engine.submitCountry(id);
    });
    const feedbackController = feedbackEnabled && GameplayFeedbackController && MapFeedbackAdapter ? new GameplayFeedbackController({
      adapter: new MapFeedbackAdapter(map),
      manager: players,
      reducedMotion: () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
      animateHud(target) { const element = target === 'streak' ? $('gameStreak') : $('gameProgress'); animate(element, target === 'streak' ? 'streak-pulse' : 'counter-pulse'); }
    }) : null;
    const profileUI = profilesEnabled && ProfileUI && players ? new ProfileUI(app, players, {
      async beforeSwitch() {
        if (!tracker?.hasActiveSession()) return;
        suppressResults = true;
        tracker.finish('player_switch', engine.state);
        if (engine.state.gameStatus === 'playing') engine.finish('player_switch');
        menu();
        suppressResults = false;
      }
    }) : null;
    profileUI?.mount();
    players?.initialize().then(() => { if (!players.active) profileUI?.open('create'); });
    function tickSolo() {
      const at=Date.now(),s=engine.state;
      if(s.gameStatus==='playing'&&((s.deadline!==null&&at>=s.deadline)||(s.feedbackUntil!==null&&at>=s.feedbackUntil)||(s.currentQuestion&&!s.currentQuestion.resolved&&at>=s.currentQuestion.deadline)))soloReplay?.actions.push({kind:'tick',at:at-s.startedAt});
      engine.tick(at);
    }
    const formatTime = seconds => { const value = Math.max(0, Math.floor(seconds || 0)); return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`; };
    function textFeedback(text, type = '') { message.textContent = text; message.className = `message ${type}`; }
    function animate(element, className) { element.classList.remove(className); void element.offsetWidth; element.classList.add(className); element.addEventListener('animationend',()=>element.classList.remove(className),{once:true}); }
    function focusTyping() {
      if (engine.config?.family === 'flag' && (window.innerWidth < 600 || !matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
      const keepMobileKeyboard = document.activeElement === input;
      if (!input.disabled && !form.hidden && (keepMobileKeyboard || matchMedia('(hover: hover) and (pointer: fine)').matches)) input.focus({preventScroll:true});
    }
    function editDistance(a,b) {
      const row=Array.from({length:b.length+1},(_,i)=>i);
      for(let i=1;i<=a.length;i++){
        let previous=row[0];row[0]=i;
        for(let j=1;j<=b.length;j++){const saved=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=saved;}
      }
      return row[b.length];
    }
    function voiceAnswer(alternatives) {
      const q=engine.state.currentQuestion;
      let candidates=[];
      if(engine.config?.family==='conquest'){
        candidates=engine.pool.filter(c=>!engine.state.completedCountries.has(c.country_id))
          .flatMap(c=>c.accepted_names.map(name=>({key:GeographyGame.normalize(name),answer:c.canonical_name,label:c.canonical_name})));
      }else if(q?.type===TYPES.CAPITAL_TYPING){
        const c=byId.get(q.countryId);
        candidates=c.capital.flatMap(capital=>[capital.name,...capital.aliases].map(name=>({key:GeographyGame.normalize(name),answer:capital.name,label:capital.name})));
      }else if(q?.type===TYPES.FLAG_RECALL){
        candidates=engine.pool.flatMap(c=>engine.validator.namesFor(c.country_id).map(name=>({key:GeographyGame.normalize(name),answer:c.canonical_name,label:c.canonical_name})));
      }
      const heard=alternatives.map(value=>({raw:value,key:GeographyGame.normalize(value)})).filter(x=>x.key);
      for(const item of heard){const exact=candidates.find(c=>c.key===item.key);if(exact)return {...exact,heard:item.raw,exact:true};}
      const ranked=[];
      for(const item of heard)for(const candidate of candidates){const distance=editDistance(item.key,candidate.key),longest=Math.max(item.key.length,candidate.key.length),allowed=longest>=9?2:longest>=4?1:0;if(distance<=allowed)ranked.push({...candidate,heard:item.raw,distance,ratio:distance/longest});}
      ranked.sort((a,b)=>a.ratio-b.ratio||a.distance-b.distance||a.label.localeCompare(b.label));
      if(!ranked.length)return null;
      const best=ranked[0],runner=ranked.find(x=>x.answer!==best.answer);
      return runner&&runner.ratio<=best.ratio+0.04?null:best;
    }
    function showMilestone(text) { clearTimeout(feedbackTimer); $('milestone').textContent = text; $('milestone').hidden = false; animate($('milestone'),'milestone-pop'); feedbackTimer = setTimeout(()=>$('milestone').hidden=true,900); }
    function syncChoiceSelection() {
      const selectedVariant = $('gameVariant').value;
      document.querySelectorAll('[data-family]').forEach(button => {
        const selected = button.dataset.family === family && (!button.dataset.flagVariant || button.dataset.flagVariant === selectedVariant);
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    }
    function activeConfig() { return { family, variant:$('gameVariant').value, difficulty:$('gameDifficulty').value, region:$('gameRegion').value, questionTime:Number($('gameQuestionTime').value) }; }
    function chooseFamily(next, variant) {
      family = next;
      $('gameVariant').replaceChildren(...Object.keys(MODES[family]).map(value=>new Option(variants[value],value)));
      if (variant && MODES[family][variant]) $('gameVariant').value = variant;
      syncChoiceSelection();
      updateSetup();
    }
    function updateSetup() {
      const c = activeConfig(); $('difficultyField').hidden = family === 'conquest'; $('questionTimeField').hidden = family === 'conquest'; $('regionField').hidden = c.variant !== 'continent';
      const region = c.variant === 'continent' ? c.region : 'World';
      const rules = family === 'conquest' ? {
        relaxed: 'No time limit. Name all 195 countries, or end whenever you like. Your completion time is the challenge.',
        sprint: 'Three minutes. Name as many countries as you can before the clock runs out.',
        blitz: 'Sixty seconds. Keep typing, keep your streak alive.',
        sudden: 'Three lives. A wrong submission costs a life; duplicates are safe. No round timer.',
        continent: `Conquer ${region}. Only countries in this continent count; the rest of the world stays dimmed.`
      }[c.variant] : family === 'find' ? (c.variant==='blitz'?'Sixty seconds. Find as many countries as possible.':`20 questions${c.variant==='continent'?` in ${region}`:''}. Tap the country on the map.`) : family === 'capital' ?
        (c.variant==='blitz'?'Sixty seconds. Alternate naming capitals and finding their countries.':`20 questions${c.variant==='continent'?` in ${region}`:''}: 10 typed capitals and 10 map locations.`) :
        (c.variant === 'match' ? '20 questions. See a country name and choose one of four unique flags.' : '20 questions. Identify an authentic flag by typing its country name. No answer suggestions are shown during recall.');
      $('gameRules').textContent = rules;
      $('setupError').textContent = '';
      syncChoiceSelection();
      profile.select(c);
    }
    function updateRecent() {
      $('recentResults').replaceChildren(...profile.data.recent.slice(0,5).map(r=>{const p=document.createElement('p');p.textContent=`${families[r.config?.family] || 'Round'} · ${variants[r.config?.variant] || ''}: ${r.correct} correct · ${r.score} points`;return p;}));
      $('recentPanel').hidden = !profile.data.recent.length;
      $('storageNote').textContent = profile.available ? 'Personal bests and recent rounds are saved on this device.' : 'Device storage is unavailable. You can still play; results last for this visit.';
    }
    function disableFlagAnswers(keepRecallInput = false) {
      input.disabled = !keepRecallInput; voice.disabled = !keepRecallInput;
      flagChoices.querySelectorAll('button').forEach(button => { button.disabled = true; });
      $('flagHintButton').disabled = true;
    }
    function renderFlagQuestion(q, s) {
      const country = byId.get(q.countryId);
      if (!country || !window.FlagComponent) return;
      flagView.hidden = false;
      flagView.classList.remove('flag-answer-good','flag-answer-bad');
      $('flagQuestionLabel').textContent = q.type === TYPES.FLAG_MATCH ? 'FLAG MATCH' : 'FLAG RECALL';
      $('flagQuestionNumber').textContent = `${s.questionNumber}${s.questionLimit ? ` / ${s.questionLimit}` : ''}`;
      $('flagHintButton').disabled = false;
      $('flagHintText').textContent = 'Hints cost 25 points.';
      flagStage.replaceChildren();
      flagOutlineStage.replaceChildren();
      flagOutlineStage.hidden = true;
      flagChoices.replaceChildren();
      if (q.type === TYPES.FLAG_RECALL) {
        flagStage.hidden = false;
        flagStage.appendChild(FlagComponent.create(country, { size:'hero', alt:'Flag to identify', fetchPriority:'high' }));
        flagPrompt.textContent = 'Which country flies this flag?';
        flagChoices.hidden = true;
        form.hidden = false; input.disabled = false; voice.disabled = false;
        markButton.textContent = 'Check answer';
        input.placeholder = 'Type a country name'; input.setAttribute('aria-label','Type a country name');
        voice.setAttribute('aria-label','Say country name'); voice.title = 'Say country name';
        textFeedback('Type the country name. No answer list is shown during recall.');
        focusTyping();
        return;
      }
      flagStage.hidden = true;
      flagPrompt.textContent = q.prompt;
      const feature = country.map_geometry_id ? GameMap.feature(country.map_geometry_id) : null;
      if (feature && window.CountryOutlineComponent) {
        flagOutlineStage.appendChild(CountryOutlineComponent.create(feature, { ariaLabel:`Outline map of ${country.canonical_name}` }));
        flagOutlineStage.hidden = false;
      }
      flagChoices.hidden = false;
      flagChoices.setAttribute('aria-label',`Four flag options for ${q.prompt}`);
      q.options.forEach((id, index) => {
        const optionCountry = byId.get(id);
        const letter = String.fromCharCode(65 + index);
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'flag-option'; button.dataset.flagId = id;
        button.setAttribute('aria-label',`Flag option ${letter}`);
        button.appendChild(FlagComponent.create(optionCountry, { size:'card', alt:`Flag option ${letter}` }));
        const label = document.createElement('span'); label.className = 'flag-option-label'; label.textContent = `Option ${letter}`;
        button.appendChild(label);
        button.addEventListener('click', () => {
          if (button.disabled || engine.state.gameStatus !== 'playing') return;
          tickSolo();
          soloReplay?.actions.push({ kind:'flag', value:id, at:Date.now()-engine.state.startedAt });
          engine.submitFlag(id);
        });
        flagChoices.appendChild(button);
      });
      form.hidden = true; input.disabled = true; voice.disabled = true; markButton.textContent = 'Mark';
      textFeedback('Choose the flag that belongs to this country.');
    }
    function flagButtonFor(id) {
      return [...flagChoices.querySelectorAll('button')].find(button => button.dataset.flagId === id) || null;
    }
    async function start(config = activeConfig()) {
      if (profilesEnabled && players && !players.active) { profileUI?.open('create'); textFeedback('Create a player before starting a score-bearing round.','bad'); return; }
      if (tracker?.hasActiveSession()) {
        suppressResults = true;
        tracker.finish('mode_change', engine.state);
        if (engine.state.gameStatus === 'playing') engine.finish('mode_change');
        suppressResults = false;
      }
      const token=++startToken;
      remote = null; remoteKey = null; lastConfig = {...config}; result = null;
      platform = true; app.classList.add('platform'); app.classList.remove('choosing','round-ended');
      const flagGame = config.family === 'flag';
      app.classList.toggle('flag-platform', flagGame);
      $('resultsDialog').close(); $('setupError').textContent='';
      document.querySelector('.setup-panel').hidden=true;document.querySelector('.game-hud').hidden=true;
      $('endGame').hidden=true;$('freeMap').hidden=true;input.disabled=true;voice.disabled=true;
      flagView.hidden = true; form.hidden = flagGame; flagChoices.hidden = true;
      if (flagGame) map.restore(); else map.start(config.variant==='continent'?config.region:'World',countries);
      const countdown=$('soloCountdown');countdown.hidden=false;
      for(const value of [3,2,1]){countdown.textContent=value;await new Promise(resolve=>setTimeout(resolve,900));if(token!==startToken)return;}
      countdown.textContent='GO';await new Promise(resolve=>setTimeout(resolve,300));
      if(token!==startToken)return;countdown.hidden=true;
      try { const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1; const random = GeographyGame.seededRandom(seed); engine.random = () => random.next(); soloReplay = {seed,actions:[]}; queuedText = null; queuedCountry = null; engine.start({...config,seed}); profile.select(config); }
      catch(error) { app.classList.add('choosing'); document.querySelector('.setup-panel').hidden=false; $('setupError').textContent=error.message; return; }
    }
    function updateHUD(s) {
      if (!platform || s.gameStatus === 'idle') return;
      const conquest = engine.config.family === 'conquest';
      $('progressLabel').textContent = conquest ? 'Countries' : 'Correct';
      $('gameProgress').textContent = conquest ? `${s.completedCountries.size} / ${engine.pool.length}` : `${s.correctAnswers} / ${s.questionLimit || s.questionNumber}`;
      $('gameScore').textContent = s.score.toLocaleString(); $('gameStreak').textContent = s.streak;
      $('timerLabel').textContent = s.remainingTime === null ? 'Elapsed' : 'Remaining';
      $('gameTime').textContent = formatTime(s.remainingTime === null ? s.elapsedTime : Math.ceil(s.remainingTime));
      $('gameTime').classList.toggle('urgent',s.remainingTime !== null && s.remainingTime<=10);
      $('gameLives').hidden = s.lives === null;
      if (s.lives !== null) { $('gameLives').textContent = '♥'.repeat(s.lives)+'♡'.repeat(3-s.lives); $('gameLives').setAttribute('aria-label',`${s.lives} lives remaining`); }
      if (s.currentQuestion) {
        const remaining = s.currentQuestion.resolved ? 0 : Math.max(0,(s.currentQuestion.deadline-engine.now())/1000);
        $('questionTime').textContent = `${Math.ceil(remaining)}s · ${s.questionNumber}${s.questionLimit?` / ${s.questionLimit}`:''}`;
        $('flagQuestionTime').textContent = `${Math.ceil(remaining)}s`;
        $('questionBar').style.width = `${100*remaining/Math.max(1,s.currentQuestion.timeLimit)}%`;
      }
    }
    function onEvent(event,s) {
      tracker?.onEvent(event, s, engine.config || {});
      if (event.type === 'start') {
        document.querySelector('.setup-panel').hidden=true; document.querySelector('.game-hud').hidden=false;
        $('endGame').hidden=false; $('freeMap').hidden=true;
        $('gameTitle').textContent=`${families[engine.config.family]} · ${variants[engine.config.variant]}${engine.config.practiceIds?' · Practice':''}`;
        document.title = $('gameTitle').textContent;
        input.value=''; input.disabled=false; voice.disabled=false;
        GameMap.stopVoice();
        const flagGame = engine.config.family === 'flag';
        app.classList.toggle('flag-platform', flagGame);
        if (flagGame) {
          map.restore();
          form.hidden = true;
          flagView.hidden = true;
        } else {
          map.start(engine.config.variant==='continent'?engine.config.region:'World',countries);
          form.hidden = false;
        }
        $('milestone').hidden=true;
      } else if (event.type === 'question') {
        GameMap.stopVoice();
        const q = event.question, conquest = engine.config.family==='conquest';
        if (engine.config.family === 'flag') {
          app.classList.add('flag-platform');
          $('questionPanel').hidden = true;
          app.classList.remove('map-question');
          const nextText = queuedText; queuedText = null;
          renderFlagQuestion(q, s);
          if (q.type === TYPES.FLAG_RECALL && nextText !== null) setTimeout(() => {
            if (remote || engine.state.gameStatus !== 'playing' || engine.state.feedbackUntil !== null) return;
            input.value = nextText; window.gameController.handleText(nextText);
          }, 0);
          updateHUD(s);
          return;
        }
        const typing = conquest || q.type===TYPES.CAPITAL_TYPING;
        $('questionPanel').hidden = conquest;
        form.hidden = !typing; input.disabled = !typing; voice.disabled = !typing;
        app.classList.toggle('map-question',!typing);
        if (!conquest) {
          const c = byId.get(q.countryId); map.prepare(q,c);
          $('questionLabel').textContent = q.type === TYPES.COUNTRY_CLICK ? 'FIND THE COUNTRY' : q.type === TYPES.CAPITAL_COUNTRY_CLICK ? 'FIND THE COUNTRY OF' : 'NAME THE CAPITAL OF';
          $('questionPrompt').textContent=q.prompt;
          const multiple = c.capital.length > 1;
          $('questionHint').textContent = typing ? (c.iso_code==='IDN' ? 'Name the current government seat or the designated future capital.' : multiple ? 'Name one listed capital or administrative centre.' : `Name its ${c.capital[0].role}.`) :
            (q.type===TYPES.CAPITAL_COUNTRY_CLICK ? `${q.role}. Tap its country on the map.` : 'Tap the map. Dots make small countries easier to select.');
          GameMap.svg.setAttribute('aria-label','Interactive answer map. Use arrow keys to move between locations and Enter to select.');
          textFeedback(typing?'Enter a capital, then press Enter.':'Pinch to zoom. Drag to explore.');
        } else textFeedback('Name a new country. Aliases and country codes work too.');
        input.placeholder = conquest ? 'Type a country name' : 'Type a capital name'; input.setAttribute('aria-label',input.placeholder);
        voice.setAttribute('aria-label',conquest?'Say country name':'Say capital name');
        input.value='';
        const nextCountry = queuedCountry; queuedCountry = null;
        const nextText = queuedText; queuedText = null;
        if (nextCountry !== null || nextText !== null) setTimeout(() => {
          if (remote || engine.state.gameStatus !== 'playing' || engine.state.feedbackUntil !== null) return;
          if (!typing && nextCountry !== null) engine.submitCountry(nextCountry);
          else if (typing && nextText !== null) { input.value = nextText; window.gameController.handleText(nextText); }
        }, 0);
        if (typing) focusTyping();
      } else if (event.type === 'correct') {
        const c=byId.get(event.countryId);
        if (engine.config.family === 'flag') {
          flagView.classList.remove('flag-answer-bad'); flagView.classList.add('flag-answer-good');
          disableFlagAnswers(engine.config.variant === 'recall');
          textFeedback(`Correct — ${c.canonical_name} · +${event.gained} · ${event.seconds.toFixed(1)}s${event.hintPenalty ? ` · hint −${event.hintPenalty}` : ''}`,'good');
          animate(flagView,'flag-correct');
        } else {
          if (feedbackController) feedbackController.correct(event.countryId, engine.config, s); else map.mark(event.countryId);
          textFeedback(`${c.canonical_name} · +${event.gained} · ${event.seconds.toFixed(1)}s`,'good');
          animate($('gameScore'),'score-pop');
          if (engine.config.family!=='conquest') {
            const typing = engine.state.currentQuestion?.type === TYPES.CAPITAL_TYPING;
            input.disabled = !typing; voice.disabled = !typing; map.enableClick(true);
          }
        }
      } else if (event.type === 'wrong') {
        if (engine.config.family === 'flag') {
          flagView.classList.remove('flag-answer-good'); flagView.classList.add('flag-answer-bad');
          const wrongButton = engine.state.currentQuestion?.type === TYPES.FLAG_MATCH ? flagButtonFor(event.countryId) : null;
          if (wrongButton) { wrongButton.classList.add('flag-option-wrong'); wrongButton.disabled = true; }
          textFeedback(`Not quite. Try again${event.penalty ? ` · −${event.penalty}` : ''}.`,'bad');
          animate(flagView,'flag-wrong');
        } else {
          if (event.countryId && feedbackEnabled) map.feedback(event.countryId,'bad');
          const clicked = byId.get(event.countryId)?.canonical_name || event.clickedName;
          textFeedback(engine.config.family==='conquest' ? (event.reason==='region'?'Outside this continent. Streak reset.':'Not recognised. Streak reset.') : `${clicked?clicked+'. ':''}Try again${event.penalty?` · −${event.penalty}`:''}.`,'bad');
          animate(form.closest('.control'),'wrong-answer');
        }
      } else if (event.type === 'duplicate') textFeedback('Already found.');
      else if (event.type === 'hint') {
        if (engine.config.family === 'flag') {
          const removeButton = event.removeId ? flagButtonFor(event.removeId) : null;
          if (removeButton) { removeButton.hidden = true; removeButton.setAttribute('aria-hidden','true'); }
          $('flagHintButton').disabled = true;
          $('flagHintText').textContent = `${event.hint} (−${event.penalty} points)`;
          textFeedback(event.hint,'pending');
        }
      }
      else if (event.type === 'reveal') {
        const c=byId.get(event.countryId); const q=s.currentQuestion;
        if (engine.config.family === 'flag') {
          disableFlagAnswers(); flagView.classList.remove('flag-answer-good'); flagView.classList.add('flag-answer-bad');
          if (q.type === TYPES.FLAG_MATCH) flagButtonFor(event.countryId)?.classList.add('flag-option-correct');
          $('flagHintText').textContent = `Answer: ${c.canonical_name}.`;
          textFeedback(`${event.reason==='timeout'?'Time up.':'Answer revealed.'} The flag is ${c.canonical_name}.`,'bad');
        } else {
          if (feedbackEnabled) map.feedback(event.countryId,'reveal'); else map.mark(event.countryId);
          map.enableClick(false); input.disabled=true; voice.disabled=true;
          textFeedback(`${event.reason==='timeout'?'TIME UP':'Answer'} · ${q.type===TYPES.CAPITAL_TYPING?c.capital.map(c=>`${c.name} (${c.role})`).join(' / '):c.canonical_name}`,'bad');
        }
      } else if (event.type === 'milestone') showMilestone(`${event.count} COUNTRIES FOUND`);
      else if (event.type === 'end') {
        GameMap.stopVoice();input.disabled=true;voice.disabled=true;
        if (engine.config.family !== 'flag') map.end();
        $('endGame').hidden=true;
        event.result.replay = {config:engine.config,seed:soloReplay?.seed,actions:soloReplay?.actions||[],elapsed:Math.max(s.elapsedTime*1000,soloReplay?.actions.at(-1)?.at||0)};
        if (!suppressResults) { result=profile.record(event.result);showResults(result); }
      }
      updateHUD(s);
    }
    function showResults(r) {
      app.classList.add('round-ended');
      $('resultsMode').textContent=`${families[r.config.family]} · ${variants[r.config.variant]}`;
      $('resultsTitle').textContent=r.config.family==='conquest'&&r.completed ? (r.total===195?'WORLD CONQUERED':'REGION CONQUERED') : r.reason==='time'?'Time’s up':r.reason==='lives'?'Out of lives':'Round complete';
      $('personalBest').hidden=!r.personalBest;
      const isConquest=r.config.family==='conquest';
      const metrics = [[isConquest?'Countries found':'Correct answers',`${r.correct} / ${r.total}`],['Final score',r.score.toLocaleString()],['Accuracy',`${r.accuracy}%`],['Best streak',r.bestStreak],[r.completed?'Completion time':'Time played',formatTime(r.elapsedTime)],['Average correct answer',r.averageResponseTime===null?'—':`${r.averageResponseTime.toFixed(1)}s`],['Fastest correct answer',r.fastestAnswer===null?'—':`${r.fastestAnswer.toFixed(1)}s`],[isConquest?'Incorrect entries':'Missed / timed out',r.wrong]];
      $('resultStats').replaceChildren(...metrics.map(([label,value])=>{const el=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=value;span.textContent=label;el.append(strong,span);return el;}));
      const regionText = region=>region?`${region.name} (${region.correct}/${region.total})`:'—';
      $('resultRegions').textContent=`Strongest region: ${regionText(r.strongestRegion)}. Weakest region: ${regionText(r.weakestRegion)}.`;
      $('resultNote').textContent=isConquest
        ? 'Accuracy is the share of submitted country names that were accepted. Answer times use accepted countries only.'
        : `${r.config.family==='flag' ? 'Flags use the same 100-point base, speed/streak bonuses, and −25-point hints.' : 'Accuracy is the share of questions answered correctly.'} Answer times run from the prompt appearing until the correct answer, including retries.${r.incorrectAttempts?` You made ${r.incorrectAttempts} incorrect ${r.incorrectAttempts===1?'attempt':'attempts'}; these affect score and practice suggestions.`:''}${r.hintsUsed?` You used ${r.hintsUsed} hint${r.hintsUsed===1?'':'s'} for −${r.hintPenalty} points.`:''}`;
      $('missedSummary').textContent=`${r.config.family==='flag'?'Flags':'Countries'} to practise (${r.missedCountries.length})`;
      $('missedDetails').hidden=!r.missedCountries.length; $('missedDetails').open=false;
      $('missedList').replaceChildren(...r.missedCountries.map(id=>{const p=document.createElement('p');const c=byId.get(id);p.textContent=c?`${c.canonical_name}${r.config.family==='capital'?` — ${c.capital.map(x=>`${x.name} (${x.role})`).join('; ')}`:''}`:id;return p;}));
      $('finalMistakes').textContent=r.mistakes.length?`Submitted mistakes: ${r.mistakes.slice(-3).join(' · ')}`:'';
      $('practiceMissed').disabled=!r.missedCountries.length;
      $('challengeFriends').disabled=!!r.config.practiceIds || r.config.family==='flag';
      $('resultsDialog').showModal(); $('playAgain').focus(); updateRecent();
    }
    function menu() {
      startToken++; $('soloCountdown').hidden=true;
      queuedText = null; queuedCountry = null;
      $('resultsDialog').close(); map.restore(); platform=true;
      app.classList.add('platform','choosing');app.classList.remove('round-ended','map-question','flag-platform');
      document.querySelector('.setup-panel').hidden=false;document.querySelector('.game-hud').hidden=true;
      $('endGame').hidden=true;$('freeMap').hidden=false;$('questionPanel').hidden=true;
      $('gameTitle').textContent='Choose your game'; document.title='Country Memory Map';
      flagView.hidden=true; flagChoices.replaceChildren(); $('flagHintText').textContent=''; $('flagHintButton').disabled=false;
      form.hidden=false; markButton.textContent='Mark'; input.disabled=true; updateRecent();
    }
    function legacy() {
      startToken++; $('soloCountdown').hidden=true;
      queuedText = null; queuedCountry = null;
      platform=false; app.classList.remove('platform','choosing','round-ended','map-question','flag-platform'); map.restore();
      document.querySelector('.setup-panel').hidden=true; $('questionPanel').hidden=true;
      flagView.hidden=true; flagChoices.replaceChildren(); form.hidden=false;markButton.textContent='Mark';input.disabled=false;voice.disabled=false;
      textFeedback('Free map: the original country and capital checkers.');
    }
    window.gameController={
      previewVoice(heard) {
        if(!platform)return false;
        textFeedback(`Hearing: “${heard}”…`,'listening');return true;
      },
      handleVoice(alternatives) {
        if(!platform)return false;
        const match=voiceAnswer(alternatives),heard=alternatives[0]||'';
        if(!match){input.value=heard;textFeedback(`Heard “${heard}”, but no confident match. Try speaking again or edit the text · no penalty.`,'bad');return true;}
        input.value=match.answer;
        textFeedback(match.exact?`Heard “${match.label}”.`:`Heard “${match.heard}” · matched ${match.label}.`,'listening');
        window.gameController.handleText(match.answer);return true;
      },
      handleText(raw) {
        if (!platform) return false;
        if(remote){
          if(engine.state.gameStatus!=='playing'||!GeographyGame.normalize(raw))return true;
          const value=String(raw),pendingId=engine.config.family==='conquest'?engine.aliases.get(GeographyGame.normalize(value)):null;
          if(pendingId)map.pending(pendingId);
          input.disabled=true;voice.disabled=true;textFeedback(`Checking ${value}…`,'pending');
          Promise.resolve(remote.submit('text',value)).then(ok=>{
            map.clearPending();
            if(ok)input.value='';
            else{input.value=value;textFeedback('Could not submit. Your answer is still here—try again.','bad');input.disabled=false;voice.disabled=false;focusTyping();}
          });
          return 'pending';
        }
        tickSolo();
        if (engine.state.feedbackUntil !== null) { queuedText = String(raw); textFeedback('Next answer queued…','pending'); return 'pending'; }
        if(engine.state.gameStatus==='playing'){if(GeographyGame.normalize(raw))soloReplay?.actions.push({kind:'text',value:raw,at:Date.now()-engine.state.startedAt});engine.submitText(raw);}
        input.value='';focusTyping();return true;
      },
      connectRemote(hooks) { remote=hooks;engine.now=()=>remote?remote.now():Date.now(); },
      renderRemote(data) {
        if(!remote||!data.game)return;
        startToken++; $('soloCountdown').hidden=true;
        const s={...data.game,completedCountries:new Set(data.game.completedCountries)};
        const previousStatus=engine.state.gameStatus, key=data.match.id+':'+s.startedAt,previous=engine.state.currentQuestion?.id,isNewMatch=remoteKey!==key;
        engine.config=data.config;engine.pool=countries.filter(c=>data.config.variant!=='continent'||c.continent===data.config.region);engine.state=s;
        platform=true;app.classList.add('platform');app.classList.remove('choosing','round-ended');
        if(isNewMatch){remoteKey=key;lastRemoteEvent=null;onEvent({type:'start'},s);if(data.config.family==='conquest')s.completedCountries.forEach(id=>GameMap.mark(id));}
        if(s.gameStatus==='playing'){
          if(data.config.family==='conquest'){if(isNewMatch||form.hidden){onEvent({type:'question',question:{type:TYPES.COUNTRY_TYPING}},s);}}
          else if(previous!==s.currentQuestion?.id)onEvent({type:'question',question:s.currentQuestion},s);
          if(data.event?.id&&lastRemoteEvent!==data.event.id&&(data.config.family==='conquest'||data.event.questionId===s.currentQuestion?.id)){lastRemoteEvent=data.event.id;onEvent(data.event,s);}
          if(s.feedbackUntil===null){const typing=data.config.family==='conquest'||s.currentQuestion?.type===TYPES.CAPITAL_TYPING;input.disabled=!typing;voice.disabled=!typing;if(typing&&previous!==s.currentQuestion?.id)focusTyping();}
        }else{
          if (previousStatus === 'playing' && tracker?.hasActiveSession()) tracker.finish(data.result?.reason || s.result?.reason || 'completed', s, data.result || s.result);
          input.disabled=true;voice.disabled=true;$('endGame').hidden=true;map.end();
        }
        $('gameTitle').textContent= families[data.config.family]+' · Friends';updateHUD(s);
      },
      blockRemote(value) {input.disabled=value;voice.disabled=value;},
      exitRemote() { if (tracker?.hasActiveSession()) tracker.finish('abandoned', engine.state); remote=null;remoteKey=null;engine.state.gameStatus='idle';menu(); },
      closeResults() {$('resultsDialog').close();}

    };
    document.querySelectorAll('[data-family]').forEach(b=>b.addEventListener('click',()=>chooseFamily(b.dataset.family,b.dataset.flagVariant)));
    for (const name of ['Africa','Asia','Europe','North America','South America','Oceania']) $('gameRegion').add(new Option(`${name} · ${countries.filter(c=>c.continent===name).length} countries`,name));
    $('gameDifficulty').value=profile.data.difficulty;
    ['gameVariant','gameDifficulty','gameRegion','gameQuestionTime'].forEach(id=>$(id).addEventListener('change',updateSetup));
    $('startGame').addEventListener('click',()=>start());
    $('endGame').addEventListener('click',()=>remote?remote.finish():engine.finish('manual'));
    $('flagHintButton').addEventListener('click',()=>{
      if (engine.config?.family !== 'flag') return;
      engine.useHint();
    });
    $('playAgain').addEventListener('click',()=>start(lastConfig));
    $('practiceMissed').addEventListener('click',()=>start({...lastConfig,variant:lastConfig.family==='conquest'?'relaxed':lastConfig.family==='find'?'standard':lastConfig.family==='flag'?lastConfig.variant:'classic',practiceIds:result.missedCountries}));
    $('challengeFriends').addEventListener('click',()=>{if(window.Friends&&result?.replay){$('resultsDialog').close();window.Friends.challenge(result.replay);}});
    $('chooseGame').addEventListener('click',menu);$('freeMap').addEventListener('click',legacy);$('openGames').addEventListener('click',menu);
    $('resultsDialog').addEventListener('cancel',e=>{e.preventDefault();menu();});
    function syncKeyboard() {
      const viewport = window.visualViewport, height = viewport?.height || window.innerHeight;
      const typing = document.activeElement === input && !input.disabled && !form.hidden;
      app.classList.toggle('keyboard-open', platform && typing && window.innerWidth < 600 && height < 500);
      app.style.setProperty('--keyboard-top',`${viewport?.offsetTop||0}px`);
    }
    window.visualViewport?.addEventListener('resize', syncKeyboard);
    input.addEventListener('focus', syncKeyboard);
    input.addEventListener('blur', () => app.classList.remove('keyboard-open'));
    document.addEventListener('visibilitychange',()=>{if(!remote)tickSolo();});
    setInterval(()=>{
      if(!remote){tickSolo();return;}
      const s=engine.state;if(s.gameStatus==='playing'){s.elapsedTime=Math.max(0,(engine.now()-s.startedAt)/1000);if(s.deadline!==null){s.remainingTime=Math.max(0,(s.deadline-engine.now())/1000);if(!s.remainingTime){input.disabled=true;voice.disabled=true;}}updateHUD(s);}
    },50);
    chooseFamily(family,profile.data.lastMode.variant);menu();
  }
  if (window.GameMap?.countries.length) boot(); else window.addEventListener('mapready',boot,{once:true});
})();
