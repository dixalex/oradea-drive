// OWNER: oradea. Palatul Füchsl (Strada Independenței 11–13 at Strada Mihai Viteazul, OSM way 1534824825), not a site module: two
// buildings behind one facade, put up September 1902 – April 1903 for the wine merchants Arnold and Mór Füchsl by the Budapest
// architects Zoltán Bálint and Lajos Jámbor (builder Vilmos Rendes), one of Oradea's first Secession buildings. A ground floor of shops
// and two floors; a rounded corner with a conical tile roof and a lantern; curved gables with kidney-shaped attic windows on both fronts;
// a wavy cornice; vines with grapes and the «FT» monogram in peach relief on cream and taupe-pink. The tram runs along the east front.
//   FUCHSL_ID = 1534824825;  fuchsl(ctx, b) -> { footprint, top, floor, lots }   ctx as ../unirii-est/assemble.js's
// Sources: oradeaheritage.ro and hu.wikipedia (Füchsl-palota), arhitectura-1906.ro, Commons photographs (2013 and the 2023 restoration).
// The rounded corner is rebuilt as a smooth arc on the two fronts' lines (OSM draws three facets). A guess: the colours of the lilac-grey
// restored state read from the Commons photographs, the number of axes (five per front), the courtyard side.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { fillet, zwerch } from '../unirii-est/kit.js';
import { gable } from '../republicii/herokit.js';
import { face } from '../../../cherkasy/slabkit.js';
import { aq, dbox } from '../republicii/facade.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { DP } from '../../../materials.js';
import { dressRun } from './dress.js';
import { gableWave } from './paint.js';
import { edgeBetween, circumcentre, bulb, cone, drum } from './towers.js';
import { FU } from './cells-fuchsl.js';

export const FUCHSL_ID = 1534824825;
const { GH, SH } = FU, K_ARC = 9;
const MOULD = { plinth: '#8a7a70', band: '#e3d8cd', string: '#e2a479', cornice: '#6a7078', fascia: '#6a7078', depth: 0.5, bandOut: 0.1 };
const CELLS = { a: { g: 'fu.g', f: ['fu.f1', 'fu.f2'] }, W: { w: FU.WW, g: 'fu.gW', f: ['fu.f1W', 'fu.f2W'] }, M: { w: FU.TW, g: 'fu.gM', f: ['fu.fM'] } };
const FRONT = { layout: 'W a a M a a W', n: 3, gh: GH, sh: SH, cells: CELLS, mould: MOULD, gables: ['W'] };

// the OSM ring with its chamfered corner (F2..F5) replaced by an arc tangent to the two fronts' lines
export function fuchslRing(flat) {
  const P = ringOf(flat), [a, b, c, d] = [P[1], P[2], P[5], P[6]];
  const u = [b[0] - a[0], b[1] - a[1]], v = [d[0] - c[0], d[1] - c[1]], den = u[0] * v[1] - u[1] * v[0];
  const s = ((c[0] - a[0]) * v[1] - (c[1] - a[1]) * v[0]) / den, X = [a[0] + u[0] * s, a[1] + u[1] * s];
  const t = (Math.hypot(X[0] - b[0], X[1] - b[1]) + Math.hypot(X[0] - c[0], X[1] - c[1])) / 2;
  const lu = Math.hypot(...u), lv = Math.hypot(...v), turn = Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (lu * lv))));
  const arc = fillet(a, X, d, t / Math.tan(turn / 2), K_ARC);
  return { ring: [P[0], P[1], ...arc, P[6], P[7], P[8], P[9], P[10]], arc, a, d };
}

