import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import Worker from './worker.mjs';
const db=new DatabaseSync(process.env.FRIENDS_DB||'/private/tmp/country-memory-friends-local.sqlite');
try{db.exec(readFileSync(new URL('./drizzle/0000_wild_smasher.sql',import.meta.url),'utf8'));}catch(e){if(!e.message.includes('already exists'))throw e;}
export const binding={prepare(sql){const statement={bind(...params){return{async first(){return db.prepare(sql).get(...params)||null;},async run(){const r=db.prepare(sql).run(...params);return{meta:{changes:Number(r.changes)}};}}},async run(){const r=db.prepare(sql).run();return {meta:{changes:Number(r.changes)}};}};return statement;},async batch(statements){return Promise.all(statements.map(s=>s.run()));}};
http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const request=new Request('http://127.0.0.1:8787'+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});const response=await Worker.fetch(request,{DB:binding},{waitUntil:p=>p.catch(console.error)});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error(e);res.writeHead(500);res.end('Local server error');}}).listen(8787,'127.0.0.1',()=>console.log('Friends API http://127.0.0.1:8787'));
