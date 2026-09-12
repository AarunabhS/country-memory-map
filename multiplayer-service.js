/* Transport and reconnection are isolated from game rendering. No keystrokes are sent. */
window.FriendService=class {
 constructor(onState,onConnection){this.onState=onState;this.onConnection=onConnection;this.room=null;this.offset=0;this.timer=null;this.busy=false;this.polling=false;this.pollPromise=null;this.suspended=false;this.apiResolution=null;this.background=false;this.requestDuration=0;this.key='country-memory-friend-session-v1';try{this.session=JSON.parse(localStorage.getItem(this.key)||'null');}catch{this.session=null;}const allowedApis=[window.FRIENDS_API,window.FRIENDS_API_FALLBACK].filter(Boolean);this.api=allowedApis.includes(this.session?.api)?this.session.api:null;window.addEventListener('online',()=>this.poll());document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.poll();});}
 now(){return Date.now()+this.offset;}
 save(){try{if(this.session)localStorage.setItem(this.key,JSON.stringify(this.session));else localStorage.removeItem(this.key);}catch{}}
 normalizeCode(value){let raw=String(value||'').trim();if(/^https?:\/\//i.test(raw)){try{raw=new URL(raw).searchParams.get('room')||raw;}catch{}}return raw.toUpperCase().replace(/[\s-]+/g,'');}
 validCode(value){return /^[A-Z0-9]{6,12}$/.test(this.normalizeCode(value));}
 prepareInvite(value){const code=this.normalizeCode(value);if(!this.validCode(code))throw new Error('Enter the room code from your invite.');const matchesSession=this.session?.code===code;if(!matchesSession){this.suspended=true;clearTimeout(this.timer);}return {code,matchesSession};}
 clearSession(){clearTimeout(this.timer);this.session=null;this.room=null;this.save();}
 async resolveApi(){if(this.api)return this.api;const fallback=window.FRIENDS_API_FALLBACK;if(!fallback)return this.api=FRIENDS_API;if(!this.apiResolution)this.apiResolution=(async()=>{for(const candidate of [...new Set([FRIENDS_API,fallback])]){try{const response=await fetch(candidate+'/health',{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(candidate===FRIENDS_API?1800:10000)});const data=await response.json();if(response.ok&&data?.ok)return this.api=candidate;}catch{}}throw new Error('No friends service is reachable.');})().finally(()=>{this.apiResolution=null;});return this.apiResolution;}
 async request(path,input,authenticated=true){let started,response;try{const api=await this.resolveApi();started=Date.now();response=await fetch(api+path,{method:input?'POST':'GET',headers:{...(input?{'Content-Type':'application/json'}:{}),...(authenticated&&this.session?.token?{Authorization:'Bearer '+this.session.token}:{})},body:input?JSON.stringify(input):undefined,signal:AbortSignal.timeout(10000)});}catch{const reconnecting=authenticated&&Boolean(this.session);this.onConnection(reconnecting?'RECONNECTING · Check your connection.':'PLAY WITH FRIENDS UNAVAILABLE · Check your connection.');throw new Error(reconnecting?'Connection lost. Reconnecting…':'Could not connect to Play with Friends. Check your connection and retry.');}this.requestDuration=Math.max(0,Date.now()-started);let data;try{data=await response.json();}catch{throw new Error('The friends service is not available yet. Please retry shortly.');}if(data.serverNow)this.offset=data.serverNow-(started+Date.now())/2;if(!response.ok){const error=new Error(data.message||'Please retry.');error.code=data.error;throw error;}this.onConnection('');return data;}
 accept(data){if(this.room?.code===data.code&&data.revision<this.room.revision)return this.room;this.room=data;this.onState(data);if(this.session&&!this.suspended){clearTimeout(this.timer);let delay=(document.hidden||this.background)?8000:Math.max(250,1500-this.requestDuration);const s=data.game;const due=s?.feedbackUntil||(!s?.currentQuestion?.resolved?s?.currentQuestion?.deadline:null)||s?.startedAt;if(!this.background&&due&&due>this.now())delay=Math.min(delay,Math.max(80,due-this.now()+30));if(!this.background&&s?.deadline&&s.deadline>this.now())delay=Math.min(delay,Math.max(80,s.deadline-this.now()+30));this.timer=setTimeout(()=>this.poll(),delay);}return data;}
 async create(name,challenge=null){const data=await this.request(challenge?'/challenges':'/rooms',{name,...(challenge||{})},false);this.background=false;this.suspended=false;this.session={code:data.code,token:data.token,api:this.api};this.save();return this.accept(data);}
 async inspect(code){code=this.normalizeCode(code);if(!this.validCode(code))throw new Error('Enter the room code from your invite.');return this.request('/rooms/'+encodeURIComponent(code),null,false);}
 async join(code,name){code=this.normalizeCode(code);if(!this.validCode(code))throw new Error('Enter the room code from your invite.');const data=await this.request('/rooms/'+encodeURIComponent(code),{action:'join',name},false);this.background=false;this.suspended=false;this.session={code:data.code,token:data.token,api:this.api};this.save();return this.accept(data);}
 async poll(){
  if(!this.session||this.suspended)return null;
  if(this.pollPromise)return this.pollPromise;
  this.polling=true;
  const task=(async()=>{try{return this.accept(await this.request('/rooms/'+this.session.code));}catch(e){if(['PLAYER_REMOVED','ROOM_EXPIRED','ROOM_NOT_FOUND'].includes(e.code)){const code=this.session?.code;this.clearSession();this.onConnection('');this.onState({error:e.code,message:e.message,code});}else{this.onConnection(e.message);if(!this.suspended)this.timer=setTimeout(()=>this.poll(),2500);}return null;}})();
  this.pollPromise=task;
  try{return await task;}finally{if(this.pollPromise===task)this.pollPromise=null;this.polling=false;}
 }
 answerCommitted(payload){return payload.action==='answer'&&this.room?.match?.id===payload.matchId&&Number.isSafeInteger(payload.seq)&&Number(this.room?.nextSeq)>payload.seq;}
 async action(action,fields={}){
  if(!this.session)throw new Error('Join a room first.');
  const payload={action,...fields};
  try{return this.accept(await this.request('/rooms/'+this.session.code,payload));}
  catch(error){
   let failure=error;
   if(action==='answer'&&error.message.includes('Reconnecting')){
    try{return this.accept(await this.request('/rooms/'+this.session.code,payload));}
    catch(retryError){failure=retryError;}
   }
   await this.poll();
   if(this.answerCommitted(payload)){this.onConnection('');return this.room;}
   throw failure;
  }
 }
 async leave(){try{await this.action('leave');}finally{clearTimeout(this.timer);this.session=null;this.room=null;this.save();}}
 suspend({keepAlive=false}={}){this.background=keepAlive;this.suspended=!keepAlive;clearTimeout(this.timer);if(keepAlive&&this.session)this.timer=setTimeout(()=>this.poll(),8000);}
 resume(){this.background=false;this.suspended=false;clearTimeout(this.timer);return this.poll();}
 invite(){const code=this.session?.code||this.room?.code||'';if(window.FRIENDS_SHARE_URL){const url=new URL(window.FRIENDS_SHARE_URL);url.searchParams.set('room',code);return url.href;}return window.CountryMemoryRetained?.getHostedInviteUrl?.(code)||location.origin+location.pathname+'?room='+encodeURIComponent(code);}
};
