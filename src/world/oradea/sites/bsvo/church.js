// OWNER: oradea. The buildings of the BSVO site (../bsvo.js): the church, Calea Borșului 3, Oradea (OSM way 717082633, 433 m2) and the
// cream-rendered shop on the street in front of its yard (OSM 717082635, 87 m2). The geometry only; the site module owns the materials.
// The church, from the Google Street View panoramas of April 2025 and May 2024 and the Bing aerial (the old trading hall that the
// congregation took over for its consecration on 11 December 2022): one long storey, 43.45 x 9.96 m, grey-white render over a dark
// blue-grey plinth, a low hipped roof of ribbed rust-brown metal tile (about 16 degrees), pale gutters.
//   north front (to the yard, the real way in): from the west a plain wall where the shed abuts it, the church's own lettering painted
//   on the wall (the BSVO mountain and cross over «BISERICA BAPTISTĂ / STÂNCA VEACURILOR», dark navy), a three-light window, the
//   glazed double door with its side window (the entrance), a three-light window, a single door with a grey surround, a glazed double
//   door, a two-light window, and the mustard fascia of the old shop along the east third of the eave;
//   south wall (to the Kaufland car park): weathered render, a wide white window, a barred one and three small vents, a side door, two air conditioners;
//   the east and west ends plain. Frame (local u, v, y): see ./kit.js; y is absolute.
// The shop: the cream one-storey box at the lane, a glazed front with a door pair and a blank white fascia, a flat roof with a parapet.
//   buildChurch({ B, S, g }) -> { yF, W, Dp, top, stats, door (local [u, v] of the entrance ring spot), roofs }
//   buildShop({ B, S, g })   -> { yS, ring (local), top }
//   B needs wall, roof, det, lit, board; all carry the frame transform; S the collision world; g(x, z) the terrain height (map metres)
import { face, ringFaces, at, box, skin, hole, label } from '../../../cherkasy/slabkit.js';
import { ANG, toMap, hip, NAME } from './kit.js';

export const W = 43.45, DP = 9.96;
export const RING = [[0, 0], [W, 0], [W, DP], [0, DP]];
export const EAVE = 3.3, TOP = 4.75, OVER = 0.45;
export const SHOP = [[11.8, -36.6], [24.1, -36.2], [23.9, -29.2], [11.6, -29.5]]; // the OSM outline of 717082635 in the church frame
export const COL = {
  wall: '#ebebe7', wallS: '#ddd8ca', plinth: '#566075', plinthS: '#a3a6a6', roof: '#70402f', gutter: '#d6d8d8', frame: '#f4f5f4', rev: '#d9dbdc', glass: '#86a0ac',
  yellow: '#d2bd2a', grey: '#a8acaf', steel: '#8e9499', step: '#b4b1a9', red: '#b3302a', lamp: '#fff1cf', ridge: '#6e382a', ac: '#eceae6', pipe: '#e8e8e4',
  shop: '#e4dab0', shopPl: '#9b958a', fascia: '#f1efe6', parapet: '#c9c3b2', flat: '#55585b',
};
// the plane y = a + bx x + bz z through three points [x, z, y] (collision prisms of the roof)
function plane(p, q, r) {
  const [ux, uz, uy] = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], [vx, vz, vy] = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
  const det = ux * vz - uz * vx, bx = (uy * vz - uz * vy) / det, bz = (ux * vy - uy * vx) / det;
  return { a: p[2] - bx * p[0] - bz * p[1], bx, bz };
}

