// OWNER: oradea. Casa Deutsch (Str. Vasile Alecsandri 4, OSM way 1141044041), not a site module: the street front of the Deutsch glass
// and porcelain shop, 1900s (the city's heritage file gives the shop as built before 1909–1910; of the 1888 corner house only this
// front is the point): two storeys, sky-blue render under white folk-floral Secession relief, round-arched upper windows with
// trilobed casings, shop windows and a double door below, a top edge of three scalloped arcs (the middle one over two bays) with grey stone finials and a heart-shaped oculus under its peak. The front is one painted picture (cells-deutsch.js) cut along that top edge; the rest of the block is a plain box.
//   DEUTSCH_ID = 1141044041;  deutsch(ctx, b) -> { footprint, top, floor, lots }
// Sources: oradeaheritage.ro (Magazinul de sticlărie Deutsch K. Ignác), visitoradea.com, Wikimedia Commons photographs of 2021. The
// block behind the front is a guess (plain, flat-roofed).
import { MB } from '../../../../kit/mesh.js';
import { face, at } from '../../../cherkasy/slabkit.js';
import { gable } from '../republicii/herokit.js';
import { dbox, plainWall } from '../republicii/facade.js';
import { cleanRing, positive, ringOf } from '../republicii/ring.js';
import { nearOnLine } from '../republicii/ring.js';
import { DP } from '../../../materials.js';
import { DD, deutschTop } from './cells-deutsch.js';
import { AXIS } from './axis.js';

export const DEUTSCH_ID = 1141044041;
const STONE = '#9a9992';

export function deutsch(ctx, b) {
  const { K, rnd, g, S, pal } = ctx, R = cleanRing(positive(ringOf(b.p))), n = R.length;
  const gAt = (x, z) => { const h = g(x, z); return Number.isFinite(h) ? h : 2; };
  // the front: the edge whose outward side looks at the street axis from the least distance
  let fi = 0, best = Infinity;
  R.forEach((A, i) => {
    const B = R[(i + 1) % n], L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 6) return;
    const nx = (B[1] - A[1]) / L, nz = -(B[0] - A[0]) / L, d = nearOnLine(AXIS, (A[0] + B[0]) / 2 + nx * 3, (A[1] + B[1]) / 2 + nz * 3).d;
    if (d < best) { best = d; fi = i; }
  });
  const A = R[fi], B = R[(fi + 1) % n], L = Math.hypot(B[0] - A[0], B[1] - A[1]), nx = (B[1] - A[1]) / L, nz = -(B[0] - A[0]) / L;
  const f = face(B, A, nx, nz), floor = Math.max(gAt(A[0], A[1]), gAt(B[0], B[1]), gAt((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)) + 0.14;
  const base = Math.min(...R.map((p) => gAt(p[0], p[1])));
  const palId = pal.idx('#d9d4c6', '#efece4');
  // ---- the front: the painted picture cut along the scalloped top edge
  const top = deutschTop(8), W = f.L, sx = W / DD.W;
  const outline = [[0, 0], [W, 0], ...top.slice().reverse().map(([x, y]) => [x * sx, y])];
  gable(K, f, W / 2, floor, W, DD.H, outline, 'dd.face', 0.2, palId, 0.03);
  // plinth, the floor band, the coping along the top edge, the finials
  dbox(K, f, 0, W, floor - 1.1, floor + DD.PLINTH, 0, 0.08, 'ft', DD.granite, DP.CONC);
  dbox(K, f, 0, W, floor + DD.GROUND - 0.05, floor + DD.GROUND + 0.3, 0, 0.16, 'ftu', '#eae7de');
  const D = K.det; D.setPart(DP.CONC).setColor(STONE);
  for (let i = 0; i + 1 < top.length; i++) { const p = at(f, top[i][0] * sx, floor + top[i][1] + 0.05, 0.1), q = at(f, top[i + 1][0] * sx, floor + top[i + 1][1] + 0.05, 0.1); D.tube(p, q, 0.075, 5); }
  for (let i = 1; i < DD.TX.length - 1; i++) {
    const x = DD.TX[i], y = DD.TV[i], p = at(f, x * sx, floor + y, 0.12);
    D.setColor(STONE).cyl(p[0], p[1], p[2], 0.17, 0.11, 0.9, 4, true).cyl(p[0], p[1] + 0.9, p[2], 0.22, 0.13, 0.12, 4, true).cyl(p[0], p[1] + 1.0, p[2], 0.1, 0.0, 0.7, 4, false);
  }
  // ---- the rest of the block: plain walls, a flat roof
  const Hback = floor + 8.4;
  R.forEach((P, i) => {
    if (i === fi) return;
    const Q = R[(i + 1) % n], l = Math.hypot(Q[0] - P[0], Q[1] - P[1]); if (l < 0.6) return;
    const px = (Q[1] - P[1]) / l, pz = -(Q[0] - P[0]) / l, ff = face(Q, P, px, pz);
    plainWall(K, ff, 0, l, base - 1.4, Hback, palId, rnd());
  });
  D.setPart(DP.PAINT).setColor('#6e6a64'); D.fill(R, [], Hback, true);
  S.prism(R.flat(), base - 1.5, Hback, 0, 0, 'wall', 0);
  return { footprint: { poly: R, h: floor + DD.H - base, kind: 'apt', name: 'Casa Deutsch', id: b.id }, top: floor + DD.H, floor: base, lots: 1 };
}
