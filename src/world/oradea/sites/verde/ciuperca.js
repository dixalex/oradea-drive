// OWNER: oradea. Dealul Ciuperca (Str. Graurilor 80): the restaurant on the hilltop (OSM way 331203796, 1,152 m2) with its glazed terrace
// ring, the belvedere platform behind it, the stone stairs down the slope beside the footway, lamps and garden beds. Not a site module.
// The hill was renewed in the early 2020s; the look is read from the city's and visitoradea.com's photographs of the new restaurant:
// one tall glazed storey on a grey stone plinth, white fascia and a deep flat roof slab with an overhang, timber deck round the round end.
//   CIUPERCA_ID = 331203796;  RING  the OSM outline (map metres);  PAD  the outline grown by 3 m (the phone-disc check)
//   buildCiuperca({ B, S, g, r }) -> { footprints, clear(x, z), stats }   B: the builders of ./kit.js
// Guesses: the colours, the glazing bays, the back wall's windows, the entrance on the road side, the belvedere's place and shape (the
// OSM viewpoint node is not in the map data), the stairs along the OSM footway.
import { ringFaces, box, skin, hole, rect } from '../../../cherkasy/slabkit.js';
import { COL, grow, positiveRing, inRing, railRun, stairRun, tuft, thinSolid } from './kit.js';

export const CIUPERCA_ID = 331203796;
export const RING = [[1254.2, -1179.3], [1251.7, -1174.8], [1243.6, -1170], [1235.3, -1169.3], [1230.1, -1172.4], [1225.1, -1176.7], [1222.8, -1182.3], [1222.9, -1187.2], [1225.2, -1196.1], [1255.6, -1217.1], [1262.6, -1207.8], [1256.7, -1202.9], [1261.3, -1196.2], [1256.6, -1192.8]];
export const PAD = grow(RING, 3);
const STAIR = [[1192, -1177], [1206, -1129]];      // beside the OSM footway that runs down the slope
const STORY = 3.9, SLAB = 0.45, OVER = 1.5;

