// Catedrala greco-catolică «Sfântul Nicolae» (Catedrala «Sfântul Nicolae»), Oradea (OSM way 286245385): the Greek Catholic
// cathedral – a cross-shaped Baroque church with a west tower (the tower of 1803 as rebuilt 1910–1912 after the fires, after
// Giovanni Quai), 51 m long. Built after the Commons photos: pale-yellow walls with wide orange-ochre pilaster strips under
// white capitals, a frieze of small white panels, a white cornice, tall arched windows in white arched recesses, a brown
// standing-seam roof with gold finials, a rounded apse; the tower with its corner pilasters, the portal, an iron gallery,
// louvred arched windows, Roman clocks and the dark bronze Baroque helm with its onion cupola, gold ball and cross.
//   buildCathedral({ B, S, g, wash, atlas }) -> { footprints, top }
//   Local frame (s, t): s from the west front along the nave toward the apse, t across (+t south); toMap(s, t) -> [x, z].
import { M4 } from '../../../../kit/mesh.js';
import { planFace, fan, poly2, windowA, roofPoly, slopeSolid, clockOn, pilaster, archFill, archRing, at, quad, rect, box, PI } from './facekit.js';
import { COL } from './set.js';

export const CATH_ID = 286245385;
const O = [-48.2, 170.6], UA = -10.7 * PI / 180, U = [Math.cos(UA), Math.sin(UA)], V = [-U[1], U[0]];
export const toMap = (s, t) => [O[0] + U[0] * s + V[0] * t, O[1] + U[1] * s + V[1] * t];
const APSE = [-90, -60, -30, 0, 30, 60, 90].map((a) => [44.7 + 6.7 * Math.cos(a * PI / 180), 9.9 * Math.sin(a * PI / 180)]);
const PLAN = [[0, -10.3], [23.1, -10.3], [23.1, -13.1], [40.4, -13.1], [40.4, -9.9], ...APSE, [40.4, 9.9], [40.4, 13.1], [23.1, 13.1], [23.1, 10.3], [0, 10.3]];
const UVM = [2.5, 2.5];
const C = { wall: '#ecd98c', strip: '#d6a04a', white: '#f1ece0', plinth: '#a89a84', roof: '#66524c', helm: '#3a2f31' };
const H = { plinth: 0.9, capT: 10.4, capB: 10.8, cornice: 12.0, eave: 12.9, ridge: 18.0, ridgeT: 17.1 };
const shift = (f, d) => ({ ...f, ax: f.ax - f.nx * d, az: f.az - f.nz * d });

