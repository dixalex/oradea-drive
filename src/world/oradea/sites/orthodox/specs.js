// OWNER: oradea. The parametric Orthodox churches of Oradea (tier b of ../orthodox.js): one entry per church, the OSM footprint
// it replaces (`id`), and what the kit (church.js) cannot read off the outline: heights, colours, roof material, domes, a west
// tower. Walls follow the OSM ring, the roofs follow the plan (nave band, cross arms, apse). Sources: the Esri aerial (roof
// colours and plan), OSM, Wikimedia Commons photos where a church has one (Biserica Nufărului, the Velența church).
//   KIT                  [{ id, key, name, H, ...}]  fields in church.js: H eave height, rise / pitch, wall, trim, plinth, roofMat
//                        ('roof' sheet metal, 'tile', 'shingle'), roofCol, domeCol, wallMat ('wall' | 'wood'), domes [{ u, v?, R, drumH,
//                        kind: 'byz' | 'onion' | 'bell', col, H, lantern }], towers [{ at: 'west', w, d?, h, roof, rh, clock }], porch,
//                        core [vt, vb], apse (u | false), hipEnd, hipWest, roofStyle 'hip'
//                        `ring` replaces the OSM outline (synthetic ones for churches OSM draws only in part), `node` [lat, lon]
//                        places a small church where OSM has only a point
//   SKIP                 the OSM building ids the kit churches replace
import { PI } from './kit.js';

// a ring in map coordinates from local points: origin (x, z), axis angle (degrees; default true east), points [u, v]
export function localRing(x, z, pts, yawDeg = -30.5) {
  const y = yawDeg * PI / 180, U = [Math.cos(y), Math.sin(y)], V = [-U[1], U[0]];
  return pts.map(([u, v]) => [x + U[0] * u + V[0] * v, z + U[1] * u + V[1] * v]);
}
const box = (L, W, x0 = -L / 2, v0 = -W / 2) => [[x0, v0], [x0 + L, v0], [x0 + L, v0 + W], [x0, v0 + W]];
// a Greek cross: centre block bw x bd, arms of length al and width aw
export const cross = (bw, bd, al, aw) => {
  const a = bw / 2, b = bd / 2, c = aw / 2;
  return [[-c, -b - al], [c, -b - al], [c, -b], [a, -b], [a, -c], [a + al, -c], [a + al, c], [a, c], [a, b], [c, b], [c, b + al], [-c, b + al], [-c, b], [-a, b], [-a, c], [-a - al, c], [-a - al, -c], [-a, -c], [-a, -b], [-c, -b]];
};

const GREY = '#7f858b', DARK = '#53585d', SILVER = '#b9bec2', RED = '#c2603f', BROWN = '#8c5a40';

