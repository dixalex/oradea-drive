// OWNER: oradea. Liceul Greco-Catolic «Iuliu Maniu» (OSM way 1374968255), not a site module: the Greek Catholic lyceum built in 1925
// to the plans of Anton Szallerbeck in the neo-Romanian style, on Str. Iuliu Maniu with a front on the square's south side: cream
// render, round-arched windows with ochre archivolts, a crest of ogee arches along the eaves, dark-brown canopies over the doors, a
// round corner tower with the bishop's shield under a low brown tiled cone, brown tiled roofs.
//   LYCEUM_ID = 1374968255;  lyceum(ctx, b) -> { footprint, top, floor, lots }
// Sources: Wikimedia Commons photographs of the lyceum (2013, from the corner of the tower), OSM. The tower's place (the north-east
// corner, at the square), the number of axes, the west side and the roof forms are guesses read from the corner photographs.
import { assembleBuilding } from './assemble.js';
import { face, at } from '../../../cherkasy/slabkit.js';
import { aq, dbox } from '../republicii/facade.js';
import { facets } from '../republicii/herokit.js';
import { ringOf } from '../republicii/ring.js';
import { DP } from '../../../materials.js';
import { LY } from './cells-lyceum.js';

export const LYCEUM_ID = 1374968255;
const GH = 4.4, SH = 3.9, AXW = 4.4, TRIM = LY.trim, TOWER_R = 3.3;

const tokens = (def, L) => (def.layout ? def.layout.split(' ') : Array(Math.max(1, Math.round(L / AXW))).fill('a'));

function dressLy(K, f, s0, s1, floorY, spec, rnd, l) {
  const palId = spec.pal, n = spec.n, He = floorY + GH + (n - 1) * SH, L = s1 - s0, toks = tokens(l.def ?? {}, L), aw = L / toks.length;
  toks.forEach((t, i) => {
    const a = s0 + i * aw, b = a + aw;
    aq(K, f, a, b, floorY, floorY + GH, 0, t === 'D' ? 'ly.gd' : 'ly.g', rnd(), palId);
    for (let j = 1; j < n; j++) aq(K, f, a, b, floorY + GH + (j - 1) * SH, floorY + GH + j * SH, 0, j === n - 1 ? 'ly.t' : 'ly.f', rnd(), palId);
    aq(K, f, a, b, He + 0.1, He + 1.6, 0.02, 'ly.crest', rnd(), palId);
    if (t === 'D') dbox(K, f, a + 0.3, b - 0.3, floorY + 3.15, floorY + 3.3, 0, 1.5, 'ftulr', LY.cap);        // a canopy over the door
  });
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', '#9d947d', DP.CONC);
  dbox(K, f, s0 - 0.02, s1 + 0.02, floorY + GH - 0.08, floorY + GH + 0.1, 0, 0.14, 'ft', LY.ochre);
  dbox(K, f, s0 - 0.04, s1 + 0.04, He - 0.3, He + 0.1, 0, 0.5, 'ftu', LY.ochre);
}

const SPEC = {
  name: 'Liceul Greco-Catolic «Iuliu Maniu»', n: 3, styles: ['ly'], cols: [[LY.wall, TRIM]], roof: LY.roof, rise: 4.2, depth: 7.0, fall: 1.4, cap: '#76402e',
  allPublic: true, kind: 'public', dress: dressLy, sideLot: { n: 3 },
  after({ K, E, R, pieces, rnd, gAt }) {
    // the round corner tower on the north-east corner: the ring's vertex with the smallest z + x sum... chosen by its position
    const i = R.reduce((m, p, k) => (p[0] - p[1] * 0.4 > R[m][0] - R[m][1] * 0.4 ? k : m), 0);
    const P = R[i], pr = R[(i + R.length - 1) % R.length], nx = R[(i + 1) % R.length];
    const u1 = [P[0] - pr[0], P[1] - pr[1]], u2 = [nx[0] - P[0], nx[1] - P[1]], l1 = Math.hypot(...u1), l2 = Math.hypot(...u2);
    // inward bisector
    const bx = -(u1[0] / l1) + u2[0] / l2, bz = -(u1[1] / l1) + u2[1] / l2, bl = Math.hypot(bx, bz) || 1;
    const out = [P[0] - (bx / bl) * 0, P[1] - (bz / bl) * 0];
    const cx = out[0] + (bx / bl) * 0.6, cz = out[1] + (bz / bl) * 0.6;
    const floor = Math.max(gAt(cx, cz), ...pieces.filter((p) => p.spec).map((p) => p.floor).slice(0, 1));
    const palId = pieces.find((p) => p.spec).spec.pal, y0 = floor - 0.6, n = 14;
    facets(K, cx, cz, TOWER_R, n, 0.3, y0, y0 + GH + 0.6, 'ly.tw0', 0.3, palId);
    facets(K, cx, cz, TOWER_R, n, 0.3, y0 + GH + 0.6, y0 + GH + 0.6 + SH, 'ly.tw1', 0.5, palId);
    facets(K, cx, cz, TOWER_R, n, 0.3, y0 + GH + 0.6 + SH, y0 + GH + 0.6 + 2 * SH, 'ly.tw2', 0.2, palId);
    facets(K, cx, cz, TOWER_R, n, 0.3, y0 + GH + 0.6 + 2 * SH, y0 + GH + 0.6 + 3 * SH, 'ly.tw3', 0.7, palId);
    const D = K.det, yt = y0 + GH + 0.6 + 3 * SH;
    D.setPart(DP.PAINT).setColor(LY.roof).cyl(cx, y0 + GH + 0.6 + 0.15, cz, TOWER_R + 1.0, TOWER_R + 0.12, 0.6, 14, true);   // the tiled canopy a storey up the tower
    D.setPart(DP.PAINT).setColor(LY.ochre).cyl(cx, yt - 0.05, cz, TOWER_R + 0.35, TOWER_R + 0.35, 0.4, 14, true);
    D.setPart(DP.PAINT).setColor(LY.roof).cyl(cx, yt + 0.3, cz, TOWER_R + 0.7, 0.3, 2.2, 14, true);
    D.setPart(DP.GALV).setColor('#b9a46a').cyl(cx, yt + 2.4, cz, 0.18, 0.1, 0.6, 8, true);
    D.setPart(DP.STEEL).setColor('#3a3d40').cyl(cx, yt + 2.9, cz, 0.04, 0.04, 1.2, 4, false);
  },
};
export function lyceum(ctx, b) { return assembleBuilding(ctx, { id: b.id, ring: ringOf(b.p), holes: (b.holes ?? []).map(ringOf), spec: SPEC }); }
