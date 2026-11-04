import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=new URL('./',import.meta.url);
const webhook=process.env.GHL_WEBHOOK_URL;
if(webhook&&new URL(webhook).protocol!=='https:')throw new Error('GHL_WEBHOOK_URL moet HTTPS gebruiken.');
const allowed={situation:['Eerste boekhouder zoeken','Overstappen','Vergelijken','Tweede mening','Snel hulp nodig'],business:['Starter','Zzp’er / freelancer','Eenmanszaak','Bv / mkb','Stichting / vereniging','Anders'],services:['Boekhouding','Btw-aangifte','Belastingaangifte','Jaarrekening','Salarisadministratie','Financieel advies'],start:['Zo snel mogelijk','Binnen een maand','Binnen drie maanden','Ik oriënteer me nog']};
export function validateLead(d){return d&&d.consent===true&&d.consentVersion==='2026-11-04'&&['situation','business','start'].every(k=>allowed[k].includes(d[k]))&&Array.isArray(d.services)&&d.services.length>0&&d.services.length<=6&&d.services.every(v=>allowed.services.includes(v))&&typeof d.online==='boolean'&&(d.online||typeof d.location==='string'&&d.location.trim().length>0)&&typeof d.name==='string'&&d.name.trim().length>0&&typeof d.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)&&d.email.length<=254&&['name','location','company','phone'].every(k=>d[k]===undefined||typeof d[k]==='string'&&d[k].length<=160);}
const attempts=new Map();
const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
if(req.url==='/api/config'&&req.method==='GET')return json(200,{live:Boolean(webhook)});
if(req.url==='/api/leads'&&req.method==='POST'){
 if(!webhook)return json(503,{success:false});
 if(req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return json(403,{success:false});
 if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{success:false});
 const ip=req.socket.remoteAddress,now=Date.now();for(const [k,v]of attempts)if(now-v.time>60000)attempts.delete(k);const entry=attempts.get(ip)||{time:now,count:0};entry.count++;attempts.set(ip,entry);if(entry.count>5)return json(429,{success:false});
 try{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16000)return json(413,{success:false});}const d=JSON.parse(body);if(!validateLead(d))return json(400,{success:false});const lead=Object.fromEntries(['situation','business','services','online','location','start','name','email','company','phone','consent','consentVersion'].map(k=>[k,d[k]]));lead.createdAt=new Date().toISOString();const upstream=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead),signal:AbortSignal.timeout(10000),redirect:'error'});return json(upstream.ok?200:502,{success:upstream.ok});}catch{return json(502,{success:false});}
}
if(req.method!=='GET')return json(405,{success:false});const paths={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'};const file=paths[req.url?.split('?')[0]];if(!file)return json(404,{error:'Niet gevonden'});try{res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'});res.end(await readFile(new URL(file,root)));}catch{json(500,{error:'Pagina niet beschikbaar'});}});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('AdministratieVergelijker: http://localhost:3000'));
export {server};
