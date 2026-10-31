// OWNER: oradea. The Rimanóczy Hotel (OSM way 421787874) and its baths block (OSM way 21056820), not sites in themselves: Kálmán Rimanóczy
// senior's hotel complex (no firm year in the sources; the Hotel Crișul Repede, the Royal café, steam baths) on Strada Iosif Vulcan, Strada Libertății and Strada Nicolae Grigorescu, with the baths along the
// Crișul Repede and the Royal café in its yard (the hotel was the town's best address; its Neo-Renaissance fronts follow the Venetian Ca'
// d'Oro, as visitoradea.com says). Three floors (a rusticated ground floor, a first floor with pedimented aediculae, a plainer second),
// a chamfered corner turret with a mansard roof and a lantern at the junction of Vulcan and Grigorescu. Wrapped in scaffold nets until
// about December 2026: this is the restored state from the older photographs.
//   RIMANOCZY_ID = 421787874, BATHS_ID = 21056820;  rimanoczy(ctx, b), baths(ctx, b) -> { footprint, top, floor, lots }
// Sources: Wikimedia Commons (Rimanóczy Hotel, 2013 to 2023, the Royal café postcard of 1910s), Fortepan 76955, visitoradea.com. Which of
// the two OSM ways is the hotel proper and which the baths is settled from the photographs and the plan (the long north front with the
// corner turret is 421787874); the colours (ochre render, cream stone) read from the 2023 photographs, the rest of the long block's
// axes, the east end and the courtyard sides are guesses.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { face } from '../../../cherkasy/slabkit.js';
import { dormer } from '../republicii/herokit.js';
import { aq, dbox } from '../republicii/facade.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { DP } from '../../../materials.js';
import { dressRun } from './dress.js';
import { edgeBetween, circumcentre, bulb, cone, drum } from './towers.js';
import { RI } from './cells-rimanoczy.js';

export const RIMANOCZY_ID = 421787874, BATHS_ID = 21056820;
const { GH, SH } = RI, CH = 2.6;                                     // CH: how far the corner's chamfer cuts along each edge
const MOULD = { plinth: '#8a7e5c', band: RI.stone, string: RI.stone, cornice: RI.stone, depth: 0.55, bandOut: 0.14 };
const CELLS = { a: { g: 'ri.g', f: ['ri.f1', 'ri.f2'] }, b: { g: 'ri.g2', f: ['ri.f1', 'ri.f2'] } };
const DEF = (axW = 4.2) => ({ axW, alt: 'b', n: 3, gh: GH, sh: SH, cells: CELLS, mould: MOULD });

function dressCorner(K, f, s0, s1, floorY, spec, rnd, l) {
  const palId = spec.pal, y1 = floorY + GH, y2 = y1 + SH, y3 = y2 + SH;
  aq(K, f, s0, s1, floorY, y1, 0, 'ri.cg', rnd(), palId); aq(K, f, s0, s1, y1, y2, 0, 'ri.c1', rnd(), palId); aq(K, f, s0, s1, y2, y3, 0, 'ri.c2', rnd(), palId);
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', '#8a7e5c', DP.CONC);
  dbox(K, f, s0, s1, y1 - 0.1, y1 + 0.22, 0, 0.16, 'ft', RI.stone);
  dbox(K, f, s0, s1, y2 - 0.06, y2 + 0.06, 0, 0.06, 'f', RI.stone);
  dbox(K, f, s0, s1, y3 - 0.58, y3 - 0.32, 0, 0.14, 'f', RI.stone);
  dbox(K, f, s0 - 0.02, s1 + 0.02, y3 - 0.32, y3 - 0.05, 0, 0.55, 'fu', RI.stone);
  dbox(K, f, s0 - 0.04, s1 + 0.04, y3 - 0.05, y3 + 0.14, 0, 0.68, 'ftu', RI.stone);
  const yb = y1 + 0.02, a = s0 + 0.35, b = s1 - 0.35;              // the balcony of the corner window: a rounded bowl in cream, an iron rail
  dbox(K, f, a, b, yb - 0.5, yb + 0.02, 0, 0.95, 'ftulr', RI.stone);
  aq(K, f, a, b, yb + 0.02, yb + 0.98, 0.91, 'rail.R', 0.9, palId, 1);
  const y2b = y2 + 0.02;                                            // the second floor's balcony stacks on it, a little smaller
  dbox(K, f, a + 0.3, b - 0.3, y2b - 0.4, y2b + 0.02, 0, 0.7, 'ftulr', RI.stone);
  aq(K, f, a + 0.3, b - 0.3, y2b + 0.02, y2b + 0.98, 0.66, 'rail.R', 0.9, palId, 1);
}

