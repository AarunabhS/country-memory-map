import Game from './shared/game-core.cjs';
import countries from './shared/countries.json' with { type:'json' };
export const {Engine,normalize,calculateScore}=Game;
const DATA=countries, byId=new Map(DATA.map(c=>[c.country_id,c]));
export class RoomError extends Error { constructor(code,message,status=400){super(message);this.code=code;this.status=status;} }
const fail=(code,message,status)=>{throw new RoomError(code,message,status);};
export const rng=Game.seededRandom;
export function safeName(raw){const name=String(raw||'').normalize('NFC').replace(/[<>\u0000-\u001f\u007f]/g,'').trim();if(!name||[...name].length>20)fail('INVALID_NAME','Choose a name from 1 to 20 characters.');return name;}
export function config(input={},async=false){
 const family=['conquest','find','capital'].includes(input.family)?input.family:'conquest';
 const allowed=family==='conquest'?(async?['relaxed','sprint','blitz','sudden','continent']:['sprint','blitz','continent']):family==='find'?['standard','blitz','continent']:['classic','blitz','continent'];
 const variant=allowed.includes(input.variant)?input.variant:allowed[0];
 const difficulty=['easy','medium','hard','expert'].includes(input.difficulty)?input.difficulty:'medium';
 const region=['Africa','Asia','Europe','North America','South America','Oceania'].includes(input.region)?input.region:'Africa';
 const practiceIds=async&&Array.isArray(input.practiceIds)?[...new Set(input.practiceIds.filter(id=>byId.has(id)))].slice(0,195):[];
 return {family,variant,difficulty,region,...(practiceIds.length?{practiceIds}:{}),questionCount:[10,20,30].includes(input.questionCount)?input.questionCount:20,questionTime:[10,15,20,30].includes(Number(input.questionTime))?Number(input.questionTime):20};
}
function createEngine(settings,seed,startAt,now,snapshot,live=true){
 const random=rng(seed); const e=new Engine(DATA,{now:()=>now,random:()=>random.next()});e.start(settings);
 if(snapshot){e.state={...snapshot.state,completedCountries:new Set(snapshot.state.completedCountries)};e.queue=snapshot.queue.map(id=>byId.get(id));e.lastCountryId=snapshot.lastCountryId;random.state=snapshot.rngState;e.result=snapshot.result||null;}
 else{e.state.startedAt=startAt;e.state.lastCorrectAt=startAt;if(e.state.deadline!==null)e.state.deadline=startAt+(settings.variant==='sprint'?180:60)*1000;
 if(live&&settings.family==='conquest'&&settings.variant==='continent'){e.state.deadline=startAt+180000;e.state.remainingTime=180;}
 if(settings.family!=='conquest'){e.state.questionLimit=settings.practiceIds?.length|| (settings.variant==='blitz'?null:settings.questionCount);e.state.questionStartedAt=startAt;e.state.currentQuestion.deadline=startAt+settings.questionTime*1000;}}
 return {e,random};
}
function pack(e,random){return {state:{...e.state,completedCountries:[...e.state.completedCountries]},queue:e.queue.map(c=>c.country_id),lastCountryId:e.lastCountryId,rngState:random.state,result:e.result||null};}
function startPlayer(room,player,startAt,now){const {e,random}=createEngine(room.config,room.match.seed,startAt,now,undefined,room.kind==='live');player.game=pack(e,random);player.feedback=null;player.dnf=false;player.lastActionAt=startAt;player.lastSeq=0;player.lastResponse=null;}
function operate(room,p,now,action){const {e,random}=createEngine(room.config,room.match.seed,room.match.startAt,now,p.game);let event=null;e.onEvent=x=>{if(['correct','wrong','duplicate','reveal'].includes(x.type)){event=x;p.feedback={...x,questionId:e.state.currentQuestion?.id||null,id:crypto.randomUUID()};}};action(e);p.game=pack(e,random);return event;}
export function makeRoom({code,id,tokenHash,name,now,seed}){return {id,code,kind:'live',state:'LOBBY',createdAt:now,expiresAt:now+7200000,hostPlayerId:id,config:config({variant:'blitz'}),players:[{id,tokenHash,name:safeName(name),joinedAt:now,lastSeenAt:now,ready:true,game:null,dnf:false}],match:null,seedCounter:seed,notice:null};}
function connected(p,now){return !p.left&&now-p.lastSeenAt<15000;}
export function syncRoom(room,now){
 if(room.state==='CLOSED')return;
 if(now>=room.expiresAt){room.state='CLOSED';room.notice='THIS ROOM HAS EXPIRED';return;}
 const host=room.players.find(p=>p.id===room.hostPlayerId);
 if(room.kind==='live'&&(!host||host.left||now-host.lastSeenAt>45000)){
  const next=room.players.filter(p=>connected(p,now)).sort((a,b)=>a.joinedAt-b.joinedAt||a.id.localeCompare(b.id))[0];
  if(next&&next.id!==room.hostPlayerId){room.hostPlayerId=next.id;next.ready=true;room.notice=`${host?.name||'Host'} disconnected. ${next.name} is now host.`;}
 }
 if(room.state==='COUNTDOWN'&&now>=room.match.startAt)room.state='PLAYING';
 for(const p of room.players){
  const s=p.game?.state;if(!s||s.gameStatus!=='playing'||now<s.startedAt)continue;
  if(room.kind==='live'&&now-p.lastSeenAt>45000){operate(room,p,now,e=>e.finish('disconnected'));p.dnf=true;continue;}
  const due=(s.deadline!==null&&now>=s.deadline)||(s.feedbackUntil!==null&&now>=s.feedbackUntil)||(s.currentQuestion&&!s.currentQuestion.resolved&&now>=s.currentQuestion.deadline);
  if(due)operate(room,p,now,e=>e.tick());
 }
 if(room.kind==='live'&&room.state==='PLAYING'){
  const timed=room.match.endAt!==null;
  if((timed&&now>=room.match.endAt)||(!timed&&room.players.every(p=>p.game?.state.gameStatus==='ended'))){room.state='RESULTS';room.expiresAt=now+14400000;}
 }
}
export function joinRoom(room,{id,tokenHash,name},now){syncRoom(room,now);if(room.state==='CLOSED')fail('ROOM_EXPIRED','THIS ROOM HAS EXPIRED',410);if(room.players.length>=8)fail(room.kind==='challenge'?'CHALLENGE_FULL':'ROOM_FULL','This room already has 8 players.',409);if(room.kind==='live'&&['COUNTDOWN','PLAYING'].includes(room.state))fail('MATCH_ALREADY_STARTED','Match in progress. Wait for the next round.',409);
 name=safeName(name);if(room.players.some(p=>p.name.normalize('NFKC').toLocaleLowerCase()===name.normalize('NFKC').toLocaleLowerCase()))fail('NAME_TAKEN','That name is already in use. Choose another name.',409);
 room.players.push({id,tokenHash,name,joinedAt:now,lastSeenAt:now,ready:false,game:null,dnf:false});return id;
}
export function member(room,tokenHash){const p=room.players.find(p=>p.tokenHash===tokenHash);if(!p)fail('PLAYER_REMOVED','Your session is no longer in this room.',403);return p;}
export function roomAction(room,p,input,now){
 const priorSeen=p.lastSeenAt;syncRoom(room,now);p.lastSeenAt=now;p.left=false;
 if(room.state==='CLOSED')fail('ROOM_EXPIRED',room.notice||'Room closed.',410);
 const isHost=p.id===room.hostPlayerId, host=()=>{if(!isHost)fail('HOST_ONLY','Only the host can do that.',403);};
 const lobby=()=>{if(!['LOBBY','REMATCH_LOBBY'].includes(room.state)||room.kind!=='live')fail('MATCH_ALREADY_STARTED','Settings are locked for this match.',409);};
 switch(input.action){
  case 'poll':break;
  case 'ready':lobby();p.ready=!!input.ready;break;
  case 'settings':host();lobby();room.config=config(input.config);room.players.forEach(x=>x.ready=x.id===room.hostPlayerId);break;
  case 'start':host();lobby();if(room.players.length<2||room.players.some(x=>!connected(x,now)||!x.ready))fail('NOT_READY','At least two connected players must all be ready.',409);room.match={id:crypto.randomUUID(),seed:crypto.getRandomValues(new Uint32Array(1))[0],startAt:now+3000,endAt:null};room.players.forEach(x=>startPlayer(room,x,room.match.startAt,now));room.match.endAt=room.players[0].game.state.deadline;room.state='COUNTDOWN';room.notice=null;break;
  case 'kick':host();lobby();if(input.playerId===p.id)fail('HOST_ONLY','Use Leave room to leave.');room.players=room.players.filter(x=>x.id!==input.playerId);break;
  case 'close':host();room.state='CLOSED';room.notice='The host closed this room.';break;
  case 'leave':if(['LOBBY','REMATCH_LOBBY','RESULTS'].includes(room.state)&&room.kind==='live'){room.players=room.players.filter(x=>x.id!==p.id);syncRoom(room,now);}else{p.left=true;p.lastSeenAt=now-15001;}break;
  case 'rematch':host();if(room.kind!=='live'||room.state!=='RESULTS')fail('NOT_FINISHED','Wait until everyone finishes.',409);room.players=room.players.filter(x=>connected(x,now));room.players.forEach(x=>{x.game=null;x.ready=x.id===room.hostPlayerId;x.dnf=false;});room.match=null;room.state='REMATCH_LOBBY';room.expiresAt=now+7200000;break;
  case 'attempt':if(room.kind!=='challenge')fail('INVALID_ACTION','Not a challenge.');if(p.game)fail('ATTEMPT_USED','Your official attempt has already started.',409);startPlayer(room,p,now+3000,now);break;
  case 'answer':{
   if(!p.game||now<p.game.state.startedAt||p.game.state.gameStatus!=='playing')fail('MATCH_NOT_PLAYING','Your match is not accepting answers.',409);
   if(input.matchId!==room.match.id)fail('STALE_MATCH','This answer belongs to an earlier match.',409);
   if(!Number.isSafeInteger(input.seq)||input.seq<1)fail('INVALID_EVENT','Invalid answer event.');
   if(input.seq<=p.lastSeq){if(input.seq===p.lastSeq)return p.lastResponse;fail('STALE_EVENT','An older event was ignored.',409);}
   if(input.seq!==p.lastSeq+1)fail('EVENT_GAP','Reconnect to restore your progress.',409);
   const s=p.game.state;if(s.feedbackUntil!==null)fail('QUESTION_FINISHED','Wait for the next question.',409);
   if(room.config.family!=='conquest'&&input.questionId!==s.currentQuestion.id)fail('STALE_QUESTION','That question has ended.',409);
   if(now-(p.lastActionAt||0)<90)fail('TOO_FAST','Please wait a moment before submitting again.',429);
   const real=Math.max(0,(now-(s.currentQuestion?s.questionStartedAt:s.lastCorrectAt))/1000);
   const claimed=Number(input.responseTime);if(!Number.isFinite(claimed)||claimed<0||claimed>real+2)fail('INVALID_TIMING','Answer timing could not be verified.');
   // Bound latency compensation to one second. Clients cannot claim arbitrarily short durations.
   const duration=Math.max(claimed,real-1,0.08);
   const event=operate(room,p,now,e=>{e.responseDuration=()=>duration;if(input.kind==='country')e.submitCountry(String(input.value||''));else if(input.kind==='text')e.submitText(String(input.value||'').slice(0,160));else fail('INVALID_EVENT','Unsupported answer type.');});
   p.lastSeq=input.seq;p.lastActionAt=now;p.lastResponse=event;syncRoom(room,now);return event;
  }
  case 'finish':if(p.game?.state.gameStatus==='playing'){operate(room,p,now,e=>e.finish('manual'));p.dnf=!(room.kind==='challenge'&&room.config.family==='conquest'&&['relaxed','continent'].includes(room.config.variant));syncRoom(room,now);}break;
  default:fail('INVALID_ACTION','Unknown room action.');
 }
 return null;
}
export function ranking(players){const list=players.map(p=>{const s=p.game?.state,r=p.game?.result;return{id:p.id,name:p.name,dnf:!!p.dnf,score:s?.score||0,correct:s?.correctAnswers||0,wrong:s?.wrongAnswers||0,accuracy:r?.accuracy??(s?.correctAnswers+s?.wrongAnswers?100*s.correctAnswers/(s.correctAnswers+s.wrongAnswers):0),average:r?.averageResponseTime??null,bestStreak:s?.bestStreak||0,progress:s?.questionNumber||0,finished:s?.gameStatus==='ended'};});
 const compare=(a,b)=>Number(a.dnf)-Number(b.dnf)||b.score-a.score||b.accuracy-a.accuracy||(a.average??Infinity)-(b.average??Infinity)||a.wrong-b.wrong;
 list.sort(compare);list.forEach((p,i)=>p.rank=i&&compare(p,list[i-1])===0?list[i-1].rank:i+1);return list;
}
export function publicRoom(room,player,now,event=null){
 const own=player?.game,s=own?.state;
 const payload={code:room.code,kind:room.kind,state:room.state,config:room.config,hostPlayerId:room.hostPlayerId,hostName:room.players.find(p=>p.id===room.hostPlayerId)?.name||'A friend',serverNow:now,expiresAt:room.expiresAt,notice:room.notice,players:room.players.map(p=>({id:p.id,name:p.name,ready:p.ready,connected:connected(p,now)})),standings:ranking(room.players),you:player?.id||null,match:room.match?{id:room.match.id,startAt:room.match.startAt,endAt:room.match.endAt}:null,event:player?.feedback||event};
 if(s){const q=s.currentQuestion;payload.game={...s,currentQuestion:q?{id:q.id,type:q.type,countryId:q.countryId,prompt:q.prompt,role:q.role,timeLimit:q.timeLimit,deadline:q.deadline,resolved:q.resolved}:null,completedCountries:s.completedCountries,questionHistory:undefined,submissions:undefined,elapsedTime:Math.max(0,(now-s.startedAt)/1000),remainingTime:s.deadline===null?null:Math.max(0,(s.deadline-now)/1000)};payload.nextSeq=player.lastSeq+1;payload.result=own.result;}
 return payload;
}
// A completed solo run is replayed through the same rules, never accepted as a final-score claim.
export function createChallenge(input,identity,now){
 const settings=config(input.config,true),seed=Number(input.seed)>>>0,actions=input.actions;
 if(!Array.isArray(actions)||actions.length>1000||!seed)fail('INVALID_REPLAY','This round cannot be challenged. Play a new round first.');
 const elapsed=Number(input.elapsed);if(!Number.isFinite(elapsed)||elapsed<0||elapsed>7200000)fail('INVALID_REPLAY','Invalid round duration.');
 let at=0;const random=rng(seed);const engine=new Engine(DATA,{now:()=>at,random:()=>random.next()});engine.start(settings);
 if(settings.family!=='conquest')engine.state.questionLimit=settings.practiceIds?.length|| (settings.variant==='blitz'?null:settings.questionCount);
 for(const action of actions){if(!Number.isFinite(action.at)||action.at<at||action.at>elapsed)fail('INVALID_REPLAY','The answer timeline is invalid.');at=action.at;engine.tick();if(action.kind==='text')engine.submitText(String(action.value||'').slice(0,160));else if(action.kind==='country')engine.submitCountry(String(action.value||''));else if(action.kind!=='tick')fail('INVALID_REPLAY','Unknown replay action.');}
 at=elapsed;engine.tick();if(engine.state.gameStatus==='playing')engine.finish('manual');
 const room=makeRoom({...identity,now,seed});room.kind='challenge';room.config=settings;room.expiresAt=now+259200000;room.match={id:crypto.randomUUID(),seed,startAt:now,endAt:null};room.players[0].game=pack(engine,random);room.players[0].lastSeq=0;room.players[0].lastResponse=null;return room;
}
export {DATA};
