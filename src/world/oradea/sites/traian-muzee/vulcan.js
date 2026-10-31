// OWNER: oradea. Muzeul Memorial Iosif Vulcan (Str. Iosif Vulcan 14; OSM way 421787868, a 3,035 m2 block of 48 vertices), not a site module:
// the house where Iosif Vulcan (1841–1907), the editor of «Familia» (where Eminescu first published, from 1865 in Pest and from 1880 in
// Oradea), lived; now a memorial museum. The block is not one building: the museum house is cut out of the street front and modelled, the
// rest of the block is drawn plainly (one storey of blank walls and a low roof) from the same ring, under the house.
//   VULCAN_ID = 421787868;  VULCAN_HOUSE = { c: [x, z], u: [ux, uz], w, d }  the house's frame (centre of its street front, along the
//   street, width, depth) ;  vulcan(ctx, b) -> { footprints: [rest, house], lots }
// Sources: ro.wikipedia (Familia), MTC / visitoradea.com (the memorial museums), the OSM museum node 2634651998. A guess: the house's
// outline (a 16 x 11 m rectangle at the OSM node), its whole look, and the plain remainder.
import { assembleBuilding } from '../unirii-est/assemble.js';
import { cleanRing, positive, ringOf, inside } from '../republicii/ring.js';
import { edgeBetween } from '../ferdinand-olosig/towers.js';
import { makeDress, pedimentHook } from './bays.js';
import { VU } from './cells-vulcan.js';

export const VULCAN_ID = 421787868;
export const VULCAN_NODE = [257.9, -243];           // OSM node 2634651998, the museum
const M = { plinth: '#a89a74', band: VU.trim, string: VU.trim, cornice: VU.trim, depth: 0.5, bandOut: 0.08 };
const C = { a: { g: 'vu.g', f: ['vu.f'] }, G: { g: 'vu.gd', f: ['vu.fb'], w: 4.0, bal: { j: 1, w: 2.2, rail: 'vu.rail', out: 0.7 } } };
const HOUSE = {
  name: 'Muzeul Memorial Iosif Vulcan', n: 2, gh: VU.GH, sh: VU.SH, styles: ['vu'], cols: [[VU.wall, VU.trim]], roof: VU.roof, cap: '#5b3a2c', rise: 3.4, depth: 5.2, fall: 1.2,
  kind: 'public', dress: makeDress('vu'),
  after: pedimentHook('vu', { w: 5.2, h: 1.9, roof: VU.roof }),
};
const REST = { name: undefined, n: 1, gh: 4.6, sh: 3.9, styles: ['vu'], cols: [[VU.wall, VU.trim]], roof: '#7a5a48', cap: '#4a3d35', rise: 0.02, depth: 0.05, fall: 1.0, kind: 'public', dressed: () => false }; // a flat top: the 48-vertex ring does not take a deep roof inset

// the house rectangle: the street edge of P nearest the museum node, the house centred on the node's foot, set back 0.15 m in front of the block's wall
export function houseFrame(P, node = VULCAN_NODE, w = 16, d = 11.5) {
  let best = null;
  P.forEach((a, i) => {
    const b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 10) return;
    const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, t = (node[0] - a[0]) * ux + (node[1] - a[1]) * uz, dist = Math.abs((node[0] - a[0]) * uz - (node[1] - a[1]) * ux);
    if (t > 0 && t < L && (!best || dist < best.dist)) best = { a, ux, uz, L, t, dist };
  });
  if (!best) return null;
  let nx = -best.uz, nz = best.ux; if ((node[0] - best.a[0]) * nx + (node[1] - best.a[1]) * nz < 0) { nx = -nx; nz = -nz; } // inward
  const s0 = Math.max(0.5, best.t - w / 2), s1 = Math.min(best.L - 0.5, best.t + w / 2);
  for (let dd = d; dd >= 6; dd -= 0.5) {
    const at = (s, o) => [best.a[0] + best.ux * s + nx * o, best.a[1] + best.uz * s + nz * o];
    const ring = [at(s0, -0.15), at(s1, -0.15), at(s1, dd), at(s0, dd)];
    if (ring.every((p, k) => k < 2 || inside(P, p[0], p[1]))) return { ring, c: at((s0 + s1) / 2, -0.15), u: [best.ux, best.uz], w: s1 - s0, d: dd, front: [ring[0], ring[1]] };
  }
  return null;
}

export function vulcan(ctx, b) {
  const P = ringOf(b.p), holes = (b.holes ?? []).map(ringOf), H = houseFrame(P), out = [];
  const rest = assembleBuilding(ctx, { id: b.id, ring: P, holes, spec: REST });
  out.push({ ...rest.footprint, name: undefined });
  let lots = rest.lots;
  if (H) {
    const R = cleanRing(positive(H.ring), 0.6), E = edgeBetween(R, H.front[0], H.front[1]);
    const spec = { ...HOUSE, dressed: (i) => i === E, edges: { [E]: [{ layout: 'a a G a a', n: 2, gh: VU.GH, sh: VU.SH, cells: C, mould: M }] } };
    const house = assembleBuilding(ctx, { id: b.id, ring: H.ring, holes: [], spec });
    out.push(house.footprint); lots += house.lots;
  }
  return { footprints: out, lots };
}
