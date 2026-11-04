import assert from 'node:assert/strict';
process.env.GHL_WEBHOOK_URL='https://example.invalid/test-only';
const {server}=await import('./server.mjs');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const nativeFetch=globalThis.fetch;
let upstreamStatus=200,received;
globalThis.fetch=async(url,options)=>{if(url===process.env.GHL_WEBHOOK_URL){received=JSON.parse(options.body);return new Response('',{status:upstreamStatus});}return nativeFetch(url,options);};
const lead={situation:'Overstappen',business:'Eenmanszaak',services:['Boekhouding'],online:true,start:'Binnen een maand',name:'Test',email:'test@example.com',consent:true,consentVersion:'2026-11-04',extra:'niet doorgeven'};
const send=(data,origin=base)=>fetch(base+'/api/leads',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
try{
 assert.equal((await send(lead,'https://andere-origin.invalid')).status,403);
 assert.equal((await send({...lead,consent:false})).status,400);
 assert.equal((await send({...lead,services:['ongeldig']})).status,400);
 upstreamStatus=503;let response=await send(lead);assert.equal(response.status,502);assert.equal((await response.json()).success,false);
 upstreamStatus=200;response=await send(lead);assert.equal(response.status,200);assert.equal((await response.json()).success,true);assert.equal(received.extra,undefined);assert.ok(received.createdAt);
 await send(lead);assert.equal((await send(lead)).status,429);
 console.log('PASS: backend toestemming, enumvalidatie, origincontrole, GHL-fout, GHL-succes, veldselectie en rate limit (gesimuleerde webhook, geen echte verzending).');
}finally{globalThis.fetch=nativeFetch;server.close();}
