// Blogginnehåll på svenska. Varje post = en SEO-optimerad artikel.
// Lägg till nya poster här — de dyker upp på /blogg automatiskt.

export interface BlogPost {
  slug: string;
  title: string;
  description: string; // Meta description (<160 tecken)
  category: string;
  readingTime: string;
  publishedAt: string; // ISO
  updatedAt?: string;
  content: string; // HTML/markdown-liknande, vi renderar med enkla rules
}

export const blogPosts: BlogPost[] = [
  {
    slug: "vad-ar-en-stamningsdagbok",
    title: "Vad är en stämningsdagbok? En komplett guide för 2026",
    description:
      "En stämningsdagbok hjälper dig att förstå mönster i ditt mående. Lär dig hur du börjar, vad du ska skriva och varför det funkar — särskilt vid bipolär.",
    category: "Grunder",
    readingTime: "6 min",
    publishedAt: "2026-04-29",
    content: `
## Vad är en stämningsdagbok?

En stämningsdagbok är ett verktyg där du regelbundet — oftast varje dag — registrerar hur du mår. Det handlar inte bara om "glad eller ledsen", utan om en mer detaljerad bild: din energinivå, sömn, aptit, ångest, och vad som hänt under dagen.

Tanken är enkel men kraftfull: när du tittar bakåt på flera veckor eller månader börjar **mönster** framträda som du aldrig hade sett dag för dag. Du upptäcker att tre dåliga nätters sömn nästan alltid följs av en nedstämd vecka. Eller att en viss medicin gör att din energi sviktar mitt på dagen.

## Varför funkar det?

Hjärnan är dålig på att komma ihåg känslor i efterhand. Frågar någon "hur har du mått senaste månaden?" tenderar du att svara utifrån hur du mår just nu. En stämningsdagbok ger dig **objektiv data** istället för minnesfärgade gissningar.

Forskning visar att personer som regelbundet följer sitt mående:

- Upptäcker tidiga varningstecken **flera dagar** innan en episod blir kritisk
- Får bättre samtal med sin läkare (konkreta data istället för vaga beskrivningar)
- Känner mer kontroll över sitt liv — du blir aktiv part istället för passiv mottagare

## För vem är en stämningsdagbok?

Stämningsdagbok används traditionellt av personer med **bipolär sjukdom**, men är värdefull för alla som lever med:

- Återkommande **nedstämdhet** eller depression
- **Ångest** och oro
- ADHD eller andra neuropsykiatriska tillstånd
- Sömnproblem
- Stress eller utbrändhet

Också för dig som bara vill förstå dig själv bättre — du behöver ingen diagnos för att börja.

## Vad ska du skriva ner?

Du behöver inte skriva en hel essä varje dag. De viktigaste fälten är:

1. **Stämningsläge** — på en skala (t.ex. 1–7 från kraftigt nedstämd till uppvarvad)
2. **Sömn** — antal timmar och kvalitet
3. **Energi** — hur mycket ork du hade
4. **Aptit** — åt du normalt, mer, eller mindre?
5. **Mediciner** — tog du dem som vanligt?
6. **Kort notering** — vad hände idag som påverkade dig?

Vid bipolär är **sömn och aptit U-formade**: både för lite och för mycket är en varning. Sov du bara tre timmar och kände dig pigg? Det är ett tidigt tecken på att vara på väg att bli uppvarvad — inte en bra dag.

## Hur kommer du igång?

Det enklaste sättet är en app som **påminner dig** och visualiserar dina data automatiskt. Papper och penna funkar också, men kräver mer disciplin och du missar mönstren som syns i grafer.

Toddy är byggt just för detta — en stämningsdagbok som tar 30 sekunder per dag och som lär sig din rytm. Du får tillbaka tydliga insikter, inte bara råa siffror.

## Dela med din läkare

Det allra mest värdefulla med en stämningsdagbok kommer fram i mötet med vården. Istället för att försöka komma ihåg "hur har det varit sen sist?" kan du visa en graf över de senaste tre månaderna. Din läkare ser direkt om medicinen funkar, om det finns säsongsmönster, och om något behöver justeras.

## Vanliga frågor

**Måste jag fylla i varje dag?**
Helst ja, men missar du en dag är det inte hela världen. Mönster syns över tid — en enstaka tom dag förstör inte bilden.

**Hur länge måste jag hålla på innan jag ser något?**
Räkna med minst 4 veckor innan tydliga mönster framträder. Efter 3 månader får du verklig insikt.

**Vad händer om mina data ser oroande ut?**
Det är hela poängen — du upptäcker det innan det blir akut. Kontakta din behandlare om du ser tydliga varningstecken. Vid akuta tankar på att ta livet av dig: ring **112** eller jourlinjen **90101**.

---

Vill du börja idag? [Skapa konto i Toddy →](/skapa-konto)
`,
  },
  {
    slug: "tidiga-varningstecken-bipolar",
    title: "Tidiga varningstecken vid bipolär sjukdom — så känner du igen dem",
    description:
      "Lär dig de tidiga signalerna på en uppvarvad eller nedstämd episod. Tidig upptäckt = enklare att bromsa innan det blir akut.",
    category: "Bipolär",
    readingTime: "7 min",
    publishedAt: "2026-04-29",
    content: `
## Varför är tidig upptäckt så viktigt?

Vid bipolär sjukdom är det inte själva episoderna som är farligast — utan att de **upptäcks för sent**. När en uppvarvad period når sin topp har personen ofta tappat insikten om att något är fel. Då är det svårt att vända.

Men nästan alla episoder börjar med subtila förändringar **dagar eller veckor** innan de blir uppenbara. Lär du dig dina egna varningstecken kan du agera tidigt — justera medicin, sova mer, dra ner på stress — och ofta bromsa eller mildra episoden helt.

## Tidiga tecken på en uppvarvad period (mani/hypomani)

Detta är de vanligaste tidiga signalerna, baserade på 1177 och klinisk forskning:

### Sömn
- Du sover **kortare** än vanligt men känner dig pigg
- Du vaknar tidigt utan att vara trött
- Behovet av sömn känns "onödigt"

⚠️ **Detta är det viktigaste tecknet.** Om du sover 4–5 timmar och känner dig full av energi — det är inte en bra dag, det är en varning.

### Energi och aktivitet
- Du tar dig an många nya projekt samtidigt
- Du städar, tränar, jobbar mer än vanligt
- Du känner dig "produktiv på riktigt äntligen"

### Tankar
- Tankarna går snabbare, ibland för snabba för att hinnas med i tal
- Du får många "geniala" idéer
- Du känner dig **mer självsäker än vanligt** — du klarar saker du normalt drar dig för

### Beteende
- Du pratar mer och snabbare
- Du shoppar, festar, tar risker du inte normalt skulle ta
- Du blir lättirriterad om någon försöker bromsa dig

### Socialt
- Du söker upp folk mer
- Sex-driften ökar
- Du börjar projekt med nya bekanta

> **Viktigt:** Hög energi + lite sömn + stort självförtroende ska du **aldrig** fira okritiskt. Det är ofta första steget mot mani.

## Tidiga tecken på en nedstämd period (depression)

### Sömn
- Du sover **mer** än vanligt — eller plötsligt mycket mindre (med ångest)
- Sömnen känns inte vilsam
- Det är svårt att gå upp på morgonen

### Energi
- Vardagsuppgifter (duscha, äta, svara på meddelanden) känns oöverkomliga
- Du blir trött av att göra ingenting

### Tankar
- Allt känns meningslöst eller hopplöst
- Du gnäller på dig själv för minsta sak
- Beslut blir omöjliga — vad ska du äta? Vad ska du säga ja till?

### Aptit
- Du äter mycket mer eller mycket mindre än vanligt
- Mat smakar inget

### Socialt
- Du drar dig undan
- Telefonsamtal känns ansträngande
- Du svarar inte på meddelanden

### Allvarligare tecken
- Du tänker att det vore enklare om du inte fanns
- Tankar på att skada dig själv
- Konkreta planer

> **Vid suicidtankar — sök hjälp direkt.** Ring **112** vid akut fara, **1177** för rådgivning, eller **90101** för jourlinje (öppet alla dagar).

## Hur du upptäcker dina egna mönster

Alla har olika varningstecken. Det som funkar är att **systematiskt registrera** ditt mående varje dag i månader. Då börjar du se: "varje gång jag inte sovit på två nätter, känner jag mig oövervinnerlig dag tre". Eller: "två veckor med dålig aptit kommer alltid före en nedstämd månad".

En stämningsdagbok som Toddy gör detta automatiskt — den varnar dig när dina mönster matchar tidigare episoder.

## Vad gör du när du ser ett varningstecken?

1. **Säg det högt till någon** — partner, anhörig, vän, behandlare. Att uttala det bryter förnekelsen.
2. **Skydda sömnen.** Gå till sängs i tid även om du inte är trött. Undvik skärm, koffein, alkohol.
3. **Undvik stora beslut.** Inga nya projekt, inga shopping-rundor, inget "vi separerar".
4. **Kontakta din vårdgivare.** Berätta vad du ser. Bättre att ringa "i onödan" en gång för mycket.
5. **Skriv ner det.** Det blir data du kan visa nästa gång.

## När det är dags för anhöriga att kliva in

Ofta är det partnern eller en nära vän som ser tecknen först — innan personen själv. Vid bipolär finns ofta en **insiktsbrist** vid uppvarvade perioder, så anhörigas roll är kritisk.

Om du är anhörig: säg det rakt och kärleksfullt. "Jag märker att du sovit lite och pratar snabbare än vanligt. Jag är orolig. Kan vi ringa din läkare ihop?"

---

Vill du börja registrera ditt mående idag? [Skapa konto i Toddy →](/skapa-konto)
`,
  },
  {
    slug: "skillnad-nedstamdhet-depression",
    title: "Skillnaden mellan nedstämdhet och depression — när ska du söka hjälp?",
    description:
      "Att vara ledsen är inte samma sak som depression. Lär dig skillnaden, varningstecknen och när det är dags att söka professionell hjälp.",
    category: "Depression",
    readingTime: "5 min",
    publishedAt: "2026-04-29",
    content: `
## Alla blir nedstämda ibland

Att vara ledsen, trött eller omotiverad är en del av att vara människa. En jobbig vecka på jobbet, ett bråk med en närstående, en grå höstvecka — det räcker för att kännas tungt. Det är **nedstämdhet**, och det går oftast över av sig självt.

Depression är något annat. Det är inte bara ledsamhet — det är ett **medicinskt tillstånd** som påverkar hur hjärnan fungerar. Och det går oftast inte över av sig självt.

## Snabbtest: nedstämdhet eller depression?

Tänk på de senaste två veckorna. Stämmer minst fem av dessa nästan varje dag, hela dagen?

- Du känner dig nedstämd, tom eller hopplös
- Du har tappat intresse för saker du normalt gillar
- Förändrad aptit (mer eller mindre än vanligt)
- Sömnproblem (för lite eller för mycket)
- Du känner dig trött, även efter vila
- Skuld- eller värdelöshetskänslor
- Svårt att koncentrera dig eller fatta beslut
- Långsamma rörelser eller ökad rastlöshet
- Tankar på döden eller att skada dig själv

Stämmer fem eller fler — och påverkar det din vardag — kan det vara depression. **Sök hjälp.**

## Tre viktiga skillnader

### 1. Tid
- **Nedstämdhet:** några dagar till en vecka
- **Depression:** minst två veckor, oftast längre

### 2. Intensitet
- **Nedstämdhet:** du kan fortfarande njuta av saker du gillar
- **Depression:** ingenting känns roligt, ens favoritsaker

### 3. Funktion
- **Nedstämdhet:** du klarar vardagen
- **Depression:** vardagliga saker som duscha, laga mat eller jobba blir oöverkomliga

## Varför är skillnaden viktig?

För att depression är **behandlingsbar** — men du måste få rätt hjälp. Att försöka "rycka upp dig" eller "tänka positivt" funkar inte vid depression, lika lite som att tänka positivt botar lunginflammation.

Effektiv behandling brukar innehålla:

- **Samtalsterapi** (KBT, IPT eller andra evidensbaserade former)
- **Mediciner** (antidepressiva) vid medelsvår eller svår depression
- **Livsstilsförändringar** — sömn, motion, socialt umgänge
- **Stöd från närstående**

## När ska du söka hjälp?

Direkt om du:

- Har symptomen ovan i mer än två veckor
- Har tankar på att inte vilja leva
- Inte klarar din vardag (jobb, hygien, mat)
- Använder alkohol eller droger för att stå ut

**Var ska du börja?**

- Ring **1177** för rådgivning
- Boka tid hos din **vårdcentral** — be om "psykolog" eller "psykiatri"
- Vid akut fara: ring **112**
- Jourlinje: **90101** (öppet alla dagar 06–22)

## Vad kan du göra själv under tiden?

Att söka vård kan ta tid. Under väntetiden — och efter att hjälpen kommit igång — finns saker som hjälper:

- **Registrera ditt mående dagligen.** En stämningsdagbok gör det lättare att se mönster och visa data till din läkare.
- **Skydda sömnen.** Försök hålla regelbundna tider, även när det är svårt.
- **Rör på dig** — även små promenader hjälper.
- **Säg till någon.** Att vara ensam med tankarna gör allt värre.

## Vanliga missuppfattningar

> **"Jag har inget skäl att vara deprimerad."**
Depression är inte en reaktion på dåliga händelser — det är en hjärnsjukdom. Du kan ha allt och ändå bli sjuk.

> **"Jag vill inte ta antidepressiva."**
Ditt val. Men prata åtminstone med en läkare innan du bestämmer dig. Modern medicin är inte vad den var på 80-talet.

> **"Det går över."**
Ibland gör det det. Men obehandlad depression varar i snitt 6–8 månader — och risken att den kommer tillbaka ökar för varje gång.

---

Vill du börja registrera ditt mående och se mönster? [Skapa konto i Toddy →](/skapa-konto)
`,
  },
  {
    slug: "somn-och-psykisk-halsa",
    title: "Sömn och psykisk hälsa — varför timmarna spelar roll",
    description:
      "Sömn är inte en lyx — det är medicin. Lär dig hur sömn påverkar din psykiska hälsa, särskilt vid bipolär och depression.",
    category: "Sömn",
    readingTime: "6 min",
    publishedAt: "2026-04-29",
    content: `
## Sömn är inte passivt

När du sover händer otroligt mycket. Hjärnan rensar avfallsprodukter, befäster minnen, balanserar känsloreglering, återställer hormonbalans, och reparerar celler. Sover du för lite — eller för mycket — påverkas allt detta.

För någon som lever med bipolär eller depression är sömn inte bara viktigt. Det är **det viktigaste enskilda verktyget** för att må bra.

## Hur mycket sömn behöver du?

Vuxna behöver oftast **7–9 timmar**. Inte mindre. Inte mycket mer.

- **Mindre än 6 timmar:** ökar risken för depression, ångest, nedsatt immunförsvar
- **Mer än 10 timmar regelbundet:** kopplat till depression och andra hälsoproblem

Notera att det är **regelbundenhet** som spelar roll, inte enstaka nätter. Att sova 5 timmar en natt är inte farligt. Att sova 5 timmar i veckor är.

## Sömn vid bipolär — extra viktigt

Vid bipolär sjukdom är sömn ett tveeggat svärd:

### Tecken på uppvarvad period
- Du sover **kortare** men känner dig pigg
- Du vaknar tidigt utan att vara trött
- "Jag behöver inte sömn just nu"

⚠️ Detta är **det första tecknet** på att en uppvarvad/manisk period är på väg. Inte en bra dag — en varning.

### Tecken på nedstämd period
- Du sover **mer** än vanligt
- Eller motsatsen: du kan inte somna pga ångest
- Sömnen känns inte vilsam

> **Tumregel vid bipolär:** Sov regelbundet samma tider varje dag — även på helger. Det är den enskilt viktigaste vanan.

## Sömn vid depression

Depression och sömn påverkar varandra åt båda hållen:

- Depression försämrar sömnen
- Dålig sömn förvärrar depression

Det betyder också att förbättrad sömn kan **bryta** den nedåtgående spiralen. Studier visar att personer med depression som lyckas etablera regelbundna sömntider mår mätbart bättre inom 2–4 veckor.

## Konkret: så förbättrar du din sömn

### Tider
- Gå till sängs och vakna **samma tid** varje dag, även helger
- Sikta på 7–9 timmar
- Om du måste välja: hellre regelbundenhet än längd

### Före sängen
- Inga skärmar 30–60 min före sömn
- Inget koffein efter kl 14
- Ingen alkohol nära sömn (alkohol förstör djupsömnen)
- Sval, mörk, tyst sovrum

### Vid sömnsvårigheter
- Vakna alltid samma tid, även om du sovit dåligt
- Inga tupplurar dagtid (max 20 min före kl 15)
- Stig upp om du legat 20 min utan att somna — gör något lugnt och gå tillbaka

### Vid uppvarvad period
- **Tvinga dig** till sängs i tid, även om du inte känner dig trött
- Be om hjälp med medicinjustering om sömnen inte återkommer på 2–3 dagar
- Undvik stora projekt på kvällen

## Spåra din sömn

Att veta hur du sov igår räcker inte. Mönster över **veckor och månader** är det som ger insikt:

- Sov du dåligt tre nätter i rad innan du blev nedstämd?
- Vaknar du tidigt veckorna före en uppvarvad period?
- Påverkar veckodag, mediciner, eller alkohol din sömn?

En stämningsdagbok som Toddy registrerar både din sömn och ditt mående — och visar dig sambanden automatiskt.

## När ska du söka hjälp?

- Sömnsvårigheter mer än 3 nätter/vecka i 4+ veckor
- Plötslig stor förändring i sömnbehov
- Sömnproblem som påverkar din vardag
- Snarkningar eller andningsuppehåll (kan vara sömnapné)

Ring **1177** för rådgivning eller boka tid på din vårdcentral.

---

Vill du börja spåra sömn och mående tillsammans? [Skapa konto i Toddy →](/skapa-konto)
`,
  },
  {
    slug: "anhorig-psykisk-ohalsa",
    title: "Anhörig till någon med psykisk ohälsa — så kan du hjälpa",
    description:
      "Som anhörig är du en av de viktigaste personerna i återhämtningen. Här är konkreta råd för hur du stöttar utan att bränna ut dig själv.",
    category: "Anhörig",
    readingTime: "6 min",
    publishedAt: "2026-04-29",
    content: `
## Du är viktigare än du tror

Forskning är tydlig: personer med psykisk ohälsa som har starkt stöd från närstående mår bättre, återhämtar sig snabbare, och har lägre risk för återfall. Du som anhörig — partner, förälder, barn, syskon, vän — är inte en biroll. Du är en av huvudrollerna.

Men det är också svårt. Du vill hjälpa, men vet inte hur. Du oroar dig konstant. Du blir frustrerad, ibland arg, och sen skuldtyngd för att du blev arg. Du försummar dig själv.

Den här texten är till dig.

## Vad du kan göra — konkret

### 1. Lyssna utan att lösa
Det första instinkten när någon mår dåligt är att **fixa det**. "Har du provat att...?" "Det blir bättre, du..." "Tänk positivt, du..."

Det funkar nästan aldrig. Det får ofta personen att känna sig oförstådd.

Det som funkar är att **lyssna** och bekräfta. "Det låter jättejobbigt." "Jag hör dig." "Du behöver inte förklara." Ibland räcker det att bara vara där.

### 2. Lär dig sjukdomen
Läs på om diagnosen. Förstå att depression inte är "vara ledsen", att mani inte är "vara på humör", att ångest inte är "oroa sig". Detta är medicinska tillstånd som påverkar hjärnans funktion.

Ju mer du vet, desto mindre frustrerad blir du när personen "borde kunna ta sig samman".

### 3. Märk varningstecken
Du ser ofta saker före personen själv:

- Vid uppvarvad period: kortare sömn, snabbare prat, många nya idéer, irritabilitet
- Vid depression: tystnad, undandragande, ändrad sömn/aptit, hopplöshet

Säg det rakt och kärleksfullt: "Jag märker att du sovit lite och pratar snabbare än vanligt. Jag är orolig. Kan vi prata om det?"

> Vid bipolär finns ofta **insiktsbrist** vid maniska perioder. Då är din observation kritisk — personen ser inte själv vad som händer.

### 4. Hjälp med vårdkontakt
Att ringa 1177 eller boka läkartid kan vara övermäktigt vid svår depression. Erbjud konkret hjälp:

- "Vill du att jag ringer 1177 åt dig?"
- "Jag följer med på läkarbesöket om du vill."
- "Ska vi tillsammans skriva ner vad du vill berätta?"

### 5. Fråga om självmordstankar — rakt
Många är rädda att "väcka tanken" genom att fråga. Det är en myt. Att fråga **minskar** suicidrisken.

"Tänker du på att skada dig själv? Tänker du på att inte vilja leva?"

Får du ett ja: ta det på största allvar. Lämna inte personen ensam. Ring **112** eller följ med till akuten.

Andra resurser:
- **1177** — rådgivning
- **90101** — jourlinjen (öppet 06–22)
- **Mind Självmordslinjen** — chatt och tel

## Vad du INTE ska göra

- ❌ "Du har ju allt — vad har du att vara ledsen över?"
- ❌ "Andra har det värre."
- ❌ "Du måste bara komma ut och röra på dig."
- ❌ "Det är inte så farligt."
- ❌ "Skärp dig nu."

Även om du menar väl, dessa fraser gör skada. Personen vet redan att de "borde" må bättre — det gör situationen värre.

## Hur du tar hand om dig själv

Du kan inte bära någon annan om du själv kollapsar. Det här är inte själviskt — det är **nödvändigt**.

### Sätt gränser
Det är okej att säga "jag orkar inte just nu, men jag finns här imorgon". Du behöver inte vara tillgänglig 24/7.

### Sök eget stöd
- **Anhörigföreningar** finns för bipolär (Balans), depression, ångest m.fl.
- **Egen terapi** är ofta värdefull
- **Vänner du kan prata med** utan att förråda förtroendet

### Vila
Sömn, motion, mat, något som ger dig glädje. Allt det du säger åt den sjuke att göra — gör det själv.

### Skuldfrågan
Det är **inte ditt fel** om personen inte mår bra. Du orsakade inte sjukdomen. Du kan inte bota den. Du kan stötta — men ansvaret för behandlingen ligger inte på dig.

## När det är akut

Ring **112** om personen:

- Pratar konkret om att ta sitt liv
- Har en plan eller verktyg
- Försökt skada sig
- Är så uppvarvad att hen kan skada sig själv eller andra

Vänta inte. Det är bättre att ringa "i onödan" en gång för mycket.

## Anhörigvyn i Toddy

Toddy har en speciell anhörigvy där du — med personens samtycke — kan följa hens mående. Du ser samma data och varningstecken, så att ni kan agera tidigt tillsammans.

[Läs mer om hur Toddy fungerar för anhöriga →](/for-anhoriga)
`,
  },
];
