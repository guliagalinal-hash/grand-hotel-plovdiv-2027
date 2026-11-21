import * as esbuild from 'esbuild';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
await esbuild.build({entryPoints:['functions/api/inquiry.ts'],bundle:true,format:'esm',platform:'neutral',outfile:'.build/inquiry.mjs',logLevel:'error'});
const fn = await import(pathToFileURL(process.cwd()+'/.build/inquiry.mjs').href);
const env={GOOGLE_SCRIPT_URL:'https://script.google.com/macros/s/test/exec',GOOGLE_SCRIPT_TOKEN:'test-token',TURNSTILE_SECRET_KEY:'test-secret'};
let calls=[],tsOk=true,googleOk=true;
globalThis.fetch=async(url,init)=>{
 calls.push({url:String(url),init});
 if(String(url).includes('turnstile')) return new Response(JSON.stringify({success:tsOk}),{status:200});
 if(String(url).includes('script.google.com')) return new Response(JSON.stringify({ok:googleOk}),{status:200});
 throw Error('Unexpected URL');
};
const booking={product:'accommodation',nights:1,room:'classic',occupancy:'double',rooms:[{adults:2,children:0,infants:0}],adults:2,children:0,infants:0,estimatedTotal:1};
let id=0;
const body=()=>({booking:structuredClone(booking),name:'Ivan Petrov',email:'ivan@example.com',phone:'+359 88 123 4567',comment:'Hello',consent:true,pageLang:'ru',submissionId:'test-id-'+(++id)+'-abcd',turnstileToken:'tok',website:''});
const post=(b,options={})=>fn.onRequestPost({env:{...env,...options.env},request:new Request('https://site.test/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json',Origin:options.origin||'https://site.test','CF-Connecting-IP':options.ip||'10.0.0.'+id},body:JSON.stringify(b)})});
const google=()=>calls.filter(x=>x.url.includes('script.google.com'));
const reset=()=>{calls=[];tsOk=true;googleOk=true};
reset();assert.equal((await fn.onRequest()).status,405);
reset();assert.equal((await post(body(),{origin:'https://evil.test'})).status,403);
reset();assert.equal((await post(body(),{env:{GOOGLE_SCRIPT_TOKEN:''}})).status,503);
reset();assert.equal((await post(body(),{env:{TURNSTILE_SECRET_KEY:''}})).status,200);
reset();{let b=body();b.email='';assert.equal((await post(b)).status,200);assert.equal(JSON.parse(google()[0].init.body).inquiry.email,'')}
reset();{let b=body();b.email='';b.booking={product:'inquiry',nights:null,room:null,occupancy:null,rooms:[],adults:0,children:0,infants:0,estimatedTotal:null};assert.equal((await post(b)).status,200);const sent=JSON.parse(google()[0].init.body).inquiry;assert.equal(sent.booking.product,'inquiry');assert.equal(sent.booking.estimatedTotal,null)}
reset();{let b=body();b.email='bad';assert.equal((await post(b)).status,400);assert.equal(calls.length,0)}
reset();tsOk=false;assert.equal((await post(body())).status,200);assert.equal(google().length,1);
reset();{let b=body();assert.equal((await post(b)).status,200);let d=JSON.parse(google()[0].init.body);assert.equal(d.token,env.GOOGLE_SCRIPT_TOKEN);assert.equal(d.inquiry.booking.estimatedTotal,143.3);assert.equal(d.inquiry.email,b.email);assert.equal(d.inquiry.submissionId,b.submissionId)}
reset();{let b=body();b.booking={product:'package',nights:1,room:'lux',occupancy:'double',rooms:[{adults:1,children:0,infants:0},{adults:1,children:0,infants:0}],adults:2,children:0,infants:0,estimatedTotal:1};assert.equal((await post(b)).status,200);assert.equal(JSON.parse(google()[0].init.body).inquiry.booking.estimatedTotal,711.2)}
reset();{let b=body();b.booking.rooms=[{adults:1,children:0,infants:0}];assert.equal((await post(b)).status,400)}
reset();googleOk=false;{let b=body();assert.equal((await post(b)).status,502);googleOk=true;assert.equal((await post(b)).status,200)}
reset();{let b=body();assert.equal((await post(b)).status,200);assert.equal((await post(b,{ip:'10.0.0.222'})).status,200);assert.equal(google().length,1)}
console.log('Google inquiry integration tests passed');
