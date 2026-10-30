# Quests, story and return visits for Oradea Drive

**Recommendation: ship «Secretele Oradiei» first, this week.** The quest book already works in the Oradea build and its UI is already translated, so the 23 sourced cards below are a 1.5–2 day data job that gives players a city-wide collection across every layer of Oradea's history. In the same week, drop the mugging mission from the Oradea build (it tells players to "knock down the muggers") and add a save code, because Safari wipes browser storage after 7 days without a visit. Then build a small story layer and ship the «Noaptea Muzeelor» prologue and chapter 1 (about 1.5 weeks), followed by a weekly shareable route.

Research only: no code was changed. Written 2026-10-30. Sources are numbered [n] and listed at the end; card sources are in the card table.

## What needs the owner

| # | Decision | Why it matters | My default |
|---|---|---|---|
| 1 | A native Romanian read of the 23 cards | I wrote the Romanian; facts are sourced, wording needs a native check | Ship after one read |
| 2 | Send the two Holocaust-related cards (`eva`, `aachvas`) to the Tikvah association or the Oradea Jewish community | Accuracy and tone on painful history | Ship `eva` with `quiet: true` (no money, no jingle) |
| 3 | Turn off the mugging mission in the Oradea build | Family and church audience; the task is to hit people with the car | Off |
| 4 | Include the Freemasons' Temple card (reserve R1) | Real museum and an odd story, but some church partners may object | Leave out |
| 5 | Pick the story concept | Sets 3–5 weeks of work | «Noaptea Muzeelor» |
| 6 | Add a cookieless event counter | Without it nobody can see whether players come back (below) | Yes, with a line on the start card |

## 1. What holds players, ranked by impact per effort

Evidence in short:

- **Autonomy, competence and relatedness** independently predict enjoyment and future play (four studies, Self-Determination Theory) [1]. A story with clear goals feeds competence; free roaming feeds autonomy; characters and sharing feed relatedness.
- **Completion** ranks in the top 3 motivations in every age and gender segment of Quantic Foundry's data; Completion and Fantasy are women's top two; Discovery ("explore, tinker, experiment") is one of the 12 core motivations [2][3]. Collections and quest cards serve Completion and Discovery directly.
- **Most players leave fast.** Mobile games in 2024: top-quartile day-1 retention about 26–28 %, median day-7 about 3.4–3.9 %; median session 5–6 minutes, top quartile 8–9 [4][5]. Browser players stay longer per visit: CrazyGames measured a 30-minute average US browser session over 1.74 billion sessions (May 2025–May 2026) [6]. So a visit should offer a goal it can finish in 5–15 minutes, and a reason to return next week.
- **Sharing without accounts works.** Wordle went from 90 players on 1 November 2021 to over 300,000 by 2 January 2022; in December its creator had added the emoji grid that players pasted into social media [7]. GeoGuessr passed 60 million registered players, with growth credited to creators (2024) [8].
- **Content updates keep location-game players.** A 2026 scoping review of Pokémon GO (preprint, not yet peer-reviewed) finds continued play rests on social needs and regular content updates; nostalgia and novelty only start it [9].
- **Instant play matters in the browser.** Slow Roads starts in one click with no install or login; only 52 % of its players got above 55 fps, so many play on weak machines [10].
- **History in games teaches some facts, not many.** In a Montreal study, students who played the Assassin's Creed Discovery Tour improved 22–44 % on a test, but a 12-minute lecture did better (2018) [11]. Keep stories short and let the place do the work.
- **Streaks give small gains.** Duolingo raised day-14 retention by 3.3 % by changing how its streak works, in an app built on daily habit [12]. Gamification helps in general, but depends on context [13].
- **Browser saves are fragile.** Safari deletes localStorage and IndexedDB "after seven days of Safari use without user interaction on the site" (WebKit, 24 March 2020) [14]. Every progress system here lives in localStorage.

| Rank | Mechanic | What it means here | Impact | Effort | Why this rank |
|---|---|---|---|---|---|
| 1 | Quest packs | «Secretele Oradiei» now (23 cards), then a themed pack every few weeks (Art Nouveau, churches, writers) | High | XS: 1.5–2 days, then ~1 day per pack | Pure data on a working system; Completion + Discovery; content updates bring players back [2][9] |
| 2 | Family-tone fix | Remove the mugging mission from the Oradea build (keep the chase, which rams a getaway SUV) | Protects the core audience | XS: 0.5 day | The Romanian text today reads "Doboară tâlharii fără să atingi victima" (`src/world/oradea/ui.js` line 70) |
| 3 | Save code | "Copy / paste my progress" in the controls card: money, sights, quests, story | Medium: stops silent progress loss | S: 0.5–1 day | Safari 7-day storage cap [14] |
| 4 | Weekly route + share line | One seeded route for everyone each week (5 rings over real landmarks), best time kept locally, a one-line result to paste | High for return visits | M: 2–3 days | Reuses the tour rings in `missions.js`; Wordle-style sharing without accounts [7] |
| 5 | Story campaign | 9 chapters with characters, dialogue cards and checkpoints (section 3) | High for session depth | L: 9–13 dev days for the layer, ~1 day per chapter | SDT competence and relatedness [1]; gives a 10–15 minute goal per visit |
| 6 | Photo challenges | "Photograph the empty chair of the Holnap poets" using the photo mode that already exists (`src/ui/photomode.js`, with Web Share) | Medium | S–M: 1–2 days | Discovery + sharing; most of the code is there |
| 7 | Event counter | A cookieless count of `game_ready`, `quest_card`, `mission_end` per random browser id | Lets you measure 1–6 | S: 1 day | `track()` only sends on driver.ck.ua (`src/analytics.js`), so the Oradea build measures page views only |
| 8 | Hungarian UI | A third language next to RO and EN | Medium | M: 2–4 days plus review | 20.9 % of Oradea is Hungarian (2021 census) [15] |
| 9 | Mission badges | "50 taxi rides", "every chase won" | Low–medium | S: 1 day | Completion [2], cheap |
| 10 | Daily streak | Login streak | Low | S | Small gains [12], and pressure on children; prefer the weekly route |
| 11 | Global leaderboards | Server, anti-cheat, moderation, no accounts | Low–medium | L | Weekly local best + share line gets most of the value |
| 12 | Multiplayer | Shared city | Low per effort | XL | Out of scope |

Session design: a quest card is a 1–3 minute drive, the weekly route 3–5 minutes, a story chapter 10–15 minutes.

## 2. «Secretele Oradiei»: 23 quest cards

**How it plugs in.** `src/game/quests/index.js` reads `QUESTS = CITY ? CITY.quests ?? [] : [SECRETS]`, and `src/world/oradea/config.js` has `quests: []`. Add `src/world/oradea/quests.js` exporting the quest below and set `quests: [SECRETE]`. The book, chip, hint pill and story card are already translated (`ui.js` lines 165–190) and pay in lei. Card format is the one in `src/game/quests/secrets.js`: `{ id, icon, ll, at?, title, hint, story, source }`, where `at` moves the light when the place is far from a road. One new optional field, `quiet: true`, needs about 10 lines in `src/game/quests.js` `find()`: no money, no `cue('partner')` jingle, a neutral banner. Copy `tests/quests.test.mjs` to `tests/oradea-quests.test.mjs` with the Oradea `map.json`, and test both languages (keep the `[ro, en]` pairs testable, because `t()` resolves at import).

**Checks I ran** (node scripts in the scratchpad, against `public/assets/oradea/map.json` and the code's own `FRAME_OF` and `curbSpot`, no game started): all 23 points are inside the play region; each light is within 120 m of a motor road (the test's rule) or has an `at`; hints are 84–133 characters (limit 200), stories 291–582 (limit 800), 3–4 sentences; no em dashes; ids unique. Coordinates are OSM nodes or way centres from the raw OSM fetch in `tools/cherkasy/raw/oradea/`; the three `at` points are the nearest motor-road kerb from `map.json`, not guesses. Three pairs of lights stand 64–78 m apart near Parcul Traian (`vulcan`–`czaran`, `lazar`–`czaran`, `holnap`–`adorjan`): fine for the 14 m trigger, but busy on the map.

