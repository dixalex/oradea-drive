// OWNER: oradea. Vila Okányi-Schwartz (the Bihor Chamber of Commerce and Industry since 2014; Str. Mihai Eminescu 25A; OSM way 423358089),
// not a site module: built in 1912 by Marcell Komor and Dezső Jakab for Jakab Schwarz, builder Ferenc Sztarill; sold in 1918, Bihoreana's
// in 1924, the Chamber's from 1925. A two-storey Secession villa on a stepped outline: pale yellow render, ochre bands, green sashes,
// arched ground-floor windows, a hipped roof and a curved gable over the entrance bay on the street side.
//   OKANYI_ID = 423358089;  okanyi(ctx, b) -> { footprint, top, floor, lots }
// Sources: oradeaheritage.ro (camera-de-comert-si-industrie-bihor: history only). A guess: the whole look, which stepped edge carries the
// entrance, the roof.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { edgeBetween } from '../ferdinand-olosig/towers.js';
import { gableWave } from '../ferdinand-olosig/paint.js';
import { makeDress, pedimentHook } from './bays.js';
import { OK } from './cells-okanyi.js';

export const OKANYI_ID = 423358089;
const M = { plinth: '#9a8c64', band: OK.trim, string: OK.trim, cornice: OK.trim, depth: 0.5, bandOut: 0.1 };
const C = { a: { g: 'ok.g', f: ['ok.f'] }, G: { g: 'ok.gd', f: ['ok.fb'], w: 3.8, bal: { j: 1, w: 2.0, rail: 'ok.rail', out: 0.7 } } };
export function okanyi(ctx, b) {
  const P = ringOf(b.p), R = cleanRing(positive(P), 0.6), F = edgeBetween(R, P[10], P[0]); // the 8.9 m edge toward Eminescu
  const side = { axW: 3.4, n: 2, gh: OK.GH, sh: OK.SH, cells: C, mould: M };
  const spec = {
    name: 'Vila Okányi-Schwartz', n: 2, gh: OK.GH, sh: OK.SH, styles: ['ok'], cols: [[OK.wall, OK.trim]], roof: OK.roof, cap: '#463a33', rise: 3.6, depth: 4.6, fall: 1.2, kind: 'public',
    dress: makeDress('ok'), dressed: (i, e) => e.L >= 3.2, allPublic: true,
    edges: F >= 0 ? { [F]: [{ layout: 'a G a', n: 2, gh: OK.GH, sh: OK.SH, cells: C, mould: M }] } : undefined, sideLot: side,
    after: pedimentHook('ok', { w: 4.8, h: 2.1, roof: OK.roof, outline: gableWave }),
  };
  const out = assembleBuilding(ctx, { id: b.id, ring: P, holes: (b.holes ?? []).map(ringOf), spec });
  return { footprint: out.footprint, top: out.top, floor: out.floor, lots: out.lots };
}