export function buildChurch({ B, S, g }) {
  const Wm = B.wall, D = B.det;
  const gAt = (u, v) => g(...toMap(u, v));
  const pts = [[0, 0], [W, 0], [W, DP], [0, DP], [W / 2, 0], [W / 2, DP], [0, DP / 2], [W, DP / 2]];
  const gmax = Math.max(...pts.map(([u, v]) => gAt(u, v))), gmin = Math.min(...pts.map(([u, v]) => gAt(u, v)));
  const yF = gmax + 0.3, gLo = gmin - 0.5, yE = yF + EAVE, yT = yF + TOP;       // floor, foot of the walls, eave, ridge
  const stats = { openings: 0, doors: 0 };

  const open = (f, q) => { const o = { dep: 0.2, rev: COL.rev, frame: COL.frame, glass: COL.glass, lit: true, pitch: 1.0, ...q, y0: yF + q.y0, y1: yF + q.y1 }; f.cuts.push(o); hole(B, f, o); if (q.door) stats.doors++; else stats.openings++; return o; };
  const wall = (f, col, wins, plinth = COL.plinth) => {
    for (const q of wins) open(f, q);
    skin(Wm, f, gLo, yF + 0.35, plinth, [2.5, 2.5]);
    skin(Wm, f, yF + 0.35, yE, col, [2.5, 2.5]);
    return f;
  };
  const row = (cs, w, y0, y1, extra = {}) => cs.map((c) => ({ s0: c - w / 2, s1: c + w / 2, y0, y1, ...extra }));

  // ---- north: the front onto the yard (s = u, west to east)
  const fN = face([0, 0], [W, 0], 0, -1);
  wall(fN, COL.wall, [
    { s0: 17.9, s1: 20.9, y0: 0.35, y1: 2.55, pitch: 1.0, tr: 2.0 },                    // three lights with a transom
    { s0: 22.7, s1: 23.9, y0: 0.35, y1: 2.55, pitch: 1.2 },                              // the window and the side light left of the entrance
    { s0: 24.1, s1: 24.5, y0: 0.35, y1: 2.55, pitch: 1.0 },
    { s0: 24.6, s1: 26.6, y0: 0.02, y1: 2.45, door: true, pitch: 1.0, tr: 2.0, dep: 0.24 }, // the glazed double door: the church's entrance
    { s0: 27.2, s1: 30.3, y0: 0.35, y1: 2.55, pitch: 1.0, tr: 2.0 },                    // the three-light window with the notice
    { s0: 32.7, s1: 33.8, y0: 0.02, y1: 2.2, door: true, pitch: 1.1, rev: COL.grey, dep: 0.2 },   // a single door in a grey surround
    { s0: 36.2, s1: 38.0, y0: 0.02, y1: 2.45, door: true, pitch: 0.9, tr: 2.0, dep: 0.22 },       // a second glazed pair
    { s0: 40.5, s1: 42.1, y0: 0.35, y1: 2.55, pitch: 0.8 },
  ]);
  // the church's lettering, painted on the wall (7.2 x 2.15 m, the board atlas' NAME band)
  label(B.board, fN, 10.2, 17.4, yF + 0.42, yF + 0.42 + 7.2 / 3.34, 0.012, NAME);
  // the mustard fascia of the old shop along the east third of the eave: a deep band proud of the wall, as the 2025 panorama shows it
  D.setColor(COL.yellow); box(D, fN, 30.0, W + 0.05, yE - 0.76, yE - 0.02, 0, 0.42, 'fltrb');
  // steps at the doors, a lamp over the entrance and two floodlights over the lettering
  D.setColor(COL.step);
  for (const [a, b] of [[24.3, 26.9], [32.5, 34.0], [36.0, 38.2]]) box(D, fN, a, b, gLo + 0.4, yF - 0.02, 0, 0.55, 'ftlrf');
  B.lit.setColor(COL.lamp);
  for (const [s, y] of [[25.6, yF + 2.75], [12.0, yF + 3.0], [15.6, yF + 3.0]]) { const p = at(fN, s, y, 0.15); B.lit.box(p[0] - 0.1, p[1], p[2] - 0.2, p[0] + 0.1, p[1] + 0.2, p[2] + 0.05, 63); }
  D.setColor(COL.steel); for (const s of [12.0, 15.6]) { const p = at(fN, s, yF + 3.0, 0.1); D.box(p[0] - 0.03, p[1] + 0.2, p[2] - 0.25, p[0] + 0.03, p[1] + 0.26, p[2] + 0.05, 63); }

  // ---- south: onto the car park behind the mesh fence (s runs east to west)
  const fS = face([W, DP], [0, DP], 0, 1);
  // as in the May 2024 panorama: the weathered render, a grey concrete foot, a wide white window beside an air conditioner, a window behind
  // iron bars, a row of small vents under the eave; the order along the wall is partly a guess
  const sw = (c, w, y0, y1, extra = {}) => ({ s0: W - c - w / 2, s1: W - c + w / 2, y0, y1, ...extra });
  const bars = { rev: COL.rev, dep: 0.16, sill: '#cfd1d2' };
  wall(fS, COL.wallS, [
    sw(4.5, 1.1, 1.15, 2.55, { pitch: 0.28, ...bars }), sw(17.0, 1.1, 1.15, 2.55, { pitch: 0.28, ...bars }), sw(31.8, 1.1, 1.15, 2.55, { pitch: 0.28, ...bars }),
    sw(10.5, 1.9, 1.25, 2.35, { pitch: 0.95, sill: '#cfd1d2' }), sw(24.5, 1.9, 1.25, 2.35, { pitch: 0.95, sill: '#cfd1d2' }),
    ...[36.8, 38.6, 40.4].map((c) => sw(c, 0.45, 2.05, 2.4, { pitch: 5, frame: COL.steel, dep: 0.12 })),
    sw(14.0, 1.0, 0.02, 2.15, { door: true, pitch: 5, frame: COL.steel, rev: COL.grey, dep: 0.14 }),
  ], COL.plinthS);
  D.setColor(COL.ac); for (const c of [27.4, 7.6]) box(D, fS, W - c - 0.4, W - c + 0.4, yF + 1.55, yF + 2.0, 0, 0.27, 'ftlrb');

  // ---- east and west ends
  const fE = face([W, 0], [W, DP], 1, 0), fWe = face([0, DP], [0, 0], -1, 0);
  wall(fE, COL.wall, [...row([2.6], 1.2, 1.1, 2.5, { pitch: 0.6 }), { s0: 6.8, s1: 7.8, y0: 0.02, y1: 2.15, door: true, pitch: 5, frame: COL.steel, rev: COL.grey, dep: 0.14 }]);
  wall(fWe, COL.wall, []);

  // ---- roof: a low hip, white gutters, a ridge board
  const r = hip(B.roof, { u0: 0, u1: W, v0: 0, v1: DP, eave: yE, top: yT, over: OVER, col: COL.roof });
  D.setColor(COL.ridge); D.box(r.ridge[0][0] - 0.1, yT - 0.02, DP / 2 - 0.16, r.ridge[1][0] + 0.1, yT + 0.16, DP / 2 + 0.16, 63);
  D.setColor(COL.gutter);
  const gy = r.ya - 0.1;
  D.box(-OVER - 0.05, gy, -OVER - 0.12, W + OVER + 0.05, gy + 0.14, -OVER + 0.02, 63 & ~8); D.box(-OVER - 0.05, gy, DP + OVER - 0.02, W + OVER + 0.05, gy + 0.14, DP + OVER + 0.12, 63 & ~8);
  D.box(-OVER - 0.12, gy, -OVER, -OVER + 0.02, gy + 0.14, DP + OVER, 63 & ~8); D.box(W + OVER - 0.02, gy, -OVER, W + OVER + 0.12, gy + 0.14, DP + OVER, 63 & ~8);
  D.setColor(COL.pipe);
  for (const [u, v] of [[0.1, -OVER], [W - 0.1, -OVER], [W - 0.1, DP + OVER - 0.05], [0.1, DP + OVER - 0.05]]) D.box(u - 0.05, gLo + 0.4, v - 0.05, u + 0.05, gy, v + 0.05, 63 & ~8);

  // ---- collision: the walls, then the four roof planes
  const [mx, mz] = toMap(W / 2, DP / 2);
  S.obox(mx, mz, W / 2, DP / 2, ANG, gLo - 0.3, yE, 'wall');
  {
    const Pw = (u, v, y) => { const [x, z] = toMap(u, v); return [x, z, y]; };
    const ya = r.ya, half = r.half, o = OVER, cm = DP / 2, [r0, r1] = r.ridge;
    const piece = (poly, p, q, w) => { const pl = plane(Pw(...p), Pw(...q), Pw(...w)); S.prism(poly.map(([u, v]) => toMap(u, v)).flat(), yE - 0.3, pl.a, pl.bx, pl.bz, 'wall', 0); };
    piece([[-o, -o], [W + o, -o], [r1[0], cm], [r0[0], cm]], [-o, -o, ya], [W + o, -o, ya], [r0[0], cm, yT]);
    piece([[-o, DP + o], [W + o, DP + o], [r1[0], cm], [r0[0], cm]], [-o, DP + o, ya], [W + o, DP + o, ya], [r0[0], cm, yT]);
    piece([[-o, -o], [-o, DP + o], [r0[0], cm]], [-o, -o, ya], [-o, DP + o, ya], [r0[0], cm, yT]);
    piece([[W + o, -o], [W + o, DP + o], [r1[0], cm]], [W + o, -o, ya], [W + o, DP + o, ya], [r1[0], cm, yT]);
  }
  return { yF, yE, yT, gLo, stats, top: yT, ringSpot: [25.6, -5.4], fN, half: r.half };
}

