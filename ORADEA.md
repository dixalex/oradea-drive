# Oradea Drive

This fork builds the Cherkasy Drive engine for Oradea, Romania. Upstream's Cherkasy files stay as they are, so its
updates merge cleanly. Oradea lives beside them, and one switch picks the city:

    npm run dev:oradea          # http://127.0.0.1:5175 (the Cherkasy game stays on npm run dev)
    npm run build:oradea        # dist/ for Oradea
    npm run deploy:oradea       # build + upload to Cloudflare (wrangler.jsonc; needs `npx wrangler login` once)
    npm run fetch:oradea        # OSM + terrain + the extra buildings into tools/cherkasy/raw/oradea/ (gitignored); FORCE=1 refetches OSM
    npm run canopy:oradea       # public/assets/oradea/canopy.bin: where real trees stand (needs uv; GDAL on first run)
    npm run heights:oradea      # raw heights.bin: measured building heights (a free Copernicus login in the keychain, below)
    npm run map:oradea          # compile public/assets/oradea/{map.json, map_buildings.json, dem.bin}
    npm run strings:oradea      # sync src/world/oradea/ui.js with upstream's UI strings, count the untranslated

## Where Oradea lives

| File | What |
|---|---|
| `src/city.js` | `CITY` (the Oradea config or `null`) from `VITE_CITY`; shared modules read `CITY?.x ?? <Cherkasy value>` |
| `src/world/oradea/config.js` | bbox, frame (origin Piața Unirii, grid turned -30.5°), play area, spawn, busy streets, radio, logos; `riverProfile` (terrain measured from the falling river's local level, not one median) and `buildingUse` (malls, markets and sports halls tagged `u` for their own look) for the map compiler |
| `src/world/oradea/city.js` | the city builder: a trimmed copy of `cherkasy/city.js` with no Cherkasy sites; Oradea sites go in `SITES` |
| `src/world/oradea/sites/*.js` | the hand-built places, one module per place, each exporting `SITE` (contract in `city.js` at `SITE_MODULES`); the city loads every file there, and skips one that fails |
| `sites/unirii` | Piața Unirii (King Ferdinand I's statue, fountains, tram bed), Biserica cu Lună, St Nicholas cathedral, the Greek Catholic bishop's palace |
| `sites/primaria` | City Hall and its tower, St Ladislaus church, the Black Eagle Palace with its stained-glass passage |
| `sites/ferdinand` | Queen Mary Theatre and Piața Ferdinand, the Darvas–La Roche house, the Sion synagogue |
| `sites/cetate` | the fortress: bastions, curtain walls, dry moat (`shape`), gates and bridges, the palace ring, the church |
| `sites/baroc` | the Roman Catholic basilica, the Baroque Palace, Canons' Row and the park between them |
| `sites/republicii` | Calea Republicii's Secession fronts (22 lots from a facade atlas), the Moskovits and Ullmann palaces |
| `sites/unirii-est` | the east side of Piața Unirii and Strada Vasile Alecsandri: the Moskovits Adolf palace, Casa Deutsch, Casa Kováts, the «Iuliu Maniu» lyceum, five row fronts with the Arcadia theatre (one 2048 x 2048 facade atlas, half size on the phone) |
| `sites/ferdinand-olosig` | the Art Nouveau corners: Casa Poynár, the Füchsl palace, Hotel Transilvania, the Adorján houses I and II, the Rimanóczy hotel and baths (restored state; scaffolded until ~Dec 2026); one 2048 x 2048 atlas, half size on the phone |
| `sites/traian-muzee` | round Parcul Traian: the Ady Endre museum (the Müller café pavilion) with the Ady statue and the «Holnap» group, the Iosif Vulcan museum house (the rest of its block plain), the Aurel Lazăr house, the Orthodox Episcopal Palace, the Okányi-Schwartz villa, the Czárán bust and Mihai Viteazul in front of the Orthodox cathedral; one 2048 x 2048 atlas, half size on the phone; the bronzes claim their OSM statue points from parks.js |
| `sites/verde` | Dealul Ciuperca (the glazed hilltop restaurant, its terrace, the belvedere and the stone stairs; no terrain change) and the zoo in its light scope (the gate with its name board, the ticket house, the Rhédey chapel in a deer yard, three paddocks; no animals); no atlas |
| `sites/gara` | the railway station with its forecourt and tram shelter, Oradea Arena (2022) |
| `sites/orthodox` | 23 Orthodox churches: the Episcopal Cathedral, Holy Trinity, St Andrew, the Velența archangels' church and the Corbești wooden church hand-built, the rest from a church kit |
| `sites/baptist` | Emanuel (1993) and the BBSO campus (2024) hand-built, six smaller Baptist churches from a kit |
| `sites/catholic` | 15 Catholic churches: the Premonstratensian, Ursuline (its front on the Ady school block of `sites/republicii`), Greek Catholic seminary, Olosig Franciscan, Misericordians' (with the old hospital wings) and Adormirea churches hand-built, nine from a kit |
| `sites/university` | University of Oradea main campus (Corpul A hand-built), Medicine and Pharmacy in the old Chamber of Commerce, Partium with the Arany János hall, Emanuel University, Law, Construction and Agora as dressed blocks |
| `src/world/oradea/peek.js` | the phone page's 3D models: place id -> site module (`ui/peek3d.js` reads it through `CITY.peek`) |
| `src/world/oradea/trams.js` | the tram network from OSM: street track, overhead line, and 19 trams running on the wall clock |
| `src/world/oradea/parks.js` | park lamps and benches along the footways in the parks (pooled near the camera), equipment on the OSM playgrounds, and the OSM fountains, statues, busts, memorials and wayside crosses no site builds (generic figures, not likenesses) (`tests/oradea-parks.test.mjs`) |
| `src/world/oradea/shopsigns.js` | real shop, café, bank and pharmacy names from OSM on boards over the shopfronts (map.json `signs`), the nearest 128 drawn, lit at night; plain lettering, no logos (names include brands) |
| `tools/oradea/oldtown.mjs` | the historic quarters (config `oldTown`): town houses get tall storeys, shopfronts and tiled roofs, capped at 4 storeys unless measured, pastel walls and terracotta roofs (`world/buildings.js` `b.old`) |
| `tools/oradea/signs.mjs` | places the shop boards on street walls for the map (`tests/oradea-signs.test.mjs`); `fetch_osm.mjs` part `shops` (config `shops`) fetches the names |
| `src/world/oradea/river.js` | the Crișul Repede: banks lifted to 3.2 m quays at load (the shared 16 m terrain lattice sank them under the water), and decks for the OSM bridges over it, with walks, railings and piers (`tests/oradea-river.test.mjs`) |
| `src/world/oradea/places.js` | sights for the maps and the explore quest (finding all unlocks the Roadster); a site's own squares go here too, not in its `SITE.places`, so the phone map, which loads no site, lists them |
| `src/world/oradea/quests.js` | «Secretele Oradiei», the quest book's quest (K): 21 sourced cards from `tools/oradea/research/reports/quests.md`; `HELD` keeps the two Jewish-history cards out until the community reads them (`tests/oradea-quests.test.mjs`) |
| `src/world/oradea/phone.js`, `phonegame.js`, `src/ui/touch.js` | the phone beta (`?phone`; `?desktop&phone` on a computer; the phone map page's "Play (beta)"): the centre only (map.json cut to 1.8 km round Piața Unirii, the sites outside skipped), the phone graphics ladder (minimal < phone < low: no AO, bloom, SMAA or shadow maps, pixel ratio ≤ 1.25, haze ~90 % at 800 m), touch controls through `core/input.js` (`input.touch`), the soft edge, the small-screen HUD, the reload guard (a tab that dies within a minute of starting comes back one level lower) (`tests/oradea-phone.test.mjs`) |
| `src/world/oradea/savecode.js` | the save code: a line in the controls card (H) copies all progress as one text code and takes one back, since Safari deletes a site's storage after 7 days without a visit (`tests/oradea-savecode.test.mjs`) |
| `src/world/oradea/ui.js`, `tr.js`, `src/i18n.js` | Romanian / English for upstream's Ukrainian UI: a build pass wraps each string in `__tr()` |
| `src/world/oradea/vehicles.js`, `signs.js` | Romanian plates, bus boards, truck sides, ads and shop signs |
| `public/assets/oradea/radio/tracks.json` | the car radio's list: empty (radio off) until the stations in `tools/oradea/radio-stations.json` agree |
| `tools/oradea/fetch_overture.py` | the buildings OSM lacks (most hill houses): Overture Maps' Microsoft ML footprints, ODbL (`uv run --with duckdb`) |
| `tools/oradea/fetch_heights.mjs`, `heights.py`, `heights.mjs` | measured building heights: Copernicus Urban Atlas Building Block Height 2021 (10 m) -> a 5 m grid -> storeys for every untagged house or block, fitted on the ~1,400 buildings OSM tags (OSM tags storeys on ~5 %; the upstream guess made the centre's street blocks nine-storey slabs). Login: a free account at dataspace.copernicus.eu, then `security add-generic-password -s CDSE_ORADEA -a <email> -w` |
| `tools/oradea/canopy.py` | `canopy.bin` from Meta + WRI CHMv2 canopy heights (CC BY 4.0): street rows and yard trees grow only where real ones stand (`greenery.js` `real`) |
| `tools/cherkasy/city.mjs` | `CITY=oradea` points the map tools at the Oradea config, raw folder and output |
| `vite.config.js` | Oradea page head, RO / EN switch, the string pass, and what dist/ leaves out |

## Feedback and the organiser

The game runs at https://oradea.drumulvietii.ro (a custom domain on the Worker; workers.dev stays on), a Drumul Vieții
project. Upstream's Telegram-bot links become a WhatsApp chat (`config.js` `feedback`): the green "I WhatsApp" chip, key
**I** (`src/world/oradea/feedback.js`), the big map's link, an "Ideas and requests" group on the controls card (`help`) and
a note on the start card (`consentNote`). The player's plate carries the NGO's logo in its own colours
(`public/assets/brand/oradea-plate.svg`, `logoColours`). The start card links this code (`source`, AGPL-3.0 sec. 13) and
names Cloudflare Web Analytics (cookieless), switched on in the Cloudflare dashboard.

## Partners

Partners show the way Cherkasy's do (`game/partners.js`): a pink badge on both maps, a big-map teleport, a pink ring at the
door and a card with the pitch and the website (O). A partner is a `kind: 'ad'` entry in `places.js` (url, pitch) plus a
line in `sites/partners.js` `TABLE` (OSM building or an own outline, street, optional door spot for a hand-built
entrance, optional board text that covers the generic shop names); `tests/oradea-partners.test.mjs` checks both. No money
changes hands: requests come by WhatsApp (the card's last line, the big map's right-click "become a partner here" /
"improve this building", which attach the spot as a Google Maps link).

| Partner | Where | Building |
|---|---|---|
| Viața Nouă · BCUO (`viatanoua`) | Str. Nicolae Jiga 25, OSM 420863618 | hand-built (`sites/viatanoua.js`, 2024 Street View), ring at the yard gate |
| Mobiversal | Str. Thurzó Sándor 40, no OSM outline (its own `MOBIVERSAL_RING`; skips Overture 3000001278) | hand-built (`sites/mobiversal.js`, 2024 Street View) |
| Casa Minunată | Str. Traian Lalescu 47, OSM 436834224 | hand-built (`sites/casaminunata.js`, the foundation's photos), ring at the street gate |
| BBSO | Str. Thurzó Sándor 19, OSM 1264556370 | hand-built (`sites/baptist`), ring at the entrance block |
| Emanuel | Bd. Decebal, OSM relation 3530253 | hand-built (`sites/baptist`), ring at the main doors |
| BSVO, Stânca Veacurilor | Calea Borșului 3, OSM 717082633 (the cream shop 717082635 is a neighbour) | hand-built (`sites/bsvo.js`, 2024–2025 Street View), ring at the glazed door through the open yard gate |

A building is a sight or a partner, never both, so the big map shows one badge: BBSO and Emanuel are partners and not
part of the explore quest. The rebuild cards are in `tools/oradea/agents/`. A ring stands on the drawn surface
(`ground.terrainHeight`): land is drawn 0.15 m over `heightAt`, so a ring at `heightAt` hides under the grass.

## Shared files touched (one or two lines each, all `CITY`-guarded)

`main.js` (`?phone`: the phone ladder and module), `mapview.js` (the phone beta button), `core/input.js` (`input.touch`), `render/{post, shadows, sky}.js` (the `phone` / `minimal` levels), `world/farcull.js` and `world/cherkasy/proxies.js` (a `far` distance), `ui/perfhint.js` (the phone levels' names), `ui/mapview.css`, `audio/engine.js`, `audio/radio.js`, `render/daylight.js`, `npc/lanes.js`, `npc/traffic.js`,
`npc/vehicles.js`, `kit/logo.js` (`CITY.logoColours`), `ui/botlink.js` (`CITY.feedback`), `ui/hud.js` (`CITY.help`), `ui/consent.js`
(`CITY.consentNote`, `CITY.source`), `ui/photomode.js` (`CITY.photo`: the photo's wordmark and file name), `ui/peek3d.js` (`CITY.peek`, the Oradea module folder), `game/quests/index.js`, `game/quests.js` (an additive `quiet` card: no money, no jingle), `game/missions.js` (`CITY.missionsOff`: Oradea leaves out the mugging mission), `world/buildings.js` (the `u` looks: additive
cases Cherkasy never reaches; `b.old` and the flat tiled roof tint for the old town), `world/cherkasy/{ground, places, signs, station_rails, greenery}.js` (greenery: the
optional `real` canopy gate; ground: the phone tier's `keep` box),
`tools/cherkasy/{fetch_osm, fetch_dem, build_map}.mjs` (fetch_osm: the `shops` part; build_map: `riverProfile`, `useOf`, `heights`, `oldTown`, `signs`), `package.json`. A merge
conflict from upstream lands on those lines.

## Left out of the Oradea build

The upstream author's paying partners (U space, Everlabs, Торс, URBAN and the bus / truck liveries), the Telegram bot
links, his radio songs, the Ukrainian voice lines, the Cherkasy map data and the share image.

## Open items

- Phones: `ORADEA-MOBILE.md` (measured memory, phone limits, the plan, the phone beta's numbers); `tools/oradea/memory/`
  measures the load. The phone beta (`?phone`) waits for real-phone tests before phones are sent to it by default.
- More landmarks: `tools/oradea/agents/` holds the agent brief and the cards; batches 1–4 (`card-unirii-est.txt`, `card-ferdinand-olosig.txt`, `card-traian-muzee.txt`, `card-verde.txt`) are built (no Freemasons' Temple); left from the content research: Colegiul Gojdu, Parcul 1 Decembrie and the Casa de Cultură, the Ciuperca lake; the Lévay house and the Rimanóczy Sr. palace were left out of batch 2. The civic landmarks are built (`sites/civic.js`: Astoria, the palaces of Justice, Finance and the Post, the Prefecture, Lotus Center, Nymphaea, four water towers); Palatul Copiilor is not.

- The dispatcher and passenger voice lines: record Romanian and English ones (`tools/audio/gen.mjs`, an ElevenLabs key).
- Radio stations: none publishes terms for third-party players, so the radio is off since 2026-10-31 (empty tracks.json, the
  chip hidden); to turn it on, copy tools/oradea/radio-stations.json back once they agree (office@radiotransilvania.ro,
  office@pluszfm.ro, contact@g-radio.ro, radiooradea.ro).
- The play area is the 69 km² core. A bigger one needs a bigger `bbox` and `FORCE=1 npm run fetch:oradea`.
- Trams don't stop at stations yet, and the traffic doesn't yield to them.
- Data credits (OSM, Microsoft via Overture, Meta + WRI CHMv2, Copernicus Land Monitoring Service Urban Atlas 2021) are on
  the start card (`ui.js`); keep them if it changes.
- Don't use GlobalBuildingAtlas heights in the map: they are CC BY-NC 4.0, which clashes with the map's ODbL.

## Event counter (on since 2026-10-31)

The game can count anonymous events (game starts, phone or desktop, sights found, partner sites opened, missions) without
cookies or ids: src/analytics.js sends a small beacon to the Worker's `POST /e` (worker/oradea.js), which writes a data
point to Workers Analytics Engine. How it was turned on (and how to turn it off: comment steps 2–3 out again):
1. Cloudflare dashboard -> Workers & Pages -> Analytics Engine -> enable (once per account).
2. Uncomment `analytics_engine_datasets` in wrangler.jsonc and `events` in src/world/oradea/config.js.
3. In src/world/oradea/ui.js, the start card's privacy line: "pe server numărăm doar evenimente anonime din joc (fără
   cookie-uri, nimic care să te identifice)" / "the server only counts anonymous game events (no cookies, nothing that
   identifies you)".
4. Deploy. Read the counts with `CF_ACCOUNT_ID=… CF_EVENTS_TOKEN=… node tools/oradea/events.mjs --days 7` (a token with
   Account Analytics: Read).

