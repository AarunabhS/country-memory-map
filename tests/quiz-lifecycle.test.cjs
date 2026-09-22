const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Game = require('../game-core.js');
const { ProfileManager, GameTracker } = require('../player-system.js');

function harness(questionCount = 1) {
  const elements = new Map(), events = [], storage = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, hidden: false, disabled: false, value: '', style: {}, dataset: {}, children: [],
      classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, focus() {},
      appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; },
      querySelectorAll() { return []; }
    });
    return elements.get(id);
  }
  const manager = new ProfileManager({getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v)}, null, {remoteSyncEnabled:false});
  manager.create({realName:'Test Player',nickname:'Tester'});
  const tracker = new GameTracker(manager, null);
  const profile = new Game.LocalProfile({getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v)});
  const countries = [{country_id:'NPL',iso_code:'NPL',canonical_name:'Nepal',accepted_names:['Nepal']}, {country_id:'IND',iso_code:'IND',canonical_name:'India',accepted_names:['India']}];
  const q = {id:'nepal',tier:'easy',category:'Flags',prompt:'Which flag?',accepted:['NPL'],targetCount:1,funFact:'Nepal.',hint:'Asia'};
  const context = {document:{getElementById:element,querySelector:element,createElement:()=>element(Symbol())}, setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},Date,Math,
    GeographyGame:Game,GeographyQuizData:{CONTENT_VERSION:'test-v1',getQuestionsByTier:()=>Array.from({length:questionCount},(_,i)=>({...q,id:`q${i}`}))},GameMap:{stopVoice(){}},matchMedia:()=>({matches:true})};
  vm.runInNewContext(fs.readFileSync('quiz-game.js','utf8'),context);
  function start() { context.QuizGame.start({tier:'easy',countries,questionCount,onEvent(event,state,config){events.push(event);tracker.onEvent(event,state,config);if(event.type==='end')profile.record(event.result);}}); }
  start();
  return {quiz:context.QuizGame,events,manager,profile,start,element};
}

test('Quiz completion emits one normalized result, records statistics and cannot score after completion',()=>{
  const h=harness();
  h.quiz.handleText('India');
  h.quiz.handleText('Nepal');
  const score=h.events.find(e=>e.type==='correct').gained;
  assert.equal(h.quiz.handleText('Nepal'),false,'completed category rejects further inputs');
  h.quiz.advanceQuestion();h.quiz.advanceQuestion();h.quiz.finish();h.quiz.deactivate();
  const ends=h.events.filter(e=>e.type==='end');assert.equal(ends.length,1);
  const r=ends[0].result;assert.equal(r.correct,1);assert.equal(r.total,1);assert.equal(r.accuracy,100);assert.equal(r.score,score);
  assert.equal(r.incorrectAttempts,1);assert.equal(r.capabilities.practice,false);assert.equal(r.capabilities.challenge,false);
  assert.equal(h.profile.data.recent.length,1);
  assert.equal(h.manager.active.stats.gamesStarted,1);assert.equal(h.manager.active.stats.gamesCompleted,1);
  assert.equal(h.manager.active.stats.lifetimeCorrect,1);assert.equal(h.manager.active.stats.lifetimeIncorrect,1);
  assert.equal(h.element('voiceButton').disabled,true);
});

test('Quiz reveal, hints, manual end and navigation retain honest partial results',()=>{
  const h=harness(2);
  h.quiz.advanceQuestion();assert.equal(h.events.length,1,'cannot skip an unresolved category through Next');
  h.quiz.useHint();h.quiz.revealCurrentQuestion();h.quiz.advanceQuestion();h.quiz.handleText('Nepal');h.quiz.finish('manual');
  const r=h.events.find(e=>e.type==='end').result;assert.equal(r.correct,1);assert.equal(r.total,2);assert.equal(r.accuracy,50);assert.equal(r.hintsUsed,1);assert.equal(r.completed,false);
  assert.equal(h.manager.active.stats.gamesCompleted,0);
  h.start();h.quiz.deactivate('mode_change');
  assert.equal(h.events.filter(e=>e.type==='end').length,2);assert.equal(h.profile.data.recent.length,2);
  assert.equal(h.events.at(-1).result.reason,'mode_change');assert.equal(h.quiz.isActive(),false);
});

test('shared results hide unsupported Quiz actions and restore core-game capabilities',()=>{
  const source=fs.readFileSync('game-ui.js','utf8');
  const code=source.slice(source.indexOf('    function showResults('),source.indexOf('    function menu('));
  const elements=new Map();
  const element=id=>{if(!elements.has(id))elements.set(id,{hidden:false,replaceChildren(){},showModal(){},focus(){},append(){}});return elements.get(id);};
  const c={app:{classList:{add(){}}},renderShell(){},$:element,document:{createElement:()=>element(Symbol())},families:{quiz:'Geo Quiz',find:'Find'},variants:{trivia:'Trivia',standard:'Standard'},formatTime:String,byId:new Map(),updateRecent(){}};
  vm.createContext(c);vm.runInContext(code,c);
  const result={config:{family:'quiz',variant:'trivia'},correct:0,total:1,score:0,accuracy:0,bestStreak:0,elapsedTime:1,averageResponseTime:null,fastestAnswer:null,wrong:1,missedCountries:[],mistakes:[],capabilities:{practice:false,challenge:false}};
  c.showResults(result);assert.equal(element('practiceMissed').hidden,true);assert.equal(element('challengeFriends').hidden,true);
  c.showResults({...result,config:{family:'find',variant:'standard'},missedCountries:['NPL'],capabilities:undefined,replay:{seed:1}});
  assert.equal(element('practiceMissed').hidden,false);assert.equal(element('practiceMissed').disabled,false);assert.equal(element('challengeFriends').hidden,false);assert.equal(element('challengeFriends').disabled,false);
});
