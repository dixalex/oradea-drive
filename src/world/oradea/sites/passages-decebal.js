// OWNER: oradea. The Strada Tudor Vladimirescu underpass under Bulevardul Decebal (its two carriageways and the tram
// between them): a design-and-build contract to Freyrom, about 39.4 M lei; the boulevard's rebuild added it (en.wikipedia
// "Transport in Oradea"); open in OSM, the opening date not found. OSM: the tunnel 1329810682 (two-way, 28 m), the cuts
// 931707897 (east) and 985545972 / 1379655348 (west); the pedestrian tunnel 1510003012 beside it is left out.
// Built by ./passages/trench.js (the box cut, walls with a parapet, the slab under the boulevard, the lit tunnel).
// Traffic does not take the underpass (the lane graph has no tunnels); the player's car does.
//   SITE.shape: the cuts (hf.heightAt) and the lift of the street over them;  build(base) -> { clear, update, stats, state }
import { shapeGroup, buildGroup } from './passages/trench.js';

export const DECEBAL = { id: 'decebal', name: 'Pasajul Decebal', opened: null, centre: [-969, -135],
  ways: [1329810682, 931707897, 985545972, 1379655348] };
let st = null;

export const SITE = {
  id: 'passages-decebal',
  label: 'Pasajul Decebal',
  shape(hf, map, geo) {
    st = shapeGroup(hf, map, geo, DECEBAL);
    if (st) console.log(`[oradea] passages: ${DECEBAL.name} shaped – ${JSON.stringify(st.stats)}`);
  },
  ground: true,
  build(base) {
    const r = buildGroup(base, st);
    if (!r) return null;
    console.log(`[oradea] passages: ${DECEBAL.name} built – ${JSON.stringify(r.stats)}`);
    return { clear: r.clear, update() {}, stats: r.stats, state: st };
  },
};
