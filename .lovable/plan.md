Det här är en stor leverans. Jag föreslår att vi delar upp den i 4 PR-liknande steg så du kan testa allt eftersom. Säg "kör allt" så bygger jag steg 1–4 i sekvens, eller välj startpunkt.

## Steg 1 — Vården som faktisk part
**a) Print-vänlig PDF (1 sida, senaste 3 mån)**
- Ny `src/lib/doctorReportPdf.ts` baserad på befintlig `reportPdf.ts` men kompakt: huvuddata + episoder + mediciner + topp-3 mönster, allt på ETT A4.
- Knapp "Läkar-PDF (3 mån)" på `/rapporter`.

**b) "Visa min läkare"-QR-kod (temp access)**
- Återanvänd `shared_reports`-tabellen — finns redan med `share_key` och `expires_at`.
- Ny knapp "QR till läkare" → skapar share med 24h expiry, visar QR-kod via `qrcode.react` (lägg till deps).
- `SharedReport.tsx` finns redan, fungerar med temp-länk.

**c) Läkar-dashboard översikt (flera patienter)**
- `DoctorDashboard.tsx` finns. Lägg till en kompakt "varningstabell": en rad per patient med senaste mående, sömn-streak, och eventuell aktiv `EpisodeWarning` (samma `detectActiveWarnings` per patient).
- Sortera så att kritiska varningar hamnar överst.

## Steg 2 — Tankar → AI nästa nivå
**d) Sentiment-analys över tid**
- Ny edge-funktion `analyze-thoughts` som batchanalyserar senaste 30 dagars `comment` med Lovable AI (`google/gemini-3-flash-preview`) och returnerar `{date, sentiment: -1..1, themes: string[]}`.
- Cacha i ny tabell `thought_analysis` (user_id, date, sentiment, themes, analyzed_at). Migration.
- Visa graf "tonen i dina tankar" på `/monster` — sparkline + "Tonen blir mörkare senaste veckan ⚠️" om trend < -0.2.

**e) Trigger-extraktion**
- Samma edge-funktion: extrahera nyckelord/teman ("jobbet", "mamma", "festen") och korrelera med mående 1–3 dagar senare via SQL (kör i edge-funktionen).
- Spara som `pattern_insights` med `pattern_type='trigger'` så det visas automatiskt i befintlig `PatternInsightsSection`.

**f) Tankedagbok i Mönster**
- Ny sektion "Din tankedagbok" på `/monster` — kronologisk lista över alla `comment` (icke-tomma), med liten mood-färgmarkör per dag.
- Klick → öppnar dagen i `DayDetailDialog`.

## Steg 3 — Quick check-in på 3 sekunder (swipe)
- Ny komponent `SwipeQuickCheckin.tsx`: vertikal mood-skala 1–7, swipe up/down för att välja, tap för att bekräfta. ~3 sek totalt.
- Gör quick-läget till **default** i `TodayCheckin`. Utförlig blir opt-in via "Lägg till sömn, mat, träning ▾".
- Behåll alla nuvarande fält men dolda bakom expand.

## Steg 4 — Polish
- Lägg till i indexmem: PDF-läkarrapport, QR-share, tankesentiment-flöde.
- Säkerställ att episod-varning syns i läkardashboard.

---

### Tekniska val
- **PDF:** behåller `jspdf` (redan installerat).
- **QR:** `qrcode.react` (~5kb).
- **AI:** Lovable AI Gateway, gemini-3-flash-preview, structured output med `Output.object`.
- **DB:** ny tabell `thought_analysis` (RLS: user_id only + doctor/relative read via befintliga share-flaggor).

Säg "**kör allt**" så börjar jag på steg 1 och fortsätter till alla 4 är klara. Eller "**bara steg X**" om du vill ta det stegvis.