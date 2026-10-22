// OWNER: oradea. Primăria Oradea (the City Hall, OSM relation 6481078; built 1902–1903 to the plans of Kálmán Rimanóczy
// Jr., opened 10 January 1904; its roof burned in 1944) with the Turnul Primăriei (OSM 1207602388), Piața Unirii.
// An eclectic Renaissance palace: a cream rendered block of three storeys round a courtyard – a rusticated ground floor
// on a red granite plinth, the piano nobile with pedimented windows over balustraded sills, the upper floor with paired
// arched windows between pilasters – under a balustrade and a dark copper mansard with round dormers; on the square the
// pavilion with its six giant Corinthian columns (portico.js), on the river street the 50 m clock tower (tower.js).
//   buildHall({ B, S, H, r, wash }) -> { footprints, F, top }
//     B = newSet() builders (kit.js; B.tile takes the painted bays of tiles.js), S the collision world, H heightAt,
//     r the rng, wash the floodlight list the wall shaders read (map metres [x, y, z])
// Plan frame (a, b): origin Q, a runs WSW along the south front, b north along the square front; toMap(a, b) -> [x, z].
import { area2 } from '../../../cherkasy/geo.js';
import { at, quad, rect, box, roofPoly, windowA, edgeNormals, edgeFace, ringInset, ringSimple, ringSimplify, COL } from './kit.js';
import { bayCol, bayUV, WT } from './tiles.js';
import { buildPortico } from './portico.js';
import { buildTower } from './tower.js';
import { toMap, toLocal, EA, EB, Y_PL, Y_TOP, Y_COR, Y_BAL, PAV_UP, ROOF, TOWER } from './frame.js';

export const HALL_ID = 6481078, TOWER_ID = 1207602388;
export { toMap, toLocal };

// the OSM outline in the plan frame (a, b), to the centimetre: the pavilion is the notch at a = -7.8 (edges 11 – 13)
const PLAN = [[73.54, 48.90], [51.66, 50.23], [51.47, 66.26], [52.73, 68.64], [66.38, 77.51], [62.55, 87.07], [43.95, 74.90], [42.23, 71.48], [41.45, 64.68],
  [40.38, 49.57], [2.09, 50.20], [1.67, 37.01], [-7.81, 37.42], [-7.86, 15.35], [0.00, 15.26], [0.00, 0.00], [77.95, -0.10], [77.78, 13.78], [60.71, 14.04],
  [60.42, 10.67], [50.33, 11.04], [51.10, 37.62], [61.58, 36.94], [61.65, 32.94], [74.75, 32.50]];
const PAV_FRONT = 12;
// the roof plan: the same without the pavilion, which has its own roof
const ROOFPLAN = [...PLAN.slice(0, 12), [0.3, 37.0], ...PLAN.slice(14)];
// the courtyard, as OSM draws it (a, b)
const HOLE_AB = [[30.9, 38.2], [30.6, 36.4], [29.1, 36.6], [28.7, 32.1], [37.8, 31.3], [37.7, 21.0], [39.3, 20.6], [38.7, 14.6], [30.3, 14.8], [29.9, 11.7],
  [16.9, 12.2], [17.0, 18.2], [21.5, 17.9], [24.1, 20.8], [24.6, 29.9], [22.5, 31.8], [19.4, 32.9], [20.1, 35.8], [17.9, 37.1], [18.3, 38.7]];

export const HALL_PAL = { cream: COL.creamPale, bay: '#ead9a8' };

const RING = PLAN.map(([a, b]) => toMap(a, b));
const HOLE = ringSimplify(HOLE_AB.map(([a, b]) => toMap(a, b)), 0.7, 1.4);
const eachSeg = (ring, fn) => ring.forEach((p, i) => fn(p, ring[(i + 1) % ring.length], i));

