// OWNER: oradea. Hotel Transilvania (opened in 1904 as the «Pannonia»; Piața Regele Ferdinand I / Strada Teatrului 2, OSM way 421787916),
// not a site module: the big neo-Renaissance hotel on the square's west side, built 1903–1904 to plans by József Guttman. Four storeys:
// a rusticated terracotta-red ground floor of round arches with a cream relief frieze over it, cream upper floors with red-framed
// arched windows between narrow red pilaster strips, paired small windows on the top floor, a white balustrade along the roof, a
// chamfered corner on the square with a balcony and a tall pedimented window. Its name is not drawn on the wall.
//   TRANSILVANIA_ID = 421787916;  transilvania(ctx, b) -> { footprint, top, floor, lots }   ctx as ../unirii-est/assemble.js's
// Sources: Wikimedia Commons (Hotel Transilvania, Hotel Pannonia, 2018 and older), the hotel's own history. The side and courtyard walls,
// the roof and the number of axes on each front (counted from the photographs: 8 on the east front, 10 on the south) are guesses.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { face } from '../../../cherkasy/slabkit.js';
import { aq, dbox } from '../republicii/facade.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { DP } from '../../../materials.js';
import { dressRun } from './dress.js';
import { edgeBetween } from './towers.js';
import { TR } from './cells-transilvania.js';

export const TRANSILVANIA_ID = 421787916;
const { GH, SH, AX, CW } = TR;
const CELLS = { a: { g: 'tr.g', f: ['tr.f1', 'tr.f2', 'tr.f3'] } };
const MOULD = { plinth: '#7a5a46', band: TR.trim, string: TR.trim, cornice: TR.trim, fascia: TR.red, depth: 0.78, bandOut: 0.16 };
const DEF = (axW) => ({ axW, n: 4, gh: GH, sh: SH, cells: CELLS, mould: MOULD });

function dressCorner(K, f, s0, s1, floorY, spec, rnd, l) {
  const palId = spec.pal, y1 = floorY + GH, y2 = y1 + SH, y3 = y2 + SH, y4 = y3 + SH, W = s1 - s0;
  aq(K, f, s0, s1, floorY, y1, 0, 'tr.cg', rnd(), palId); aq(K, f, s0, s1, y1, y2, 0, 'tr.c1', rnd(), palId);
  aq(K, f, s0, s1, y2, y3, 0, 'tr.c2', rnd(), palId); aq(K, f, s0, s1, y3, y4, 0, 'tr.c3', rnd(), palId);
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', '#7a5a46', DP.CONC);
  dbox(K, f, s0, s1, y1 - 0.1, y1 + 0.22, 0, 0.16, 'ft', TR.trim);
  for (const y of [y2, y3]) dbox(K, f, s0, s1, y - 0.06, y + 0.06, 0, 0.06, 'f', TR.trim);
  dbox(K, f, s0, s1, y4 - 0.58, y4 - 0.32, 0, 0.14, 'f', TR.red);
  dbox(K, f, s0 - 0.02, s1 + 0.02, y4 - 0.32, y4 - 0.05, 0, 0.6, 'fu', TR.trim);
  dbox(K, f, s0 - 0.04, s1 + 0.04, y4 - 0.05, y4 + 0.14, 0, 0.72, 'ftu', TR.trim);
  // the attic block over the corner: a plinth with an urn at each end, and the pilasters in relief
  dbox(K, f, s0 + 0.2, s1 - 0.2, y4 + 0.14, y4 + 1.6, 0.1, 0.55, 'ftulr', TR.trim);
  K.det.setPart(DP.PAINT).setColor(TR.trim);
  for (const s of [s0 + 0.7, s1 - 0.7]) { const p = [f.ax + f.ux * s + f.nx * 0.6, y4 + 1.6, f.az + f.uz * s + f.nz * 0.6]; K.det.cyl(p[0], p[1], p[2], 0.25, 0.32, 0.45, 8, true).cyl(p[0], p[1] + 0.45, p[2], 0.4, 0.12, 0.55, 8, true); }
  for (const s of [s0 + 0.04, s1 - 0.4]) dbox(K, f, s, s + 0.36, floorY + GH, y4 - 0.32, 0, 0.18, 'ftulr', TR.trim);
  const yb = y1 + 0.02, a = s0 + 0.7, b = s1 - 0.7;                 // the balcony of the corner window: a slab on corbels and an iron rail
  dbox(K, f, a, b, yb - 0.24, yb + 0.02, 0, 1.05, 'ftulr', TR.trim);
  for (const s of [a + 0.2, b - 0.2]) dbox(K, f, s - 0.12, s + 0.12, yb - 0.75, yb - 0.24, 0, 0.5, 'flrt', TR.trim);
  aq(K, f, a, b, yb + 0.02, yb + 0.98, 1.01, 'rail.D', 0.9, palId, 1);
}

// b: the map_buildings.json entry ({ id, p, holes })
export function transilvania(ctx, b) {
  const P = ringOf(b.p), R = cleanRing(positive(P), 0.6);
  const E = edgeBetween(R, P[8], P[9]), C = edgeBetween(R, P[9], P[10]), S = edgeBetween(R, P[10], P[0]), N1 = edgeBetween(R, P[7], P[8]), N2 = edgeBetween(R, P[1], P[2]);
  const spec = {
    name: 'Hotel Transilvania', n: 4, gh: GH, sh: SH, styles: ['tr'], cols: [['#e4d8bf', TR.trim]], roof: TR.roof, cap: '#6c3223', rise: 3.2, depth: 5.5, fall: 1.4, kind: 'public',
    tower: [C], dressTower: dressCorner, towerSpec: { style: 'tr', n: 4, gh: GH, sh: SH }, dress: dressRun,
    dressed: (i) => i === E || i === S || i === N1 || i === N2,
    edges: { [E]: [DEF(5.2)], [S]: [DEF(5.2)], [N1]: [DEF(5.2)], [N2]: [DEF(5.2)] },
    after({ K, pieces, rnd }) { // the balustrade along the roof with a dark red vase at each end of a front
      for (const l of pieces) {
        if (!l.spec) continue;
        const e = l.e, f = face(e.B, e.A, e.nx, e.nz), s0 = (1 - l.b) * e.L, s1 = (1 - l.a) * e.L, nb = Math.max(1, Math.round((s1 - s0) / 3));
        for (let k = 0; k < nb; k++) aq(K, f, s0 + ((s1 - s0) * k) / nb, s0 + ((s1 - s0) * (k + 1)) / nb, l.He + 0.14, l.He + 1.24, 0.3, 'tr.bal', rnd(), l.spec.pal, 1);
        K.det.setPart(DP.PAINT).setColor(TR.redD);
        for (const s of [s0 + 0.3, s1 - 0.3]) { const p = [f.ax + f.ux * s + f.nx * 0.3, l.He + 0.14, f.az + f.uz * s + f.nz * 0.3]; K.det.cyl(p[0], p[1], p[2], 0.22, 0.28, 0.5, 6, true).cyl(p[0], p[1] + 0.5, p[2], 0.34, 0.1, 0.6, 6, true); }
      }
    },
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: R, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}
