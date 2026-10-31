// OWNER: oradea. Casa Poynár (Piața Regele Ferdinand 1 / Strada Nicolae Grigorescu 6), not a site module: the Secession corner house of
// the Poynár family, built 1907–1911 by Ferenc Sztarill (the heritage file says 1907–1911, the Hungarian and Romanian Wikipedia pages
// April–November 1907). Ground floor with mezzanine for shops, two upper floors, a round corner tower with iron balconies, a drum and a
// bulbous verdigris cupola, two curved pediments with round windows, a slate roof. OSM 6481083 is a multipolygon for the whole wedge
// between the bridgehead roundabout and Strada Grigorescu; the house is the tip where Calea Republicii starts, the rest of the wedge
// is drawn as a plain neighbour block.
//   POYNAR_ID = 6481083;  poynar(ctx, b) -> { footprints: [house, neighbours], top, floor, lots }   ctx as ../unirii-est/assemble.js's
// Sources: oradeaheritage.ro (Casa Poynár), arhitectura-1906.ro, visitoradea.com (Calea Republicii opens with it), Commons photographs
// of 2013 and 2022. A guess: the plot (a 22 x 28 m wedge cut off the OSM ring at its tip), the heights, the side walls, the rest of the wedge.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { fillet, zwerch } from '../unirii-est/kit.js';
import { gable } from '../republicii/herokit.js';
import { face, at } from '../../../cherkasy/slabkit.js';
import { aq, dbox } from '../republicii/facade.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { DP } from '../../../materials.js';
import { dressRun } from './dress.js';
import { gableWave } from './paint.js';
import { PT } from './cells-poynar.js';
import { bulb, edgeBetween, tipOf, circumcentre, drum } from './towers.js';

export const POYNAR_ID = 6481083;
const R_TOWER = 3.6, K_ARC = 6, FRONT_E = 28, WEST_S = 0.4, TIP_HINT = [62.3, -198.7];

// the house: the tip of the wedge cut off with the tower arc, and the rest of the wedge. The cut runs from C on the east front (FRONT_E
// from the tip) to D on the west edge, so no corner of the house is sharper than ~60 degrees (the roof's inset ring needs that).
export function poynarParts(flat) {
  const R = positive(ringOf(flat)), n = R.length, k = tipOf(R, TIP_HINT), tip = R[k], pv = R[(k + n - 1) % n], nx = R[(k + 1) % n];
  const d = (p) => Math.hypot(p[0] - tip[0], p[1] - tip[1]);
  const sqNext = d(pv) < d(nx), ks = sqNext ? (k + n - 1) % n : (k + 1) % n;       // the shorter edge is the front on the square
  const sqEnd = R[ks], eEnd = sqNext ? nx : pv, far = R[sqNext ? (ks + n - 1) % n : (ks + 1) % n];
  const L = d(eEnd), C = [tip[0] + ((eEnd[0] - tip[0]) * FRONT_E) / L, tip[1] + ((eEnd[1] - tip[1]) * FRONT_E) / L];
  const D = [sqEnd[0] + (far[0] - sqEnd[0]) * WEST_S, sqEnd[1] + (far[1] - sqEnd[1]) * WEST_S];
  const arc = fillet(sqEnd, tip, C, R_TOWER, K_ARC);
  const rest = R.map((p, i) => (i === k ? C : i === ks ? D : p));
  return { house: [D, sqEnd, ...arc, C], arc, sqEnd, cut: C, D, tip, rest };
}

const GH = PT.GH, SH = 4.0;
const AX = (g, f, extra) => ({ g, f, ...extra });
const CELLS = { a: AX('pt.g', ['pt.f1', 'pt.f2']), R: AX('pt.g', ['pt.f1', 'pt.f2R']), G: AX('pt.g', ['pt.f1b', 'pt.f2'], { bal: { j: 1, w: 2.2, rail: 'rail.PB', out: 0.75 } }),
  H: AX('pt.g', ['pt.f1', 'pt.f2']) };
const MOULD = { plinth: '#8a7a5a', band: PT.trim, string: PT.trim, cornice: PT.trim, depth: 0.5, bandOut: 0.12 };

