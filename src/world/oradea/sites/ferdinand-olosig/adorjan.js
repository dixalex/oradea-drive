// OWNER: oradea. Casele Adorján I and II (Strada Patrioților 4–6 at Strada Moscovei, Olosig; OSM ways 421787914 and 489773508), not a
// site module: two apartment houses for the lawyer and businessman Emil Adorján, designed by Marcell Komor and Dezső Jakab (builder
// Ferenc Sztarill): I in 1902–1903 (a dusty-pink ground floor under pale grey-cream upper floors, three curved gables on a terracotta
// hipped roof), II in 1904–1905 (grey, three floors behind a wavy parapet). Both are covered in cream stucco frames and wavy bands.
//   ADORJAN1_ID = 421787914, ADORJAN2_ID = 489773508;  adorjan1(ctx, b), adorjan2(ctx, b) -> { footprint, top, floor, lots }
// Sources: oradeaheritage.ro, arhitectura-1906.ro, Wikimedia Commons (Adorjan House I and II, 2013), the thehistoriantraveller.com
// notes (I pink, II grey with a heart-shaped window). A guess: the exact axis counts, the roofs behind the fronts, the yard sides.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { zwerch } from '../unirii-est/kit.js';
import { gable } from '../republicii/herokit.js';
import { face } from '../../../cherkasy/slabkit.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { dressRun } from './dress.js';
import { gableWave, waveTop } from './paint.js';
import { edgeBetween } from './towers.js';
import { AD } from './cells-adorjan.js';

export const ADORJAN1_ID = 421787914, ADORJAN2_ID = 489773508;

const M1 = { plinth: '#8a6a5c', band: AD.orn, string: AD.orn, cornice: AD.orn, depth: 0.45, bandOut: 0.1 };
const M2 = { plinth: '#6e6c68', band: AD.ornG, string: AD.ornG, cornice: AD.ornG, depth: 0.35, bandOut: 0.1 };
const C1 = { a: { g: 'ad.g1', f: ['ad.f1', 'ad.f2'] }, b: { g: 'ad.g1b', f: ['ad.f1', 'ad.f2'] }, G: { g: 'ad.g1', f: ['ad.f1', 'ad.f2'], bal: { j: 1, w: 2.0, rail: 'rail.A', out: 0.7 } } };
const C2 = { a: { g: 'ad2.g', f: ['ad2.f1', 'ad2.f2'] }, b: { g: 'ad2.gb', f: ['ad2.f1', 'ad2.f2'] }, B: { g: 'ad2.g', f: ['ad2.f1', 'ad2.f2'], bal: { j: 1, w: 2.4, rail: 'rail.A', out: 0.75 } } };

// b: the map_buildings.json entry ({ id, p, holes })
export function adorjan1(ctx, b) {
  const P = ringOf(b.p), R = cleanRing(positive(P), 0.6);
  const N = edgeBetween(R, P[0], P[1]), E = edgeBetween(R, P[1], P[2]);
  const spec = {
    name: 'Casa Adorján I', n: 3, gh: AD.GH1, sh: AD.SH1, styles: ['ad'], cols: [[AD.upper, AD.orn]], roof: AD.roof, cap: '#9b4228', rise: 5.4, depth: 5.8, fall: 1.4, kind: 'apt',
    dress: dressRun, dressed: (i) => i === N || i === E,
    edges: { [N]: [{ layout: 'a G b a b G a', n: 3, gh: AD.GH1, sh: AD.SH1, cells: C1, mould: M1, gable: { tok: 'G', cell: 'ad.gable', w: 5.4, h: 4.2 } }], [E]: [{ layout: 'a b G a', n: 3, gh: AD.GH1, sh: AD.SH1, cells: C1, mould: M1, gable: { tok: 'G', cell: 'ad.gable', w: 5.4, h: 4.2 } }] },
    after({ K, pieces, depth, rnd }) { // curved gables with an oval relief: two on the north front, one on the east front
      for (const l of pieces) {
        const gd = l.def?.gable, tks = gd ? (l.info?.toks.filter((q) => q.t === gd.tok) ?? []) : []; if (!tks.length) continue;
        const e = l.e, f = face(e.B, e.A, e.nx, e.nz), surf = (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
        for (const tk of tks) { const sc = (tk.a + tk.b) / 2; gable(K, f, sc, l.He + 0.1, gd.w, gd.h, gableWave(gd.w, gd.h), gd.cell, rnd(), l.spec.pal, 0.05); zwerch(K, f, sc, l.He + 0.1, gd.w, gd.h, surf, depth, AD.roof); }
      }
    },
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: R, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}

export function adorjan2(ctx, b) {
  const P = ringOf(b.p), R = cleanRing(positive(P), 0.6);
  const E = edgeBetween(R, P[1], P[2]), S = edgeBetween(R, P[2], P[3]);
  const spec = {
    name: 'Casa Adorján II', n: 3, gh: AD.GH2, sh: AD.SH2, styles: ['ad2'], cols: [[AD.grey, AD.ornG]], roof: AD.roofG, cap: '#505356', rise: 2.6, depth: 5.0, fall: 1.4, kind: 'apt',
    dress: dressRun, dressed: (i) => i === E || i === S,
    edges: { [E]: [{ layout: 'a b B a b a a', n: 3, gh: AD.GH2, sh: AD.SH2, cells: C2, mould: M2, waves: 4 }], [S]: [{ axW: 4.3, alt: 'b', n: 3, gh: AD.GH2, sh: AD.SH2, cells: C2, mould: M2, waves: 2 }] },
    after({ K, pieces, depth, rnd }) { // the wavy parapet: one picture per section along the front
      for (const l of pieces) {
        const nw = l.def?.waves; if (!nw || !l.spec) continue;
        const e = l.e, f = face(e.B, e.A, e.nx, e.nz), s0 = (1 - l.b) * e.L, w = ((1 - l.a) * e.L - s0) / nw, h = 1.9;
        for (let k = 0; k < nw; k++) gable(K, f, s0 + w * (k + 0.5), l.He + 0.1, w, h, waveTop(w, 0.9, 0.9, 2), 'ad2.wave', rnd(), l.spec.pal, 0.08);
      }
    },
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: R, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}