const towerDress = (facet) => function dressTowerFU(K, f, s0, s1, floorY, spec, rnd, l, e) {
  const j = facet.get(e.i), win = j % 3 === 1, palId = spec.pal, y1 = floorY + GH, y2 = y1 + SH, y3 = y2 + SH - 0.1;
  aq(K, f, s0, s1, floorY, y1, 0, 'fu.tg', rnd(), palId);
  aq(K, f, s0, s1, y1, y2, 0, win ? 'fu.t1' : 'fu.tw1', rnd(), palId);
  aq(K, f, s0, s1, y2, y3, 0, win ? 'fu.t2' : 'fu.tw2', rnd(), palId);
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', '#8a7a70', DP.CONC);
  dbox(K, f, s0, s1, y1 - 0.1, y1 + 0.22, 0, 0.1, 'ft', '#e3d8cd');
  dbox(K, f, s0, s1, y2 - 0.05, y2 + 0.05, 0, 0.05, 'f', '#e2a479');
  dbox(K, f, s0 - 0.01, s1 + 0.01, y3 - 0.58, y3 - 0.32, 0, 0.14, 'f', '#6a7078');
  dbox(K, f, s0 - 0.02, s1 + 0.02, y3 - 0.32, y3 - 0.05, 0, 0.5, 'fu', '#6a7078');
  dbox(K, f, s0 - 0.04, s1 + 0.04, y3 - 0.05, y3 + 0.14, 0, 0.62, 'ftu', '#6a7078');
  if (j >= 2 && j <= 6) { // a balcony on the first floor over the middle of the corner: a slab and an iron rail
    const yb = y1 + 0.02; dbox(K, f, s0, s1, yb - 0.22, yb + 0.02, 0, 0.75, 'ftu', '#e3d8cd');
    aq(K, f, s0, s1, yb + 0.02, yb + 0.98, 0.71, 'rail.F', 0.9, palId, 1);
  }
  if (j >= 3 && j <= 5) { // and a smaller one on the second floor over the middle
    dbox(K, f, s0, s1, y2 - 0.2, y2 + 0.02, 0, 0.55, 'ftu', '#e3d8cd');
    aq(K, f, s0, s1, y2 + 0.02, y2 + 0.98, 0.51, 'rail.F', 0.9, palId, 1);
  }
};

// b: the map_buildings.json entry ({ id, p, holes })
export function fuchsl(ctx, b) {
  const { ring, arc, a, d } = fuchslRing(b.p), R = cleanRing(positive(ring), 0.6), P = ringOf(b.p);
  const facet = new Map(); for (let j = 0; j < K_ARC; j++) facet.set(edgeBetween(R, arc[j], arc[j + 1]), j);
  const A = edgeBetween(R, P[1], arc[0]), B = edgeBetween(R, arc[K_ARC], P[6]), centre = circumcentre(arc[0], arc[K_ARC >> 1], arc[K_ARC]);
  const rad = Math.hypot(arc[0][0] - centre[0], arc[0][1] - centre[1]);
  const spec = {
    name: 'Palatul Füchsl', n: 3, gh: GH, sh: SH, styles: ['fu'], cols: [['#e3dccf', '#e7dccf']], roof: '#8a4333', cap: '#7a382b', rise: 3.8, depth: 3.0, fall: 1.4, kind: 'apt',
    tower: [...facet.keys()], dressTower: towerDress(facet), towerSpec: { style: 'fu', n: 3, gh: GH, sh: SH }, dress: dressRun,
    dressed: (i) => i === A || i === B, edges: { [A]: [FRONT], [B]: [FRONT] },
    after({ K, pieces, rnd }) {
      const palId = pieces.find((p) => p.spec)?.spec.pal ?? 0, He = Math.max(...pieces.filter((p) => p.spec).map((p) => p.He));
      for (const l of pieces) { // a curved gable over each wing bay
        const toks = l.info?.toks.filter((q) => q.t === 'W'); if (!toks?.length) continue;
        const e = l.e, f = face(e.B, e.A, e.nx, e.nz), depth = 3.0, surf = (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
        for (const tk of toks) {
          const sc = (tk.a + tk.b) / 2, w = 5.2, h = 4.4;
          gable(K, f, sc, l.He + 0.1, w, h, gableWave(w, h), 'fu.gable', rnd(), palId, 0.05);
          zwerch(K, f, sc, l.He + 0.1, w, h, surf, depth, '#8a4333');
        }
      }
      // the tower's cone of dark-red tile, the white lantern with its arches, a small galvanised bulb and a spire
      const [cx, cz] = centre, y0 = He + 0.1, h = 8.4;
      cone(K.roof, cx, cz, y0, rad + 0.35, 0.85, h, FU.roof, 18, 0);
      drum(K, cx, cz, 1.0, 8, y0 + h - 0.2, y0 + h + 2.0, 'fu.lant', rnd(), palId);
      K.det.setPart(DP.PAINT).setColor('#f1ece2').cyl(cx, y0 + h + 1.98, cz, 1.2, 1.2, 0.2, 8, true);
      bulb(K.det, cx, cz, y0 + h + 2.18, 1.0, 2.6, '#9aa3a8');
    },
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: R, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}
