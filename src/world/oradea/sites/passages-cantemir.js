// OWNER: oradea. The Strada Dimitrie Cantemir underpass (DN76), the eastern end of the Gojdu corridor works, opened with
// the others on 31 December 2023 (OSM opening_date; the project: adevarul.ro, g4media.ro on the corridor's opening):
// the two one-way carriageways of Cantemir dive under the crossing north of Parcul 1 Decembrie and come up east of it.
// OSM: the tunnels 996776594 (eastbound) and 1007453786 (westbound), the cuts 1093061922 / 1007453784 (eastbound) and
// 996843183 / 996843185 / 1007453779 (westbound).
// Built by ./passages/trench.js (the box cut, walls with a parapet, the slab under the crossing street, the lit tunnel).
// Traffic does not take the underpass (the lane graph has no tunnels); the player's car does.
//   SITE.shape: the cuts (hf.heightAt) and the lift of the street over them;  build(base) -> { clear, update, stats, state }
import { shapeGroup, buildGroup } from './passages/trench.js';

export const CANTEMIR = { id: 'cantemir', name: 'Pasajul Cantemir', opened: '2023-12-31', centre: [963, 197],
  ways: [996776594, 1007453786, 1093061922, 1007453784, 996843183, 996843185, 1007453779] };
let st = null;

export const SITE = {
  id: 'passages-cantemir',
  label: 'Pasajul Cantemir',
  shape(hf, map, geo) {
    st = shapeGroup(hf, map, geo, CANTEMIR);
    if (st) console.log(`[oradea] passages: ${CANTEMIR.name} shaped – ${JSON.stringify(st.stats)}`);
  },
  ground: true,
  build(base) {
    const r = buildGroup(base, st);
    if (!r) return null;
    console.log(`[oradea] passages: ${CANTEMIR.name} built – ${JSON.stringify(r.stats)}`);
    return { clear: r.clear, update() {}, stats: r.stats, state: st };
  },
};
