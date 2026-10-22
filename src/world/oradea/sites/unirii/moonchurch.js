// Biserica cu Lună, the Orthodox church of the Assumption (Adormirea Maicii Domnului), Piața Unirii 10, Oradea (OSM way
// 651522972): late Baroque with classical touches, 1784–1790 (architect Jakob Eder, builder Ioann Lins), the moon clock of
// 1793. Built after the Commons photos of 2021: the three-bay west front in ochre render with cream pilasters, a pink
// granite plinth, arched stained-glass windows under shell hoods, a red-marble portal, a deep entablature carrying a
// segmental arch, the attic wings with urns and the concave shoulders rising to the tower – the round window with the
// moon sphere over a panel, a pedimented stage, the belfry with louvred arched windows and the Roman clock on all four
// sides –, and the black spire (a flared base, a square lantern with louvred arches, a tiered cone, a gold ball and cross).
// A nave of six pilastered bays with a dark gabled roof and a polygonal apse with a small cupola.
//   buildMoonChurch({ B, S, g, wash, atlas }) -> { footprints, moon: { geo, pos, yaw, nrm }, top }
//   B: the site's MeshBuilders (set.js); S the collision world; g the terrain sampler; wash: the floodlight points are pushed;
//   atlas: the signAtlas() (its dial cell goes on the clocks)
//   Local frame (s, t): s from the west front along the nave toward the apse, t across (+t south); toMap(s, t) -> [x, z].
import * as THREE from 'three';
import { M4 } from '../../../../kit/mesh.js';
import { planFace, fan, poly2, windowA, roofPoly, slopeSolid, clockOn, pilaster, face, at, quad, rect, box, PI } from './facekit.js';
import { COL } from './set.js';

export const MOON_ID = 651522972;
const O = [84.6, 157.05], UA = -12 * PI / 180, U = [Math.cos(UA), Math.sin(UA)], V = [-U[1], U[0]];
export const toMap = (s, t) => [O[0] + U[0] * s + V[0] * t, O[1] + U[1] * s + V[1] * t];
const PLAN = [[0, -9.2], [28.3, -9.2], [31.6, -8.6], [35.0, -6.8], [36.5, -4.6], [36.5, 4.6], [35.0, 6.8], [31.6, 8.6], [28.3, 9.2], [0, 9.2]];
const UVM = [2.5, 2.5];
// heights over the floor
const HT = { plinth: 1.15, cap: 13.1, cornice: 16.4, attic: 22.0, tower1: 26.0, tower2: 37.0, spire: 37.9, ridge: 21.9 };
const shift = (f, d) => ({ ...f, ax: f.ax - f.nx * d, az: f.az - f.nz * d });
const dir = (f) => (f.ux * f.nz - f.uz * f.nx > 0 ? 1 : -1);