export const KIT = [
  { id: 262768555, key: 'duh', name: 'Biserica Sfântul Duh Mângâietor', H: 7.4, wall: '#ebdfc2', roofMat: 'tile', roofCol: BROWN, rise: 4.6,
    domes: [{ u: 8.4, R: 2.7, drumH: 3.0, kind: 'onion', col: GREY }], towers: [{ at: 'west', w: 5.2, h: 21, roof: 'pyramid', rh: 6, roofCol: DARK }] },
  { id: 421282171, key: 'vasile', name: 'Biserica Sfântul Vasile cel Mare', H: 7.0, wall: '#eee3c8', roofMat: 'tile', roofCol: BROWN, rise: 4.0,
    domes: [{ u: 10, R: 2.6, drumH: 2.8, kind: 'byz', col: GREY }], towers: [{ at: 'west', w: 4.6, h: 17, roof: 'pyramid', rh: 5.5, roofCol: DARK }] },
  { id: 421961371, key: 'ioan', name: 'Biserica Sfântul Ioan Iacob Hozevitul', H: 8.6, wall: '#ece0c4', roofMat: 'roof', roofCol: DARK, rise: 5.0, roofStyle: 'hip', apse: false,
    domes: [{ u: 0, v: 0, R: 4.6, drumH: 5.2, kind: 'byz', col: GREY, n: 12, lantern: true }, { u: 0, v: 11.5, R: 1.4, drumH: 1.8, kind: 'onion', col: GREY }, { u: 0, v: -11.5, R: 1.4, drumH: 1.8, kind: 'onion', col: GREY }] },
  { id: 421967047, key: 'vineri', name: 'Biserica Sfânta Vineri', H: 6.2, wall: '#f0e6cc', roofMat: 'tile', roofCol: RED, rise: 3.8,
    domes: [{ u: 1, R: 2.2, drumH: 2.4, kind: 'onion', col: GREY }] },
  { id: 422011201, key: 'schimb', name: 'Biserica Schimbarea la Față', H: 7.0, wall: '#eadcb8', roofMat: 'roof', roofCol: DARK, rise: 3.6, roofStyle: 'hip',
    domes: [{ u: 0, v: 0, R: 3.3, drumH: 3.4, kind: 'byz', col: '#6f7a86', n: 12 }] },
  { id: 422521523, key: 'o10', name: 'Biserica Ortodoxă', H: 6.8, wall: '#f0ece0', roofMat: 'roof', roofCol: SILVER, rise: 3.0, roofStyle: 'hip',
    domes: [{ u: -5, v: 0, R: 2.5, drumH: 2.6, kind: 'byz', col: SILVER }, { u: 5, v: 0, R: 2.0, drumH: 2.2, kind: 'byz', col: SILVER }] },
  { id: 423412051, key: 'cruci', name: 'Mănăstirea Sfintei Cruci', H: 7.2, wall: '#f1ede2', roofMat: 'roof', roofCol: SILVER, rise: 3.8,
    domes: [{ u: 3, R: 2.9, drumH: 3.4, kind: 'bell', col: SILVER }], towers: [{ at: 'west', w: 4.2, h: 16, roof: 'bell', rh: 5.6, roofCol: SILVER }] },
  { id: 436548036, key: 'noua', name: 'Biserica Nouă', H: 6.6, wall: '#efe4cb', roofMat: 'tile', roofCol: RED, rise: 3.6,
    domes: [{ u: 4, R: 2.3, drumH: 2.6, kind: 'onion', col: GREY }], towers: [{ at: 'west', w: 4.0, h: 14, roof: 'pyramid', rh: 4.6, roofCol: RED }] },
  { id: 544489782, key: 'sebast', name: 'Biserica Sfântul Sebastian', H: 6.4, wall: '#ece1c6', roofMat: 'roof', roofCol: GREY, rise: 3.2,
    towers: [{ at: 'west', w: 3.8, h: 14.5, roof: 'pyramid', rh: 4.8, roofCol: DARK }] },
  { id: 544505902, key: 'velenta', name: 'Biserica Ortodoxă Velența II', H: 7.6, wall: '#efe5d0', roofMat: 'tile', roofCol: RED, rise: 4.2, apse: false, core: [-2.5, 13.4],
    domes: [{ u: -10, v: 5, R: 2.2, drumH: 2.4, kind: 'onion', col: GREY }] },
  { id: 624265570, key: 'o16', name: 'Biserica Ortodoxă', H: 6.6, wall: '#f1eee4', roofMat: 'roof', roofCol: SILVER, round: true,
    domes: [{ u: 0, v: 0, R: 3.2, drumH: 3.0, kind: 'byz', col: SILVER, n: 12 }] },
  { id: 717090541, key: 'mil', name: 'Biserica Ortodoxă Militară', H: 5.2, wall: '#efe9d8', roofMat: 'roof', roofCol: '#5d7a62', rise: 2.4,
    domes: [{ u: 4, R: 1.5, drumH: 1.8, kind: 'onion', col: '#5d7a62' }] },
  { id: 544741748, key: 'capela', name: 'Capela Ortodoxă', H: 5.4, wall: '#f0ebdc', roofMat: 'roof', roofCol: GREY, roofStyle: 'hip', rise: 2.4,
    domes: [{ u: 0, v: 0, R: 2.1, drumH: 2.2, kind: 'byz', col: '#6f8fb0' }] },
  { id: 1078045524, key: 'petru', name: 'Biserica Sfinții Apostoli Petru și Pavel', H: 6.0, wall: '#eddfc0', roofMat: 'tile', roofCol: RED, rise: 3.0, apse: false,
    domes: [{ u: 1, R: 1.8, drumH: 2.0, kind: 'onion', col: GREY }], towers: [{ at: 'west', w: 3.6, h: 13, roof: 'pyramid', rh: 4.4, roofCol: RED }] },
  { id: 932353253, key: 'n1737', name: 'Biserica Sfinții Arhangheli Mihail și Gavril', H: 5.6, wall: '#f0e8d4', roofMat: 'roof', roofCol: SILVER, rise: 2.8,
    towers: [{ at: 'west', w: 3.2, h: 11.5, roof: 'pyramid', rh: 4.2, roofCol: SILVER }] },
  { id: 3000009285, key: 'n2000', name: 'Biserica Ortodoxă', H: 7.4, wall: '#f2efe6', roofMat: 'roof', roofCol: SILVER, rise: 3.6, apse: false,
    domes: [{ u: 0, v: 0, R: 3.0, drumH: 3.2, kind: 'byz', col: SILVER, n: 12 }, { u: -9, v: 0, R: 1.6, drumH: 1.9, kind: 'onion', col: SILVER }] },
];

// Biserica Nufărului: OSM draws only a 7 x 15 m stub of it, the church (a yellow cross-domed church with a grey roof and a lantern,
// Commons photo "Nufarul orthodox Church") stands over the dark shape north-west of the stub in the aerial: a cross ring replaces it
KIT.push({
  id: 421766749, key: 'nufar', name: 'Biserica Nufărului', H: 6.4, wall: '#e8c77c', trim: '#f4ead0', roofMat: 'roof', roofCol: '#868b90', rise: 3.0, roofStyle: 'hip',
  ring: () => localRing(2571.5, 1336, cross(9, 9, 3.4, 8.2).map(([u, v]) => [v, u]), -17),
  domes: [{ u: 0, v: 0, R: 3.4, drumH: 3.6, kind: 'byz', col: '#868b90', lantern: true, n: 8 }],
});
// a small wooden church where OSM has only a node (n7981182385, "Biserica de lemn"): nave, five-sided apse, shingled roof and spire
KIT.push({
  id: 7981182385, key: 'lemn2', name: 'Biserica de lemn', H: 3.6, wall: '#8a6a4c', trim: '#6e5238', plinth: '#8c8272', roofMat: 'shingle', roofCol: '#7d7a76', wallMat: 'wood', rise: 2.0, pitch: 0.9, windows: false, noDoor: true,
  node: [47.0433001, 21.9195374],
  ring: (x, z) => localRing(x, z, [[-4.2, -2.2], [2.2, -2.2], [3.6, -1.1], [4.1, 0], [3.6, 1.1], [2.2, 2.2], [-4.2, 2.2]]),
  towers: [{ at: 'west', w: 2.6, h: 8.5, roof: 'spire', rh: 5.5, roofCol: '#6c6a66', col: '#8a6a4c' }],
});

export const SKIP = KIT.map((k) => k.id).filter((id) => id !== 7981182385);