export function buildCiuperca({ B, S, g, r }) {
  const R = positiveRing(RING), fs = ringFaces(R), stats = { windows: 0, stairs: 0 };
  const hs = R.map(([x, z]) => g(x, z)).filter(Number.isFinite), yF = Math.max(...hs) + 0.2, gLo = Math.min(...hs) - 0.7, yE = yF + STORY;
  const W = B.wall, D = B.det;
  // the entrance: the bulb edge nearest the road (south of the building)
  const mid = (f) => [f.ax + f.ux * f.L / 2, f.az + f.uz * f.L / 2];
  let door = -1, dBest = 1e9; fs.forEach((f, i) => { const [x, z] = mid(f), d = Math.hypot(x - 1236, z + 1160); if (f.L > 3 && d < dBest) { dBest = d; door = i; } });
  const longest = fs.reduce((b, f, i) => (f.L > fs[b].L ? i : b), 0);
  const col = (c) => D.setColor(c);

  fs.forEach((f, i) => {
    if (f.L < 0.6) return;
    const back = i === longest;
    if (back) { // the long wall on the hill side: cream render with a ribbon of windows
      const n = Math.floor((f.L - 3) / 5.2);
      for (let k = 0; k < n; k++) { const c = 2.2 + (k + 0.5) * (f.L - 4.4) / n; const q = { s0: c - 1.15, s1: c + 1.15, y0: yF + 1.0, y1: yF + 3.2, dep: 0.22, rev: COL.white, frame: COL.mullion, glass: COL.glass, lit: true, pitch: 1.2 }; f.cuts.push(q); hole(B, f, q); stats.windows++; }
      skin(W, f, gLo, yF + 0.5, COL.plinth, [2.5, 2.5]); skin(W, f, yF + 0.5, yE, COL.cream, [2.5, 2.5]);
      return;
    }
    skin(W, f, gLo, yF + 0.5, COL.plinth, [2.5, 2.5]);                       // the stone plinth
    skin(W, f, yE - 0.4, yE, COL.white, [2.5, 2.5]);                          // the fascia band
    B.lit.setColor(COL.glass); rect(B.lit, f, 0.02, f.L - 0.02, yF + 0.5, yE - 0.4, -0.06);
    col(COL.mullion);
    const bays = Math.max(1, Math.round(f.L / 1.9));
    for (let k = 0; k <= bays; k++) { const s = Math.min(f.L - 0.05, Math.max(0.05, f.L * k / bays)); box(D, f, s - 0.05, s + 0.05, yF + 0.5, yE - 0.4, -0.02, 0.12, 'ftlr'); }
    box(D, f, 0, f.L, yF + 0.5, yF + 0.62, -0.02, 0.12, 'ft'); box(D, f, 0, f.L, yE - 0.52, yE - 0.4, -0.02, 0.12, 'fb');   // sill and head rails
    stats.windows += bays;
    if (i === door) { // the double door in the middle of the glazing, steps and a flat canopy
      const c = f.L / 2;
      col(COL.timberD); box(D, f, c - 1.3, c + 1.3, yF + 0.5, yF + 2.8, -0.02, 0.1, 'f');
      col(COL.steel); box(D, f, c - 1.4, c + 1.4, yF + 2.8, yF + 2.95, -0.02, 0.14, 'fbtlr'); box(D, f, c - 1.4, c - 1.3, yF + 0.5, yF + 2.8, -0.02, 0.14, 'fl'); box(D, f, c + 1.3, c + 1.4, yF + 0.5, yF + 2.8, -0.02, 0.14, 'fr');
      col(COL.stoneL); box(D, f, c - 1.8, c + 1.8, yF - 0.4, yF - 0.02, 0.05, 1.3, 'ftlrf'); box(D, f, c - 2.1, c + 2.1, yF - 0.8, yF - 0.4, 0.05, 1.8, 'ftlrf');
    }
  });
  // wall and glass volumes: the floor slab inside and the collision
  S.prism(R.flat(), gLo, yE + SLAB, 0, 0, 'wall', 0);

  // the roof: a flat slab with a white fascia, overhanging, a dark membrane on top, a low parapet line
  const slab = grow(R, OVER);
  W.setColor(COL.white); W.extrude(slab, [], yE, yE + SLAB, { top: false, sides: true });
  W.fill(slab, [], yE - 0.01, false);
  B.roof.setColor(COL.roofDark); B.roof.fill(slab, [], yE + SLAB, true);
  // the overhang's soffit stays white (a timber-lined soffit is a guess); posts at the bulb under the overhang
  col(COL.steel);

  // the terrace: a timber deck ring round the round end, 1.8 m wide, with a glass rail on its outer edge and steps at the door
  const deck = grow(R, 1.8);
  const yD = yF - 0.04;
  W.setColor(COL.stone); W.extrude(deck, [], gLo, yD - 0.02, { top: false, sides: true, bottom: false });
  D.setColor(COL.timber); D.fill(deck, [], yD, true);
  // railing along the deck's outer edge on the south and west, open at the door
  const run = []; deck.forEach((p, i) => { const q = deck[(i + 1) % deck.length]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.5 && (p[1] > -1200 && q[1] > -1200 && p[0] < 1256)) run.push([p, q]); });
  const doorF = fs[door], dm = mid(doorF);
  for (const [p, q] of run) {
    const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2; if (Math.hypot(mx - dm[0], mz - dm[1]) < 3.2) continue;
    railRun(B.det, B.glass, g, [p, q], { y: yD, glass: true, col: COL.steel });
    thinSolid(S, g, [p, q], 1.0);
  }

  // the belvedere: a round viewing platform on the hill side of the long wall, steps up to it, a rail, two benches
  const lf = fs[longest], lm = mid(lf), bx = lm[0] + lf.nx * 12, bz = lm[1] + lf.nz * 12, br = 5.2, yB = g(bx, bz) + 0.7;
  const disc = (rad, n = 20) => Array.from({ length: n }, (_, k) => [bx + Math.cos(k / n * Math.PI * 2) * rad, bz + Math.sin(k / n * Math.PI * 2) * rad]);
  D.setColor(COL.stone); D.extrude(disc(br + 0.2), [], yB - 3, yB - 0.1, { top: false });
  D.setColor(COL.timber); D.fill(disc(br), [], yB, true);
  D.setColor(COL.stoneL); D.extrude(disc(br + 0.25), [], yB - 0.5, yB - 0.02, { top: true, sides: true });
  const ringPts = disc(br - 0.2, 24); ringPts.push(ringPts[0]);
  // leave a gap towards the building for the way in
  const ang0 = Math.atan2(lm[1] - bz, lm[0] - bx), arc = [];
  for (let k = 0; k <= 24; k++) { const a = ang0 + 0.5 + k / 24 * (Math.PI * 2 - 1.0); arc.push([bx + Math.cos(a) * (br - 0.2), bz + Math.sin(a) * (br - 0.2)]); }
  railRun(D, B.glass, g, arc, { y: yB, glass: true });
  thinSolid(S, g, arc, 1.0);
  S.cyl(bx, bz, gLo - 2, yB, br + 0.2, br + 0.2, 'wall', 0);
  // a path of paving from the platform to the building
  { const n = Math.ceil(Math.hypot(lm[0] - bx, lm[1] - bz) / 2.4);
    D.setColor(COL.stoneL);
    for (let k = 1; k < n - 2; k++) { const t = k / n, x = bx + (lm[0] - bx) * t, z = bz + (lm[1] - bz) * t; D.box(x - 0.9, g(x, z) - 0.1, z - 0.9, x + 0.9, g(x, z) + 0.21, z + 0.9, 63); } }
  for (const s of [-1, 1]) { // benches facing out
    const a = ang0 + Math.PI + s * 1.3, x = bx + Math.cos(a) * (br - 1.1), z = bz + Math.sin(a) * (br - 1.1);
    D.setColor(COL.timberD); D.box(x - 0.9, yB + 0.4, z - 0.25, x + 0.9, yB + 0.47, z + 0.25, 63);
    D.setColor(COL.steel); D.box(x - 0.8, yB, z - 0.2, x - 0.7, yB + 0.4, z + 0.2, 63); D.box(x + 0.7, yB, z - 0.2, x + 0.8, yB + 0.4, z + 0.2, 63);
  }

  // the stairs down the slope beside the footway, with a rail on each side, lamps and garden beds
  stats.stairs = stairRun(D, g, STAIR[0], STAIR[1], { w: 2.8 });
  {
    const [a, b] = STAIR, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, nx = -uz, nz = ux;
    for (const s of [-1, 1]) { const e = [[a[0] + nx * 1.5 * s, a[1] + nz * 1.5 * s], [b[0] + nx * 1.5 * s, b[1] + nz * 1.5 * s]]; railRun(D, null, g, e, { h: 0.95, col: COL.steel }); }
  }
  // lamps round the terrace
  const lamps = [];
  for (let k = 0; k < deck.length; k += 2) { const p = deck[k]; if (p[1] > -1200 && p[0] < 1256 && Math.hypot(p[0] - dm[0], p[1] - dm[1]) > 3.2) lamps.push(p); }
  for (const [x, z] of lamps) {
    D.setColor(COL.steel); D.box(x - 0.04, yD, z - 0.04, x + 0.04, yD + 3.0, z + 0.04, 63);
    B.lit.setColor(COL.lamp); B.lit.ellipsoid([x, yD + 3.1, z], [0.16, 0.2, 0.16], 6, 4);
  }
  // beds of shrubs on the slope below the terrace
  for (let k = 0; k < 26; k++) { const a = Math.PI * 0.05 + k / 26 * Math.PI * 1.0, rr = 16.5 + r() * 2.5, x = 1240 + Math.cos(a) * rr * 1.0, z = -1183 + Math.sin(a) * rr * 0.55 + 4; if (!inRing(slab, x, z) && !inRing(deck, x, z)) tuft(D, x, g(x, z) - 0.04, z, 0.4 + r() * 0.35, r() < 0.5 ? COL.bed : COL.lawn); }

  const fp = [{ poly: R.map((p) => p.slice()), h: yE + SLAB - gLo + 0.4, kind: 'restaurant', name: 'Restaurant Ciuperca', id: CIUPERCA_ID }];
  const keep = [slab, deck, disc(br + 2)];
  const stairBox = (x, z) => { const [a, b] = STAIR, L = Math.hypot(b[0] - a[0], b[1] - a[1]), t = ((x - a[0]) * (b[0] - a[0]) + (z - a[1]) * (b[1] - a[1])) / (L * L); if (t < 0 || t > 1) return false; return Math.hypot(x - a[0] - t * (b[0] - a[0]), z - a[1] - t * (b[1] - a[1])) < 3.2; };
  return { footprints: fp, clear: (x, z) => keep.some((P) => inRing(P, x, z)) || stairBox(x, z), stats: { ...stats, yF: +yF.toFixed(2), belvedere: [Math.round(bx), Math.round(bz)] }, yF };
}
