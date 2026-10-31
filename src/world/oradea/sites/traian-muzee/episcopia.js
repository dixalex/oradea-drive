// OWNER: oradea. Palatul Episcopiei Ortodoxe (Str. Roman Ciorogariu; OSM way 1525803455, the «Colecția Muzeală a Episcopiei Ortodoxe»), not a
// site module: built in 1905 by Kálmán Rimanóczy Jr as a family villa, the Orthodox Church's since 1921. Two storeys and a hipped roof, a
// Venetian-style front on the street (the 38 m edge) of warm cream render and red brick, with a first-floor loggia window of three arches
// over the entrance, brick-framed arched windows either side.
//   EPISCOPIA_ID = 1525803455;  episcopia(ctx, b) -> { footprint, top, floor, lots }
// Sources: the task card (1905, Rimanóczy Jr, the Venetian front, three arches on the first floor, Orthodox since 1921), the OSM outline.
// A guess: the colours, the axis count, the sides and the back.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { edgeBetween } from '../ferdinand-olosig/towers.js';
import { makeDress } from './bays.js';
import { EP } from './cells-episcopia.js';

export const EPISCOPIA_ID = 1525803455;
const M = { plinth: '#9a4f36', band: EP.accent, string: EP.accent, cornice: EP.trim, depth: 0.55, bandOut: 0.1 };
const C = { a: { g: 'ep.g', f: ['ep.f'] }, T: { g: 'ep.gd', f: ['ep.f3'], w: 5.2, bal: { j: 1, w: 3.8, rail: 'ep.rail', out: 0.8 } } };
export function episcopia(ctx, b) {
  const P = ringOf(b.p), R = cleanRing(positive(P), 0.6), F = edgeBetween(R, P[5], P[6]);
  const side = { axW: 4.2, n: 2, gh: EP.GH, sh: EP.SH, cells: C, mould: M };
  const spec = {
    name: 'Palatul Episcopiei Ortodoxe', n: 2, gh: EP.GH, sh: EP.SH, styles: ['ep'], cols: [[EP.wall, EP.trim]], roof: EP.roof, cap: '#6e3626', rise: 3.8, depth: 5.6, fall: 1.2, kind: 'public',
    dress: makeDress('ep'), dressed: (i, e) => e.L >= 3.2, allPublic: true,
    edges: F >= 0 ? { [F]: [{ layout: 'a a a a T a a a a', n: 2, gh: EP.GH, sh: EP.SH, cells: C, mould: M }] } : undefined, sideLot: side,
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: P, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}