export function buildMoonChurch({ B, S, g, wash, atlas }) {
  const ring = PLAN.map(([s, t]) => toMap(s, t));
  const hs = [...ring, toMap(14, 0), toMap(-2, 0)].map(([x, z]) => g(x, z));
  const F = Math.max(...hs.slice(0, ring.length)) + 0.3, gLo = Math.min(...hs) - 0.4, Y = (h) => F + h;
  const P = B.plaster, ST = B.stone, inside = toMap(14, 0), mT = M4(O[0], 0, O[1], -UA);
  const mk = (a, b, ins = inside) => planFace(toMap, a, b, ins);

  // ---- entablature: architrave, frieze, dentils, the deep main cornice and its crown (one run along a face)
  const entab = (f, s0, s1, o = 1) => {
    P.setColor(COL.cream);
    box(P, f, s0, s1, Y(13.2), Y(13.9), 0, 0.38 * o, 'ftlru');
    P.setColor('#e6dcc0'); box(P, f, s0, s1, Y(13.9), Y(15.1), 0, 0.3 * o, 'ftlru', UVM);
    P.setColor(COL.cream);
    box(P, f, s0, s1, Y(15.1), Y(15.5), 0, 0.55 * o, 'ftlru');
    box(P, f, s0, s1, Y(15.5), Y(16.0), 0, 0.95 * o, 'ftlru');
    box(P, f, s0, s1, Y(16.0), Y(HT.cornice), 0, 0.7 * o, 'ftlru');
  };
  const shell = (f, s, y, w) => { // a scalloped hood over a window: a half disc with a small keystone
    const pts = [[s - w, y], ...Array.from({ length: 9 }, (_, k) => { const a = PI - (k / 8) * PI; return [s + Math.cos(a) * w, y + Math.sin(a) * w * 0.62]; }), [s + w, y]];
    P.setColor(COL.cream); fan(P, pts.map(([a, b]) => at(f, a, b, 0.1)), f.N);
    P.setColor('#d9c8a0'); fan(P, [[s - w * 0.7, y + 0.04], ...Array.from({ length: 7 }, (_, k) => { const a = PI - (k / 6) * PI; return [s + Math.cos(a) * w * 0.7, y + 0.04 + Math.sin(a) * w * 0.42]; }), [s + w * 0.7, y + 0.04]].map(([a, b]) => at(f, a, b, 0.14)), f.N);
    box(P, f, s - 0.14, s + 0.14, y + w * 0.58, y + w * 0.78, 0, 0.2, 'ftlr');
  };

  // ================================================================ the west front
  const f = mk([0, -9.2], [0, 9.2]), fU = shift(f, 0.35);
  P.setColor(COL.ochre); rect(P, f, 0, f.L, gLo, Y(HT.cornice), 0, UVM);
  ST.setColor(COL.plinth); box(ST, f, -0.12, f.L + 0.12, gLo, Y(HT.plinth), 0, 0.14, 'ftlr', [1.2, 1.2]);
  for (const [s0, s1] of [[0, 1.5], [16.9, 18.4], [5.1, 6.9], [11.5, 13.3]]) pilaster(B, f, s0, s1, Y(HT.plinth), Y(HT.cap), 0.24, COL.cream, 0.8);
  entab(f, -0.4, f.L + 0.4);
  for (const s of [3.3, 15.1]) { windowA(B, f, { s, y0: Y(6.4), w: 1.75, h: 3.6, rise: 0.85, sur: 0.3, sill: true, lit: true, glass: '#566a84' }); shell(f, s, Y(6.4 + 3.6 + 0.85 + 0.36), 1.2); }
  windowA(B, f, { s: 9.2, y0: Y(6.0), w: 2.25, h: 4.2, rise: 1.1, sur: 0.36, sill: true, lit: true, glass: '#566a84' }); shell(f, 9.2, Y(6.0 + 4.2 + 1.1 + 0.42), 1.6);
  // the portal in red marble: jambs, lintel, a small pediment, the door, three steps
  { const sd = 9.2, M = COL.marble;
    B.stone.setColor(M); box(B.stone, f, sd - 1.45, sd - 1.0, Y(0.2), Y(4.3), 0, 0.26, 'ftlr'); box(B.stone, f, sd + 1.0, sd + 1.45, Y(0.2), Y(4.3), 0, 0.26, 'ftlr');
    box(B.stone, f, sd - 1.6, sd + 1.6, Y(4.3), Y(4.8), 0, 0.36, 'ftlru');
    B.stone.setColor('#b86a5c'); fan(B.stone, [at(f, sd - 1.45, Y(4.8), 0.1), at(f, sd + 1.45, Y(4.8), 0.1), at(f, sd, Y(5.65), 0.1)], f.N);
    B.det.setColor('#3f2618'); rect(B.det, f, sd - 1.0, sd + 1.0, F, Y(4.3), 0.04);
    B.det.setColor('#2d1a10'); for (let i = 0; i < 2; i++) rect(B.det, f, sd - 0.88 + i * 0.9, sd - 0.06 + i * 0.9, Y(0.4), Y(4.1), 0.07);
    ST.setColor('#b9b0a2'); box(ST, f, sd - 2.2, sd + 2.2, gLo, F - 0.12, 0, 1.1, 'ftlr'); box(ST, f, sd - 1.9, sd + 1.9, gLo, F, 0, 0.55, 'ftlr');
  }
  // the segmental arch over the middle bay, in two layers
  { const c0 = 5.0, c1 = 13.4, rise = 1.3, Rr = ((c1 - c0) ** 2 / 4 + rise * rise) / (2 * rise), cx = (c0 + c1) / 2, cy = Y(HT.cornice) + rise - Rr;
    const arc = (r) => Array.from({ length: 13 }, (_, k) => { const a = Math.asin((c1 - c0) / 2 / Rr) * (-1 + 2 * k / 12); return [cx + Math.sin(a) * r, cy + Math.cos(a) * r]; });
    const outer = [[c0 - 0.05, Y(HT.cornice)], ...arc(Rr).map(([a, b]) => [a, b]), [c1 + 0.05, Y(HT.cornice)]];
    P.setColor(COL.cream); poly2(P, shift(f, 0.0), outer, [], 0.12, 2.5);
    const inner = [[c0 + 0.5, Y(HT.cornice)], ...arc(Rr - 0.55).filter(([, y]) => y >= Y(HT.cornice)), [c1 - 0.5, Y(HT.cornice)]];
    P.setColor('#d6c293'); poly2(P, f, inner, [], 0.17, 2.5);
  }

  // ================================================================ the attic wings and the tower's shoulders
  P.setColor(COL.ochre);
  for (const [a, b] of [[0.7, 4.6], [13.8, 17.7]]) {
    rect(P, fU, a, b, Y(HT.cornice) - 0.5, Y(HT.attic), 0, UVM);
    P.with(mT, (q) => q.box(0.35, Y(HT.cornice) - 0.5, -9.2 + a, 3.4, Y(HT.attic), -9.2 + b, 1 | 4 | 16 | 32));
    P.setColor(COL.ochre);
    P.setColor('#e6dcc0'); box(P, fU, a + 0.3, b - 0.3, Y(18.4), Y(19.6), 0, 0.1, 'ft');          // the garland frieze
    P.setColor('#cdb683'); box(P, fU, a + 0.35, b - 0.35, Y(19.9), Y(21.2), 0, 0.06, 'f');           // panels
    P.setColor(COL.cream);
    box(P, fU, a - 0.05, b + 0.05, Y(HT.attic) - 0.6, Y(HT.attic), 0, 0.42, 'ftlru');              // the cap cornice
    for (const sp of [a + 0.4, b - 0.4]) box(P, fU, sp - 0.4, sp + 0.4, Y(HT.cornice), Y(HT.attic) - 0.6, 0, 0.14, 'ftlr');
    P.setColor(COL.ochre);
  }
  // concave shoulders: bowl curves from the wing top to the tower's edge
  for (const m of [0, 1]) {
    const pts = Array.from({ length: 9 }, (_, k) => { const th = (k / 8) * PI / 2; return [2.7 + 1.9 * Math.sin(th), Y(HT.attic) + 3.1 * (1 - Math.cos(th))]; });
    const poly = [...pts, [4.6, Y(HT.attic)]].map(([s, y]) => [m ? f.L - s : s, y]);
    P.setColor(COL.ochre); poly2(P, fU, poly, [], 0, 2.5);
    P.setColor(COL.cream);
    for (let k = 0; k < 8; k++) { const [s0, y0] = pts[k], [s1, y1] = pts[k + 1], q = (s, y, o) => at(fU, m ? f.L - s : s, y, o);
      quad(P, q(s0, y0, 0.02), q(s1, y1, 0.02), q(s1, y1 + 0.34, 0.02), q(s0, y0 + 0.34, 0.02), fU.N); }
    // the urn on the wing's corner
    const [ux, uz] = at(fU, m ? f.L - 1.1 : 1.1, 0, -0.2).filter((_, i) => i !== 1), uy = Y(HT.attic);
    P.setColor(COL.cream); P.lathe([[0.0, 0], [0.34, 0.0], [0.26, 0.2], [0.14, 0.45], [0.3, 0.9], [0.4, 1.35], [0.24, 1.75], [0.1, 1.95], [0.0, 2.0]].map(([r, h]) => [r, uy + h]), 10, ux, uz);
    ST.setColor(COL.cream);
  }

  // ================================================================ the tower: shafts, stage cornices, pediment
  const T1 = { s0: 0.35, s1: 9.65, t: 4.65 }, T2 = { s0: 0.65, s1: 9.35, t: 4.35 };
  P.setColor(COL.ochre);
  P.with(mT, (q) => {
    q.box(T1.s0, Y(HT.cornice) - 0.5, -T1.t, T1.s1, Y(HT.tower1) - 0.1, T1.t, 1 | 2 | 4 | 16 | 32);             // stage 1, closed on top
    q.box(T2.s0, Y(HT.tower1) - 0.1, -T2.t, T2.s1, Y(HT.tower2), T2.t, 1 | 2 | 4 | 16 | 32);                      // stage 2, closed on top
  });
  // the faces of both stages: front, back, north, south – ordered so the viewer's right is s
  const facesOf = (T) => ({
    front: mk([T.s0, -T.t], [T.s0, T.t], toMap(5, 0)), back: mk([T.s1, T.t], [T.s1, -T.t], toMap(5, 0)),
    north: mk([T.s0, -T.t], [T.s1, -T.t], toMap(5, 0)), south: mk([T.s1, T.t], [T.s0, T.t], toMap(5, 0)),
  });
  const A = facesOf(T1), C = facesOf(T2);
  // stage 1: the moon window over a panel, pilasters, the pediment on the front; cornices on every side
  for (const [k, fa] of Object.entries(A)) {
    P.setColor(COL.cream);
    for (const s of [0.45, fa.L - 0.45]) pilaster(B, fa, s - 0.45, s + 0.45, Y(k === 'front' ? 22.5 : HT.attic), Y(24.9), 0.2, COL.cream, 0.7);
    box(P, fa, -0.45, fa.L + 0.45, Y(24.9), Y(25.35), 0, 0.5, 'ftlru'); box(P, fa, -0.5, fa.L + 0.5, Y(25.35), Y(26.0), 0, 0.72, 'ftlru');
    if (k === 'front') continue;
    P.setColor('#e6dcc0'); box(P, fa, 1.2, fa.L - 1.2, Y(19.0), Y(24.0), 0, 0.06, 'f');
  }
  { const fa = A.front, c = fa.L / 2;
    P.setColor('#e6dcc0'); box(P, fa, 1.0, fa.L - 1.0, Y(HT.attic) + 0.4, Y(24.2), 0, 0.05, 'f');
    // the round window: a moulded ring round a dark well, the sphere in front of it
    const ringPts = (r, y, o) => Array.from({ length: 20 }, (_, k) => { const a = k / 20 * PI * 2; return at(fa, c + Math.cos(a) * r, y + Math.sin(a) * r, o); });
    const yw = Y(22.1);
    P.setColor(COL.cream); fan(P, ringPts(1.75, yw, 0.1), fa.N);
    P.setColor('#d3bf90'); fan(P, ringPts(1.45, yw, 0.13), fa.N);
    B.det.setColor('#1b1c1e'); fan(B.det, ringPts(1.12, yw, 0.16), fa.N);
    P.setColor(COL.cream); box(P, fa, c - 2.0, c + 2.0, yw - 2.15, yw - 1.95, 0, 0.3, 'ftlru');            // the ledge below
    P.setColor('#d3bf90'); box(P, fa, c - 1.6, c + 1.6, yw - 3.3, yw - 2.3, 0, 0.08, 'f');
    // the pediment, two layers
    P.setColor(COL.cream); fan(P, [at(fa, -0.5, Y(26.0), 0.0), at(fa, fa.L + 0.5, Y(26.0), 0.0), at(fa, c, Y(28.6), 0.0)], fa.N);
    P.setColor('#d9c9a0'); fan(P, [at(fa, 0.6, Y(26.0), 0.05), at(fa, fa.L - 0.6, Y(26.0), 0.05), at(fa, c, Y(27.9), 0.05)], fa.N);
  }
  // stage 2: pilasters, the louvred arched window and the clock on each face, the crowning cornice
  for (const [k, fa] of Object.entries(C)) {
    P.setColor(COL.cream);
    for (const s of [0.45, fa.L - 0.45]) pilaster(B, fa, s - 0.45, s + 0.45, Y(HT.tower1), Y(35.3), 0.2, COL.cream, 0.8);
    const c = fa.L / 2;
    windowA(B, fa, { s: c, y0: Y(29.5), w: 2.0, h: 2.6, rise: 1.0, sur: 0.34, sill: true, glass: '#7a3524', cols: 1, rows: 2 });
    clockOn(B, fa, c, Y(35.0), 2.3, atlas, COL.cream);
    P.setColor(COL.cream); box(P, fa, -0.5, fa.L + 0.5, Y(36.55), Y(36.95), 0, 0.55, 'ftlru'); box(P, fa, -0.62, fa.L + 0.62, Y(36.95), Y(HT.spire), 0, 0.85, 'ftlru');
  }

  // ---- the spire
  const sc = (T1.s0 + T1.s1) / 2, yS = Y(HT.spire), [spx, spz] = toMap(sc, 0), dark = '#2b2c2f';
  B.det.setColor(dark);
  // the flare: two square frusta (a cylinder of four sides turned 45 degrees) with a concave profile
  B.det.with(mT, (q) => {
    const sq = (y, r0, r1, h) => q.with(M4(sc, 0, 0, PI / 4), (qq) => qq.cyl(0, y, 0, r0 * Math.SQRT2, r1 * Math.SQRT2, h, 4, true));
    sq(yS, 5.0, 4.9, 0.25); sq(yS + 0.25, 4.9, 3.9, 0.5); sq(yS + 0.75, 3.9, 3.1, 0.75);
  });
  // the square lantern with a louvred arch on each face, a cornice, then the tiered cone
  const lanY0 = yS + 1.5, lanY1 = yS + 5.6, LH = 2.9;
  B.det.with(mT, (q) => { q.box(sc - LH, lanY0, -LH, sc + LH, lanY1, LH, 1 | 2 | 16 | 32); });
  const lf = [mk([sc - LH, -LH], [sc - LH, LH], toMap(5, 0)), mk([sc + LH, LH], [sc + LH, -LH], toMap(5, 0)), mk([sc - LH, -LH], [sc + LH, -LH], toMap(5, 0)), mk([sc + LH, LH], [sc - LH, LH], toMap(5, 0))];
  for (const fa of lf) {
    windowA(B, fa, { s: fa.L / 2, y0: lanY0 + 0.5, w: 1.5, h: 2.1, rise: 0.7, sur: 0.2, off: 0.04, glass: '#7a3524', surCol: '#3b3c40' });
    for (const s of [0.28, fa.L - 0.28]) { B.det.setColor('#34353a'); box(B.det, fa, s - 0.25, s + 0.25, lanY0, lanY1, 0, 0.1, 'ftlr'); }
    B.det.setColor(dark); box(B.det, fa, -0.25, fa.L + 0.25, lanY1, lanY1 + 0.4, 0, 0.4, 'ftlru');
  }
  B.det.setColor(dark);
  B.det.lathe([[3.0, lanY1 + 0.4], [2.8, lanY1 + 0.8], [2.3, lanY1 + 1.2], [2.2, lanY1 + 1.5], [2.3, lanY1 + 2.3], [2.6, lanY1 + 2.6], [2.1, lanY1 + 2.9], [1.95, lanY1 + 3.3], [2.05, lanY1 + 3.9], [1.75, lanY1 + 4.3], [1.35, lanY1 + 5.4], [0.95, lanY1 + 6.6], [0.6, lanY1 + 7.6], [0.3, lanY1 + 8.2], [0.0, lanY1 + 8.6]], 8, spx, spz);
  const tip = lanY1 + 8.6;
  B.det.setColor(COL.gold); B.det.ellipsoid([spx, tip + 0.3, spz], [0.5, 0.5, 0.5], 10, 7);
  B.det.cyl(spx, tip + 0.7, spz, 0.1, 0.1, 3.0, 6, true);
  B.det.with(mT, (q) => { q.box(sc - 0.07, tip + 2.4, -0.75, sc + 0.07, tip + 2.6, 0.75); });
  // the moon sphere: a two-coloured ball in the round window, turned by the lunar phase (a separate mesh)
  const [mx, mz] = at(A.front, A.front.L / 2, Y(22.1), -0.25).filter((_, i) => i !== 1), moonGeo = new THREE.SphereGeometry(0.85, 24, 16);
  { const Pp = moonGeo.attributes.position, col = new Float32Array(Pp.count * 3), gold = new THREE.Color('#e0b02e').convertSRGBToLinear(), black = new THREE.Color('#121316').convertSRGBToLinear();
    for (let i = 0; i < Pp.count; i++) { const c = Pp.getX(i) > 1e-4 ? gold : black; col.set([c.r, c.g, c.b], i * 3); }
    moonGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }

  // ================================================================ the nave and the apse
  const wall = (a, b) => { // one run of wall between plan points: skin, plinth, pilasters, windows
    const fa = mk(a, b);
    P.setColor(COL.ochre); rect(P, fa, 0, fa.L, gLo, Y(HT.cornice), 0, UVM);
    ST.setColor(COL.plinth); box(ST, fa, -0.1, fa.L + 0.1, gLo, Y(HT.plinth), 0, 0.12, 'ftlr', [1.2, 1.2]);
    entab(fa, -0.2, fa.L + 0.2, 0.75);
    const nb = Math.max(1, Math.round(fa.L / 4.7));
    for (let k = 0; k <= nb; k++) { const c = k * fa.L / nb, w = k === 0 || k === nb ? 0.6 : 0.55; pilaster(B, fa, Math.max(-0.1, c - w), Math.min(fa.L + 0.1, c + w), Y(HT.plinth), Y(HT.cap), 0.2, COL.cream, 0.7); }
    for (let k = 0; k < nb; k++) windowA(B, fa, { s: (k + 0.5) * fa.L / nb, y0: Y(4.6), w: 1.7, h: 5.4, rise: 0.85, sur: 0.34, sill: true, lit: true, glass: '#566a84' });
    return fa;
  };
  const sides = [wall([0, -9.2], [28.3, -9.2]), wall([28.3, 9.2], [0, 9.2])];
  for (let i = 1; i < PLAN.length - 2; i++) {
    const a = PLAN[i], b = PLAN[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const fa = mk(a, b);
    P.setColor(COL.ochre); rect(P, fa, 0, fa.L, gLo, Y(HT.cornice), 0, UVM);
    ST.setColor(COL.plinth); box(ST, fa, -0.1, fa.L + 0.1, gLo, Y(HT.plinth), 0, 0.12, 'ftlr', [1.2, 1.2]);
    entab(fa, -0.2, fa.L + 0.2, 0.75);
    for (const s of [0, fa.L]) pilaster(B, fa, Math.max(-0.1, s - 0.5), Math.min(fa.L + 0.1, s + 0.5), Y(HT.plinth), Y(HT.cap), 0.2, COL.cream, 0.7);
    if (len > 2.5) windowA(B, fa, { s: fa.L / 2, y0: Y(4.6), w: len > 5 ? 1.9 : 1.4, h: 5.4, rise: 0.85, sur: 0.32, sill: true, lit: true, glass: '#566a84' });
  }
  // the nave roof: two slopes, the apse a fan of facets from the ridge's end, a cupola on the apse
  const R = Y(HT.ridge), E = Y(HT.cornice) + 0.3, p3 = ([s, t], y) => { const [x, z] = toMap(s, t); return [x, y, z]; };
  B.roof.setColor(COL.sheet);
  roofPoly(B.roof, [p3([-0.45, -9.7], E - 0.4), p3([28.3, -9.7], E - 0.4), p3([28.3, 0], R), p3([-0.45, 0], R)], 2);
  roofPoly(B.roof, [p3([28.3, 9.7], E - 0.4), p3([-0.45, 9.7], E - 0.4), p3([-0.45, 0], R), p3([28.3, 0], R)], 2);
  const apexA = p3([28.3, 0], R), ap = PLAN.slice(1, 9).map(([s, t]) => p3([s + (s > 28.5 ? 0.25 : 0), t * 1.04], E - 0.4));
  for (let i = 0; i + 1 < ap.length; i++) roofPoly(B.roof, [ap[i], ap[i + 1], apexA], 2);
  { const [cx, cz] = toMap(33.3, 0), cy = R - 3.3;
    B.det.setColor(dark); B.det.lathe([[2.0, cy], [1.9, cy + 0.6], [1.4, cy + 1.1], [1.35, cy + 2.0], [1.7, cy + 2.2], [1.1, cy + 2.7], [0.6, cy + 3.3], [0.0, cy + 3.8]], 8, cx, cz);
    B.det.setColor(COL.gold); B.det.ellipsoid([cx, cy + 4.0, cz], [0.25, 0.25, 0.25], 8, 5); B.det.cyl(cx, cy + 4.2, cz, 0.05, 0.05, 1.4, 5, true);
    B.det.with(mT, (q) => q.box(33.3 - 0.04, cy + 4.9, -0.4, 33.3 + 0.04, cy + 5.0, 0.4)); }
  for (const s of [9, 19]) { const [x, z] = toMap(s, 0); B.det.setColor(COL.gold); B.det.cyl(x, R, z, 0.06, 0.06, 1.2, 5, true); B.det.with(mT, (q) => q.box(s - 0.04, R + 0.8, -0.35, s + 0.04, R + 0.88, 0.35)); }

  // ---- floodlights and colliders
  wash.push(at(f, 4, Y(0.5), 6), at(f, 14.5, Y(0.5), 6), at(sides[0], 8, Y(0.5), 4), at(sides[1], 8, Y(0.5), 4));
  S.prism(ring.flat(), gLo, Y(HT.cornice), 0, 0, 'wall');
  const k = (R - E) / 9.7;
  slopeSolid(S, [toMap(0, -9.2), toMap(28.3, -9.2), toMap(28.3, 0), toMap(0, 0)], Y(HT.cornice) - 0.3, p3([0, -9.2], E - 0.4), V, k);
  slopeSolid(S, [toMap(0, 9.2), toMap(28.3, 9.2), toMap(28.3, 0), toMap(0, 0)], Y(HT.cornice) - 0.3, p3([0, 9.2], E - 0.4), [-V[0], -V[1]], k);
  S.obox(...toMap((T1.s0 + T1.s1) / 2, 0), (T1.s1 - T1.s0) / 2, T1.t, UA, Y(HT.cornice), Y(HT.tower2), 'tower');
  S.cyl(...toMap(sc, 0), Y(HT.tower2), yS + 4.5, 4.4, 2.8, 'roof');
  S.cyl(...toMap(sc, 0), yS + 4.5, tip + 2.6, 2.4, 0.3, 'roof');
  for (const [a, b] of [[0.7, 4.6], [13.8, 17.7]]) S.obox(...toMap(1.8, (a + b) / 2 - 9.2), 1.8, (b - a) / 2, UA, Y(HT.cornice), Y(HT.attic), 'wall');

  return { footprints: [{ poly: ring, h: tip + 2.6 - gLo, kind: 'church', name: 'Biserica cu Lună', id: MOON_ID }], moon: { geo: moonGeo, pos: [mx, Y(22.1), mz], yaw: -UA, nrm: A.front.N }, top: tip + 2.6 };
}
