/* Transport and reconnection are isolated from game rendering. No keystrokes are sent. */
window.FriendService=class {
 constructor(onState,onConnection){this.membershipRequest=null;this.generation=0;this.onState=onState;this.onConnection=onConnection;this.room=null;this.offset=0;this.timer=null;this.busy=false;this.polling=false;this.pollPromise=null;this.suspended=false;this.apiResolution=null;this.background=false;this.requestDuration=0;this.key='country-memory-friend-session-v1';try{this.session=JSON.parse(localStorage.getItem(this.key)||'null');}catch{this.session=null;}if(this.session&&(!this.validCode(this.session.code)||typeof this.session.token!=='string'||!this.session.token)){this.session=null;this.save();}const allowedApis=[window.FRIENDS_API,window.FRIENDS_API_FALLBACK].filter(Boolean);this.api=allowedApis.includes(this.session?.api)?this.session.api:null;window.addEventListener('online',()=>this.poll());document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.poll();});}
 now(){return Date.now()+this.offset;}
 save(){try{if(this.session)localStorage.setItem(this.key,JSON.stringify(this.session));else localStorage.removeItem(this.key);}catch{}}
 normalizeCode(value){let raw=String(value||'').trim();if(/^https?:\/\//i.test(raw)){try{raw=new URL(raw).searchParams.get('room')||raw;}catch{}}return raw.toUpperCase().replace(/[\s-]+/g,'');}
 validCode(value){return /^[A-Z0-9]{6,12}$/.test(this.normalizeCode(value));}
 prepareInvite(value){const code=this.normalizeCode(value);if(!this.validCode(code))throw new Error('Enter the room code from your invite.');const matchesSession=this.session?.code===code;if(!matchesSession){this.suspended=true;clearTimeout(this.timer);}return {code,matchesSession};}
 clearSession(){this.membershipRequest=null;this.pollPromise=null;this.polling=false;this.generation++;clearTimeout(this.timer);this.session=null;this.room=null;this.save();}
 async resolveApi(){if(this.api)return this.api;const fallback=window.FRIENDS_API_FALLBACK;if(!fallback)return this.api=FRIENDS_API;if(!this.apiResolution)this.apiResolution=(async()=>{for(const candidate of [...new Set([FRIENDS_API,fallback])]){try{const response=await fetch(candidate+'/health',{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(candidate===FRIENDS_API?1800:10000)});const data=await response.json();if(response.ok&&data?.ok)return this.api=candidate;}catch{}}throw new Error('No friends service is reachable.');})().finally(()=>{this.apiResolution=null;});return this.apiResolution;}
 async request(path,input,authenticated=true,session=this.session,generation=this.generation){let started,response;try{const api=await this.resolveApi();started=Date.now();response=await fetch(api+path,{method:input?'POST':'GET',headers:{...(input?{'Content-Type':'application/json'}:{}),...(authenticated&&session?.token?{Authorization:'Bearer '+session.token}:{})},body:input?JSON.stringify(input):undefined,signal:AbortSignal.timeout(10000)});}catch{const reconnecting=authenticated&&Boolean(this.session);if(generation===this.generation&&(!authenticated||session===this.session))this.onConnection(reconnecting?'RECONNECTING · Check your connection.':'PLAY WITH FRIENDS UNAVAILABLE · Check your connection.');throw new Error(reconnecting?'Connection lost. Reconnecting…':'Could not connect to Play with Friends. Check your connection and retry.');}this.requestDuration=Math.max(0,Date.now()-started);let data;try{data=await response.json();}catch{throw new Error('The friends service is not available yet. Please retry shortly.');}if(data.serverNow)this.offset=data.serverNow-(started+Date.now())/2;if(!response.ok){const error=new Error(data.message||'Please retry.');error.code=data.error;throw error;}if(generation===this.generation&&(!authenticated||session===this.session))this.onConnection('');return data;}
 accept(data,generation=this.generation){if(generation!==this.generation)return this.room;if(this.room?.code===data.code&&data.revision<this.room.revision)return this.room;this.room=data;this.onState(data);if(this.session&&!this.suspended){clearTimeout(this.timer);let delay=(document.hidden||this.background)?8000:Math.max(250,1500-this.requestDuration);const s=data.game;const due=s?.feedbackUntil||(!s?.currentQuestion?.resolved?s?.currentQuestion?.deadline:null)||s?.startedAt;if(!this.background&&due&&due>this.now())delay=Math.min(delay,Math.max(80,due-this.now()+30));if(!this.background&&s?.deadline&&s.deadline>this.now())delay=Math.min(delay,Math.max(80,s.deadline-this.now()+30));this.timer=setTimeout(()=>this.poll(),delay);}return data;}
 async enter(path,payload){
  if(this.membershipRequest)throw new Error('A room request is already in progress.');
  const operation={},generation=this.generation,previous=this.session;
  this.membershipRequest=operation;
  try{
   const data=await this.request(path,payload,false);
   const session={code:data.code,token:data.token,api:this.api};
   if(this.membershipRequest!==operation||generation!==this.generation){this.notifyLeave(session);return null;}
   this.generation++;
   this.pollPromise=null;this.polling=false;
   this.background=false;this.suspended=false;this.session=session;this.room=null;
   this.save();
   if(previous&&previous.token!==session.token)this.notifyLeave(previous);
   return this.accept(data);
  }finally{if(this.membershipRequest===operation)this.membershipRequest=null;}
 }
 async create(name,challenge=null){return this.enter(challenge?'/challenges':'/rooms',{name,...(challenge||{})});}
 async inspect(code){code=this.normalizeCode(code);if(!this.validCode(code))throw new Error('Enter the room code from your invite.');return this.request('/rooms/'+encodeURIComponent(code),null,false);}
 async join(code,name){code=this.normalizeCode(code);if(!this.validCode(code))throw new Error('Enter the room code from your invite.');return this.enter('/rooms/'+encodeURIComponent(code),{action:'join',name});}
 async poll(){
  if(!this.session||this.suspended)return null;
  if(this.pollPromise)return this.pollPromise;
  this.polling=true;
  const generation=this.generation;
  const task=(async()=>{try{return this.accept(await this.request('/rooms/'+this.session.code),generation);}catch(e){if(generation!==this.generation)return null;if(['PLAYER_REMOVED','ROOM_EXPIRED','ROOM_NOT_FOUND'].includes(e.code)){const code=this.session?.code;this.clearSession();this.onConnection('');this.onState({error:e.code,message:e.message,code});}else{this.onConnection(e.message);if(!this.suspended)this.timer=setTimeout(()=>this.poll(),2500);}return null;}})();
  this.pollPromise=task;
  try{return await task;}finally{if(this.pollPromise===task){this.pollPromise=null;this.polling=false;}}
 }
 answerCommitted(payload){return payload.action==='answer'&&this.room?.match?.id===payload.matchId&&Number.isSafeInteger(payload.seq)&&Number(this.room?.nextSeq)>payload.seq;}
 async action(action,fields={}){
  if(!this.session)throw new Error('Join a room first.');
  const payload={action,...fields};const generation=this.generation;
  try{return this.accept(await this.request('/rooms/'+this.session.code,payload),generation);}
  catch(error){
   if(generation!==this.generation)return null;
   let failure=error;
   if(action==='answer'&&error.message.includes('Reconnecting')){
    try{return this.accept(await this.request('/rooms/'+this.session.code,payload),generation);}
    catch(retryError){failure=retryError;}
   }
   if(generation!==this.generation)return null;
   await this.poll();
   if(generation!==this.generation)return null;
   if(this.answerCommitted(payload)){this.onConnection('');return this.room;}
   throw failure;
  }
 }
 async leave(){
  const session=this.session;
  this.suspended=true;
  this.clearSession();
  this.onConnection('');
  // Exit immediately even offline. The captured token still identifies the
  // departing player; late polls/actions cannot restore the cleared session.
  this.notifyLeave(session);
 }

 notifyLeave(session){if(session)void this.request('/rooms/'+session.code,{action:'leave'},true,session).catch(()=>{});}
 suspend({keepAlive=false}={}){this.background=keepAlive;this.suspended=!keepAlive;clearTimeout(this.timer);if(keepAlive&&this.session)this.timer=setTimeout(()=>this.poll(),8000);}
 resume(){this.background=false;this.suspended=false;clearTimeout(this.timer);return this.poll();}
 invite(){const code=this.session?.code||this.room?.code||'';if(window.FRIENDS_SHARE_URL){const url=new URL(window.FRIENDS_SHARE_URL);url.searchParams.set('room',code);return url.href;}return window.CountryMemoryApp?.getHostedInviteUrl?.(code)||location.origin+location.pathname+'?room='+encodeURIComponent(code);}
};