export function buildCathedral({ B, S, g, wash, atlas }) {
  const ring = PLAN.map(([s, t]) => toMap(s, t)), P = B.plaster, ST = B.stone, mT = M4(O[0], 0, O[1], -UA), inside = toMap(31, 0);
  const hs = [...ring, toMap(10, 0), toMap(30, 0), toMap(-2, 0)].map(([x, z]) => g(x, z));
  const F = Math.max(...hs.slice(0, ring.length)) + 0.3, gLo = Math.min(...hs) - 0.4, Y = (h) => F + h;
  const mk = (a, b) => planFace(toMap, a, b, inside);

  // one wall run: skin, plinth, strips with capitals, the frieze of small panels, the cornice, recessed arched windows
  const wall = (a, b, o = {}) => {
    const f = mk(a, b), L = f.L, nb = o.bays ?? Math.max(1, Math.round(L / 4.6)), top = o.top ?? H.eave;
    P.setColor(C.wall); rect(P, f, 0, L, gLo, Y(H.cornice), 0, UVM);
    ST.setColor(C.plinth); box(ST, f, -0.1, L + 0.1, gLo, Y(H.plinth), 0, 0.12, 'ftlr', [1.2, 1.2]);
    P.setColor(C.white); box(P, f, -0.25, L + 0.25, Y(H.cornice), Y(top), 0, 0.62, 'ftlru'); box(P, f, -0.15, L + 0.15, Y(H.cornice) - 0.2, Y(H.cornice), 0, 0.36, 'ftlru');
    for (let k = 0; k <= nb; k++) {
      const c = k * L / nb, w = k === 0 || k === nb ? 0.65 : 0.65, s0 = Math.max(-0.1, c - w), s1 = Math.min(L + 0.1, c + w);
      P.setColor(C.strip); box(P, f, s0, s1, Y(H.plinth), Y(H.capT), 0, 0.16, 'ftlr', UVM);
      P.setColor(C.white); box(P, f, s0 - 0.3, s1 + 0.3, Y(H.capT), Y(H.capB), 0, 0.34, 'ftlru');
    }
    P.setColor(C.white); for (let s = 0.6; s < L - 0.4; s += 1.15) box(P, f, s, s + 0.45, Y(10.95), Y(11.85), 0, 0.05, 'f');
    if (!o.blank) for (let k = 0; k < nb; k++) {
      const s = (k + 0.5) * L / nb;
      if (L / nb < 3.0) continue;
      archFill(P, f, s, Y(3.6), 2.6, 4.8, 1.3, 0.03, '#efdf95'); archRing(P, f, s, Y(3.6), 2.6, 4.8, 1.3, 0.24, 0.05, C.white);
      windowA(B, f, { s, y0: Y(3.9), w: 1.4, h: 3.8, rise: 0.7, sur: 0.12, sill: true, lit: true, glass: '#4f5f78', off: 0.06 });
    }
    return f;
  };
  const faces = [];
  const edges = PLAN.map((p, i) => [p, PLAN[(i + 1) % PLAN.length]]);
  edges.forEach(([a, b], i) => {
    if (i === edges.length - 1) return;                                                     // the west front is built below
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    faces.push(wall(a, b, { bays: len < 3.5 ? 1 : undefined, blank: len < 3.5 }));
  });
  // ---- the transept's gable ends
  for (const m of [-1, 1]) {
    const f = faces.find((q, i) => i >= 0 && Math.abs(edges[i][0][1] - m * 13.1) < 0.01 && Math.abs(edges[i][1][1] - m * 13.1) < 0.01);
    if (!f) continue;
    const c = f.L / 2, rise = H.ridgeT - H.eave + 0.2;
    P.setColor(C.white); fan(P, [at(f, -0.3, Y(H.eave), 0.0), at(f, f.L + 0.3, Y(H.eave), 0.0), at(f, c, Y(H.eave) + rise + 0.3, 0.0)], f.N);
    P.setColor(C.wall); fan(P, [at(f, 0.4, Y(H.eave), 0.04), at(f, f.L - 0.4, Y(H.eave), 0.04), at(f, c, Y(H.eave) + rise - 0.55, 0.04)], f.N);
    windowA(B, f, { s: c, y0: Y(H.eave) + 0.9, w: 1.2, h: 1.4, rise: 0.6, sur: 0.16, lit: true, glass: '#4f5f78' });
  }

  // ================================================================ the west front and the tower
  const f = mk([0, -10.3], [0, 10.3]), fU = shift(f, 0.0);
  P.setColor(C.wall); rect(P, f, 0, f.L, gLo, Y(H.cornice), 0, UVM);
  ST.setColor(C.plinth); box(ST, f, -0.1, f.L + 0.1, gLo, Y(H.plinth), 0, 0.12, 'ftlr', [1.2, 1.2]);
  P.setColor(C.white); box(P, f, -0.25, f.L + 0.25, Y(H.cornice), Y(H.eave), 0, 0.62, 'ftlru');
  const tw = 4.3, c0 = f.L / 2;                                                            // the tower's half width
  for (const s of [0.65, f.L - 0.65, c0 - tw - 0.2, c0 + tw + 0.2]) { P.setColor(C.strip); box(P, f, s - 0.65, s + 0.65, Y(H.plinth), Y(H.capT), 0, 0.16, 'ftlr', UVM); P.setColor(C.white); box(P, f, s - 0.95, s + 0.95, Y(H.capT), Y(H.capB), 0, 0.34, 'ftlru'); }
  P.setColor(C.white); for (let s = 0.6; s < f.L - 0.4; s += 1.15) if (Math.abs(s - c0) > tw + 0.9) box(P, f, s, s + 0.45, Y(10.95), Y(11.85), 0, 0.05, 'f');
  for (const s of [3.3, f.L - 3.3]) { archFill(P, f, s, Y(3.6), 2.6, 4.8, 1.3, 0.03, '#efdf95'); archRing(P, f, s, Y(3.6), 2.6, 4.8, 1.3, 0.24, 0.05, C.white); windowA(B, f, { s, y0: Y(3.9), w: 1.4, h: 3.8, rise: 0.7, sur: 0.12, sill: true, lit: true, glass: '#4f5f78', off: 0.06 }); }
  // the tower shaft: stage 1 to the gallery, stage 2 (inset) to the cornice, both closed on top
  const T1 = { s0: 0, s1: 8.6, t: tw }, T2 = { s0: 0.4, s1: 8.2, t: tw - 0.4 }, yG = 17.6, yC = 28.2;
  P.setColor(C.wall);
  P.with(mT, (q) => { q.box(T1.s0, Y(H.eave) - 0.5, -T1.t, T1.s1, Y(yG), T1.t, 1 | 4 | 16 | 32); q.box(T2.s0, Y(yG) - 0.1, -T2.t, T2.s1, Y(yC), T2.t, 1 | 2 | 4 | 16 | 32); });
  const faceSet = (T) => ({ front: mk([T.s0, -T.t], [T.s0, T.t]), back: mk([T.s1, T.t], [T.s1, -T.t]), north: mk([T.s0, -T.t], [T.s1, -T.t]), south: mk([T.s1, T.t], [T.s0, T.t]) });
  const A = faceSet(T1), Bf = faceSet(T2);
  // stage 1: orange corner strips with capitals, a cornice, and on the front the portal and the big window
  for (const [k, fa] of Object.entries(A)) {
    for (const s of [0.65, fa.L - 0.65]) { P.setColor(C.strip); box(P, fa, s - 0.65, s + 0.65, Y(H.plinth), Y(16.0), 0, 0.16, 'ftlr', UVM); P.setColor(C.white); box(P, fa, s - 0.95, s + 0.95, Y(16.0), Y(16.5), 0, 0.34, 'ftlru'); }
    P.setColor(C.white); box(P, fa, -0.3, fa.L + 0.3, Y(16.5), Y(17.0), 0, 0.5, 'ftlru'); box(P, fa, -0.5, fa.L + 0.5, Y(17.0), Y(yG), 0, 0.85, 'ftlru');
    if (k !== 'front') { archFill(P, fa, fa.L / 2, Y(3.6), 2.4, 4.4, 1.2, 0.03, '#efdf95'); archRing(P, fa, fa.L / 2, Y(3.6), 2.4, 4.4, 1.2, 0.22, 0.05, C.white); windowA(B, fa, { s: fa.L / 2, y0: Y(3.9), w: 1.3, h: 3.4, rise: 0.65, sur: 0.12, sill: true, lit: true, glass: '#4f5f78', off: 0.06 }); }
  }
  { const fa = A.front, c = fa.L / 2;
    archFill(P, fa, c, Y(0.6), 2.9, 4.1, 1.45, 0.04, '#f4ecd0'); archRing(P, fa, c, Y(0.6), 2.9, 4.1, 1.45, 0.3, 0.07, C.white);
    windowA(B, fa, { s: c, y0: Y(0.9), w: 2.1, h: 3.4, rise: 1.0, sur: 0.0, glass: '#6a4a2c', off: 0.09 });                       // the portal's carved doors
    P.setColor(C.white); box(P, fa, c - 1.9, c + 1.9, Y(6.6), Y(7.0), 0, 0.5, 'ftlru');
    archFill(P, fa, c, Y(8.2), 2.0, 3.4, 1.0, 0.03, '#efdf95'); archRing(P, fa, c, Y(8.2), 2.0, 3.4, 1.0, 0.24, 0.05, C.white);
    windowA(B, fa, { s: c, y0: Y(8.5), w: 1.5, h: 2.9, rise: 0.75, sur: 0.1, sill: true, lit: true, glass: '#4f5f78', off: 0.06 });
    for (let i = 0; i < 3; i++) { ST.setColor('#b2a692'); box(ST, fa, c - 2.2 + i * 0.3, c + 2.2 - i * 0.3, gLo, F - 0.1 + i * 0.0, 0, 0.5 + (2 - i) * 0.4, 'ftlr'); }
    P.setColor(C.white); fan(P, [at(fa, c - 1.7, Y(13.2), 0.05), at(fa, c + 1.7, Y(13.2), 0.05), at(fa, c, Y(14.6), 0.05)], fa.N);
  }
  // the gallery: a slab, a top rail and posts all round
  { const g0 = Y(yG);
    B.det.setColor('#2b2d30');
    B.det.with(mT, (q) => {
      const G = 1.0, s0 = T2.s0 - G, s1 = T2.s1 + G, tt = T2.t + G;
      q.box(s0, g0 - 0.12, -tt, s1, g0 + 0.04, tt);
      q.box(s0, g0 + 1.05, -tt, s1, g0 + 1.13, -tt + 0.05); q.box(s0, g0 + 1.05, tt - 0.05, s1, g0 + 1.13, tt);
      q.box(s0, g0 + 1.05, -tt, s0 + 0.05, g0 + 1.13, tt); q.box(s1 - 0.05, g0 + 1.05, -tt, s1, g0 + 1.13, tt);
      q.box(s0, g0 + 0.5, -tt, s1, g0 + 0.54, -tt + 0.03); q.box(s0, g0 + 0.5, tt - 0.03, s1, g0 + 0.54, tt);
      for (let s = s0; s <= s1 + 0.01; s += 1.3) { q.tube([s, g0 + 0.04, -tt + 0.03], [s, g0 + 1.1, -tt + 0.03], 0.025, 4); q.tube([s, g0 + 0.04, tt - 0.03], [s, g0 + 1.1, tt - 0.03], 0.025, 4); }
      for (let t = -tt + 1.3; t < tt - 0.6; t += 1.3) { q.tube([s0 + 0.03, g0 + 0.04, t], [s0 + 0.03, g0 + 1.1, t], 0.025, 4); q.tube([s1 - 0.03, g0 + 0.04, t], [s1 - 0.03, g0 + 1.1, t], 0.025, 4); }
    });
  }
  // stage 2: corner strips, a louvred arched window and a clock on each face, the main cornice
  for (const fa of Object.values(Bf)) {
    for (const s of [0.55, fa.L - 0.55]) { P.setColor(C.strip); box(P, fa, s - 0.55, s + 0.55, Y(yG), Y(27.0), 0, 0.16, 'ftlr', UVM); P.setColor(C.white); box(P, fa, s - 0.8, s + 0.8, Y(27.0), Y(27.45), 0, 0.3, 'ftlru'); }
    const c = fa.L / 2;
    windowA(B, fa, { s: c, y0: Y(20.2), w: 1.8, h: 3.0, rise: 0.9, sur: 0.3, sill: true, glass: '#4a2e1f', rows: 2 });
    clockOn(B, fa, c, Y(25.2), 2.2, atlas, C.white);
    P.setColor(C.white); box(P, fa, -0.4, fa.L + 0.4, Y(27.5), Y(28.0), 0, 0.55, 'ftlru'); box(P, fa, -0.55, fa.L + 0.55, Y(28.0), Y(yC), 0, 0.85, 'ftlru');
  }
  // the helm: a flared bell, ornamented corners, the drum, the onion cupola, the lantern, ball and cross
  const sc = 4.1, [hx, hz] = toMap(sc, 0), yH = Y(yC);
  B.copper.setColor(C.helm);
  B.copper.lathe([[4.5, yH], [4.45, yH + 0.4], [4.1, yH + 0.8], [3.5, yH + 1.5], [3.1, yH + 2.4], [3.0, yH + 3.4], [3.35, yH + 4.4], [3.55, yH + 5.2], [3.3, yH + 6.0], [2.6, yH + 6.7], [2.2, yH + 7.2], [2.15, yH + 8.2]], 8, hx, hz);
  for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const [x, z] = toMap(sc + a * 3.0, b * 3.0); B.copper.ellipsoid([x, yH + 4.6, z], [0.55, 1.1, 0.55], 8, 6); B.copper.ellipsoid([x, yH + 3.2, z], [0.42, 0.5, 0.42], 8, 5); }
  B.copper.lathe([[2.15, yH + 8.2], [2.0, yH + 8.7], [2.05, yH + 9.5], [1.65, yH + 10.4], [1.0, yH + 11.1], [0.55, yH + 11.6], [0.5, yH + 12.0], [0.62, yH + 12.2], [0.3, yH + 12.5], [0.12, yH + 13.2]], 10, hx, hz);
  const tip = yH + 13.2;
  B.det.setColor(COL.gold); B.det.ellipsoid([hx, tip + 0.3, hz], [0.48, 0.48, 0.48], 10, 7);
  B.det.setColor('#cfcfca'); B.det.cyl(hx, tip + 0.7, hz, 0.08, 0.08, 3.0, 6, true);
  B.det.with(mT, (q) => { q.box(sc - 0.07, tip + 2.5, -0.8, sc + 0.07, tip + 2.65, 0.8); q.box(sc - 0.07, tip + 1.7, -0.5, sc + 0.07, tip + 1.82, 0.5); });

  // ================================================================ roofs
  const E = Y(H.eave) - 0.3, R = E + 10.5 * 0.5, Rt = E + 8.95 * 0.5, p3 = ([s, t], y) => { const [x, z] = toMap(s, t); return [x, y, z]; };
  B.roof.setColor(C.roof);
  roofPoly(B.roof, [p3([-0.4, -10.7], E), p3([44.7, -10.7], E), p3([44.7, 0], R), p3([-0.4, 0], R)], 2);
  roofPoly(B.roof, [p3([44.7, 10.7], E), p3([-0.4, 10.7], E), p3([-0.4, 0], R), p3([44.7, 0], R)], 2);
  const apexA = p3([44.7, 0], R), ap = APSE.map(([s, t]) => p3([s + (s > 45 ? 0.3 : 0), t * 1.06], E));
  for (let i = 0; i + 1 < ap.length; i++) roofPoly(B.roof, [ap[i], ap[i + 1], apexA], 2);
  for (const m of [-1, 1]) {
    roofPoly(B.roof, [p3([22.7, m * 13.6], E), p3([22.7, m * 1.5], E), p3([31.75, m * 1.5], Rt), p3([31.75, m * 13.6], Rt)], 2);
    roofPoly(B.roof, [p3([40.8, m * 1.5], E), p3([40.8, m * 13.6], E), p3([31.75, m * 13.6], Rt), p3([31.75, m * 1.5], Rt)], 2);
  }
  // gold finials with crosses at the ridge ends
  for (const [s, t, y] of [[31.75, 0, R], [41.0, 0, R], [31.75, 13.2, Rt], [31.75, -13.2, Rt]]) {
    const [x, z] = toMap(s, t); B.det.setColor(COL.gold); B.det.lathe([[0.1, 0], [0.3, 0.1], [0.4, 0.5], [0.25, 0.9], [0.1, 1.0]].map(([r, h]) => [r, y + h]), 8, x, z);
    B.det.setColor('#cfcfca'); B.det.cyl(x, y + 1.0, z, 0.05, 0.05, 1.2, 5, true); B.det.with(mT, (q) => q.box(s - 0.04, y + 1.7, t - 0.35, s + 0.04, y + 1.8, t + 0.35));
  }
  // ---- floodlights and colliders
  wash.push(at(f, 5, Y(0.5), 6), at(f, f.L - 5, Y(0.5), 6), at(faces[0], 8, Y(0.5), 4), at(faces[faces.length - 1], 8, Y(0.5), 4));
  S.prism(ring.flat(), gLo, Y(H.eave), 0, 0, 'wall');
  const k1 = 0.5;
  slopeSolid(S, [toMap(0, -10.3), toMap(44.7, -10.3), toMap(44.7, 0), toMap(0, 0)], Y(H.eave) - 0.3, p3([0, -10.3], E), V, k1);
  slopeSolid(S, [toMap(0, 10.3), toMap(44.7, 10.3), toMap(44.7, 0), toMap(0, 0)], Y(H.eave) - 0.3, p3([0, 10.3], E), [-V[0], -V[1]], k1);
  S.obox(...toMap((T1.s0 + T1.s1) / 2, 0), (T1.s1 - T1.s0) / 2, T1.t, UA, Y(H.eave), Y(yC), 'tower');
  S.cyl(...toMap(sc, 0), Y(yC), yH + 8.2, 4.4, 2.2, 'roof'); S.cyl(...toMap(sc, 0), yH + 8.2, tip + 2.8, 2.1, 0.2, 'roof');
  return { footprints: [{ poly: ring, h: tip + 2.8 - gLo, kind: 'church', name: 'Catedrala Sfântul Nicolae', id: CATH_ID }], top: tip + 2.8 };
}
