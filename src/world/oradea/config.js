// Oradea (Romania): what the shared code and the map tools read when the build plays Oradea. The game picks it with
// VITE_CITY=oradea (src/city.js), the map tools with CITY=oradea (tools/cherkasy/city.mjs). Cherkasy keeps its own
// values inline in each module, so a module reads `CITY?.x ?? <the Cherkasy value>`. Plain data only: the Node map
// tools import this file too.
//
//   tools: fetch / compile settings – bbox [s, w, n, e] for Overpass, dem { s, n, w, e } for the terrain tiles, frame
//     { lat0, lon0, rot } (map origin and the rotation that lines the street grid up with the axes), region
//     { x0, x1, z0, z1 } (the playable rectangle in map metres); build_map.mjs switches: riverProfile, buildingUse,
//     extraBuildings (a GeoJSON-lines file in the raw folder), trams, heights (a height grid in the raw folder), oldTown
//     (the historic quarters: old town houses, their colours), shops (real shop names on the shopfronts)
//   assets: the folder of map.json / map_buildings.json / dem.bin under public/
//   sun: { lat, lon } for the daylight model (render/daylight.js)
//   spawn: { at: [x, z] on foot, look: [x, z], carDir: [dx, dz] } (world/oradea/city.js)
//   busyStreets: names whose lanes get 1.4x the traffic (npc/lanes.js)
//   pavingCentre: [x, z] the centre whose pavements are pavers, not patched asphalt (cherkasy/ground.js)
//   places: map places (places.js);  quests: the quest book's quests (game/quests/index.js)
//   peek: the phone page's 3D models, place id -> site module (peek.js, ui/peek3d.js)
//   logos: brand files drawn under another name (kit/logo.js): the cars' Everlabs plate (a Cherkasy partner) carries the
//     organiser's logo, Drumul Vieții (public/assets/brand/oradea-plate.svg, from the NGO's LogoH-UA.svg);  logoColours: those drawn in their own colours
//   vehicleAtlas: paints the traffic's plates, signs and ads (vehicles.js)
//   radio: folder of the car radio's tracks.json – Oradea's live stations (audio/radio.js)
//   voices: false – no dispatcher / passenger lines (upstream's are Ukrainian; audio/engine.js drops them from the index)
//   feedback: where the game's "Bot" links go instead of upstream's Telegram bot – a WhatsApp chat with the organiser
//     (Drumul Vieții), for ideas, bugs and requests (ui/botlink.js; the chip and the big map's link, vite.config.js; key I,
//     world/oradea/feedback.js);  help: extra groups for the controls card (ui/hud.js HELP);  consentNote: a line of HTML
//     under the start card's terms (ui/consent.js);  source: where this build's code is (AGPL-3.0 sec. 13), linked there
import { PLACES } from './places.js';
import { vehicleAtlas } from './vehicles.js';
import { PEEK } from './peek.js';
import { t } from '../../i18n.js';

export default {
  id: 'oradea',
  name: 'Oradea Drive',
  assets: 'assets/oradea/',
  feedback: 'https://wa.me/40741849122',
  source: 'https://github.com/dixalex/oradea-drive/tree/oradea',
  help: [[t('Idei și cereri', 'Ideas and requests'), [['I', t('WhatsApp: o idee, o greșeală sau ceva ce vrei în joc (școala ta, biserica, firma, o clădire)',
    'WhatsApp: an idea, a bug, or something you want in the game (your school, church, business, a building)')]]]],
  consentNote: t('💬 Ai o idee, ai găsit o greșeală sau vrei ceva în joc – școala ta, biserica, firma, o clădire? Scrie-ne pe WhatsApp: tasta <kbd>I</kbd> sau butonul verde de sus. Oradea Drive e un proiect Drumul Vieții.',
    '💬 Got an idea, found a bug, or want something in the game – your school, church, business or a building? Message us on WhatsApp: press <kbd>I</kbd> or the green button at the top. Oradea Drive is a Drumul Vieții project.'),
  tools: {
    bbox: [47.005, 21.82, 47.11, 22.03],
    dem: { s: 46.96, n: 47.15, w: 21.76, e: 22.10 },
    // origin Piața Unirii; the central street grid runs ~30.5 deg off north (OSM building edges within 2.5 km)
    frame: { lat0: 47.0553, lon0: 21.9289, rot: -30.5 },
    // the largest rotated rectangle inside bbox (300 m margin): 69 km2, 21.8k of the 28.5k OSM buildings; a bigger one
    // needs a bigger bbox and a fresh fetch (FORCE=1)
    region: { x0: -6250, x1: 5250, z0: -3000, z1: 3000 },
    // the Crișul Repede falls ~17 m across the map: the terrain is measured from its local level (build_map.mjs)
    riverProfile: true,
    // malls, markets and sports halls get a use (`u` in map_buildings.json) that buildings.js draws as big boxes
    buildingUse: true,
    // footprints OSM lacks (most hill houses): Overture's Microsoft ML buildings, tools/oradea/fetch_overture.py
    extraBuildings: 'overture_buildings.geojsonl',
    // railway=tram ways go to map.json `trams` (drawn by world/oradea/trams.js), not to the railway
    trams: true,
    // OSM tags storeys on ~5 % of the buildings: the rest take them from Copernicus' measured heights
    // (tools/oradea/heights.py; build_map keeps the guesses while the file is missing)
    heights: 'heights.bin',
    // the historic quarters by their OSM place=suburb names (tools/oradea/oldtown.mjs): town houses, pastel render,
    // tiled roofs, and no borrowed nine-storey slabs
    oldTown: ['Orașul Nou', 'Velența', 'Olosig', 'Subcetate'],
    // shops, cafés and offices by name (fetch_osm.mjs `shops`): their real names go on the shopfronts (map.json `signs`)
    shops: true,
  },
  sun: { lat: 47.0553, lon: 21.9289 },
  spawn: { at: [20, -30], look: [-143, -46], carDir: [-1, 0] }, // Piața Unirii, facing the City Hall tower
  busyStreets: /Calea Aradului|Calea Clujului|Calea Borșului|Calea Matei Basarab|Bulevardul Dacia|Bulevardul Decebal|Bulevardul Magheru|Bulevardul Ștefan cel Mare/,
  pavingCentre: [0, 0],
  places: PLACES,
  peek: PEEK,
  quests: [],
  logos: { everlabs: 'oradea-plate' }, logoColours: ['everlabs'],
  vehicleAtlas,
  radio: 'assets/oradea/radio/',
  voices: false,
};