// ================================================================================================ the shop at the lane
export function buildShop({ B, S, g }) {
  const Wm = B.wall, D = B.det;
  const cs = SHOP;
  const gm = Math.max(...cs.map(([u, v]) => g(...toMap(u, v))));
  const yS = gm + 0.3, gLo = Math.min(...cs.map(([u, v]) => g(...toMap(u, v)))) - 0.5, hE = 3.55, yE = yS + hE;
  const faces = ringFaces(cs); // edge 0 north (the lane), 1 east, 2 south, 3 west
  const dark = '#7a909c';
  const open = (f, q) => { const o = { dep: 0.18, rev: '#e8e4d4', frame: '#f4f5f4', glass: dark, pitch: 1.2, ...q, y0: yS + q.y0, y1: yS + q.y1 }; f.cuts.push(o); hole({ det: D, lit: D, glass: D }, f, o); return o; };
  const skinAll = (f) => { skin(Wm, f, gLo, yS + 0.4, COL.shopPl, [2.5, 2.5]); skin(Wm, f, yS + 0.4, yE, COL.shop, [2.5, 2.5]); };
  // the lane front: two shop windows and a door pair, a blank white fascia over them
  const f0 = faces[0];
  open(f0, { s0: 0.8, s1: 4.6, y0: 0.35, y1: 2.65, tr: 2.05 });
  open(f0, { s0: 5.4, s1: 7.4, y0: 0.02, y1: 2.5, door: true, pitch: 1.0, tr: 2.05 });
  open(f0, { s0: 8.2, s1: 11.7, y0: 0.35, y1: 2.65, tr: 2.05 });
  open(faces[1], { s0: 2.6, s1: 4.0, y0: 0.9, y1: 2.4, pitch: 0.7 });
  open(faces[2], { s0: 1.8, s1: 3.4, y0: 0.9, y1: 2.4, pitch: 0.8 });
  open(faces[2], { s0: 7.6, s1: 9.0, y0: 0.9, y1: 2.4, pitch: 0.7 });
  open(faces[3], { s0: 2.6, s1: 4.0, y0: 0.9, y1: 2.4, pitch: 0.7 });
  for (const f of faces) skinAll(f);
  Wm.setColor(COL.fascia); box(Wm, f0, 0.3, f0.L - 0.3, yS + 2.85, yE - 0.05, 0, 0.12, 'fltrb');
  // a flat roof with a low parapet and a cap
  const P = cs.map(([u, v]) => [u, v]);
  D.setColor(COL.flat); D.fill(P, [], yE + 0.02, true);
  D.setColor(COL.parapet);
  for (const f of faces) box(D, f, -0.04, f.L + 0.04, yE, yE + 0.35, -0.2, 0.06, 'fltrb');
  S.prism(cs.map(([u, v]) => toMap(u, v)).flat(), gLo - 0.3, yE + 0.35, 0, 0, 'wall', 0);
  return { yS, yE, ring: cs, top: yE + 0.35 };
}
