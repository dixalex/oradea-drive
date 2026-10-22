// OWNER: oradea. Universitatea Emanuel din Oradea, Str. Nufărului 87 (OSM way 264915540) (not a site module).
//   buildEmanuel(ctx, kit) -> { res, skip }
// The baptist university's main building, from the photographs: five storeys of terracotta-brown brick with white string courses and
// white vertical strips round the stair bays, a dark steep roof whose eave carries a zig-zag of small gabled dormers, and big gables
// with round windows at the wing ends; the lit foyer sits at the south end. The L plan has a long wing along the motorway and a short
// wing to the south-west; the roof is gabled over the long wing and hipped over the short one.
import { DP } from '../../../materials.js';
import { IDS } from './data.js';
import { obox, edgeFrame, pilasters } from './dress.js';

const BRICK = '#b8683f', WHITE = '#f1ece1', ROOF = '#4d4540', ROOF2 = '#463f3a';

export function buildEmanuel(ctx, kit) {
  const { D } = ctx;
  const spec = {
    id: IDS.EMANUEL, name: 'Universitatea Emanuel', n: 5, gh: 3.8, sh: 3.4, wall: BRICK, stone: null, bay: 3.0, winW: 0.42, winH: 0.58, lintel: 0, trim: WHITE, cornice: 0.34, belt: true, beltCol: WHITE,
    roof: { col: ROOF, col2: ROOF2, pitch: 0.62, ov: 0.6, maxRise: 5.5, wallCol: BRICK }, gables: (r) => r.hl > 15, chimneys: 1, gain: 1.04,
    dormers: { step: 4.5, w: 1.5, h: 1.6, col: WHITE, roof: ROOF },
    door: { e: 'long', s: 0.5, w: 2.8, kind: 'canopy' },
  };
  const res = kit.block(spec);
  if (!res) return null;
  const { fl, He, E, rects, yR } = res;
  // white strips: a pair of pilasters at every fifth bay on the two longest fronts
  const long = [...E].sort((a, b) => b.L - a.L).slice(0, 2);
  for (const e of long) {
    const ef = edgeFrame(e.A, e.B), nb = Math.max(1, Math.round(ef.L / 3.0)), bw = ef.L / nb, s = [];
    for (let i = 2; i < nb - 1; i += 5) s.push((i + 0.5) * bw);
    pilasters(D, ef, { s, w: 1.1, o: 0.12, y0: fl + 0.2, y1: He, col: WHITE });
    obox(D, ef, 0, ef.L, 0, 0.1, fl + 3.8 + 3.4 * 2 - 0.12, fl + 3.8 + 3.4 * 2 + 0.1, WHITE);
  }
  // round windows in the end gables
  rects.forEach((r, i) => {
    if (r.hl <= 15) return;
    for (const sg of [-1, 1]) {
      const x = r.cx + r.ux * (r.hl + 0.03) * sg, z = r.cz + r.uz * (r.hl + 0.03) * sg, nx = r.ux * sg, nz = r.uz * sg, y = He + (yR[i] - He) * 0.42, rr = 0.8;
      const ex = -nz, ez = nx, pts = (q) => Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return [x + ex * Math.cos(a) * q + nx * 0.05, y + Math.sin(a) * q, z + ez * Math.cos(a) * q + nz * 0.05]; });
      D.setPart(DP.PAINT).setColor(WHITE).face(pts(rr + 0.18), [nx, 0, nz]);
      D.setPart(DP.GLASS).setColor('#242c33').face(pts(rr).map((p) => [p[0] + nx * 0.02, p[1], p[2] + nz * 0.02]), [nx, 0, nz]);
    }
  });
  return { res, skip: [IDS.EMANUEL] };
}