export function buildHall({ B, S, H, r, wash }) {
  // the floor: the mean ground round the building, a little over
  let sum = 0, cnt = 0;
  eachSeg(RING, (p, q) => { for (let t = 0; t < 1; t += 0.25) { sum += H(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t); cnt++; } });
  const F = Math.round((sum / cnt + 0.3) * 10) / 10, Y = (h) => F + h;
  const gOf = (f, s0 = 0, s1 = f.L, o = 0.5) => { let g = 1e9; for (let i = 0; i <= 8; i++) { const p = at(f, s0 + (s1 - s0) * i / 8, 0, o); g = Math.min(g, H(p[0], p[2])); } return g; };
  const ctx = { B, S, H, r, wash, F, Y, toMap, gOf };

  // ---------------------------------------------------------------- walls
  const faces = [];
  const tl = toLocal(...TOWER.c);
  const addRing = (ring, hole) => {
    const N = edgeNormals(ring, hole);
    ring.forEach((p, k) => {
      const q = ring[(k + 1) % ring.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (L < 0.8) return;
      const f = edgeFace(p, q, N[k]), m = toLocal((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      const na = N[k][0] * EA[0] + N[k][1] * EA[1], nb = N[k][0] * EB[0] + N[k][1] * EB[1];
      const court = !hole && m[0] > 50.4 && m[1] > 10.9 && m[1] < 37.2;
      // the arm on the river street, the tower's wall, is plain: one arched window a bay (the photos of the tower show it so)
      const riverArm = !hole && nb > 0.6 && Math.hypot(m[0] - tl[0], m[1] - tl[1]) < 26;
      const ornate = !hole && !court && !riverArm && na < 0.4;
      faces.push(Object.assign(f, { k: hole ? 100 + k : k, hole, ornate, na, nb, m }));
    });
  };
  addRing(RING, false);
  addRing(HOLE, true);
  const pavFront = faces.find((f) => !f.hole && f.k === PAV_FRONT);
  for (const f of faces) {
    if (f === pavFront) continue;
    wallFace(ctx, f, !f.hole && (f.k === PAV_FRONT - 1 || f.k === PAV_FRONT + 1) ? PAV_UP : 0);
  }

  // ---------------------------------------------------------------- roofs
  const rr = roofs(ctx);
  for (const f of faces) if (f.ornate && f.k !== PAV_FRONT && Math.abs(f.k - PAV_FRONT) > 1 && f.L > 6) dormers(ctx, f);

  // ---------------------------------------------------------------- the pavilion on the square, the tower on the river street
  const pav = buildPortico(ctx, pavFront);
  const tow = buildTower(ctx);

  // ---------------------------------------------------------------- floodlights
  for (const [a, b] of [[-14, 6], [-14, 26], [-14, 46], [12, -7], [40, -7], [66, -7], [32, 56], [10, 56]]) wash.push([toMap(a, b)[0], Y(0.8), toMap(a, b)[1]]);

  // ---------------------------------------------------------------- colliders and footprints
  const gLo = faces.reduce((m, f) => Math.min(m, gOf(f)), 1e9) - 0.45, flat = (ring) => ring.flat();
  S.prism(flat(RING), gLo, Y(Y_BAL), 0, 0, 'wall', 0, [flat(HOLE)]);
  if (rr.r1) S.prism(flat(rr.r1), Y(Y_BAL - 0.2), Y(ROOF[1][1]), 0, 0, 'roof', 0, rr.h1 ? [flat(rr.h1)] : null);
  if (rr.r2) S.prism(flat(rr.r2), Y(ROOF[1][1] - 0.2), Y(ROOF[2][1]), 0, 0, 'roof', 0, rr.h2 ? [flat(rr.h2)] : null);
  pav.collide(S);
  tow.collide(S);
  const footprints = [
    { poly: RING, h: Y(ROOF[2][1]) - gLo, kind: 'public', name: 'Primăria Oradea', id: HALL_ID },
    ...tow.footprints,
  ];
  return { footprints, F, top: tow.top, gLo, ring: RING, hole: HOLE };
}

// one wall of the building: the plinth, the painted bays, the cornice, the balustrade and its posts, the basement lights
function wallFace(ctx, f, up) {
  const { B, F, Y, gOf } = ctx, ornate = f.ornate;
  const g = gOf(f), gLo = Math.min(g, F) - 0.45;
  B.stone.setColor(COL.granite);
  box(B.stone, f, -0.08, f.L + 0.08, gLo, Y(Y_PL), 0, 0.09, 'ftlr', [2, 2]);
  // the cornice and balustrade of neighbouring walls overlap at the corners: a few mm of height per wall keep their tops from fighting
  const n = Math.max(1, Math.round(f.L / WT)), w = f.L / n, y0 = Y(Y_PL), y1 = Y(Y_TOP) + (f.k % 3) * 0.008;
  for (let i = 0; i < n; i++) {
    const [u0, u1] = bayUV(bayCol(ornate ? 'ornate' : 'plain', i + f.k), 0.004, 0.996);
    quad(B.tile, at(f, i * w, y0), at(f, (i + 1) * w, y0), at(f, (i + 1) * w, y1), at(f, i * w, y1), f.N, [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
    if (ornate && f.L > 3) { B.det.setColor('#1e1d1c'); rect(B.det, f, (i + 0.5) * w - 0.5, (i + 0.5) * w + 0.5, F + 0.35, F + 0.95, 0.13); }
  }
  const C = HALL_PAL.cream, yt = y1 + up;
  if (up) { B.wall.setColor(HALL_PAL.bay); rect(B.wall, f, 0, f.L, y1, yt, 0, [2.5, 2.5]); }
  B.wall.setColor(C);
  box(B.wall, f, -0.2, f.L + 0.2, yt, yt + 0.5, 0, 0.18, 'ftlru', [2.5, 2.5]);
  box(B.wall, f, -0.34, f.L + 0.34, yt + 0.5, yt + 1.0, 0, 0.5, 'ftlru', [2.5, 2.5]);
  box(B.wall, f, -0.45, f.L + 0.45, yt + 1.0, yt + Y_COR - Y_TOP, 0, 0.8, 'ftlru', [2.5, 2.5]);
  const yb0 = yt + Y_COR - Y_TOP, yb1 = yt + Y_BAL - Y_TOP;
  for (let i = 0; i <= n; i++) {
    const s = i * w;
    box(B.wall, f, s - 0.27, s + 0.27, yb0, yb1, 0.22, 0.72, 'ftlr', [2.5, 2.5]);
    box(B.wall, f, s - 0.35, s + 0.35, yb1, yb1 + 0.12, 0.16, 0.78, 'ftlr', [2.5, 2.5]);
  }
  B.balu.setColor(C);
  const u = (s) => s / 1.8, yq = yb1 - 0.12;
  quad(B.balu, at(f, 0.27, yb0, 0.47), at(f, f.L - 0.27, yb0, 0.47), at(f, f.L - 0.27, yq, 0.47), at(f, 0.27, yq, 0.47), f.N, [[u(0.27), 0], [u(f.L - 0.27), 0], [u(f.L - 0.27), 1], [u(0.27), 1]]);
}

// the mansard: a lower steep slope, an upper gentle one and a flat deck, each an inset of the roof plan; the courtyard's
// rim gets the same, as far as the ring stays simple
function roofs(ctx) {
  const { B, F, Y } = ctx, out = {};
  const outer = ROOFPLAN.map(([a, b]) => toMap(a, b));
  const slopes = (ring, hole, spec) => {
    const rings = [];
    for (const [d] of spec) {
      let k = 1, R = ringInset(ring, d, hole);
      while (!ringSimple(R) && k > 0.3) { k -= 0.15; R = ringInset(ring, d * k, hole); }
      if (!ringSimple(R)) return null;
      rings.push(R);
    }
    return rings;
  };
  const P3 = (p, y) => [p[0], y, p[1]];
  B.roof.setColor(COL.copper);
  const ro = slopes(outer, false, ROOF);
  const ho = slopes(HOLE, true, ROOF);
  const put = (rings, hole, ys) => {
    if (!rings) return;
    for (let t = 0; t + 1 < rings.length; t++) {
      const A = rings[t], Bq = rings[t + 1];
      A.forEach((p, i) => { const j = (i + 1) % A.length; roofPoly(B.roof, [P3(p, Y(ys[t])), P3(A[j], Y(ys[t])), P3(Bq[j], Y(ys[t + 1])), P3(Bq[i], Y(ys[t + 1]))], 2); });
    }
  };
  put(ro, false, ROOF.map((q) => q[1]));
  put(ho, true, ROOF.map((q) => q[1]));
  if (ro) {
    B.roof.setColor(COL.copper);
    const hole = ho ? ho[2] : HOLE;
    B.roof.fill(ro[2], [hole], Y(ROOF[2][1]), true);
    out.r1 = ro[1]; out.r2 = ro[2]; out.h1 = ho && ho[1]; out.h2 = ho && ho[2];
  }
  return out;
}

// round-headed dormers on the mansard's lower slope, one over every second bay
function dormers(ctx, f) {
  const { B, F, Y } = ctx, n = Math.max(1, Math.round(f.L / WT)), w = f.L / n, o = -1.9;
  const df = { ...f, ax: f.ax + f.nx * o, az: f.az + f.nz * o };
  for (let i = 0; i < n; i += 2) {
    const s = (i + 0.5) * w, y0 = Y(19.4), y1 = Y(20.7);
    B.wall.setColor(HALL_PAL.cream);
    box(B.wall, df, s - 0.62, s + 0.62, y0, y1, -1.3, 0, 'flr');
    B.det.setColor('#2e3338'); windowA({ ...B, glass: B.det }, df, { s, y0: y0 + 0.25, w: 0.7, h: 0.55, rise: 0.35, sur: 0, off: 0.02, glass: '#2e3338' });
    B.roof.setColor(COL.copper);
    const yr = y1 + 0.62, P = (ss, y, oo) => at(df, ss, y, oo);
    roofPoly(B.roof, [P(s - 0.8, y1 - 0.02, 0.12), P(s, yr, 0.12), P(s, yr, -1.4), P(s - 0.8, y1 - 0.02, -1.4)], 2);
    roofPoly(B.roof, [P(s + 0.8, y1 - 0.02, 0.12), P(s, yr, 0.12), P(s, yr, -1.4), P(s + 0.8, y1 - 0.02, -1.4)], 2);
    B.wall.setColor(HALL_PAL.cream); B.wall.face([P(s - 0.62, y1, 0), P(s + 0.62, y1, 0), P(s, yr - 0.03, 0)], f.N);
  }
}
