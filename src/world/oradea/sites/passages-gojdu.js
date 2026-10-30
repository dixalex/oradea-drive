// OWNER: oradea. The underpasses of the Gojdu corridor ("Coridor de mobilitate urbană durabilă în Piața Emanuil Gojdu –
// Etapa I", POR 2014–2020, about EUR 40 M), opened 31 December 2023 (adevarul.ro, g4media.ro, newsweek.ro): the DN1 /
// Calea Clujului axis from the south end of Podul Dacia dives under the roundabout's loops, runs in a box cut along
// Piața Emanuil Gojdu and passes under the pedestrian square between the Orthodox cathedral and Parcul 1 Decembrie (the
// long tunnel, "pasajul mare"), coming up north of it toward Parcul 1 Decembrie; the branch of Piața 1 Decembrie leaves it
// at the tunnel's north portal and passes under the park's edge in two short tunnels. Seven underpasses in all (one under
// "Piața Cetății", six under Piața Gojdu, the one at Parcul 1 Decembrie two tunnels).
// OSM: the tunnels 1198929697 (under the bridgehead), 1198935967, 1198935968, 1495385237, 1495385238 (under the loops),
// 23902269 and 172687717 (under the square), 1495385241 and 1163299474 (Piața 1 Decembrie); the cuts and ramps between
// them (560117114, 1198935969, 1198867035 with the layer -1 ramp 1163299475 up to Calea Clujului – its continuation
// 1198934235, also layer -1, is where the ramp has met the surface lanes, so it stays on the street –,
// 1163299476 / 1163299477 / 1163299478, 1152486224, 996776596, 996766488, 1163299473, 1163299461, 1090381674,
// 1185931279, 1232710596).
// Built by ./passages/trench.js (see there: the box cut, walls with a parapet, the slab under the street and the square,
// the lit tunnels). The streets, the tram and the square above keep their level. Traffic does not take the underpasses
// (the lane graph has no tunnels); the player's car does.
//   SITE.shape: the cuts (hf.heightAt) and the lift of the street over them;  build(base) -> { clear, update, stats, state }
import { shapeGroup, buildGroup } from './passages/trench.js';

export const GOJDU = { id: 'gojdu', name: 'Pasajele Gojdu', opened: '2023-12-31', centre: [800, -170],
  ways: [1198929697, 1198935967, 1198935968, 1495385237, 1495385238, 23902269, 172687717, 1495385241, 1163299474,
    560117114, 1198935969, 1198867035, 1163299475, 1163299476, 1163299477, 1163299478, 1152486224, 996776596,
    996766488, 1163299473, 1163299461, 1090381674, 1185931279, 1232710596] };
let st = null;

export const SITE = {
  id: 'passages-gojdu',
  label: 'Pasajele Gojdu',
  shape(hf, map, geo) {
    st = shapeGroup(hf, map, geo, GOJDU);
    if (st) console.log(`[oradea] passages: ${GOJDU.name} shaped – ${JSON.stringify(st.stats)}`);
  },
  ground: true,
  build(base) {
    const r = buildGroup(base, st);
    if (!r) return null;
    console.log(`[oradea] passages: ${GOJDU.name} built – ${JSON.stringify(r.stats)}`);
    return { clear: r.clear, update() {}, stats: r.stats, state: st };
  },
};
