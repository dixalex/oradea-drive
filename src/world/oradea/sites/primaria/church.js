// OWNER: oradea. Biserica Romano-Catolică «Sfântul Ladislau» (OSM way 264917565), Piața Unirii, Oradea: the Baroque
// church of 1720–1733 as it stands today (Commons photos of 2021): a pale-yellow, white-pilastered nave 16 m wide whose
// west front rises in two concave shoulders to a single 7 m square tower (door, round clock, a belfry with a louvred
// arch and a clock under an eight-sided green helm with its lantern and cross), tall arched windows on the long sides,
// a lower chancel and a shallow three-sided apse at the east end, a pale-green plinth, a grey standing-seam roof.
//   buildChurch({ B, S, H, r, wash }) -> { footprints, ridge: {...}, parts }   B = newSet() builders (kit.js), S the
//   collision world, H heightAt, r the rng, wash the floodlight list (map metres) the wall shader reads
// Local frame: s along the nave from the front (west), t across (+t south); toMap(s, t) -> [x, z].
import { face } from '../../../cherkasy/slabkit.js';
import { gable } from '../../../cherkasy/bayatlas.js';
import { M4 } from '../../../../kit/mesh.js';
import { at, quad, rect, box, poly2, windowA, slopeSolid, roofPoly, clockOn, COL } from './kit.js';

export const CHURCH_ID = 264917565;
const O = [-35.8, -14.55], UA = Math.atan2(-0.2236, 0.9747), U = [Math.cos(UA), Math.sin(UA)], V = [-U[1], U[0]];
export const toMap = (s, t) => [O[0] + U[0] * s + V[0] * t, O[1] + U[1] * s + V[1] * t];
export const churchLocal = { toMap, U, V, O, yaw: UA };
// heights above the floor F
const PLINTH = 1.15, EAVE = 11.0, RISE = 5.6, CH_EAVE = 9.0, CH_RISE = 4.0;
const PLAN = [[0, -8.1], [19.7, -8.1], [19.7, -5.8], [30, -5.8], [33, -2.6], [32.8, 3.5], [30, 6.1], [19.7, 6.1], [19.7, 8.1], [0, 8.1]];
const T = { s1: 7.0, hw: 3.5, yC: 17.6, yB: 24.0, yT: 31.0, cx: 3.5 };       // tower: depth, half width, cornice heights

// a wall face between two plan points with its normal away from `inside`; s runs to the viewer's right
function mkFace(a, b, inside = toMap(14, 0)) {
  const P = toMap(...a), Q = toMap(...b), ex = Q[0] - P[0], ez = Q[1] - P[1], L = Math.hypot(ex, ez);
  let nx = ez / L, nz = -ex / L;
  if ((P[0] + ex / 2 - inside[0]) * nx + (P[1] + ez / 2 - inside[1]) * nz < 0) { nx = -nx; nz = -nz; }
  const [A, Bq] = ex * nz - ez * nx > 0 ? [P, Q] : [Q, P];
  return face(A, Bq, nx, nz);
}

