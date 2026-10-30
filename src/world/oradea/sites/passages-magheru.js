// OWNER: oradea. Pasajul Magheru: the road underpass on the line of Aleea Ștrandului and Strada Parcul Traian under Bulevardul
// Magheru (its two carriageways and the tram between them) at the north end of Podul Dacia, opened 11 September 2020
// (AGERPRES 2020-09-11: 34.04 m under the boulevard, ramps of 102.27 m toward Parcul Traian and 88.35 m toward Aleea
// Ștrandului, 224.65 m in all; Freyrom; the Dacia bridge widened at the same time). OSM: the tunnel 778333112, the west
// ramp 846659447 splitting into the one-way 778333122 / 778333121, the east ramp 778333111, 666652307, 778333114.
// Built by ./passages/trench.js: the box cut, the slab under the boulevard (the street, the tram and the traffic keep
// their level over it), walls with a parapet, the lit tunnel. The surface lanes of Aleea Ștrandului beside the east ramp
// stay on the street. Traffic does not take the underpass (the lane graph has no tunnels); the player's car does.
//   SITE.shape: the cut (hf.heightAt) and the lift of the street over it;  build(base) -> { clear, update, stats }
import { shapeGroup, buildGroup } from './passages/trench.js';

export const MAGHERU = { id: 'magheru', name: 'Pasajul Magheru', opened: '2020-09-11', centre: [670, -512],
  ways: [778333112, 846659447, 778333122, 778333121, 778333111, 666652307, 778333114] };
let st = null;

export const SITE = {
  id: 'passages-magheru',
  label: 'Pasajul Magheru',
  shape(hf, map, geo) {
    st = shapeGroup(hf, map, geo, MAGHERU);
    if (st) console.log(`[oradea] passages: ${MAGHERU.name} shaped – ${JSON.stringify(st.stats)}`);
  },
  ground: true,
  build(base) {
    const r = buildGroup(base, st);
    if (!r) return null;
    console.log(`[oradea] passages: ${MAGHERU.name} built – ${JSON.stringify(r.stats)}`);
    return { clear: r.clear, update() {}, stats: r.stats, state: st };
  },
};
