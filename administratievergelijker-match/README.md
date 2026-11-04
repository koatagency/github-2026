# AdministratieVergelijker

Zelfstandige Nederlandse landingpage, gebouwd met HTML, CSS en JavaScript zoals de bestaande site. De bestaande `../index.html` en campagnegenerator zijn ongewijzigd. Bij inspectie waren geen README, AGENTS.md, package.json of publicatieworkflows aanwezig. De repository heeft een GitHub-remote; de hostinginstellingen zijn hier niet vastgelegd.

## Lokaal openen

Open `administratievergelijker-match/index.html` direct in je browser, of start vanuit de repository:

```powershell
node administratievergelijker-match/server.mjs
```

Open vervolgens http://localhost:3000. Node 24 of hoger aanbevolen. Er zijn geen runtime-afhankelijkheden. Zonder webhook is dit expliciet testmodus: geen verzending of leadtracking. Testaanvragen worden na afronding in localStorage opgeslagen, met CSV-export en wissen. Onvoltooide antwoorden bestaan alleen in het paginageheugen. Gebruik fictieve gegevens. CSV-export schermt formuleprefixen af.

Op statische hosting kan de map als `/administratievergelijker-match/` worden gepubliceerd. Er staat geen wijziging aan de bestaande homepage of publicatie-instellingen klaar.

## GHL activeren op een Node-host

1. Configureer de GHL-workflow met een inkomende webhook en map de velden `situation`, `business`, `services`, `online`, `location`, `start`, `name`, `email`, `company`, `phone`, `consent`, `consentVersion`, `createdAt`.
2. Stel `GHL_WEBHOOK_URL` uitsluitend als servergeheim in. Zie `.env.example`; Node laadt `.env` niet automatisch. Eventueel lokaal: `node --env-file=administratievergelijker-match/.env administratievergelijker-match/server.mjs`.
3. Start `server.mjs`. `PORT` is optioneel (standaard 3000). De server luistert op loopback; zet hem achter een HTTPS reverse proxy op dezelfde origin. Pas de bindhost aan als de gekozen host dat vereist. Geef de oorspronkelijke publieke Host door. Publiceer geen env-bestanden.
4. Rond vóór productie de privacy-informatie af met de echte verantwoordelijke, contactpunt, bewaartermijnen, werkwijze voor rechtenverzoeken en concrete criteria/ontvangers voor delen. Stem toegang en bewaring af met kantoren en GHL.
5. Test met een fictieve lead in GHL, inclusief veldmapping, uitgeschakelde workflow, foutrespons en timeout. Een 2xx van de webhook betekent ontvangst door de koppeling, geen bewijs dat een kantoor is benaderd. Activeer pas daarna de publieke endpoint.

De backend valideert opnieuw, accepteert alleen JSON vanaf dezelfde origin, beperkt de body en aanvragen per IP (5 per minuut), gebruikt een HTTPS-webhook zonder redirects en een timeout. Geheimen en persoonsgegevens worden niet gelogd. De beperking is in-memory; gebruik bij meerdere instanties een centrale rate limiter en stel misbruikbeveiliging in op de proxy. Er zijn geen automatische retries om dubbele leads bij een onzekere netwerkuitkomst te beperken. Een handmatige retry kan nog steeds een duplicaat opleveren; gebruik GHL-deduplicatie. GitHub Pages kan deze backend niet draaien; gebruik daar testmodus of migreer deze map naar een Node-host.

`generate_lead` wordt alleen aangeroepen als een bestaande `window.gtag` aanwezig is én de backend expliciet succes bevestigt. De pagina installeert geen analytics. Het event bevat alleen de formuliernaam, geen antwoorden of contactgegevens. Regel eventuele analytics-toestemming in de hostsite.

## Controles

```powershell
node --check administratievergelijker-match/app.js
node --check administratievergelijker-match/server.mjs
npm install --no-save --package-lock=false playwright
node administratievergelijker-match/test.mjs
node administratievergelijker-match/test-backend.mjs
```

De browsertest gebruikt lokaal geïnstalleerd Chrome. Geef zo nodig `BROWSER_PATH` mee. Hij controleert verplichte keuzes, diensten, locatie/online, ongeldig e-mailadres, toestemming, antwoordbehoud bij teruggaan en opslagfouten, bevestiging, CSV, verwijderen, hulpmiddelen en horizontale overflow op 360/390/768/1280px. Toets daarnaast handmatig met toetsenbord en schermlezer. Testaanvragen blijven op het testbrowserprofiel; de test verwijdert ze aan het eind.
