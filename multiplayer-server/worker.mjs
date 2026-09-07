import {makeRoom,joinRoom,member,roomAction,syncRoom,publicRoom,createChallenge,RoomError} from './room-engine.mjs';
const allowed=new Set(['https://www.arunabhosom.com','https://aarunabhs.github.io','http://127.0.0.1:8000','http://localhost:8000']);
const encoder=new TextEncoder();
async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
const token=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
const code=()=> 'GEO'+[...crypto.getRandomValues(new Uint8Array(6))].map(x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%31]).join('');
export class D1Store {
 constructor(db){this.db=db;}
 async get(code){return this.db.prepare('SELECT body, version FROM rooms WHERE code = ?').bind(code).first();}
 async insert(room){return this.db.prepare('INSERT INTO rooms(code,version,body,expires_at) VALUES(?,0,?,?)').bind(room.code,JSON.stringify(room),room.expiresAt).run();}
 async save(room,version){const r=await this.db.prepare('UPDATE rooms SET body=?,expires_at=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(room),room.expiresAt,room.code,version).run();return r.meta.changes===1;}
 async rate(key,now,ttl=120000){const r=await this.db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+ttl).first();return r.count;}
 async cleanup(now){await this.db.batch([this.db.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now),this.db.prepare('DELETE FROM rooms WHERE expires_at < ?').bind(now-86400000)]);}
}
export async function handle(request,store,now=Date.now()){
 const url=new URL(request.url),origin=request.headers.get('Origin');
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'600'};
 if(origin&&allowed.has(origin))headers['Access-Control-Allow-Origin']=origin;
 const send=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 try{
 if(origin&&!allowed.has(origin))throw new RoomError('ORIGIN_DENIED','This website is not allowed to use this service.',403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(url.pathname==='/health')return send({ok:true,service:'Country Memory Map Friends',serverNow:now});
 if(!['GET','POST'].includes(request.method))throw new RoomError('METHOD','Unsupported method.',405);
 const ip=request.headers.get('CF-Connecting-IP')||'local';
 const key=await hash(ip+':'+Math.floor(now/60000));if(await store.rate(key,now)>1800)throw new RoomError('RATE_LIMITED','Too many requests. Please wait a minute.',429);
 const codeMatch=url.pathname.match(/^\/rooms\/([A-Z0-9]{6,12})$/);
 let input={};if(request.method==='POST'){if(!request.headers.get('Content-Type')?.includes('application/json'))throw new RoomError('CONTENT_TYPE','Use JSON requests.',415);const body=await request.text();if(body.length>250000)throw new RoomError('TOO_LARGE','Request too large.',413);try{input=JSON.parse(body);}catch{throw new RoomError('INVALID_JSON','Invalid request.');}}
 if(request.method==='POST'&&['/rooms','/challenges'].includes(url.pathname)){
  const count=await store.rate(await hash(ip+':create:'+Math.floor(now/3600000)),now,3600000);if(count>20)throw new RoomError('RATE_LIMITED','Room creation limit reached. Try again later.',429);
  const secret=token(),identity={code:code(),id:crypto.randomUUID(),tokenHash:await hash(secret),name:input.name,now,seed:crypto.getRandomValues(new Uint32Array(1))[0]};
  const room=url.pathname==='/challenges'?createChallenge(input,identity,now):makeRoom(identity);await store.insert(room);return send({...publicRoom(room,room.players[0],now),token:secret,revision:0},201);
 }
 if(!codeMatch)throw new RoomError('NOT_FOUND','ROOM NOT FOUND',404);
 const roomCode=codeMatch[1];const bearer=request.headers.get('Authorization')?.replace(/^Bearer /,'');const authHash=bearer?await hash(bearer):null;
 const newToken=input.action==='join'?token():null;const newId=crypto.randomUUID();const newHash=newToken?await hash(newToken):null;
 for(let attempt=0;attempt<12;attempt++){
  const row=await store.get(roomCode);if(!row)throw new RoomError('ROOM_NOT_FOUND','ROOM NOT FOUND',404);
  const room=JSON.parse(row.body);let p=null,event=null;
  syncRoom(room,now);if(room.state==='CLOSED')throw new RoomError('ROOM_EXPIRED',room.notice||'THIS ROOM HAS EXPIRED',410);
  if(request.method==='POST'){
   if(input.action==='join'){joinRoom(room,{id:newId,tokenHash:newHash,name:input.name},now);p=member(room,newHash);}
   else{if(!authHash)throw new RoomError('SESSION_REQUIRED','Join the room first.',401);p=member(room,authHash);event=roomAction(room,p,input,now);}
  }else if(authHash){p=member(room,authHash);event=roomAction(room,p,{action:'poll'},now);}
  if(await store.save(room,row.version))return send({...publicRoom(room,p,now,event),revision:row.version+1,...(newToken?{token:newToken}:{})});
 }
 throw new RoomError('BUSY','The room is busy. Please retry.',409);
 }catch(error){if(error instanceof RoomError)return send({error:error.code,message:error.message,serverNow:now},error.status);console.error('Friends request failed:',error.message);return send({error:'SERVICE_ERROR',message:'Connection interrupted. Please retry.',serverNow:now},500);}
}
export default {async fetch(request,env,ctx){const store=new D1Store(env.DB);if(Math.random()<0.01)ctx.waitUntil(store.cleanup(Date.now()));return handle(request,store);}};
