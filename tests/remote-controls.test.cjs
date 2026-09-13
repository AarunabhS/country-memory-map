const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
// Execute the actual controller methods with only the surrounding DOM and
// presentation callbacks stubbed. No room or answer-readiness logic is copied.
const source=fs.readFileSync('game-ui.js','utf8');
const methods=source.slice(source.indexOf('      renderRemote(data) {'),source.indexOf('      exitRemote()'));
function harness(now=5000){
  const elements=new Map();
  const context={
    remote:{},remoteSubmission:null,remoteKey:'match:3000',lastRemoteEvent:null,startToken:0,platform:true,
    countries:[],input:{disabled:false},voice:{disabled:false},
    engine:{state:{gameStatus:'playing',currentQuestion:{id:'question'}},now:()=>now},
    map:{click:false,clearPending(){},enableClick(value){this.click=value;},end(){this.click=false;}},
    app:{classList:{add(){},remove(){}},removeAttribute(){}},
    renderShell(){},onEvent(){},updateHUD(){},focusTyping(){},
    families:{conquest:'World Conquest',capital:'Capital Clash',find:'Find the Country'},
    TYPES:{CAPITAL_TYPING:'CAPITAL_TYPING',FLAG_RECALL:'FLAG_RECALL'},
    flagChoices:{querySelectorAll:()=>[]},
    $:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);},
  };
  vm.createContext(context);
  context.controller=vm.runInContext(`({${methods}})`,context);
  return context;
}
function state({family='capital',type='CAPITAL_TYPING',feedbackUntil=null}={}){
  return {match:{id:'match'},config:{family,variant:'blitz'},game:{gameStatus:'playing',startedAt:3000,completedCountries:[],feedbackUntil,currentQuestion:{id:'question',type}}};
}
test('countdown blocks both typed and map answers until the server start time',()=>{
  for(const family of ['capital','find']){
    const h=harness(2000);h.controller.renderRemote(state({family,type:family==='find'?'COUNTRY_CLICK':'CAPITAL_TYPING'}));
    assert.equal(h.input.disabled,true);assert.equal(h.voice.disabled,true);assert.equal(h.map.click,false);
  }
});
test('feedback pauses remote inputs and the next state restores the correct answer method',()=>{
  const h=harness();
  h.controller.renderRemote(state({feedbackUntil:5500}));
  assert.equal(h.input.disabled,true);assert.equal(h.voice.disabled,true);assert.equal(h.map.click,false);
  h.controller.renderRemote(state());
  assert.equal(h.input.disabled,false);assert.equal(h.voice.disabled,false);assert.equal(h.map.click,false);
  h.controller.renderRemote(state({family:'find',type:'COUNTRY_CLICK'}));
  assert.equal(h.input.disabled,true);assert.equal(h.voice.disabled,true);assert.equal(h.map.click,true);
});
test('a connection failure disables map selection as well as speech and typing',()=>{
  const h=harness();h.controller.renderRemote(state({family:'find',type:'COUNTRY_CLICK'}));
  h.controller.blockRemote(true);
  assert.equal(h.input.disabled,true);assert.equal(h.voice.disabled,true);assert.equal(h.map.click,false);
  h.controller.renderRemote(state({family:'find',type:'COUNTRY_CLICK'}));
  assert.equal(h.map.click,true);
});

test('a late answer from a departed screen cannot unlock or overwrite a new submission', async()=>{
  const ui=fs.readFileSync('multiplayer-ui.js','utf8');
  const submit=ui.slice(ui.indexOf(' async function submit('),ui.indexOf('\n function render('));
  const pending=[];let renders=0;
  const context={submitBusy:false,viewVersion:1,latest:{game:{},match:{id:'old'},nextSeq:1},questionShownAt:0,
    performance:{now:()=>1000},connection:{hidden:true},
    gameController:{blockRemote(){},renderRemote(){renders++;}},
    service:{action:()=>new Promise(resolve=>pending.push(resolve))}};
  vm.createContext(context);vm.runInContext(submit,context);
  const first=context.submit('text','India');
  // These are the same invalidations used by suspend when navigating away.
  context.viewVersion++;context.submitBusy=false;context.latest={game:{},match:{id:'new'},nextSeq:1};
  const second=context.submit('text','France');const active=context.submitBusy;
  pending[0]();assert.equal(await first,false);
  assert.equal(context.submitBusy,active);assert.equal(renders,0);
  pending[1]();assert.equal(await second,true);
  assert.equal(context.submitBusy,false);assert.equal(renders,1);
});

test('a new question invalidates pending feedback from the previous answer',()=>{
  const h=harness();h.remoteSubmission={label:'old answer'};
  const next=state();next.game.currentQuestion.id='next-question';
  h.controller.renderRemote(next);
  assert.equal(h.remoteSubmission,null);
  assert.equal(h.input.disabled,false);
});

test('an answer rejected after a deadline cannot show a stale error on the next question',async()=>{
  const ui=fs.readFileSync('multiplayer-ui.js','utf8');
  const submit=ui.slice(ui.indexOf(' async function submit('),ui.indexOf('\n function render('));
  let reject;
  const context={submitBusy:false,viewVersion:1,latest:{game:{currentQuestion:{id:'old'}},match:{id:'match'},nextSeq:1},questionShownAt:0,
    performance:{now:()=>1000},connection:{hidden:true,textContent:''},
    gameController:{blockRemote(){},renderRemote(){}},service:{action:()=>new Promise((_,fail)=>{reject=fail;})}};
  vm.createContext(context);vm.runInContext(submit,context);
  const answer=context.submit('country','El Salvador');
  context.latest.game.currentQuestion={id:'new'};
  reject(new Error('That question has ended.'));
  assert.equal(await answer,false);
  assert.equal(context.connection.hidden,true);assert.equal(context.connection.textContent,'');
});

test('remote Flag Recall enables text and speech; Match never enables the map',()=>{
 const h=harness();
 h.controller.renderRemote(state({family:'flag',type:'FLAG_RECALL'}));
 assert.equal(h.input.disabled,false);assert.equal(h.voice.disabled,false);assert.equal(h.map.click,false);
 h.controller.renderRemote(state({family:'flag',type:'FLAG_MATCH'}));
 assert.equal(h.input.disabled,true);assert.equal(h.voice.disabled,true);assert.equal(h.map.click,false);
 h.controller.renderRemote(state({family:'flag',type:'FLAG_RECALL',feedbackUntil:6000}));
 assert.equal(h.input.disabled,true);assert.equal(h.voice.disabled,true);
});
