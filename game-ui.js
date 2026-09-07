/* Shared setup, HUD, feedback and results for every game configuration. */
(function () {
  'use strict';
  function boot() {
    if (!window.GameMap?.countries.length || window.gameController) return;
    const { Engine, LocalProfile, TYPES, MODES } = GeographyGame;
    const countries = buildGameCountries(GameMap), byId = new Map(countries.map(c => [c.country_id, c]));
    let storage; try { storage = window.localStorage; } catch { storage = null; }
    const profile = new LocalProfile(storage);
    const app = document.querySelector('.app'), input = document.querySelector('#guessInput'), form = document.querySelector('#guessForm');
    const voice = document.querySelector('#voiceButton'), message = document.querySelector('#message');
    const families = { conquest: 'World Conquest', find: 'Find the Country', capital: 'Capital Clash' };
    const variants = { relaxed:'Relaxed', sprint:'Sprint', blitz:'Blitz', sudden:'Sudden Death', continent:'Continent', standard:'Standard', classic:'Classic' };
    let remote = null, remoteKey = null, lastRemoteEvent = null, soloReplay = null;
    let family = profile.data.lastMode.family, lastConfig = null, result = null, platform = true, feedbackTimer;
    app.insertAdjacentHTML('afterbegin', `
      <header class="platform-header"><div><span class="brand-kicker">COUNTRY MEMORY MAP</span><h1 id="gameTitle">Choose your game</h1></div><button id="endGame" type="button" hidden>End round</button><button id="freeMap" type="button">Free map</button></header>
      <section class="game-hud" aria-label="Game statistics" hidden>
        <div class="hud-stat"><span id="progressLabel">Found</span><strong id="gameProgress">0 / 195</strong></div>
        <div class="hud-stat"><span>Score</span><strong id="gameScore">0</strong></div>
        <div class="hud-stat"><span>Streak</span><strong id="gameStreak">0</strong></div>
        <div class="hud-stat timer-stat"><span id="timerLabel">Elapsed</span><strong id="gameTime">0:00</strong></div>
        <div id="gameLives" aria-label="Lives remaining" hidden></div>
      </section>
      <section class="setup-panel" aria-label="Choose a game">
        <p class="eyebrow">THE WORLD IS YOUR PLAYGROUND</p><h2>Where will you begin?</h2>
        <div class="game-choices" role="group" aria-label="Game">
          <button type="button" data-family="conquest"><b>World Conquest</b><span>Name countries. Build your streak.</span></button>
          <button type="button" data-family="find"><b>Find the Country</b><span>See the name. Find it on the map.</span></button>
          <button type="button" data-family="capital"><b>Capital Clash</b><span>Connect countries and their capitals.</span></button>
        </div>
        <div class="setup-fields"><label>Format<select id="gameVariant"></select></label><label id="difficultyField">Difficulty<select id="gameDifficulty"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="expert">Expert</option></select></label><label id="regionField" hidden>Continent<select id="gameRegion"></select></label></div>
        <p id="gameRules" class="game-rules"></p><p id="setupError" role="status"></p>
        <button type="button" id="startGame" class="primary-button">Start playing <span aria-hidden="true">↗</span></button>
        <details class="rules-details"><summary>Scoring & rules</summary><p>New answer: 100 points × speed bonus × streak bonus, rounded. Under 2s: ×1.30; under 4s: ×1.20; up to 7s: ×1.10. Streaks of 5 / 10 / 20 / 40 earn ×1.05 / ×1.10 / ×1.20 / ×1.30.</p><p>World Conquest: duplicates change nothing. Invalid submissions reset your streak, and accuracy measures accepted entries. Other games: 10 seconds per question; wrong attempts cost 25 then 50 points. A third mistake or timeout reveals the answer, and accuracy measures questions answered correctly. Difficulty starts with editorial tiers, separately for capitals and map locations.</p></details>
        <details id="recentPanel" class="rules-details"><summary>Recent rounds on this device</summary><div id="recentResults"></div></details>
        <p class="storage-note" id="storageNote"></p>
      </section>
      <dialog id="resultsDialog" aria-labelledby="resultsTitle"><div class="results-content"><p class="eyebrow" id="resultsMode"></p><h2 id="resultsTitle">Round complete</h2><p id="personalBest" class="personal-best" hidden>NEW PERSONAL BEST</p><div id="resultStats" class="result-stats"></div><p id="resultRegions"></p><p id="resultNote" class="result-note"></p><details id="missedDetails"><summary id="missedSummary">Countries to practise</summary><div id="missedList"></div></details><div id="finalMistakes"></div><div class="result-actions"><button type="button" id="playAgain" class="primary-button">Play Again</button><button type="button" id="practiceMissed">Practice Missed</button><button type="button" id="chooseGame">Choose game</button><button type="button" id="challengeFriends">Challenge Friends</button></div></div></dialog>
    `);
    const shell = document.querySelector('.map-shell');
    shell.insertAdjacentHTML('beforeend','<div id="milestone" class="milestone" role="status" hidden></div>');
    form.insertAdjacentHTML('beforebegin','<div id="questionPanel" class="question-panel" hidden><div class="question-heading"><span id="questionLabel"></span><span id="questionTime"></span></div><h2 id="questionPrompt"></h2><p id="questionHint"></p><div class="question-track"><div id="questionBar"></div></div></div>');
    const $ = id => document.getElementById(id);
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
      if (engine.state.gameStatus === 'playing') soloReplay?.actions.push({ kind:'country',value:id,at:Date.now()-engine.state.startedAt });
      engine.submitCountry(id);
    });
    function tickSolo() {
      const at=Date.now(),s=engine.state;
      if(s.gameStatus==='playing'&&((s.deadline!==null&&at>=s.deadline)||(s.feedbackUntil!==null&&at>=s.feedbackUntil)||(s.currentQuestion&&!s.currentQuestion.resolved&&at>=s.currentQuestion.deadline)))soloReplay?.actions.push({kind:'tick',at:at-s.startedAt});
      engine.tick(at);
    }
    const formatTime = seconds => { const value = Math.max(0, Math.floor(seconds || 0)); return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`; };
    function textFeedback(text, type = '') { message.textContent = text; message.className = `message ${type}`; }
    function animate(element, className) { element.classList.remove(className); void element.offsetWidth; element.classList.add(className); element.addEventListener('animationend',()=>element.classList.remove(className),{once:true}); }
    function focusTyping() {
      const keepMobileKeyboard = document.activeElement === input;
      if (!input.disabled && !form.hidden && (keepMobileKeyboard || matchMedia('(hover: hover) and (pointer: fine)').matches)) input.focus({preventScroll:true});
    }
    function showMilestone(text) { clearTimeout(feedbackTimer); $('milestone').textContent = text; $('milestone').hidden = false; animate($('milestone'),'milestone-pop'); feedbackTimer = setTimeout(()=>$('milestone').hidden=true,900); }
    function activeConfig() { return { family, variant:$('gameVariant').value, difficulty:$('gameDifficulty').value, region:$('gameRegion').value }; }
    function chooseFamily(next, variant) {
      family = next;
      document.querySelectorAll('[data-family]').forEach(b=>{b.classList.toggle('selected',b.dataset.family===family);b.setAttribute('aria-pressed',String(b.dataset.family===family));});
      $('gameVariant').replaceChildren(...Object.keys(MODES[family]).map(value=>new Option(variants[value],value)));
      if (variant && MODES[family][variant]) $('gameVariant').value = variant;
      updateSetup();
    }
    function updateSetup() {
      const c = activeConfig(); $('difficultyField').hidden = family === 'conquest'; $('regionField').hidden = c.variant !== 'continent';
      const region = c.variant === 'continent' ? c.region : 'World';
      const rules = family === 'conquest' ? {
        relaxed: 'No time limit. Name all 195 countries, or end whenever you like. Your completion time is the challenge.',
        sprint: 'Three minutes. Name as many countries as you can before the clock runs out.',
        blitz: 'Sixty seconds. Keep typing, keep your streak alive.',
        sudden: 'Three lives. A wrong submission costs a life; duplicates are safe. No countdown.',
        continent: `Conquer ${region}. Only countries in this continent count; the rest of the world stays dimmed.`
      }[c.variant] : family === 'find' ? (c.variant==='blitz'?'Sixty seconds. Find as many countries as possible.':`20 questions${c.variant==='continent'?` in ${region}`:''}. Tap the country on the map.`) :
        (c.variant==='blitz'?'Sixty seconds. Alternate naming capitals and finding their countries.':`20 questions${c.variant==='continent'?` in ${region}`:''}: 10 typed capitals and 10 map locations.`);
      $('gameRules').textContent = rules;
      $('setupError').textContent = '';
      profile.select(c);
    }
    function updateRecent() {
      $('recentResults').replaceChildren(...profile.data.recent.slice(0,5).map(r=>{const p=document.createElement('p');p.textContent=`${families[r.config?.family] || 'Round'} · ${variants[r.config?.variant] || ''}: ${r.correct} correct · ${r.score} points`;return p;}));
      $('recentPanel').hidden = !profile.data.recent.length;
      $('storageNote').textContent = profile.available ? 'Personal bests and recent rounds are saved on this device.' : 'Device storage is unavailable. You can still play; results last for this visit.';
    }
    function start(config = activeConfig()) {
      remote = null; remoteKey = null; lastConfig = {...config}; result = null;
      platform = true; app.classList.add('platform'); app.classList.remove('choosing','round-ended');
      $('resultsDialog').close(); $('setupError').textContent='';
      try { const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1; const random = GeographyGame.seededRandom(seed); engine.random = () => random.next(); soloReplay = {seed,actions:[]}; engine.start({...config,seed}); profile.select(config); }
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
        $('questionBar').style.width = `${remaining*10}%`;
      }
    }
    function onEvent(event,s) {
      if (event.type === 'start') {
        document.querySelector('.setup-panel').hidden=true; document.querySelector('.game-hud').hidden=false;
        $('endGame').hidden=false; $('freeMap').hidden=true;
        $('gameTitle').textContent=`${families[engine.config.family]} · ${variants[engine.config.variant]}${engine.config.practiceIds?' · Practice':''}`;
        document.title = $('gameTitle').textContent;
        input.value=''; input.disabled=false; voice.disabled=false;
        GameMap.stopVoice();
        map.start(engine.config.variant==='continent'?engine.config.region:'World',countries);
        $('milestone').hidden=true;
      } else if (event.type === 'question') {
        GameMap.stopVoice();
        const q = event.question, conquest = engine.config.family==='conquest';
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
        input.value=''; if (typing) focusTyping();
      } else if (event.type === 'correct') {
        map.feedback(event.countryId,'good',engine.config.family==='conquest');
        const c=byId.get(event.countryId); textFeedback(`${c.canonical_name} · +${event.gained} · ${event.seconds.toFixed(1)}s`,'good');
        animate($('gameScore'),'score-pop');
        if (engine.config.family!=='conquest') { input.disabled=true; voice.disabled=true; map.enableClick(false); }
      } else if (event.type === 'wrong') {
        if (event.countryId) map.feedback(event.countryId,'bad');
        const clicked = byId.get(event.countryId)?.canonical_name || event.clickedName;
        textFeedback(engine.config.family==='conquest' ? (event.reason==='region'?'Outside this continent. Streak reset.':'Not recognised. Streak reset.') : `${clicked?clicked+'. ':''}Try again${event.penalty?` · −${event.penalty}`:''}.`,'bad');
        animate(form.closest('.control'),'wrong-answer');
      } else if (event.type === 'duplicate') textFeedback('Already found.');
      else if (event.type === 'reveal') {
        map.feedback(event.countryId,'reveal'); map.enableClick(false); input.disabled=true; voice.disabled=true;
        const c=byId.get(event.countryId); const q=s.currentQuestion;
        textFeedback(`${event.reason==='timeout'?'TIME UP':'Answer'} · ${q.type===TYPES.CAPITAL_TYPING?c.capital.map(c=>`${c.name} (${c.role})`).join(' / '):c.canonical_name}`,'bad');
      } else if (event.type === 'milestone') showMilestone(`${event.count} COUNTRIES FOUND`);
      else if (event.type === 'end') {
        GameMap.stopVoice();input.disabled=true;voice.disabled=true;map.end();$('endGame').hidden=true;
        event.result.replay = {config:engine.config,seed:soloReplay?.seed,actions:soloReplay?.actions||[],elapsed:Math.max(s.elapsedTime*1000,soloReplay?.actions.at(-1)?.at||0)};
        result=profile.record(event.result);showResults(result);
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
        : `Accuracy is the share of questions answered correctly. Answer times run from the prompt appearing until the correct answer, including retries.${r.incorrectAttempts?` You made ${r.incorrectAttempts} incorrect ${r.incorrectAttempts===1?'attempt':'attempts'}; these affect score and practice suggestions.`:''}`;
      $('missedSummary').textContent=`Countries to practise (${r.missedCountries.length})`;
      $('missedDetails').hidden=!r.missedCountries.length; $('missedDetails').open=false;
      $('missedList').replaceChildren(...r.missedCountries.map(id=>{const p=document.createElement('p');const c=byId.get(id);p.textContent=c?`${c.canonical_name}${r.config.family==='capital'?` — ${c.capital.map(x=>`${x.name} (${x.role})`).join('; ')}`:''}`:id;return p;}));
      $('finalMistakes').textContent=r.mistakes.length?`Submitted mistakes: ${r.mistakes.slice(-3).join(' · ')}`:'';
      $('practiceMissed').disabled=!r.missedCountries.length;
      $('challengeFriends').disabled=!!r.config.practiceIds;
      $('resultsDialog').showModal(); $('playAgain').focus(); updateRecent();
    }
    function menu() {
      $('resultsDialog').close(); map.restore(); platform=true;
      app.classList.add('platform','choosing');app.classList.remove('round-ended','map-question');
      document.querySelector('.setup-panel').hidden=false;document.querySelector('.game-hud').hidden=true;
      $('endGame').hidden=true;$('freeMap').hidden=false;$('questionPanel').hidden=true;
      $('gameTitle').textContent='Choose your game'; document.title='Country Memory Map';
      form.hidden=false; input.disabled=true; updateRecent();
    }
    function legacy() {
      platform=false; app.classList.remove('platform','choosing','round-ended','map-question'); map.restore();
      document.querySelector('.setup-panel').hidden=true; $('questionPanel').hidden=true;
      form.hidden=false;input.disabled=false;voice.disabled=false;
      textFeedback('Free map: the original country and capital checkers.');
    }
    window.gameController={
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
        tickSolo();if(engine.state.gameStatus==='playing'){if(GeographyGame.normalize(raw))soloReplay?.actions.push({kind:'text',value:raw,at:Date.now()-engine.state.startedAt});engine.submitText(raw);}
        input.value='';focusTyping();return true;
      },
      connectRemote(hooks) { remote=hooks;engine.now=()=>remote?remote.now():Date.now(); },
      renderRemote(data) {
        if(!remote||!data.game)return;
        const s={...data.game,completedCountries:new Set(data.game.completedCountries)};
        const key=data.match.id+':'+s.startedAt,previous=engine.state.currentQuestion?.id,isNewMatch=remoteKey!==key;
        engine.config=data.config;engine.pool=countries.filter(c=>data.config.variant!=='continent'||c.continent===data.config.region);engine.state=s;
        platform=true;app.classList.add('platform');app.classList.remove('choosing','round-ended');
        if(isNewMatch){remoteKey=key;lastRemoteEvent=null;onEvent({type:'start'},s);if(data.config.family==='conquest')s.completedCountries.forEach(id=>GameMap.mark(id));}
        if(s.gameStatus==='playing'){
          if(data.config.family==='conquest'){if(isNewMatch||form.hidden){onEvent({type:'question',question:{type:TYPES.COUNTRY_TYPING}},s);}}
          else if(previous!==s.currentQuestion?.id)onEvent({type:'question',question:s.currentQuestion},s);
          if(data.event?.id&&lastRemoteEvent!==data.event.id&&(data.config.family==='conquest'||data.event.questionId===s.currentQuestion?.id)){lastRemoteEvent=data.event.id;onEvent(data.event,s);}
          if(s.feedbackUntil===null){const typing=data.config.family==='conquest'||s.currentQuestion?.type===TYPES.CAPITAL_TYPING;input.disabled=!typing;voice.disabled=!typing;if(typing&&previous!==s.currentQuestion?.id)focusTyping();}
        }else{input.disabled=true;voice.disabled=true;$('endGame').hidden=true;map.end();}
        $('gameTitle').textContent= families[data.config.family]+' · Friends';updateHUD(s);
      },
      blockRemote(value) {input.disabled=value;voice.disabled=value;},
      exitRemote() {remote=null;remoteKey=null;engine.state.gameStatus='idle';menu();},
      closeResults() {$('resultsDialog').close();}

    };
    document.querySelectorAll('[data-family]').forEach(b=>b.addEventListener('click',()=>chooseFamily(b.dataset.family)));
    for (const name of ['Africa','Asia','Europe','North America','South America','Oceania']) $('gameRegion').add(new Option(`${name} · ${countries.filter(c=>c.continent===name).length} countries`,name));
    $('gameDifficulty').value=profile.data.difficulty;
    ['gameVariant','gameDifficulty','gameRegion'].forEach(id=>$(id).addEventListener('change',updateSetup));
    $('startGame').addEventListener('click',()=>start());
    $('endGame').addEventListener('click',()=>remote?remote.finish():engine.finish('manual'));
    $('playAgain').addEventListener('click',()=>start(lastConfig));
    $('practiceMissed').addEventListener('click',()=>start({...lastConfig,variant:lastConfig.family==='conquest'?'relaxed':lastConfig.family==='find'?'standard':'classic',practiceIds:result.missedCountries}));
    $('challengeFriends').addEventListener('click',()=>{if(window.Friends&&result?.replay){$('resultsDialog').close();window.Friends.challenge(result.replay);}});
    $('chooseGame').addEventListener('click',menu);$('freeMap').addEventListener('click',legacy);$('openGames').addEventListener('click',menu);
    $('resultsDialog').addEventListener('cancel',e=>{e.preventDefault();menu();});
    function syncKeyboard() {
      const height = window.visualViewport?.height || window.innerHeight;
      const typing = document.activeElement === input && !input.disabled && !form.hidden;
      app.classList.toggle('keyboard-open', platform && typing && window.innerWidth < 600 && height < 500);
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