// one facet of the round tower: shop window, a window on the first and second floor on every third facet, an iron balcony round
const towerDress = (facet) => function dressTowerPT(K, f, s0, s1, floorY, spec, rnd, l, e) {
  const j = facet.get(e.i), win = j >= 1 && j <= 4, palId = spec.pal, y1 = floorY + GH, y2 = y1 + SH, y3 = y2 + SH;
  aq(K, f, s0, s1, floorY, y1, 0, 'pt.tg', rnd(), palId);
  aq(K, f, s0, s1, y1, y2, 0, win ? 'pt.t1' : 'pt.tw1', rnd(), palId);
  aq(K, f, s0, s1, y2, y3, 0, win ? 'pt.t2' : 'pt.tw2', rnd(), palId);
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', '#8a7a5a', DP.CONC);
  dbox(K, f, s0, s1, y1 - 0.1, y1 + 0.22, 0, 0.14, 'ft', PT.trim);
  dbox(K, f, s0, s1, y2 - 0.06, y2 + 0.06, 0, 0.07, 'f', PT.trim);
  dbox(K, f, s0 - 0.01, s1 + 0.01, y3 - 0.58, y3 - 0.32, 0, 0.14, 'f', PT.trim);
  dbox(K, f, s0 - 0.02, s1 + 0.02, y3 - 0.32, y3 - 0.05, 0, 0.5, 'fu', PT.trim);
  dbox(K, f, s0 - 0.04, s1 + 0.04, y3 - 0.05, y3 + 0.14, 0, 0.62, 'ftu', PT.trim);
  // the balcony of the first floor runs all round the tower, the one above it only over the middle three facets
  const yb = y1 + 0.02;
  dbox(K, f, s0, s1, yb - 0.22, yb + 0.02, 0, 0.85, 'ftu', PT.trim);
  aq(K, f, s0, s1, yb + 0.02, yb + 0.98, 0.81, 'rail.PB1', 0.9, palId, 1);
  if (j >= 2 && j <= 3) {
    dbox(K, f, s0, s1, y2 - 0.2, y2 + 0.02, 0, 0.65, 'ftu', PT.trim);
    aq(K, f, s0, s1, y2 + 0.02, y2 + 0.98, 0.61, 'rail.PB1', 0.9, palId, 1);
  }
};

function houseSpec(Rh, P) {
  const iSq = edgeBetween(Rh, P.sqEnd, P.arc[0]), iE = edgeBetween(Rh, P.arc[K_ARC], P.cut);
  const facet = new Map(); for (let j = 0; j < K_ARC; j++) facet.set(edgeBetween(Rh, P.arc[j], P.arc[j + 1]), j);
  const centre = circumcentre(P.arc[0], P.arc[K_ARC >> 1], P.arc[K_ARC]);
  return {
    name: 'Casa Poynár', n: 3, gh: GH, sh: SH, styles: ['pt'], cols: [[PT.wall, PT.trim]], roof: PT.slate, cap: PT.slateCap, rise: 4.6, depth: 5.2, fall: 1.4,
    kind: 'apt', tower: [...facet.keys()], dressTower: towerDress(facet), dress: dressRun, towerSpec: { style: 'pt', n: 3, gh: GH, sh: SH },
    dressed: (i) => i === iSq || i === iE,
    edges: {
      [iSq]: [{ layout: 'a R G', n: 3, gh: GH, sh: SH, cells: CELLS, mould: MOULD, gable: { tok: 'G', cell: 'pt.gA', w: 6.0, h: 5.0 } }],
      [iE]: [{ layout: 'a H a a', n: 3, gh: GH, sh: SH, cells: CELLS, mould: MOULD, gable: { tok: 'H', cell: 'pt.gB', w: 6.8, h: 5.6 } }],
    },
    after({ K, E, R, Ro, Hcap, depth, pieces, rnd }) {
      const palId = pieces.find((p) => p.spec)?.spec.pal ?? 0;
      for (const l of pieces) {
        const gd = l.def?.gable, tk = gd && l.info?.toks.find((q) => q.t === gd.tok); if (!tk) continue;
        const e = l.e, f = face(e.B, e.A, e.nx, e.nz), sc = (tk.a + tk.b) / 2, y0 = l.He + 0.1, surf = (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
        gable(K, f, sc, y0, gd.w, gd.h, gableWave(gd.w, gd.h), gd.cell, rnd(), palId, 0.05);
        zwerch(K, f, sc, y0, gd.w, gd.h, surf, depth, PT.slate);
      }
      // the cupola: a drum of niches between half-columns on the roof, the bulb on it, a spire
      const [cx, cz] = centre, y0 = Hcap - 1.0;
      drum(K, cx, cz, 1.7, 12, y0, y0 + 2.5, 'pt.drum', rnd(), palId);
      K.det.setPart(DP.PAINT).setColor(PT.trim).cyl(cx, y0 + 2.48, cz, 2.0, 2.0, 0.22, 12, true);
      bulb(K.det, cx, cz, y0 + 2.7, 1.9, 5.6, PT.dome);
    },
  };
}

const NEIGH = { n: 3, styles: ['pt'], cols: [['#e3d5b2', '#f1ead8']], roof: '#8f4a38', rise: 4.2, depth: 6.0, fall: 1.4, kind: 'apt', dressed: () => false };

// b: the map_buildings.json entry ({ id, p, holes })
export function poynar(ctx, b) {
  const P = poynarParts(b.p), Rh = cleanRing(positive(P.house), 0.6);
  const house = assembleBuilding(ctx, { id: b.id, ring: Rh, holes: [], spec: houseSpec(Rh, P) });
  const rest = assembleBuilding(ctx, { id: b.id, ring: P.rest, holes: (b.holes ?? []).map(ringOf), spec: { ...NEIGH, name: null } });
  return { footprints: [house.footprint, rest.footprint], top: house.top, floor: house.floor, lots: house.lots + rest.lots };
}
