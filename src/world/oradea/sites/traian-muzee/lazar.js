// OWNER: oradea. Casa Memorială Aurel Lazăr (Str. Aurel Lazăr 13; OSM way 421787845, 1,058 m2), not a site module: the lawyer Aurel Lazăr's
// house, where the Declaration of National Independence of the Romanians of Transylvania, Banat, Crișana and Maramureș was drawn up on
// 12 October 1918; a memorial museum since 1 December 2008. The OSM outline is the house with its wings and yard buildings: the house is
// the middle 21 m of the long front on the street (the museum node 2634651850 sits on it), two storeys with a pedimented entrance; the
// wings either side are one storey of blank wall, and the back is plain.
//   LAZAR_ID = 421787845;  lazar(ctx, b) -> { footprint, top, floor, lots }
// Sources: CIMEC ghidulmuzeelor (the museum), the OSM museum node. A guess: the whole look, the house's width, the wings' height.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { edgeBetween } from '../ferdinand-olosig/towers.js';
import { makeDress, pedimentHook } from './bays.js';
import { LA } from './cells-lazar.js';

export const LAZAR_ID = 421787845;
const M = { plinth: '#a09680', band: LA.trim, string: LA.trim, cornice: LA.trim, depth: 0.5, bandOut: 0.08 };
const C = { a: { g: 'la.g', f: ['la.f'] }, G: { g: 'la.gd', f: ['la.fb'], w: 4.0, bal: { j: 1, w: 2.2, rail: 'la.rail', out: 0.7 } } };
const WING = { axW: 3.5, n: 1, gh: LA.GH, sh: LA.SH, cells: { a: { g: 'la.p', f: [] } }, mould: { ...M, band: null, string: null } };
export function lazar(ctx, b) {
  const P = ringOf(b.p), R = cleanRing(positive(P), 0.6), E = edgeBetween(R, P[0], P[1]); // the long south front
  const spec = {
    name: 'Casa Memorială Aurel Lazăr', n: 2, gh: LA.GH, sh: LA.SH, styles: ['la'], cols: [[LA.wall, LA.trim]], roof: LA.roof, cap: '#4f4038', rise: 3.2, depth: 5.0, fall: 1.0, kind: 'public',
    dress: makeDress('la'), dressed: (i) => i === E,
    edges: { [E]: [{ ...WING, w: 14 }, { layout: 'a a G a a', w: 21, n: 2, gh: LA.GH, sh: LA.SH, cells: C, mould: M }, WING] },
    after: pedimentHook('la', { w: 5.0, h: 1.8, roof: LA.roof }),
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: P, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}