| # | id | Card (EN) | Layer | Place, OSM ref | lat, lon | Light | Source (date) |
|---|---|---|---|---|---|---|---|
| 1 | rogerius | A quarter named after a chronicler | 1241 Mongol invasion, the bishopric | Piața Rogerius market, way 436834230 | 47.076837, 21.918041 | kerb 31 m | [en.wikipedia Roger of Torre Maggiore](https://en.wikipedia.org/wiki/Roger_of_Torre_Maggiore) |
| 2 | cetate-crowns | Crowns under the fortress yard | Bishopric of St Ladislaus, royal tombs, 1390 statues | fortress archaeological site, node 1311238558 | 47.052344, 21.942855 | `at` 47.052695, 21.941159 (west road, 139 m) | [ro.wikipedia Cetatea Oradea](https://ro.wikipedia.org/wiki/Cetatea_Oradea); also [Mediafax, 1 Nov 2007](https://www.mediafax.ro/?p=1021622), [en.wikipedia St George statue](https://en.wikipedia.org/wiki/Statue_of_Saint_George,_Prague_Castle) |
| 3 | cetate-1660 | The miller's wife | Ottoman siege 1660, eyalet, 1692 | Bethlen bastion, node 12077091739 | 47.051095, 21.9405 | kerb 29 m | [ro.wikipedia Cetatea Oradea](https://ro.wikipedia.org/wiki/Cetatea_Oradea) |
| 4 | cetate-depot | The church that became a store | Communist era, decay after 1975, 2009–2015 restoration | fortress church (OSM POI "Biserica catolică") | 47.05162, 21.94338 | `at` 47.052112, 21.94517 (Strada Redutei, 151 m) | [ro.wikipedia Cetatea Oradea](https://ro.wikipedia.org/wiki/Cetatea_Oradea) |
| 5 | ady-cafe | The poet's café | Ady, Hungarian literary life | Ady Endre museum, way 1534596467 | 47.057889, 21.935142 | kerb 18 m | [CIMEC museum guide](https://ghidulmuzeelor.cimec.ro/idEN.asp?k=113) |
| 6 | holnap | The empty chair | The Holnap circle, 1908 | statue group, node 4827012515 | 47.057486, 21.932022 | kerb 31 m | [ELTE Online, 2 Jun 2023](https://elteonlinenew.elte.hu/?p=5394) (single source); 1908 from [en.wikipedia Endre Ady](https://en.wikipedia.org/wiki/Endre_Ady) |
| 7 | vulcan | The man who renamed Eminescu | Familia, Iosif Vulcan, Eminescu's debut | Iosif Vulcan museum, node 2634651998 | 47.056005, 21.933456 | kerb 10 m | [ro.wikipedia Familia (revistă)](https://ro.wikipedia.org/wiki/Familia_(revist%C4%83)); [CIMEC](https://ghidulmuzeelor.cimec.ro/id.asp?k=117) |
| 8 | lazar | The declaration in the lawyer's house | 1918 union | Aurel Lazăr museum, node 2634651850 | 47.05646, 21.934545 | kerb 26 m | [CIMEC](https://ghidulmuzeelor.cimec.ro/idEN.asp?k=1706); city day: [Agerpres, 12 Oct 2019](https://agerpres.ro/administratie/2019/10/12/bihor-ziua-orasului-oradea-manifestare-cu-o-dubla-semnificatie--384539) |
| 9 | szigligeti | The playwright who chose his name | Hungarian theatre | Szigligeti's birthplace, node 3604586494 | 47.061555, 21.92883 | kerb 9 m | [en.wikipedia Ede Szigligeti](https://en.wikipedia.org/wiki/Ede_Szigligeti); company name: [theater.hu](https://www.theater.hu/hu/szinhazak/nagyvaradi-szinhaz--143/hirek/szabo-k_-istvan-chicagoi-eloadasa-nagyvaradon--8935.html) |
| 10 | eva | Eva's diary (`quiet`) | Holocaust | Eva Heyman memorial, node 5263445988 | 47.050399, 21.925633 | kerb 11 m | [en.wikipedia Eva Heyman](https://en.wikipedia.org/wiki/Eva_Heyman) |
| 11 | aachvas | The synagogue that became a museum | Jewish community 1722–today, Holocaust, post-1989 | Aachvas Rein synagogue, way 286245386 | 47.057033, 21.923169 | kerb 18 m | [Visit Oradea](https://www.visitoradea.com/what-to-see/museum-of-jewish-history) |
| 12 | fuchsl | Two wine merchants | Art Nouveau | Füchsl Palace, way 1534824825 | 47.054323, 21.932978 | kerb 21 m | [hu.wikipedia Füchsl-palota](https://hu.wikipedia.org/wiki/F%C3%BCchsl-palota); [Arhitectura 1906](https://arhitectura-1906.ro/en/2019/11/glimpses-of-architecture-in-oradea-at-the-beginning-of-the-20th-century/) |
| 13 | poynar | A house built in seven months | Art Nouveau, Aromanian family | Casa Poynár, node 3501610695 | 47.056539, 21.930789 | kerb 13 m | [Arhitectura 1906, M. Pașca (c. Nov 2019)](https://arhitectura-1906.ro/en/2019/11/glimpses-of-architecture-in-oradea-at-the-beginning-of-the-20th-century/) |
| 14 | gojdu | Gojdu's scholarships | Romanian and Aromanian community | Emanuil Gojdu College, way 1534596459 | 47.054551, 21.938052 | kerb 47 m | [ro.wikipedia Emanuil Gojdu](https://ro.wikipedia.org/wiki/Emanuil_Gojdu) |
| 15 | czaran | The man who marked the mountains | Armenian-origin family, Bihor tourism | Czárán bust, node 4827012513 | 47.055889, 21.934284 | kerb 8 m | [Explore Carpathia](https://www.explorecarpathia.eu/en/romania/nagyvarad-oradea/bust-of-czaran-gyula); [CNIPT Arad](https://cniptarad.ro/en/harta-locatie/441-monumentul-lui-czaran-gyula) |
| 16 | rodia | The monks' pharmacy | Habsburg-era religious orders | Pharmacy Museum, node 10630966450 | 47.060508, 21.937625 | kerb 15 m | [Visit Oradea](https://www.visitoradea.com/what-to-see/the-pharmacy-museum) |
| 17 | sfladislau | The tower that had to wait | Habsburg Baroque | St Ladislaus church, Piața Unirii (OSM POI) | 47.05553, 21.92883 | kerb 23 m | [Explore Carpathia](https://www.explorecarpathia.eu/en/romania/nagyvarad-oradea/st-laszlo-parish-church) |
| 18 | gcpalace | The night the roof burned | Art Nouveau era, post-1989 | Greek Catholic bishop's palace, way 41415055 | 47.054959, 21.927381 | kerb 26 m | [G4Media, 8 Feb 2025](https://www.g4media.ro/au-inceput-lucrarile-de-restaurarea-a-palatului-episcopiei-greco-catolice-din-oradea-imobil-de-patrimoniu-distrus-de-un-incendiu-n-2018-in-doi-ani-localnicii-si-turistii-vor-avea-aici-un-nou-centr.html); [TVR Info, 26 Aug 2018](https://tvrinfo.ro/palatul-episcopiei-greco-catolice-din-oradea-cladire-de-patrimoniu-a-fost-distrus-intr-un-incendiu-speciali-tii-lucrau-la-restaurarea-operelelor-de-arta-din-interiorul-palatului_835091/) |
| 19 | nymphaea | The warm-water lily | Thermal springs, Băile Felix | Aquapark Nymphaea, way 544505904 | 47.05281, 21.951994 | kerb 85 m | [en.wikipedia Nymphaea lotus var. thermalis](https://en.wikipedia.org/wiki/Nymphaea_lotus_var._thermalis); [en.wikipedia Băile Felix](https://en.wikipedia.org/wiki/B%C4%83ile_Felix) |
| 20 | rimanoczy | The architect with his own brickworks | Art Nouveau era builders, Orthodox bishopric | Strada Roman Ciorogariu 3, way 1525803455 | 47.058848, 21.933203 | kerb 18 m | [Arhitectura 1906](https://arhitectura-1906.ro/en/2019/11/glimpses-of-architecture-in-oradea-at-the-beginning-of-the-20th-century/) |
| 21 | adorjan | The lawyer who built the Black Eagle | Art Nouveau | Casa Adorján I, way 421787914 | 47.057981, 21.930944 | kerb 17 m | [Arhitectura 1906](https://arhitectura-1906.ro/en/2019/11/glimpses-of-architecture-in-oradea-at-the-beginning-of-the-20th-century/) |
| 22 | zoo-chapel | The chapel saved by deer | Habsburg-era nobility, communist era | Oradea Zoo, way 290565675 | 47.049669, 21.916517 | `at` 47.050695, 21.916069 (Strada Octavian Goga, 124 m) | [Digi24, 28 Mar 2017](https://www.digi24.ro/regional/digi24-oradea/zoo-oradea-gradina-cu-capela-696747) |
| 23 | rudd | The fish the museum saved | Thermal springs, post-1989 | Muzeul Țării Crișurilor, node 11748234272 | 47.049382, 21.923678 | kerb 90 m | [Muzeul Țării Crișurilor (c. Jun 2025)](https://mtariicrisurilor.ro/en/new-efforts-for-saving-the-thermal-rudd/) |

**Coverage.** Bishopric and medieval cathedral: 1, 2. Ottoman years: 3. Habsburg Baroque: 16, 17, 22. Art Nouveau 1900–1914: 12, 13, 18, 20, 21. Hungarian community and literature (Ady, Holnap, Szigligeti): 5, 6, 9, 15. Romanian community (Familia, Iosif Vulcan, Eminescu, 1918): 7, 8, 14. Aromanian and Armenian families: 13, 14, 15. Jewish community and the Holocaust: 10, 11. Communist years: 4, 22. After 1989: 11, 18, 23. Thermal springs and Băile Felix: 3, 19, 23.

**Gaps.** I found no verifiable source for a German-community place inside the map (the Lutheran church on OSM has no history I could source), nor for the 1989 revolution in Oradea. Băile Felix itself lies outside the play area (about 8 km south [17]); card 19 tells its story from the city. No card sits on a building that is already a sight, except cards 2–4 (inside the fortress) and 17 (inside the Piața Unirii site); each tells a lesser-known detail.

**Reserves (not in the 23).**

| id | Place | Why held back |
|---|---|---|
| R1 masons | Freemasons' Temple, Calea Armatei Române 4 (way 1264537032; 47.049871, 21.925807; kerb 18 m). Built 1901 by Zoltán Bálint and Lajos Jámbor for the St Ladislaus lodge, now a museum [18][19] | Owner's call (church audience); "the only such museum in Eastern Europe" is a promotional claim I could not verify |
| R2 partium | Partium Christian University, Strada Primăriei (node 703825870; 47.057022, 21.922709; kerb 24 m). College founded 1990, university 1995, accredited 2008, teaches in Hungarian [20] | True but dry; a post-1989 Hungarian layer if wanted |
| R3 ciuperca | Ciuperca hill viewpoint (node 1311238516) | Its history (a chapel of 1839–1840) comes from a page I could not open |
| R4 rulikowski | The municipal Rulikowski cemetery | Kazimierz Rulikowski was shot in Nagyvárad on 28 Aug 1849, but no source links him to the cemetery's name [21] |

**Paste-ready data** for `src/world/oradea/quests.js` (blurb and counter are mine; texts are `t(ro, en)` as in `places.js`):

```js
import { t } from '../../i18n.js';

export const SECRETE = {
  id: 'secrete', title: t('Secretele Oradiei', 'Secrets of Oradea'), icon: '🗝️', unit: t('taine', 'secrets'),
  reward: 100, rewardAll: 2000,
  blurb: t('Locuri pe lângă care treci zilnic fără să știi ce s-a întâmplat acolo: o catedrală sub curtea cetății, o capelă salvată de căprioare, un scaun liber lângă patru poeți și un pește salvat de muzeu. Urmează indiciile, caută lumina gri, și orașul îți spune povestea lui.',
    'Places people pass every day without knowing what happened there: a cathedral under the fortress yard, a chapel saved by deer, an empty chair beside four poets and a fish rescued by a museum. Follow the hints, look for the grey light, and the city tells its story.'),
  cards: [
    { id: "rogerius", icon: "📜", ll: [47.076837, 21.918041],
      title: t("Cartierul unui cronicar",
        "A quarter named after a chronicler"),
      hint: t("Un cartier întreg din nord-vestul orașului poartă numele unui preot italian. Caută piața cartierului.",
        "A whole quarter in the north-west carries the name of an Italian priest. Look for its market."),
      story: t("Cartierul Rogerius poartă numele Magistrului Roger (Rogerius), un preot din Apulia care era arhidiacon la catedrala din Oradea când au venit mongolii, în 1241. S-a ascuns în pădure, a fost prins și a scăpat abia când oastea mongolă s-a retras, în 1242. A descris totul într-o scrisoare cunoscută drept «Carmen miserabile» (Cântec de jale), o relatare dramatică a invaziei. A murit în 1266, ca arhiepiscop de Split.",
        "The Rogerius quarter is named after Master Roger (Rogerius), a priest from Apulia who was archdeacon of Oradea cathedral when the Mongols came in 1241. He hid in the forest, was captured, and escaped only when the Mongol army withdrew in 1242. He described it all in a letter known as the «Carmen miserabile» (Sorrowful Lament), a dramatic account of the invasion. He died in 1266 as archbishop of Split."),
      source: { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Roger_of_Torre_Maggiore" } },
    { id: "cetate-crowns", icon: "👑", ll: [47.052344, 21.942855], at: [47.052695, 21.941159],
      title: t("Coroanele de sub curtea cetății",
        "Crowns under the fortress yard"),
      hint: t("În curtea cetății, sub pavaj, s-au găsit temeliile unei catedrale gotice. Lumina e pe drumul de pe latura de vest.",
        "In the fortress yard, under the paving, lie the foundations of a Gothic cathedral. The light is on the road on the west side."),
      story: t("Catedrala gotică din cetate a fost ridicată între 1342 și 1370, iar până în secolul al XV-lea aici au fost înmormântați regi și regine, printre ei Ladislau I, regina Maria și împăratul Sigismund de Luxemburg (1437). În 2007 arheologii au găsit zidurile unei capele-turn rotunde, unde credeau că erau păstrate moaștele Sfântului Ladislau. Pe piața catedralei stăteau statui de bronz ale regilor sfinți, făcute de frații Martin și Gheorghe din Cluj, topite în secolul al XVII-lea, în războaiele cu turcii. O operă a acelorași frați, Sfântul Gheorghe din 1373, se vede și azi la Praga.",
        "The Gothic cathedral in the fortress was built between 1342 and 1370, and until the 15th century kings and queens were buried here, among them Ladislaus I, Queen Mary and Emperor Sigismund of Luxembourg (1437). In 2007 archaeologists found the walls of a round chapel-tower that they believe held the relics of St Ladislaus. Bronze statues of the holy kings by the brothers Martin and George of Cluj stood on the cathedral square until they were melted down in the 17th-century wars with the Turks. Another work by the same brothers, the St George of 1373, still stands in Prague."),
      source: { name: "Wikipedia", url: "https://ro.wikipedia.org/wiki/Cetatea_Oradea" } },
    { id: "cetate-1660", icon: "🌊", ll: [47.051095, 21.9405],
      title: t("Soția morarului",
        "The miller's wife"),
      hint: t("Un bastion al cetății poartă numele unui principe al Transilvaniei. Legenda spune că apa caldă din șanț apăra zidurile.",
        "One fortress bastion bears the name of a Transylvanian prince. Legend says warm water in the moat kept the walls safe."),
      story: t("O legendă spune că șanțul cetății se umplea cu apa mereu caldă a Peței și că doar soția unui morar știa unde se deschid stăvilarele. Când fiii ei au fost prinși de turci, le-ar fi arătat locul. Istoria sigură e mai simplă: pe 27 august 1660 cetatea a căzut după un asediu de câteva săptămâni, iar Oradea a fost 32 de ani centrul unui pașalâc, cu biserica din cetate prefăcută în geamie. Pe 28 mai 1692 garnizoana otomană s-a predat armatei habsburgice.",
        "A legend says the fortress moat was filled with the ever-warm water of the Peța, and only a miller's wife knew where the sluices opened. When the Turks captured her sons, she is said to have shown them the place. The certain history is simpler: on 27 August 1660 the fortress fell after a siege of several weeks, and for 32 years Oradea was the seat of an Ottoman province, with the fortress church turned into a mosque. On 28 May 1692 the Ottoman garrison surrendered to the Habsburg army."),
      source: { name: "Wikipedia", url: "https://ro.wikipedia.org/wiki/Cetatea_Oradea" } },
    { id: "cetate-depot", icon: "📦", ll: [47.05162, 21.94338], at: [47.052112, 21.94517],
      title: t("Biserica-depozit",
        "The church that became a store"),
      hint: t("În curtea cetății stă o biserică barocă mică. Între 1948 și 1997 în ea nu s-a slujit. Lumina e pe partea de est.",
        "A small Baroque church stands in the fortress yard. From 1948 to 1997 no services were held in it. The light is on the east side."),
      story: t("Biserica romano-catolică din cetate a fost construită între 1775 și 1777. După 1945 cetatea a ajuns mai ales loc militar; între 1945 și 1952, în aripa de nord a palatului princiar a funcționat un lagăr de tranzit pentru oponenții regimului comunist, iar între 1948 și 1997 biserica a fost depozit. După 1975 au venit și depozite en-gros, care au grăbit degradarea cetății. Restaurarea s-a făcut între 2009 și 2015.",
        "The Roman Catholic church in the fortress was built in 1775–1777. After 1945 the fortress was mostly a military site; from 1945 to 1952 the north wing of the princes' palace held a transit camp for opponents of the communist regime, and from 1948 to 1997 the church served as a store. After 1975 wholesale depots moved in too, and the fortress decayed fast. It was restored between 2009 and 2015."),
      source: { name: "Wikipedia", url: "https://ro.wikipedia.org/wiki/Cetatea_Oradea" } },
    { id: "ady-cafe", icon: "☕", ll: [47.057889, 21.935142],
      title: t("Cafeneaua poetului",
        "The poet's café"),
      hint: t("La marginea unui parc din centru, un pavilion mic a fost cafenea. Un poet maghiar își scria aici articolele.",
        "At the edge of a central park, a small pavilion used to be a café where a Hungarian poet wrote his articles."),
      story: t("Pavilionul a fost cafeneaua «Müller», terminată în 1869 și refăcută în 1895, locul de întâlnire al intelectualilor orădeni. Tradiția spune că tânărul Ady Endre, jurnalist la Oradea la începutul anilor 1900, stătea vara la o masă din colțul din dreapta al terasei și își scria reportajele. Din 1955 clădirea e Muzeul Memorial Ady Endre, cu o redacție de ziar refăcută și o sală de cafenea de epocă.",
        "The pavilion was the «Müller» café, finished in 1869 and rebuilt in 1895, where Oradea's writers and thinkers met. Tradition says the young Ady Endre, a journalist in Oradea in the early 1900s, sat at a table in the right-hand corner of the terrace in summer and wrote his reports. Since 1955 the building has been the Ady Endre Memorial Museum, with a rebuilt newsroom and a period café room."),
      source: { name: "Ghidul muzeelor (CIMEC)", url: "https://ghidulmuzeelor.cimec.ro/idEN.asp?k=113" } },
    { id: "holnap", icon: "🪑", ll: [47.057486, 21.932022],
      title: t("Scaunul gol",
        "The empty chair"),
      hint: t("Patru poeți de bronz stau la o masă de cafenea, în fața unui liceu. Al cincilea scaun te așteaptă pe tine.",
        "Four bronze poets sit at a café table in front of a school. The fifth chair is waiting for you."),
      story: t("În 1908, la Oradea s-a înființat cercul literar «A Holnap» (Mâine); antologia lui, cu Ady Endre, Babits Mihály și Juhász Gyula, a fost primită cu dezaprobare. Grupul statuar din 2012 îi arată pe Ady, Juhász Gyula, Dutka Ákos și Emőd Tamás la o masă, ca într-o cafenea. Al cincilea scaun e lăsat liber, ca trecătorii să se așeze și să se fotografieze lângă poeți.",
        "In 1908 the literary circle «A Holnap» (Tomorrow) was founded in Oradea; its anthology, with Ady Endre, Mihály Babits and Gyula Juhász, met with disapproval. The 2012 statue group shows Ady, Gyula Juhász, Ákos Dutka and Tamás Emőd at a café table. A fifth chair is left empty so passers-by can sit down and take a photo with the poets."),
      source: { name: "ELTE Online", url: "https://elteonlinenew.elte.hu/?p=5394" } },
    { id: "vulcan", icon: "✒️", ll: [47.056005, 21.933456],
      title: t("Omul care i-a dat nume lui Eminescu",
        "The man who renamed Eminescu"),
      hint: t("Pe strada care îi poartă numele stă casa omului care a schimbat numele celui mai cunoscut poet român.",
        "On the street named after him stands the house of the man who changed the name of Romania's best-known poet."),
      story: t("Iosif Vulcan (1841–1907) a fondat revista «Familia» la Pesta, în 1865. În februarie 1866 a publicat în ea poezia «De-aș avea...», trimisă de un tânăr care semna Mihai Eminovici; Vulcan i-a schimbat numele în Eminescu, iar poetul l-a păstrat. Din 1880 revista a apărut la Oradea, până la sfârșitul lui 1906. În casa în care a locuit Vulcan e azi un muzeu memorial.",
        "Iosif Vulcan (1841–1907) founded the magazine «Familia» in Pest in 1865. In February 1866 he printed the poem «De-aș avea...», sent by a young man who signed himself Mihai Eminovici; Vulcan changed the name to Eminescu, and the poet kept it. From 1880 the magazine came out in Oradea, until the end of 1906. The house where Vulcan lived is now a memorial museum."),
      source: { name: "Wikipedia", url: "https://ro.wikipedia.org/wiki/Familia_(revistă)" } },
    { id: "lazar", icon: "📝", ll: [47.05646, 21.934545],
      title: t("Declarația din casa avocatului",
        "The declaration in the lawyer's house"),
      hint: t("Pe o stradă liniștită lângă parcul din centru, în casa unui avocat s-a scris în 1918 un text care a schimbat harta.",
        "On a quiet street near the central park, a lawyer's house is where a 1918 text that changed the map was written."),
      story: t("Pe 12 octombrie 1918, în casa avocatului Aurel Lazăr a fost redactată Declarația de independență națională a românilor din Transilvania, Banat, Crișana și Maramureș, manifestul-program al mișcării naționale a românilor, cu șapte săptămâni înainte de Adunarea de la Alba Iulia din 1 decembrie 1918. Muzeul memorial s-a deschis aici pe 1 decembrie 2008, cu salonul familiei și un fotoliu care, după donatoare, ținea de biroul la care s-a scris textul. Din 1992, 12 octombrie e Ziua orașului Oradea.",
        "On 12 October 1918 the Declaration of National Independence of the Romanians of Transylvania, Banat, Crișana and Maramureș was drawn up in lawyer Aurel Lazăr's house; it became the manifesto of the Romanian national movement, seven weeks before the Alba Iulia assembly of 1 December 1918. The memorial museum opened here on 1 December 2008, with the family's living room and an armchair that, the donor said, belonged to the desk where the text was written. Since 1992, 12 October has been Oradea's city day."),
      source: { name: "Ghidul muzeelor (CIMEC)", url: "https://ghidulmuzeelor.cimec.ro/idEN.asp?k=1706" } },
    { id: "szigligeti", icon: "🎭", ll: [47.061555, 21.92883],
      title: t("Dramaturgul cu nume ales",
        "The playwright who chose his name"),
      hint: t("În Olosig, pe strada care îi poartă numele, s-a născut un autor de comedii. Teatrul maghiar al orașului se numește după el.",
        "In Olosig, on the street named after him, a writer of comedies was born. The city's Hungarian theatre is named after him."),
      story: t("Szigligeti Ede s-a născut pe 8 martie 1814 în Olosig (Várad-Olaszi), cu numele József Szathmáry. Tatăl i-a interzis să folosească numele familiei, așa că și-a ales altul: Szigligeti. A scris în jur de o sută de piese, iar comediile i-au adus cel mai mare succes. Trupa de teatru maghiară a Oradiei se numește azi Szigligeti Színház.",
        "Ede Szigligeti was born on 8 March 1814 in Olosig (Várad-Olaszi) as József Szathmáry. His father forbade him to use the family name, so he chose another: Szigligeti. He wrote about a hundred plays, and his comedies were his greatest success. Oradea's Hungarian theatre company is called the Szigligeti Színház today."),
      source: { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ede_Szigligeti" } },
    { id: "eva", icon: "🕯️", ll: [47.050399, 21.925633], quiet: true,
      title: t("Jurnalul Evei",
        "Eva's diary"),
      hint: t("Într-un parc la sud de centru, o fetiță de bronz privește aleea. Strada de alături poartă un nume care amintește de 1944.",
        "In a park south of the centre, a bronze girl looks along the path. The street beside it has a name that remembers 1944."),
      story: t("Eva Heyman s-a născut la Oradea pe 13 februarie 1931 și și-a început jurnalul în ziua în care a împlinit 13 ani, în 1944. Între 24 mai și 3 iunie 1944, peste 20.000 de evrei au fost deportați cu trenul la Auschwitz din acest parc; Eva a fost ucisă acolo pe 17 octombrie 1944, împreună cu bunicii ei. Statuia ei, făcută de Flor Kent, a fost așezată aici în 2015, în amintirea copiilor evrei deportați din Oradea. Yad Vashem i-a publicat jurnalul în ebraică în 1964 și în engleză în 1974.",
        "Eva Heyman was born in Oradea on 13 February 1931 and began her diary on her thirteenth birthday in 1944. Between 24 May and 3 June 1944 more than 20,000 Jews were deported by train to Auschwitz from this park; Eva was murdered there on 17 October 1944, with her grandparents. Her statue, by Flor Kent, was placed here in 2015 in memory of the Jewish children deported from Oradea. Yad Vashem published her diary in Hebrew in 1964 and in English in 1974."),
      source: { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Eva_Heyman" } },
    { id: "aachvas", icon: "🕍", ll: [47.057033, 21.923169],
      title: t("Sinagoga care a devenit muzeu",
        "The synagogue that became a museum"),
      hint: t("Pe Strada Primăriei, nu departe de Piața Unirii, o sinagogă din anii 1920 spune azi povestea unei comunități întregi.",
        "On Strada Primăriei, not far from Piața Unirii, a 1920s synagogue now tells the story of a whole community."),
      story: t("Sinagoga ortodoxă Aachvas Rein a fost construită în 1926, după planurile lui Pintér István. Din 5 decembrie 2018 găzduiește Muzeul Istoriei Evreilor din Oradea. Parterul arată viața comunității de la întemeierea ei, în 1722, iar etajul e dedicat Holocaustului, ghetoului și deportărilor din 1944.",
        "The Aachvas Rein Orthodox synagogue was built in 1926 to plans by István Pintér. Since 5 December 2018 it has housed the Museum of Jewish History of Oradea. The ground floor shows the community's life from its founding in 1722, and the upper floor is given to the Holocaust, the ghetto and the deportations of 1944."),
      source: { name: "Visit Oradea", url: "https://www.visitoradea.com/what-to-see/museum-of-jewish-history" } },
    { id: "fuchsl", icon: "🍇", ll: [47.054323, 21.932978],
      title: t("Doi negustori de vin",
        "Two wine merchants"),
      hint: t("La un colț al Pieței 1 Decembrie, caută ciorchini de struguri și două litere pe fațadă.",
        "On a corner of Piața 1 Decembrie, look for bunches of grapes and two letters on the front."),
      story: t("Palatul Füchsl a fost ridicat între septembrie 1902 și aprilie 1903 pentru frații Arnold și Mór Füchsl, negustori de vin, după planurile arhitecților budapestani Bálint Zoltán și Jámbor Lajos. O singură fațadă ascunde, de fapt, două clădiri. Ciorchinii de struguri și literele «FT» de pe fațadă amintesc de afacerea proprietarilor, iar Ady Endre a scris în «Nagyváradi Napló» că e o lucrare artistică.",
        "The Füchsl Palace went up between September 1902 and April 1903 for the brothers Arnold and Mór Füchsl, wine merchants, to plans by the Budapest architects Zoltán Bálint and Lajos Jámbor. One facade actually hides two buildings. The bunches of grapes and the letters «FT» on the front recall the owners' trade, and Ady Endre called it a work of art in the «Nagyváradi Napló»."),
      source: { name: "Wikipedia", url: "https://hu.wikipedia.org/wiki/Füchsl-palota" } },
    { id: "poynar", icon: "🏠", ll: [47.056539, 21.930789],
      title: t("Casa ridicată în șapte luni",
        "A house built in seven months"),
      hint: t("La un colț al Pieței Regele Ferdinand, o casă Secession își scoate colțul în consolă deasupra străzii.",
        "On a corner of King Ferdinand Square, a Secession house pushes its corner out over the street."),
      story: t("Casa Poynár a fost construită între aprilie și noiembrie 1907 pentru János Poynár, dintr-o familie de origine aromână. Constructorul, Ferenc Sztarill, a ridicat multe clădiri din centru, printre ele palatul în care funcționa cafeneaua EMKE. Colțul casei, ieșit în consolă peste stradă, o face ușor de recunoscut.",
        "The Poynár House was built between April and November 1907 for János Poynár, from a family of Aromanian origin. Its builder, Ferenc Sztarill, put up many buildings in the centre, among them the palace that housed the EMKE café. Its corner, jutting out over the street, makes it easy to spot."),
      source: { name: "Arhitectura 1906", url: "https://arhitectura-1906.ro/en/2019/11/glimpses-of-architecture-in-oradea-at-the-beginning-of-the-20th-century/" } },
    { id: "gojdu", icon: "🎓", ll: [47.054551, 21.938052],
      title: t("Bursele lui Gojdu",
        "Gojdu's scholarships"),
      hint: t("Un liceu din centru poartă numele unui avocat născut la Oradea care și-a lăsat averea pentru studenți.",
        "A central high school carries the name of an Oradea-born lawyer who left his fortune to students."),
      story: t("Emanuil Gojdu s-a născut la Oradea în 1802, într-o familie aromână venită din Moscopole, și a ajuns un avocat de succes la Pesta. Prin testamentul din 1869 și-a lăsat averea pentru burse destinate tinerilor români ortodocși din Ungaria și Transilvania. Fundația a funcționat între 1870 și 1917, iar printre bursieri au fost pionierul aviației Traian Vuia, poetul Octavian Goga și medicul Victor Babeș. Colegiul Național «Emanuil Gojdu» îi poartă numele.",
        "Emanuil Gojdu was born in Oradea in 1802 to an Aromanian family from Moscopole and became a successful lawyer in Pest. In his will of 1869 he left his fortune to fund scholarships for young Orthodox Romanians in Hungary and Transylvania. The foundation ran from 1870 to 1917, and its scholars included the aviation pioneer Traian Vuia, the poet Octavian Goga and the doctor Victor Babeș. The Emanuil Gojdu National College carries his name."),
      source: { name: "Wikipedia", url: "https://ro.wikipedia.org/wiki/Emanuil_Gojdu" } },
    { id: "czaran", icon: "🥾", ll: [47.055889, 21.934284],
      title: t("Omul care a marcat munții",
        "The man who marked the mountains"),
      hint: t("În parcul de lângă Strada Libertății, un bust îl cinstește pe omul care a deschis Munții Bihorului drumeților.",
        "In the park off Strada Libertății, a bust honours the man who opened the Bihor mountains to hikers."),
      story: t("Czárán Gyula (1847–1906), dintr-o familie de negustori de origine armeană din Șepreuș, a ajuns în Munții Bihorului la sfatul medicilor, pentru aerul curat. Între 1880 și 1905 a deschis trasee, a amenajat peșteri și a plătit din banii lui drumuri, poduri, scări și marcaje; la început, localnicii îl credeau vârcolac. E numit «părintele turismului bihorean», iar bustul lui a fost ridicat aici în 2008.",
        "Gyula Czárán (1847–1906), from a merchant family of Armenian origin in Șepreuș, came to the Bihor mountains on his doctors' advice, for the clean air. From 1880 to 1905 he opened trails, fitted out caves and paid for roads, bridges, ladders and trail markers himself; at first the locals took him for a werewolf. He is called «the father of Bihor tourism», and his bust was put up here in 2008."),
      source: { name: "Explore Carpathia", url: "https://www.explorecarpathia.eu/en/romania/nagyvarad-oradea/bust-of-czaran-gyula" } },
    { id: "rodia", icon: "⚗️", ll: [47.060508, 21.937625],
      title: t("Farmacia călugărilor",
        "The monks' pharmacy"),
      hint: t("Pe Calea Republicii, spre nord, o farmacie a funcționat 250 de ani în aceleași camere. Azi e muzeu.",
        "Up Calea Republicii, a pharmacy worked in the same rooms for 250 years. Today it is a museum."),
      story: t("Farmacia «Apotheca Rodia» a fost deschisă de călugării romano-catolici ai ordinului Mizericordienilor, lângă spitalul lor, și a funcționat neîntrerupt circa 250 de ani. Episcopia Romano-Catolică a restaurat clădirea de pe Calea Republicii nr. 33, iar pe 18 mai 2019 aici s-a deschis Muzeul Farmaciei. Sunt expuse peste 1.500 de obiecte, mobilierul original și picturi murale din secolul al XVIII-lea descoperite recent.",
        "The «Apotheca Rodia» pharmacy was opened by the Roman Catholic monks of the Misericordian order beside their hospital and ran without a break for about 250 years. The Roman Catholic diocese restored the building at Calea Republicii 33, and on 18 May 2019 the Pharmacy Museum opened here. It shows over 1,500 objects, the original furniture and 18th-century murals found during the works."),
      source: { name: "Visit Oradea", url: "https://www.visitoradea.com/what-to-see/the-pharmacy-museum" } },
    { id: "sfladislau", icon: "🔔", ll: [47.05553, 21.92883],
      title: t("Turnul care a așteptat",
        "The tower that had to wait"),
      hint: t("Chiar în Piața Unirii, o biserică barocă și-a primit turnul la câteva decenii după ce a fost gata.",
        "Right on Piața Unirii, a Baroque church got its tower decades after it was finished."),
      story: t("Biserica Sfântul Ladislau din Piața Unirii a fost construită între 1717 și 1734, după epoca otomană. Episcopul voia și un turn, dar arhitectul căruia i-l ceruse a murit, așa că turnul s-a ridicat abia între 1790 și 1800, după planurile unui autor necunoscut. Pictura murală e din 1908, iar tabloul altarului, cu Sfântul Ladislau, din 1863.",
        "St Ladislaus church on Piața Unirii was built between 1717 and 1734, after the Ottoman years. The bishop wanted a tower too, but the architect he had asked died, so the tower went up only in 1790–1800, to plans by an unknown designer. The wall paintings date from 1908, and the altarpiece of St Ladislaus from 1863."),
      source: { name: "Explore Carpathia", url: "https://www.explorecarpathia.eu/en/romania/nagyvarad-oradea/st-laszlo-parish-church" } },
    { id: "gcpalace", icon: "🔥", ll: [47.054959, 21.927381],
      title: t("Noaptea în care a ars acoperișul",
        "The night the roof burned"),
      hint: t("Pe o latură a Pieței Unirii, un palat cu turn a ars în 2018 și a fost refăcut. Caută acoperișul nou.",
        "On one side of Piața Unirii, a palace with a tower burned in 2018 and was rebuilt. Look for the new roof."),
      story: t("Palatul Episcopiei Greco-Catolice a fost ridicat între 1903 și 1905, după planurile lui Kálmán Rimanóczy junior. La sfârșitul lui august 2018 acoperișul de lemn a luat foc într-o seară, în timp ce restauratorii lucrau la frescele din interior; pompierii l-au stins după miezul nopții, iar clădirile vecine au fost apărate. Primăria a plătit refacerea acoperișului și a fațadelor, iar în 2025 au început lucrările din interior, pentru un viitor centru cultural.",
        "The Greek Catholic bishop's palace was built in 1903–1905 to plans by Kálmán Rimanóczy junior. One evening in late August 2018 its timber roof caught fire while restorers were working on the frescoes inside; firefighters put it out after midnight and saved the neighbouring buildings. The city paid to rebuild the roof and the facades, and in 2025 work began inside on a future cultural centre."),
      source: { name: "G4Media", url: "https://www.g4media.ro/au-inceput-lucrarile-de-restaurarea-a-palatului-episcopiei-greco-catolice-din-oradea-imobil-de-patrimoniu-distrus-de-un-incendiu-n-2018-in-doi-ani-localnicii-si-turistii-vor-avea-aici-un-nou-centr.html" } },
    { id: "nymphaea", icon: "🪷", ll: [47.05281, 21.951994],
      title: t("Nufărul apelor calde",
        "The warm-water lily"),
      hint: t("În estul orașului, pe Aleea Ștrandului, un aquapark poartă numele latin al unei flori de apă.",
        "In the east of the city, on Aleea Ștrandului, an aquapark bears the Latin name of a water flower."),
      story: t("Nymphaea e numele latin al nuferilor. Cel mai neobișnuit dintre ei, nufărul termal (Nymphaea lotus var. thermalis), crește lângă Oradea, la Sânmartin, în apa pârâului Peța, care are în jur de 30 °C, și e declarat monument al naturii din 1932. Multă vreme s-a crezut că e o relicvă din epoci mai calde; analizele ADN arată că nu se deosebește de nufărul lotus. Tot din apele calde de lângă oraș trăiește stațiunea Băile Felix, unde primele băi s-au amenajat între 1711 și 1721.",
        "Nymphaea is the Latin name of the water lilies. The oddest of them, the thermal lotus (Nymphaea lotus var. thermalis), grows near Oradea, at Sânmartin, in the Peța stream, whose water stays at about 30 °C, and it has been a protected natural monument since 1932. It was long thought to be a relic of warmer ages; DNA tests show it is no different from the common lotus. The same warm waters feed the Băile Felix spa, where the first baths were set up in 1711–1721."),
      source: { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nymphaea_lotus_var._thermalis" } },
    { id: "rimanoczy", icon: "🧱", ll: [47.058848, 21.933203],
      title: t("Arhitectul cu fabrică de cărămidă",
        "The architect with his own brickworks"),
      hint: t("Pe Strada Roman Ciorogariu, palatul pe care și l-a ridicat arhitectul Primăriei e azi al Episcopiei Ortodoxe.",
        "On Strada Roman Ciorogariu, the palace City Hall's architect built for himself now belongs to the Orthodox bishopric."),
      story: t("Kálmán Rimanóczy junior a proiectat o bună parte din centrul de azi: Primăria (1902–1903), Palatul Episcopiei Greco-Catolice (1903–1905) și Palatul Apollo de pe Calea Republicii (1912–1914). Pe lângă biroul de arhitectură, avea fabrici de cărămidă, sobe, cherestea și mobilă. Pe la 1901 și-a ridicat palatul de pe Strada Roman Ciorogariu nr. 3, azi reședința Episcopiei Ortodoxe, cu o colecție muzeală.",
        "Kálmán Rimanóczy junior designed much of today's centre: City Hall (1902–1903), the Greek Catholic bishop's palace (1903–1905) and the Apollo Palace on Calea Republicii (1912–1914). Besides his architecture office he owned brick, stove, timber and furniture factories. Around 1901 he built his own palace at Strada Roman Ciorogariu 3, now the Orthodox bishop's residence, with a museum collection."),
      source: { name: "Arhitectura 1906", url: "https://arhitectura-1906.ro/en/2019/11/glimpses-of-architecture-in-oradea-at-the-beginning-of-the-20th-century/" } },
    { id: "adorjan", icon: "🦅", ll: [47.057981, 21.930944],
      title: t("Avocatul care a construit Vulturul Negru",
        "The lawyer who built the Black Eagle"),
      hint: t("Unde Strada Patrioților întâlnește Strada Moscovei, două case bogat ornamentate au același proprietar ca un palat celebru din centru.",
        "Where Strada Patrioților meets Strada Moscovei, two richly decorated houses share their owner with a famous palace in the centre."),
      story: t("Avocatul și omul de afaceri Emil Adorján și-a construit aici două case de raport, Adorján I (1902–1903) și Adorján II (1904–1905), după planurile arhitecților Komor Marcell și Jakab Dezső. Împreună formează unul dintre cele mai spectaculoase colțuri ale orașului. Câțiva ani mai târziu, același Adorján și aceiași arhitecți au ridicat Palatul Vulturul Negru, cu pasajul lui acoperit cu sticlă colorată.",
        "The lawyer and businessman Emil Adorján built two apartment houses here, Adorján I (1902–1903) and Adorján II (1904–1905), to plans by the architects Marcell Komor and Dezső Jakab. Together they make one of the most striking corners in the city. A few years later the same Adorján and the same architects built the Black Eagle Palace, with its arcade under coloured glass."),
      source: { name: "Arhitectura 1906", url: "https://arhitectura-1906.ro/en/2019/11/glimpses-of-architecture-in-oradea-at-the-beginning-of-the-20th-century/" } },
    { id: "zoo-chapel", icon: "🦌", ll: [47.049669, 21.916517], at: [47.050695, 21.916069],
      title: t("Capela salvată de căprioare",
        "The chapel saved by deer"),
      hint: t("Grădina zoologică de la sud-vest de centru a fost cândva parcul unui conte. Printre țarcuri se ascunde ceva vechi de două secole.",
        "The zoo south-west of the centre was once a count's park. Something two centuries old hides among the enclosures."),
      story: t("Terenul grădinii zoologice a fost un parc englezesc amenajat de contele Rhédey Lajos, ofițer în armata habsburgică, care l-a donat orașului la începutul secolului al XIX-lea și a ridicat aici o capelă; el și soția lui sunt înmormântați în ea. Grădina zoologică s-a înființat în 1960, iar primii vizitatori au venit doi ani mai târziu. Când regimul comunist a vrut să demoleze capela, administratorul a îngrădit locul și a adus căprioare carpatine, spunând că acum e adăpost pentru animale, așa că demolarea nu mai era posibilă.",
        "The zoo grounds were an English-style park laid out by Count Lajos Rhédey, an officer in the Habsburg army, who gave it to the city in the early 19th century and built a chapel here; he and his wife are buried in it. The zoo was founded in 1960, and the first visitors came two years later. When the communist regime wanted to demolish the chapel, the zoo's manager fenced it in and brought in Carpathian deer, saying it was now an animal shelter, so it could no longer be pulled down."),
      source: { name: "Digi24", url: "https://www.digi24.ro/regional/digi24-oradea/zoo-oradea-gradina-cu-capela-696747" } },
    { id: "rudd", icon: "🐟", ll: [47.049382, 21.923678],
      title: t("Peștele salvat de muzeu",
        "The fish the museum saved"),
      hint: t("Pe Calea Armatei Române, muzeul județului a salvat un pește care nu mai trăiește nicăieri în natură.",
        "On Calea Armatei Române, the county museum saved a fish that no longer lives anywhere in the wild."),
      story: t("Scardinius racovitzai, un pește mic înrudit cu roșioara, trăia doar în lacul cald Pețea de la Băile 1 Mai, lângă Oradea. După pierderea bruscă de apă termală din 2013–2014, lacul a secat complet, iar Muzeul Țării Crișurilor a salvat peștii și melcul termal. Prima reproducere în captivitate a reușit în 2014, iar puii au ajuns în grădini zoologice și acvarii. Specia e azi dispărută din natură și e crescută în Vivariul muzeului, la Oradea.",
        "The thermal rudd (Scardinius racovitzai) lived only in the warm Pețea lake at Băile 1 Mai, near Oradea. After a sudden loss of thermal water in 2013–2014 the lake dried out completely, and the Criș Land Museum rescued the fish and the thermal snail. The first captive breeding succeeded in 2014, and the young went to zoos and public aquariums. The species is now extinct in the wild and is reared in the museum's Vivarium in Oradea."),
      source: { name: "Muzeul Țării Crișurilor", url: "https://mtariicrisurilor.ro/en/new-efforts-for-saving-the-thermal-rudd/" } },
  ],
};
```

## 3. Story campaign

### Three concepts

| Concept | Through-line | Fits existing missions | Sensitivity | Verdict |
|---|---|---|---|---|
| **A. «Noaptea Muzeelor»** (Museum Night) | A week before Museum Night, a comic private collector "borrows" the seven pieces of a pop-up exhibition about Oradea's layers. You drive the organisers' flying shuttle and get them back, one layer per chapter. Oradea opened its museums free for Museum Night on a Saturday evening in May 2026 [22] | Courier, story pickup (taxi), chase, rings, plus follow, photograph, find with clues, escort, race | Low–medium | **Recommended**: light, family-safe, uses every hand-built landmark |
| B. «Drumul spre casă» (The road home) | A Ukrainian teenager and her grandmother arrive at Oradea station; you are the volunteer driver who helps them build a life, and each chapter brings a friend from another community | Taxi, courier, find, photograph | High: war, refugees, and the owner's own NGO work | Strong fit with Drumul Vieții; only with the Ukrainian community's input and no war scenes |
| C. «Cursa celor patru orașe» (The four towns race) | A rally league across Orașul Nou, Olosig, Subcetate and Velența, which were separate towns until 1872 [23]; rival drivers, clue gates at landmarks | Rings, race, find | Low | Cheapest to build; thin story |

### Recommended: «Noaptea Muzeelor»

**Frame.** All plot, people and objects are fiction; every place and every history fact shown in it is real and comes from the quest cards. The "stolen" pieces are copies made for a fictional pop-up show run by a fictional association, so no real museum or church is the victim of a crime. Nobody is hurt; the villain is vain, not cruel, and ends up giving his own collection to the city.

| Character | Who | Role in play |
|---|---|---|
| Ilinca Mureșan | Young curator of the pop-up show | Quest giver; your main passenger |
| Bence Szabó | Photography student at Partium | Photo missions, jokes, Hungarian names and stories |
| Olena | 15, came from Ukraine in 2022, volunteer guide | Learns the city with the player; asks the questions a newcomer asks |
| Nea Gică | Retired tram driver | The radio voice instead of the generic dispatcher; knows every street |
| Colecționarul (the Collector) and his yellow van crew | A retired restorer who thinks the pieces are safer in his vault | Comic antagonist; never named after a real person or community |

| # | Chapter | Landmarks (hand-built sites) | Missions: existing → new | Beat | Cards it points to |
|---|---|---|---|---|---|
| 1 | Prima cursă (First run) | Railway station, Piața Unirii, Black Eagle passage, City Hall tower | Story pickup at the station → courier posters to the passage → rings round the tower. New: dialogue cards | The crates vanish from a parked van while the driver buys coffee | sfladislau, gcpalace, adorjan |
| 2 | Urma dubei (The van's trail) | Calea Republicii, Parcul Traian | New: follow the yellow van at a distance; find the drop with clues | First piece back: a stained-glass copy | fuchsl, ady-cafe, rodia |
| 3 | Hârtie și cerneală (Paper and ink) | Iosif Vulcan street, the Holnap poets, Queen Mary Theatre | New: photograph the empty chair; timed delivery of programmes before curtain-up | Second piece: a printing-plate copy | vulcan, holnap, szigligeti, poynar |
| 4 | Turnul (The tower) | City Hall, the roofs of Piața Unirii, the Crișul bridges | Rooftop courier → chase the van (ram) | Third piece; the crew drop a business card | rimanoczy, lazar |
| 5 | Cetatea (The fortress) | Fortress, moat, bastions, at dusk | New: find with a riddle based on the miller's-wife legend; escort a fragile crate; rings over the bastions | Fourth piece: a model of the medieval cathedral | cetate-crowns, cetate-1660, cetate-depot |
| 6 | Barocul (The Baroque) | Basilica, Baroque Palace, Canons' Row | New: race the crew's scooter on the road beside the arches | Fifth piece; Bence spots the Collector in a photo | gojdu, sfladislau |
| 7 | Apele calde (Warm waters) | Aquapark Nymphaea, the county museum | Timed fragile delivery of a fish cooler to the museum (echo of the real 2013–2014 rescue) | Sixth piece, hidden at the aquapark | nymphaea, rudd, zoo-chapel |
| 8 | Podurile (The bridges) | Crișul bridges, station, Oradea Arena | The big chase (ram) across the river; photograph the licence plate | Seventh piece; the Collector is identified | czaran |
| 9 | Noaptea Muzeelor (Museum Night) | Darvas–La Roche house, Piața Unirii, the fortress, the river | Multi-drop timed delivery of all seven pieces → night rings show over the river | The Collector turns up and donates his collection; credits; a cosmetic reward | all |

An optional quiet epilogue could take Olena to the Eva Heyman memorial with no timer, money or score. Only add it if the Jewish community reviews it; otherwise keep the Holocaust in the quest cards alone.

**New mechanics the campaign needs** (all reuse code in `src/game/missions.js` or `src/game/quests.js`):

| Mechanic | Built from | Effort |
|---|---|---|
| Dialogue cards (portrait, name, 1–3 lines; non-blocking while driving, blocking only at chapter start and end, with the game paused like the quest book) | The quest-card DOM pattern | 1 day |
| Step runner with checkpoints and retry | `begin` / `end`, beacons, `setObj` / `setBar` / `setTimer` | 3–4 days |
| Story pickup and drop | `startTaxi` | 0.5 day |
| Timed and fragile delivery | `startCourier` (damage bar, timer) | 0.5 day |
| Authored rings | `startTour` ring meshes | 0.5 day |
| Chase | `startChase` / `getaway` / `ramGetaway` | Reuse |
| Follow (keep 15–120 m behind, fail if lost for N s) | `getaway` driver on the lane graph | 1–2 days |
| Race against a scripted driver | `getaway` driver + checkpoints | 1–2 days |
| Find with clues | Quest search circle and `curbSpot` | 0.5–1 day |
| Photograph a target (in frame and in range when the shot is taken) | `photo.capture()` in `src/ui/photomode.js` + a frustum check | 1–2 days |
| Save and retry | localStorage `oradea.story` + the save code | 0.5 day |

### What is sensitive, and how to treat it

| Topic | Risk | Treatment |
|---|---|---|
| Romanian–Hungarian history (1918–1920, 1940–1944, statues) | Oradea's monuments are argued over in the press: the 2023 St Ladislaus statue drew "heated debate" [24][25] | State facts with dates, no "liberation" or "loss" language; give Hungarian names in brackets where historical; no villain with an ethnic marker; Romanian and Hungarian characters as friends; one Romanian and one Hungarian reader before release. Card 8 says what the 1918 declaration was, not who won |
| The Holocaust | Trivialising it with game rewards; Yad Vashem, USHMM and the ADL warn against simulations and role play [26][27] | No timers, chases, scores or photos-for-points at Holocaust sites; `quiet: true` on `eva`; texts reviewed by the community (the Tikvah association made the Eva statue) |
| Religion | Many church partners; fiction about crimes in real churches | No plot crime inside a real church; churches only as backdrops and quest facts; equal tone for every denomination; the Freemasons' card only by the owner's choice |
| Communist repression | Flattening it | Short facts with sources (card 4: the 1945–1952 transit camp) |
| Refugees (concept B, and Olena in A) | Exploiting real stories | Fictional character, no war scenes; ask the Ukrainian community the NGO serves |
| Violence | The mugging mission | Turn it off in the Oradea build (CITY-guarded type filter in `missions.js`) or reskin it as blocking a pickpocket's path |

## 4. Build order and effort

Two things matter most now: the quest cards and the family-tone fix. Everything else waits until those ship.

| Order | Ships | Contents | Files | Effort |
|---|---|---|---|---|
| 0 | Week 1 | «Secretele Oradiei» (23 cards), `quiet` flag, test | `src/world/oradea/quests.js` (new), `config.js` (`quests`), `src/game/quests.js` (additive `quiet`), `tests/oradea-quests.test.mjs` (new) | 1.5–2 days |
| 1 | Week 1–2 | Mugging off in Oradea; save code export / import; optional event counter | `missions.js` (one CITY-guarded line in `available()`), a small save-code UI, a Worker route | 2–3 days |
| 2 | Week 2 | Weekly route with a share line | New `game/weekly.js` reusing the tour rings | 2–3 days |
| 3 | Week 3 | Story layer, prologue and chapter 1 (only dialogue, pickup, courier, rings) | New `game/story.js` and dialogue UI, `src/world/oradea/story/ch1.js`; in `missions.js` expose the internal helpers as `api.kit` and add `hold(on)` to pause calls without saving the J setting | 5–6 days |
| 4 | Weeks 4–6 | Chapters 2–9, adding follow, photo, find, race, escort as chapters need them; sensitivity reads | Chapter data files, step handlers | 10–14 days |
| 5 | Ongoing | A quest pack every few weeks; Hungarian UI | Data | ~1 day per pack |

Total about 21–30 working days. The first useful piece ships in 1.5–2 days. Upstream note: `quests.js` and `missions.js` are Oleg's shared files, so keep those changes small and additive, as ORADEA.md asks.

## 5. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Conflicting dates between sources (St Ladislaus church 1717–1734 vs 1720–1741; Black Eagle 1907–1908 vs 1908–1909; zoo land given in 1804 vs 1819; transit camp from 1945 or 1947; the palace fire on 25 or 26 August 2018) | A wrong date in the game | Cards use the safer wording ("early 19th century", "late August 2018"); owner check |
| Single-source cards (holnap: a student article; poynar, rimanoczy, adorjan: one architecture dossier; czaran: tourism sites) | Lower confidence | Replace with a museum or heritage-list source when one turns up |
| Romanian written by a non-native | Awkward phrasing | Native read before shipping |
| Progress lost in Safari or private windows | Players stop coming back | Save code (rank 3) |
| No event data in the Oradea build | You cannot tell whether any of this works | Event counter (rank 7) |
| The story layer grows into infrastructure | Weeks without shipped content | Ship the cards first; ship chapter 1 before writing chapter 2 |
| Light positions not seen in the running game | A light in an awkward spot | One playtest drive through all 23 before release |
| Phones | The story UI is desktop-first | Keep dialogue cards touch-friendly from the start |

## Sources

Player research (read 2026-10-30):

1. Ryan, Rigby, Przybylski, "The Motivational Pull of Video Games", *Motivation and Emotion* 30:347–363, 29 Nov 2006 (abstract read): https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf
2. Quantic Foundry, GDC 2020 slides on player segments (Discovery, Completion; site blocks automated reading, seen through search results): https://quanticfoundry.com/wp-content/uploads/2020/08/GDC-2020-Slides-Player-Segments-Quantic-Foundry.pdf
3. Statista on Quantic Foundry data, "Compete or complete" (2017; seen through search results): https://www.statista.com/chart/amp/7350/compete-or-complete-gender-differences-in-gaming
4. GameAnalytics 2025 benchmarks (2024 data), summarised by GameDev Reports (secondary): https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks
5. GameAnalytics 2026 benchmarks (2025 data), GameDev Reports: https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game
6. PocketGamer.biz on the CrazyGames study, 21 May 2026: https://www.pocketgamer.biz/report-hypercasual-and-puzzle-games-dominate-the-browser-gaming-space/
7. Wordle: https://en.wikipedia.org/wiki/Wordle ; NPR, 31 Jan 2022: https://whyy.org/npr-story/the-new-york-times-buys-wordle
8. Tubefilter, 16 Sep 2024: https://www.tubefilter.com/2024/09/16/location-obsessed-creators-put-geoguessr-on-the-map/
9. JMIR scoping review of Pokémon GO motivations, 2026 preprint (not peer-reviewed): https://preprints.jmir.org/preprint/89235 ; motive scale: Yang & Liu, *Cyberpsychology, Behavior, and Social Networking*, doi 10.1089/cyber.2016.0562
10. web.dev, Slow Roads case study, updated 11 Apr 2023: https://web.dev/case-studies/slow-roads
11. Variety, Feb 2018: https://variety.com/2018/gaming/news/assassins-creed-origins-discovery-tour-effectiveness-1202861325
12. Duolingo blog, "Improving the streak": https://blog.duolingo.com/improving-the-streak
13. Hamari, Koivisto, Sarsa, "Does gamification work?", 2014: https://research.aalto.fi/fi/publications/does-gamification-work-a-literature-review-of-empirical-studies-o/
14. WebKit, "Full Third-Party Cookie Blocking and More", 24 Mar 2020: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/

Oradea (read 2026-10-30; card sources are in the card table):

15. Oradea, 2021 census and history: https://en.wikipedia.org/wiki/Oradea
16. Mediafax, 1 Nov 2007, the chapel-tower dig: https://www.mediafax.ro/?p=1021622
17. Băile Felix: https://en.wikipedia.org/wiki/B%C4%83ile_Felix
18. Arhitectura 1906 dossier (Bálint and Jámbor's lodge, 1901): https://arhitectura-1906.ro/en/2019/11/glimpses-of-architecture-in-oradea-at-the-beginning-of-the-20th-century/
19. Visit Oradea, Temple of Freemasonry: https://www.visitoradea.com/en/blog/temple-of-freemasonry-oradea
20. Partium Christian University: https://en.wikipedia.org/wiki/Partium_Christian_University
21. Prohászka, *Polish Monuments* (Budapest, 2001), Rulikowski's execution: https://library.hungaricana.hu/en/view/VaroshazaKiado_0077/?pg=26
22. Agerpres, 22 May 2026, Museum Night in Oradea: https://agerpres.ro/2026/05/22/bihor-obiectivele-turistice-din-oradea-vor-putea-fi-vizitate-gratuit-sambata-seara-de-noaptea-muzeel--1559015
23. Velența (separate town until 1872): https://en.wikipedia.org/wiki/Velen%C8%9Ba
24. Hungary Today, 23 Aug 2023, the St Ladislaus statue in the fortress: https://hungarytoday.hu/statue-of-hungarian-knight-king-to-be-erected-in-oradea/
25. EVZ, the Ladislaus statue debate: https://evz.ro/statuia-regelui-ladislau-lungariei-oradea.html
26. ADL, "Why Simulation Activities Should Not Be Used": https://www.adl.org/resources/tools-and-strategies/why-simulation-activities-should-not-be-used
27. JTA on Yad Vashem, USHMM and ADL warning against Holocaust role play: https://www.jta.org/?p=1868478

Repo files read: `AGENTS.md`, `ORADEA.md`, `src/game/quests.js`, `src/game/quests/index.js`, `src/game/quests/secrets.js`, `src/game/missions.js`, `src/game/explore.js`, `src/game/garage.js`, `src/world/oradea/config.js`, `src/world/oradea/places.js`, `src/world/oradea/ui.js` (quest strings), `src/analytics.js`, `src/ui/photomode.js` (header), `src/main.js` (wiring), `tests/quests.test.mjs`.

## Not verified

- Quantic Foundry and GameAnalytics figures come from search results and secondary summaries; their own pages blocked reading or were PDFs I did not open.
- The Holnap statue's empty chair and its 2012 date have one source (a student article).
- Whether the museum's Vivarium is in the Calea Armatei Române building; card 23 only says "in Oradea".
- Whether the Szigligeti company still plays in the Queen Mary Theatre building; card 9 only gives the company's name.
- That the aquapark was named after the thermal lotus; card 19 avoids the claim.
- The Siemens-Schuckert locomotive monument (OSM node 6635554032) has no sourced history, so it has no card.
- No German-community place and no 1989-revolution place could be sourced (see Gaps); reserves R3 and R4 stay unverified.
- No in-game check of the lights: I did not start the game. Positions come from `map.json` and the code's own `curbSpot`.