// a dormer over every second axis of a front, ends left out
function dormers(K, pieces, depth, rnd, palId) {
  for (const l of pieces) {
    if (!l.spec || !l.info) continue;
    const e = l.e, f = face(e.B, e.A, e.nx, e.nz), surf = (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
    l.info.toks.forEach((tk, i) => { if (i % 2 === 0 && i > 0 && i < l.info.toks.length - 1) dormer(K, f, (tk.a + tk.b) / 2, 1.4, 1.5, 1.2, surf(1.2) - 0.25, 'ri.dorm', rnd(), palId, surf, RI.slate, RI.wall); });
  }
}

// the ring with the corner at P[k] cut by a chamfer of CH along each edge: [ring, a, b] (a and b the chamfer's two ends)
function chamfer(P, k) {
  const n = P.length, c = P[k], p = P[(k + n - 1) % n], q = P[(k + 1) % n], at = (v) => { const L = Math.hypot(v[0] - c[0], v[1] - c[1]); return [c[0] + ((v[0] - c[0]) * CH) / L, c[1] + ((v[1] - c[1]) * CH) / L]; };
  const a = at(p), b = at(q), out = P.slice(); out.splice(k, 1, a, b);
  return { ring: out, a, b };
}

// the hotel: the long north front on Strada Iosif Vulcan and the west wall on the pedestrian street carry the fronts, the turret stands
// on the chamfered corner between them (the ring's vertex 36, before the 100 m north front)
export function rimanoczy(ctx, b) {
  const P = ringOf(b.p), n = P.length, k = n - 2, { ring, a, b: bb } = chamfer(P, k), R = cleanRing(positive(ring), 0.6);
  const C = edgeBetween(R, a, bb), W = edgeBetween(R, P[k - 1], a), N = edgeBetween(R, bb, P[(k + 1) % n]);
  const spec = {
    name: 'Hotelul Rimanóczy', n: 3, gh: GH, sh: SH, styles: ['ri'], cols: [[RI.wall, RI.stone]], roof: RI.slate, cap: RI.slateCap, rise: 4.2, depth: 3.0, fall: 1.4, kind: 'public',
    tower: [C], dressTower: dressCorner, towerSpec: { style: 'ri', n: 3, gh: GH, sh: SH }, dress: dressRun,
    dressed: (i) => i === W || i === N, edges: { [W]: [DEF(4.2)], [N]: [DEF(4.2)] },
    after({ K, pieces, depth, rnd }) { // dormers on the mansard, then the turret: two tiers of steep slate, an oculus drum, a lantern, a bulb and a spire
      const palId = pieces.find((p) => p.spec)?.spec.pal ?? 0, He = Math.max(...pieces.filter((p) => p.spec).map((p) => p.He));
      dormers(K, pieces, depth, rnd, palId);
      const cx = (a[0] + bb[0]) / 2, cz = (a[1] + bb[1]) / 2, y0 = He + 0.1;
      const ux = (bb[0] - a[0]), uz = (bb[1] - a[1]), L = Math.hypot(ux, uz), inx = -uz / L, inz = ux / L;       // into the building, side unknown: pick the one inside the ring
      const inside = (x, z) => { let o = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++) if ((R[i][1] > z) !== (R[j][1] > z) && x < ((R[j][0] - R[i][0]) * (z - R[i][1])) / (R[j][1] - R[i][1]) + R[i][0]) o = !o; return o; };
      const s = inside(cx + inx * 2.5, cz + inz * 2.5) ? 1 : -1, tx = cx + inx * s * 2.4, tz = cz + inz * s * 2.4;
      cone(K.roof, tx, tz, y0, 4.2, 3.0, 2.6, RI.slate, 8, 0);                       // the lower tier
      K.det.setPart(DP.PAINT).setColor(RI.stone).cyl(tx, y0 + 2.5, tz, 3.2, 3.2, 0.22, 8, true);
      drum(K, tx, tz, 2.3, 8, y0 + 2.7, y0 + 4.5, 'ri.oc', rnd(), palId);            // the drum with an oculus on each facet
      K.det.setPart(DP.PAINT).setColor(RI.stone).cyl(tx, y0 + 4.48, tz, 2.6, 2.6, 0.22, 8, true);
      cone(K.roof, tx, tz, y0 + 4.6, 2.4, 1.1, 2.6, RI.slate, 8, 0);                 // the upper tier
      drum(K, tx, tz, 1.1, 8, y0 + 7.0, y0 + 8.1, 'ri.lant', rnd(), palId);
      K.det.setPart(DP.PAINT).setColor(RI.stone).cyl(tx, y0 + 8.08, tz, 1.25, 1.25, 0.18, 8, true);
      bulb(K.det, tx, tz, y0 + 8.26, 1.0, 2.0, '#8d979f');
    },
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: R, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}

// the baths block on the bridgehead: the west front on Strada Grigorescu and the south front on the river road, the chamfer between them
export function baths(ctx, b) {
  const P = ringOf(b.p), R = cleanRing(positive(P), 0.6);
  const S = edgeBetween(R, P[0], P[1]), C = edgeBetween(R, P[1], P[2]), W = edgeBetween(R, P[2], P[3]);
  const spec = {
    name: 'Băile Rimanóczy', n: 3, gh: GH, sh: SH, styles: ['ri'], cols: [[RI.wall, RI.stone]], roof: RI.slate, cap: RI.slateCap, rise: 4.0, depth: 3.0, fall: 1.4, kind: 'public',
    tower: [C], dressTower: dressCorner, towerSpec: { style: 'ri', n: 3, gh: GH, sh: SH }, dress: dressRun,
    dressed: (i) => i === S || i === W, edges: { [S]: [DEF(4.2)], [W]: [DEF(4.2)] },
    after({ K, pieces, depth, rnd }) { dormers(K, pieces, depth, rnd, pieces.find((p) => p.spec)?.spec.pal ?? 0); },
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: R, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}
