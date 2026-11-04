import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {server,validateLead} from './server.mjs';
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForTimeout(300);
 await page.getByRole('button',{name:'Volgende'}).click();assert.match(await page.locator('#errors').innerText(),/Kies een optie/);
 await page.getByLabel('Overstappen',{exact:true}).check();await page.getByLabel('Eenmanszaak',{exact:true}).check();await page.getByRole('button',{name:'Volgende'}).click();
 await page.getByRole('button',{name:'Volgende'}).click();assert.match(await page.locator('#errors').innerText(),/minimaal één/);
 await page.getByLabel('Boekhouding',{exact:true}).check();await page.getByRole('button',{name:'Terug'}).click();assert.equal(await page.getByLabel('Overstappen',{exact:true}).isChecked(),true);await page.getByRole('button',{name:'Volgende'}).click();assert.equal(await page.getByLabel('Boekhouding',{exact:true}).isChecked(),true);await page.getByRole('button',{name:'Volgende'}).click();
 await page.getByLabel('Binnen een maand',{exact:true}).check();await page.getByRole('button',{name:'Volgende'}).click();assert.match(await page.locator('#errors').innerText(),/plaats/);await page.getByLabel('Mijn voorkeur is volledig online').check();await page.getByRole('button',{name:'Volgende'}).click();
 assert.equal(await page.locator('[name=consent]').isChecked(),false);await page.getByRole('button',{name:'Testaanvraag lokaal opslaan'}).click();assert.match(await page.locator('#errors').innerText(),/toestemming/);
 await page.locator('[name=name]').fill('Test Ondernemer');await page.locator('[name=email]').fill('ongeldig');await page.getByRole('button',{name:'Testaanvraag lokaal opslaan'}).click();assert.match(await page.locator('#errors').innerText(),/geldig e-mailadres/);
 await page.locator('[name=email]').fill('test@example.com');await page.locator('[name=consent]').check();
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('storage blocked');};});await page.getByRole('button',{name:'Testaanvraag lokaal opslaan'}).click();assert.match(await page.locator('#errors').innerText(),/opslaan is niet gelukt/);assert.equal(await page.locator('[name=email]').inputValue(),'test@example.com');
 await page.evaluate(()=>delete Storage.prototype.setItem); // Reload restores the native method; retained form is refilled below.
 await page.reload();await page.getByLabel('Overstappen',{exact:true}).check();await page.getByLabel('Eenmanszaak',{exact:true}).check();await page.getByRole('button',{name:'Volgende'}).click();await page.getByLabel('Boekhouding',{exact:true}).check();await page.getByRole('button',{name:'Volgende'}).click();await page.getByLabel('Binnen een maand',{exact:true}).check();await page.getByLabel('Mijn voorkeur is volledig online').check();await page.getByRole('button',{name:'Volgende'}).click();await page.locator('[name=name]').fill('Test Ondernemer');await page.locator('[name=email]').fill('test@example.com');await page.locator('[name=consent]').check();await page.getByRole('button',{name:'Testaanvraag lokaal opslaan'}).click();await page.locator('#result:visible').waitFor();assert.match(await page.locator('#result').innerText(),/niets verzonden/);assert.match(await page.locator('#summary').innerText(),/test@example.com/);
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('administratievergelijker-tests-v1')));assert.equal(records.length,1);assert.equal(validateLead(records[0]),true);assert.equal(validateLead({...records[0],consent:false}),false);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporteer tests als CSV'}).click();assert.equal((await download).suggestedFilename(),'administratievergelijker-tests.csv');
 await page.getByRole('button',{name:'Bekijk mijn reflectie'}).click();assert.match(await page.locator('#scan-result').innerText(),/aansluiting/);const checklist=page.waitForEvent('download');await page.locator('#download').click();assert.equal((await checklist).suggestedFilename(),'overstapchecklist.txt');
 for(const width of [360,390,768,1280]){await page.setViewportSize({width,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);}
 await page.getByRole('button',{name:'Verwijder lokale tests'}).click();assert.match(await page.locator('#storage-status').innerText(),/0 testaanvragen/);
 assert.equal((await fetch(base+'/api/leads',{method:'POST'})).status,503);assert.equal((await fetch(base+'/.env')).status,404);assert.deepEqual(errors,[]);
 console.log('PASS: flow, validatie, toestemming, terug, opslagfout, samenvatting, CSV, verwijderen, zelfscan, checklist, responsive overflow, backend uit, geheime bestanden.');
}finally{await browser.close();server.close();}
