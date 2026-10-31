// OWNER: oradea. Muzeul Memorial Ady Endre (Parcul Traian 1; the real footprint is Overture 3000011176, 241 m2; OSM tags the museum
// on way 1534596467, a point-like outline that is not in map_buildings.json), not a site module: the small pavilion of the former
// «Müller» café in the park, the museum since 26 May 1955, renewed 2019–2020. The building's date is disputed (1869, or a wooden kiosk
// of 1896), so no date is shown. One tall storey of cream render under a hipped roof; a pedimented entrance bay on the longest front.
//   ADY_ID = 3000011176;  ady(ctx, b) -> { footprint, top, floor, lots }   ctx as ../unirii-est/assemble.js's
// Sources: visitoradea.com (Ady Endre Museum), MTC / Crisia (Mariann Szamos 2022), explorecarpathia.eu. A guess: all of the look (colour,
// window shape and rhythm, the pediment, the roof) from the museum's public photographs; the sides and the back follow the same axes.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { zwerch } from '../unirii-est/kit.js';
import { gable } from '../republicii/herokit.js';
import { face } from '../../../cherkasy/slabkit.js';
import { aq, dbox } from '../republicii/facade.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { edgeBetween } from '../ferdinand-olosig/towers.js';
import { dressRun } from '../ferdinand-olosig/dress.js';
import { MA } from './cells-ady.js';

export const ADY_ID = 3000011176;
const M = { plinth: '#a89a7c', band: null, string: null, cornice: MA.trim, depth: 0.5 };
const C = { a: { g: 'ma.g' }, G: { g: 'ma.gd', w: 3.9 } };
const SHORT = { layout: 'p', n: 1, gh: MA.GH, sh: 3.9, cells: { p: { g: 'ma.p' } }, mould: M };
// a wall run under 3.2 m is a blank pier (a window cell squeezed into it would look wrong); the others go through the run dresser
const dress = (K, f, s0, s1, floorY, spec, rnd, l) => { if (s1 - s0 < 3.2) l.def = SHORT; dressRun(K, f, s0, s1, floorY, spec, rnd, l); };
const SPEC = {
  name: 'Muzeul Memorial Ady Endre', n: 1, gh: MA.GH, sh: 3.9, styles: ['ma'], cols: [[MA.wall, MA.trim]], roof: MA.roof, cap: '#463c36', rise: 3.1, depth: 4.4, fall: 1.0,
  kind: 'public', allPublic: true, dress, dressed: (i, e) => e.L >= 2,
  sideLot: { axW: MA.AX, n: 1, gh: MA.GH, sh: 3.9, cells: C, mould: M },
  after({ K, pieces, depth, rnd }) { // the pediment over the entrance bay, with its roof behind, and the steps
    for (const l of pieces) {
      const tks = l.info?.toks.filter((q) => q.t === 'G') ?? []; if (!tks.length) continue;
      const e = l.e, f = face(e.B, e.A, e.nx, e.nz), surf = (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
      for (const tk of tks) {
        const sc = (tk.a + tk.b) / 2, w = 4.6, h = 1.7;
        gable(K, f, sc, l.He + 0.1, w, h, [[0, 0], [w, 0], [w / 2, h]], 'ma.pedi', rnd(), l.spec.pal, 0.05);
        zwerch(K, f, sc, l.He + 0.1, w, h, surf, depth, MA.roof);
        dbox(K, f, sc - 1.9, sc + 1.9, l.floor - 0.5, l.floor - 0.02, 0, 1.0, 'ftulr', '#cfc6b2');
        dbox(K, f, sc - 2.2, sc + 2.2, l.floor - 1.0, l.floor - 0.5, 0, 1.6, 'ftulr', '#c4baa4');
      }
    }
  },
};
export function ady(ctx, b) {
  const P = ringOf(b.p), R = cleanRing(positive(P), 0.6), E = edgeBetween(R, P[4], P[5]); // the east front, the one the Ady statue stands before
  const spec = { ...SPEC, edges: E >= 0 ? { [E]: [{ layout: 'a G a', n: 1, gh: MA.GH, sh: 3.9, cells: C, mould: M }] } : undefined, lots: E >= 0 ? undefined : [{ layout: 'a a G a a', n: 1, gh: MA.GH, sh: 3.9, cells: C, mould: M }] };
  const out = assembleBuilding(ctx, { id: b.id, ring: P, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}