export function buildChurch({ B, S, H, r, wash }) {
  const ring = PLAN.map(([s, t]) => toMap(s, t));
  const hs = [...ring, toMap(14, 0), toMap(-1, 0), toMap(35, 0)].map(([x, z]) => H(x, z));
  const F = Math.max(...hs.slice(0, ring.length)) + 0.12, gLo = Math.min(...hs) - 0.4, Y = (h) => F + h;
  const W = B.wall, UVM = [1, 1];

  // ---------------------------------------------------------------- walls, plinth, cornice
  const faces = PLAN.map((a, k) => ({ a, b: PLAN[(k + 1) % PLAN.length], k })).filter(({ a, b }) => Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.5)
    .map((q) => ({ ...q, f: mkFace(q.a, q.b), top: q.k >= 2 && q.k <= 6 ? CH_EAVE : EAVE }));
  const front = faces.find((q) => q.k === 9).f;
  for (const { f, k, top } of faces) {
    if (k !== 9) { W.setColor(COL.cream); rect(W, f, 0, f.L, gLo, Y(top), 0, UVM); }
    B.stone.setColor('#b8c4b2'); box(B.stone, f, 0, f.L, gLo, Y(PLINTH), 0, 0.07, 'ft', [1.2, 1.2]);
    W.setColor(COL.white); box(W, f, -0.28, f.L + 0.28, Y(top - 0.62), Y(top), 0, 0.34, 'ftlr', UVM);
  }
  // the front: the nave's end with its two concave shoulders rising to the tower, in one polygon
  {
    const sh = [[15.9, 12.0], [14.7, 12.6], [13.7, 13.8], [12.8, 15.3], [12.1, 16.6], [11.6, T.yC]];
    const poly = [[0, gLo], [16.2, gLo], [16.2, Y(11.8)], ...sh.map(([s, y]) => [s, Y(y)]), ...sh.map(([s, y]) => [16.2 - s, Y(y)]).reverse(), [0, Y(11.8)]];
    W.setColor(COL.cream); poly2(W, front, poly, [], 0, 1);
    // the shoulders' edge: a thin white moulding riding the curve
    W.setColor(COL.white);
    for (let i = 0; i + 1 < sh.length; i++) for (const m of [0, 1]) {
      const a = m ? [16.2 - sh[i][0], sh[i][1]] : sh[i], b = m ? [16.2 - sh[i + 1][0], sh[i + 1][1]] : sh[i + 1];
      quad(W, at(front, a[0], Y(a[1]) - 0.42, 0.05), at(front, b[0], Y(b[1]) - 0.42, 0.05), at(front, b[0], Y(b[1]), 0.05), at(front, a[0], Y(a[1]), 0.05), front.N);
    }
    // pilasters: the corners, and one either side of the tower
    for (const [s0, s1, top] of [[0, 0.75, 11.7], [15.45, 16.2, 11.7], [3.85, 4.6, 14.0], [11.6, 12.35, 14.0]]) {
      box(W, front, s0, s1, Y(PLINTH), Y(top), 0, 0.16, 'ftlr', UVM);
      box(W, front, s0 - 0.08, s1 + 0.08, Y(top), Y(top + 0.3), 0, 0.24, 'ftlr', UVM);
    }
    // the door under a white surround, a lintel and two steps
    const sd = 8.1;
    B.det.setColor('#4d3123'); rect(B.det, front, sd - 1.0, sd + 1.0, F, Y(3.3), 0.05);
    W.setColor(COL.white);
    box(W, front, sd - 1.3, sd - 1.0, F, Y(3.7), 0, 0.16, 'ftlr', UVM); box(W, front, sd + 1.0, sd + 1.3, F, Y(3.7), 0, 0.16, 'ftlr', UVM);
    box(W, front, sd - 1.45, sd + 1.45, Y(3.3), Y(3.8), 0, 0.22, 'ftlru', UVM);
    B.stone.setColor('#b8c4b2'); box(B.stone, front, sd - 1.7, sd + 1.7, gLo, F + 0.02, 0.07, 0.65, 'ftlr', [1.2, 1.2]);
    B.det.setColor('#d8d2c0'); for (let i = 0; i < 6; i++) box(B.det, front, sd - 1.0 + i * 0.36, sd - 0.78 + i * 0.36, Y(3.85), Y(4.1), 0.06, 0.12, 'f');   // the zig-zag frieze, as blocks
    // the panel above and the round clock in it
    W.setColor('#f3e9c2'); box(W, front, sd - 1.5, sd + 1.5, Y(5.0), Y(10.9), 0, 0.05, 'f', UVM);
    clockOn({ wall: W, sign: B.sign }, front, sd, Y(9.2), 2.1, 2);
    wash.push(at(front, sd - 5, Y(0.8), 5.5), at(front, sd + 5, Y(0.8), 5.5));
  }

  // ---------------------------------------------------------------- the long sides: pilasters, three arched windows a side
  for (const { f, k, top } of faces) {
    const nave = k === 0 || k === 8;
    if (nave) {
      for (const s of [0.35, f.L - 0.35, 6.57, 13.13]) {
        W.setColor(COL.white); box(W, f, s - 0.4, s + 0.4, Y(PLINTH), Y(top - 0.6), 0, 0.16, 'ftlr', UVM);
        box(W, f, s - 0.48, s + 0.48, Y(top - 1.2), Y(top - 0.6), 0, 0.22, 'ftlr', UVM);
      }
      for (const s of [3.3, 9.85, 16.4]) windowA(B, f, { s, y0: Y(5.6), w: 1.7, h: 3.4, rise: 0.85, sur: 0.2, sill: true, glass: '#7e8e98' });
      for (const s of [3.3, 9.85, 16.4]) windowA(B, f, { s, y0: Y(2.0), w: 0.9, h: 1.0, rise: 0.4, sur: 0.12, glass: '#6f7f8a' });
      wash.push(at(f, f.L / 2, Y(0.6), 5));
    } else if (k === 2 || k === 6) {
      windowA(B, f, { s: f.L / 2, y0: Y(3.6), w: 1.5, h: 3.0, rise: 0.75, sur: 0.2, sill: true, glass: '#7e8e98' });
      for (const s of [0.3, f.L - 0.3]) { W.setColor(COL.white); box(W, f, s - 0.35, s + 0.35, Y(PLINTH), Y(top - 0.6), 0, 0.15, 'ftlr', UVM); }
    } else if (k === 3 || k === 5 || k === 4) {
      windowA(B, f, { s: f.L / 2, y0: Y(3.6), w: k === 4 ? 1.8 : 1.0, h: 3.0, rise: k === 4 ? 0.9 : 0.5, sur: 0.18, sill: true, glass: '#7e8e98' });
    }
  }

  // ---------------------------------------------------------------- roofs: the nave gabled, the chancel two slopes ending in a half hip
  const p3 = ([x, z], y) => [x, y, z];
  gable(B.roof, W, [toMap(0.3, -8.1), toMap(19.7, -8.1), toMap(19.7, 8.1), toMap(0.3, 8.1)], Y(EAVE), RISE, COL.sheet, COL.cream, 0.4);
  const yR = Y(CH_EAVE + CH_RISE), yE = Y(CH_EAVE) - 0.15, tM = 0.15;
  B.roof.setColor(COL.sheet);
  roofPoly(B.roof, [p3(toMap(19.7, -5.95), yE), p3(toMap(30, -5.95), yE), p3(toMap(30, tM), yR), p3(toMap(19.7, tM), yR)], 2);
  roofPoly(B.roof, [p3(toMap(30, 6.25), yE), p3(toMap(19.7, 6.25), yE), p3(toMap(19.7, tM), yR), p3(toMap(30, tM), yR)], 2);
  {
    const apex = p3(toMap(30, tM), yR), ap = APSE_PTS().map(([s, t]) => p3(toMap(s + (s > 30 ? 0.12 : 0), t * 1.02), yE));
    for (let i = 0; i + 1 < ap.length; i++) roofPoly(B.roof, [ap[i], ap[i + 1], apex], 2);
  }

  // ---------------------------------------------------------------- the tower: shaft, belfry, clocks, helm, cross
  const tf = [mkFace([0, -T.hw], [0, T.hw], toMap(T.cx, 0)), mkFace([T.s1, T.hw], [T.s1, -T.hw], toMap(T.cx, 0)), mkFace([0, T.hw], [T.s1, T.hw], toMap(T.cx, 0)), mkFace([T.s1, -T.hw], [0, -T.hw], toMap(T.cx, 0))];
  const ty = toMap(T.cx, 0), mTower = M4(O[0], 0, O[1], -UA);
  W.setColor(COL.cream);
  W.with(mTower, (q) => {
    q.box(0.0, Y(EAVE), -T.hw, T.s1, Y(T.yC), T.hw, 1 | 4 | 16 | 32);               // lower shaft: no front (the polygon is there), no base
    q.box(0.0, Y(T.yC), -T.hw, T.s1, Y(T.yT + 0.85), T.hw, 1 | 2 | 4 | 16 | 32);     // upper shaft: all four sides and the deck under the helm
  });
  W.setColor(COL.white);
  for (const f of tf) {
    // corner strips, cornices at the shaft's three levels, the belfry arch under a clock
    for (const s of [0.28, f.L - 0.28]) box(W, f, s - 0.28, s + 0.28, Y(T.yC), Y(T.yT), 0, 0.14, 'ftlr', UVM);
    box(W, f, -0.3, f.L + 0.3, Y(T.yC - 0.5), Y(T.yC + 0.15), 0, 0.42, 'ftlru', UVM);
    box(W, f, -0.3, f.L + 0.3, Y(T.yB - 0.3), Y(T.yB + 0.35), 0, 0.4, 'ftlru', UVM);
    box(W, f, -0.45, f.L + 0.45, Y(T.yT), Y(T.yT + 0.85), 0, 0.62, 'ftlru', UVM);
    W.setColor('#f1e6bd'); box(W, f, 1.1, f.L - 1.1, Y(T.yC + 1.2), Y(T.yB - 1.0), 0, 0.06, 'f', UVM); W.setColor(COL.white);
    windowA(B, f, { s: f.L / 2, y0: Y(T.yB + 1.0), w: 1.5, h: 2.3, rise: 0.75, sur: 0.2, sill: true, glass: '#27403a' });
    clockOn({ wall: W, sign: B.sign }, f, f.L / 2, Y(T.yT - 1.55 + (f === tf[0] ? 0 : 0)), 2.0, 2);
  }
  // the helm: an octagonal bell, a lantern, a ball and a cross
  const helm = [[4.4, T.yT + 0.85], [4.4, T.yT + 1.4], [3.35, T.yT + 2.1], [3.0, T.yT + 3.4], [3.1, T.yT + 4.2], [2.2, T.yT + 5.1], [1.5, T.yT + 6.5], [1.25, T.yT + 7.3]];
  B.det.setColor(COL.helm);
  B.det.with(mTower, (q) => {
    q.lathe(helm.map(([rr, h]) => [rr, Y(h)]), 8, T.cx, 0);
    q.setColor('#2b3f39'); q.cyl(T.cx, Y(T.yT + 7.3), 0, 1.05, 1.05, 1.8, 8); // lantern drum
    q.setColor(COL.helm); q.lathe([[1.35, Y(T.yT + 9.1)], [1.05, Y(T.yT + 9.3)], [0.5, Y(T.yT + 10.0)], [0.2, Y(T.yT + 10.6)]], 8, T.cx, 0);
    q.setColor(COL.gold); q.ellipsoid([T.cx, Y(T.yT + 10.85), 0], [0.28, 0.28, 0.28], 8, 5);
    q.box(T.cx - 0.05, Y(T.yT + 11.0), -0.05, T.cx + 0.05, Y(T.yT + 12.7), 0.05, 63); q.box(T.cx - 0.05, Y(T.yT + 11.9), -0.4, T.cx + 0.05, Y(T.yT + 12.0), 0.4, 63);
  });

  // ---------------------------------------------------------------- colliders
  const prismRing = (pts, y1) => S.prism(pts.flat(), gLo, y1);
  const nave = [toMap(0, -8.1), toMap(19.7, -8.1), toMap(19.7, 8.1), toMap(0, 8.1)];
  prismRing(nave, Y(EAVE));
  prismRing([toMap(19.7, -5.8), toMap(30, -5.8), toMap(33, -2.6), toMap(32.8, 3.5), toMap(30, 6.1), toMap(19.7, 6.1)], Y(CH_EAVE));
  const k = RISE / 8.1, kc = CH_RISE / 5.95;
  slopeSolid(S, [toMap(0.3, -8.1), toMap(19.7, -8.1), toMap(19.7, 0), toMap(0.3, 0)], Y(EAVE - 0.3), p3(toMap(0.3, -8.1), Y(EAVE)), V, k);
  slopeSolid(S, [toMap(0.3, 8.1), toMap(19.7, 8.1), toMap(19.7, 0), toMap(0.3, 0)], Y(EAVE - 0.3), p3(toMap(0.3, 8.1), Y(EAVE)), [-V[0], -V[1]], k);
  slopeSolid(S, [toMap(19.7, -5.8), toMap(30, -5.8), toMap(30, 0.15), toMap(19.7, 0.15)], Y(CH_EAVE - 0.3), p3(toMap(19.7, -5.8), Y(CH_EAVE)), V, kc);
  slopeSolid(S, [toMap(19.7, 6.1), toMap(30, 6.1), toMap(30, 0.15), toMap(19.7, 0.15)], Y(CH_EAVE - 0.3), p3(toMap(19.7, 6.1), Y(CH_EAVE)), [-V[0], -V[1]], kc);
  S.obox(ty[0], ty[1], T.s1 / 2, T.hw, UA, Y(EAVE), Y(T.yT + 0.85), 'tower');
  S.cyl(ty[0], ty[1], Y(T.yT + 0.85), Y(T.yT + 8.2), 4.0, 1.3, 'roof');
  S.cyl(ty[0], ty[1], Y(T.yT + 8.2), Y(T.yT + 12.7), 1.05, 0.3, 'roof');

  const footprints = [{ poly: ring, h: Y(T.yT + 12.7) - gLo, kind: 'church', name: 'Biserica Sfântul Ladislau', id: CHURCH_ID }];
  return { footprints, F, gLo, top: Y(T.yT + 12.7) };
}

function APSE_PTS() { return [[30, -5.8], [33, -2.6], [32.8, 3.5], [30, 6.1]]; }
