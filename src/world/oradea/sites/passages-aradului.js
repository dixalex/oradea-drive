// OWNER: oradea. Calea Aradului (DN79) at the Jumbo junction with the ring road: the underpass under the roundabout and
// the overpass over the next one south, both opened on 17 August 2026 (economedia.ro, digi24.ro: 406 m of underpass under
// the Centura at Jumbo, and the overpass; OSM start_date 2026-08-17), and the older ring-road viaduct over the roundabout.
// Three levels at one spot: the Centura on its viaduct, the roundabout on the ground, DN79 in its tunnel under it.
// OSM: the tunnel 1232944975, the cuts 1232944977 (north) and 1232944976 (south) – ./passages/trench.js; the overpass
// 1232944983 (embankment), 1232944982 (bridge), 1232944984 (embankment) and the Centura viaduct 388685531 / 388685534 –
// ./passages/deck.js. Traffic rides the decks (deckAt); it does not take the underpass (the lane graph has no tunnels).
// Outside the phone tier's centre (skipped there).
//   SITE.shape: the cut and the lift of the street over the tunnel;  build(base) -> { clear, deckAt, update, stats }
import { shapeGroup, buildGroup } from './passages/trench.js';
import { planDeck, buildDecks } from './passages/deck.js';

export const ARADULUI = { id: 'aradului', name: 'Pasajul Calea Aradului', opened: '2026-08-17', centre: [-1150, 1900],
  ways: [1232944975, 1232944977, 1232944976] };
export const ARADULUI_DECKS = [
  { id: 'aradului-dn79', name: 'Pasajul suprateran Calea Aradului', opened: '2026-08-17', ways: [1232944983, 1232944982, 1232944984] },
  { id: 'centura-jumbo-v', name: 'Centura, viaductul de la Jumbo', ways: [388685531] },
  { id: 'centura-jumbo-e', name: 'Centura, viaductul de la Jumbo', ways: [388685534] },
];
let st = null;

export const SITE = {
  id: 'passages-aradului',
  label: 'Pasajele Calea Aradului',
  shape(hf, map, geo) {
    st = shapeGroup(hf, map, geo, ARADULUI);
    if (st) console.log(`[oradea] passages: ${ARADULUI.name} shaped – ${JSON.stringify(st.stats)}`);
  },
  ground: true,
  build(base) {
    const pc = base.map.phoneCentre;
    if (pc && Math.hypot(ARADULUI.centre[0] - pc.x, ARADULUI.centre[1] - pc.z) > pc.r + 150) return null;
    // the decks first: their lawn fix-up repaints the ground tiles under the open decks, which would take the tunnel's
    // floor (drawn in the ground material) for one
    const plans = ARADULUI_DECKS.map((O) => planDeck(base.map, base.heightAt, O));
    const d = buildDecks(base, plans, 'aradului');
    const t = buildGroup(base, st);
    if (!t && !d) return null;
    console.log(`[oradea] passages: ${ARADULUI.name} built – ${JSON.stringify(t?.stats ?? null)}; decks ${JSON.stringify(d?.stats ?? null)} ${JSON.stringify(plans.map((p) => p?.stats ?? null))}`);
    return { clear: (x, z) => !!(t?.clear(x, z) || d?.clear(x, z)), deckAt: d?.deckAt ?? null, update() {}, stats: { trench: t?.stats, decks: d?.stats }, state: st, plans };
  },
};
