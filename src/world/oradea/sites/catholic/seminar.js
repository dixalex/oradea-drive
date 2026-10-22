// OWNER: oradea. The Greek Catholic church of the Seminary, «Sfântul Gheorghe» (Biserica Seminarului, Parcul Traian 20, OSM way 312206820): built
// 1858 in a neo-Romanesque style that Oradea's Greek Catholics liked, a salmon-pink and white nave of arched bays with a Lombard frieze, a
// six-sided apse, a tower on the front with the entrance in its base (two low flanks, a lancet panel, a belfry of pink faces between white
// corner pinnacles, a balustrade and a blue octagonal spire), and the seminary wing leaning on its west wall. Sources: Wikimedia Commons photographs
// of the front, the side and the apse (2010–12), the Esri aerial of 2025 for the plan and the roof (the nave shows a red tile roof now, the
// photographs a blue one; the apse, flashings and spire are drawn blue).
//   buildSeminar({ B, S, g, ring }) -> { footprints, stats, top }
import { frameOf } from './church.js';
import {
  begin, end, edgeFrame, at, nrm, rect, slab, poly, win, door, oculus, oval, outline, frontFrame, sideFrame, lathe, PROFILES, cross, ball, GOLD,
  fanRoof, gable, gableSolid, ringArea, PI,
} from './kit.js';

export const SEMINAR_ID = 312206820;
const PINK = '#d98a80', WHITE = '#ece5d7', PLINTH = '#b9ad9d', BLUE = '#3b58a8', ROOF = '#b6532f', GLASS = '#3b4a66', DARK = '#33231c';
const U_F = -16.86, U_A = 10.0, VR0 = -6.7, VR1 = -7.0, VL0 = 5.0, VL1 = 6.95;   // the plan in the frame of frameOf (+u front to altar)
const U_T = U_F + 5.6, EAVE = 7.8, FLANK = 6.2, T_COR = 13.4, T_TOP = 19.5;

// a white arched panel on a wall edge with a window in it: s centre, panel width w, the panel from y0 to y1, the window w x h from wy
function bay(B, f, s, w, y0, y1, o = {}) {
  const P = outline(s, y0, w, y1 - y0, 'round', 6);
  B.wall.setColor(WHITE); B.wall.face(P.map(([a, b]) => at(f, a, b, 0.05)), nrm(f));
  if (o.win !== false) {
    const ww = o.ww ?? Math.min(1.5, w * 0.5), wh = o.wh ?? Math.max(2, y1 - y0 - 1.8);
    win(B, f, s, y0 + (o.sill ?? 1.0), ww, wh, { kind: 'round', trim: WHITE, glass: GLASS, sur: 0.12, d: 0.08, bars: false });
    B.sheet.setColor(BLUE); slab(B.sheet, f, s - ww / 2 - 0.2, s + ww / 2 + 0.2, y0 + (o.sill ?? 1.0) - 0.12, y0 + (o.sill ?? 1.0) - 0.04, 0, 0.3, 'ft');
  }
}
// the Lombard frieze under the eave: a white band with pink teeth hanging from the cornice
function frieze(B, f, s0, s1, eave) {
  B.wall.setColor(WHITE); slab(B.wall, f, s0 - 0.05, s1 + 0.05, eave - 1.15, eave - 0.05, 0, 0.08, 'ft');
  B.wall.setColor(PINK);
  for (let s = s0 + 0.35; s + 0.5 <= s1 - 0.2; s += 0.95) slab(B.wall, f, s, s + 0.5, eave - 1.0, eave - 0.45, 0.08, 0.14, 'flr');
  B.wall.setColor(WHITE); slab(B.wall, f, s0 - 0.22, s1 + 0.22, eave - 0.07, eave + 0.18, 0, 0.32, 'ftb');
}

export function buildSeminar({ B, S, g, ring }) {
  const st = { windows: 0, towers: 1, solids: 0 };
  const F = frameOf(ring, { faceTo: [623, -500] }), toW = F.toMap;
  // ---- the outline: the front, the straight right wall, a six-sided apse, the slightly slanted left wall
  const rC = (VL1 - VR1) / 2, vC = (VL1 + VR1) / 2, P = [[U_F, VR0], [U_A, VR1]];
  for (let k = 1; k <= 5; k++) { const th = (-90 + k * 30) * PI / 180; P.push([U_A + rC * Math.cos(th), vC + rC * Math.sin(th)]); }
  P.push([U_A, VL1], [U_F, VL0]);
  const R = ringArea(P) > 0 ? P : P.slice().reverse();
  let hi = -1e9, lo = 1e9;
  for (const [u, v] of R) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.15, gLo = lo - 0.5, Y = (h) => Fy + h, eaveY = Y(EAVE), flankY = Y(FLANK);
  const wallV = (a, b, u) => a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]);
  const vRt = (u) => wallV(P[0], P[1], u), vLt = (u) => wallV([U_F, VL0], [U_A, VL1], u);
  begin(B, F.cx, F.cz, F.yaw);
  const E = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));

  // ---- the long walls and the apse
  for (const f of E) {
    const isFront = f.n[0] < -0.9;
    if (isFront) continue;
    const apse = f.a[0] >= U_A - 0.01 && f.b[0] >= U_A - 0.01, long = !apse;
    if (long) {
      // split at the tower's back face: the flank part is low, the rest full height
      const sSplit = U_T - (f.a[0] < f.b[0] ? f.a[0] : f.b[0]); const fwd = f.a[0] < f.b[0];
      const parts = fwd ? [[0, sSplit, FLANK], [sSplit, f.L, EAVE]] : [[0, f.L - sSplit, EAVE], [f.L - sSplit, f.L, FLANK]];
      for (const [s0, s1, eh] of parts) {
        B.wall.setColor(PINK); rect(B.wall, f, s0, s1, gLo, Y(eh));
        B.wall.setColor(PLINTH); slab(B.wall, f, s0 - 0.04, s1 + 0.04, gLo, Y(0.95), 0, 0.12, 'ft');
        frieze(B, f, s0, s1, Y(eh));
        const n = Math.max(1, Math.round((s1 - s0) / 4.3)), w = (s1 - s0) / n;
        for (let k = 0; k < n; k++) { bay(B, f, s0 + (k + 0.5) * w, Math.min(3.1, w - 0.9), Y(0.95), Y(eh) - 1.5, { wh: eh === FLANK ? 3.0 : 3.9 }); st.windows++; }
      }
    } else {
      B.wall.setColor(PINK); rect(B.wall, f, 0, f.L, gLo, Y(EAVE));
      B.wall.setColor(PLINTH); slab(B.wall, f, -0.04, f.L + 0.04, gLo, Y(0.95), 0, 0.12, 'ft');
      frieze(B, f, 0, f.L, Y(EAVE));
      bay(B, f, f.L / 2, f.L - 0.95, Y(0.95), Y(EAVE) - 1.5, { ww: 1.4, wh: 4.1 }); st.windows++;
    }
  }

  // ---- the nave's front wall above the flanks and the gable end behind the tower, then the roofs
  const FN = frontFrame(U_T, vRt(U_T), vLt(U_T), -1), vcN = (vRt(U_T) + vLt(U_T)) / 2;
  const rise = 3.0, ridgeY = eaveY + rise, ov = 0.5;
  B.wall.setColor(PINK); FN.rect(B.wall, vRt(U_T), vLt(U_T), flankY, eaveY);
  poly(B.wall, [FN.pt(vRt(U_T), eaveY), FN.pt(vLt(U_T), eaveY), FN.pt(vcN, ridgeY)], [-1, 0, 0]);
  const Fe = frontFrame(U_A, vRt(U_A), vLt(U_A), +1);
  poly(B.wall, [Fe.pt(vRt(U_A), eaveY), Fe.pt(vLt(U_A), eaveY), Fe.pt(vC, ridgeY)], [1, 0, 0]);
  const vm = 0.0;   // the ridge line
  const slopeQ = (v0a, v0b, sgn) => {
    // eave points on the wall line (grown outward by ov), the ridge on v = vm; a trapezoid between u = U_T - 0.1 and the apse start
    const ua = U_T - 0.1, ub = U_A;
    const eA = [ua, eaveY - 0.18, v0a + sgn * ov], eB = [ub, eaveY - 0.18, v0b + sgn * ov], rA = [ua, ridgeY, vm], rB = [ub, ridgeY, vm];
    poly(B.tile, [eA, eB, rB, rA], [0, 1, 0]);
  };
  B.tile.setColor(ROOF); slopeQ(vRt(U_T), vRt(U_A), -1); slopeQ(vLt(U_T), vLt(U_A), +1);
  // the apse: a half cone of six facets, blue
  const apsePts = R.filter((p) => p[0] >= U_A - 0.01 && Math.abs(p[0] - U_A) + Math.abs(p[1] - vC) < 20).sort((a, b) => a[1] - b[1]);
  const apex = [U_A - 0.2, ridgeY - 1.1, vC], eaveP = apsePts.map(([u, v]) => { const dx = u - apex[0], dz = v - apex[2], d = Math.hypot(dx, dz) || 1; return [u + dx / d * 0.35, eaveY - 0.18, v + dz / d * 0.35]; });
  B.sheet.setColor(BLUE); fanRoof(B.sheet, apex, eaveP, BLUE);
  cross(B.cap, U_A - 0.1, apex[1] + 0.05, vC, 1.4, GOLD);
  // the flanks' shed roofs, blue, rising to the tower; a small cross-gable cap on each
  const vTc = (VR0 + VL0) / 2, tw = 2.8;
  for (const sgn of [-1, 1]) {
    const vOut = sgn < 0 ? VR0 - 0.3 : VL0 + 0.3, vIn = vTc + sgn * tw;
    poly(B.sheet, [[U_F - 0.3, flankY - 0.1, vOut], [U_T, flankY - 0.1, vOut], [U_T, flankY + 1.2, vIn], [U_F - 0.3, flankY + 1.2, vIn]], [0, 1, 0]);
  }

  // ---- the front: flanks, tower base with the porch, the tower
  const FF = frontFrame(U_F, VR0, VL0, -1);
  B.wall.setColor(PINK); FF.rect(B.wall, VR0, VL0, gLo, flankY);
  B.wall.setColor(PLINTH); FF.slab(B.wall, VR0 - 0.05, VL0 + 0.05, gLo, Y(0.95), 0, 0.12, 'ft');
  for (const sgn of [-1, 1]) {
    const w0 = sgn < 0 ? VR0 : vTc + tw, w1 = sgn < 0 ? vTc - tw : VL0, mid = (w0 + w1) / 2;
    // the frieze runs along the front in the plane's own coordinates
    B.wall.setColor(WHITE); FF.slab(B.wall, w0, w1, flankY - 1.15, flankY - 0.05, 0, 0.08, 'ft');
    B.wall.setColor(PINK); for (let w = w0 + 0.3; w + 0.5 <= w1 - 0.15; w += 0.95) FF.slab(B.wall, w, w + 0.5, flankY - 1.0, flankY - 0.45, 0.08, 0.14, 'flr');
    B.wall.setColor(WHITE); FF.slab(B.wall, w0 - 0.2, w1 + 0.2, flankY - 0.07, flankY + 0.18, 0, 0.32, 'ftb');
    const P2 = outline(mid, Y(0.95), 1.8, 3.9, 'round', 6);
    B.wall.setColor(WHITE); B.wall.face(P2.map(([a, b]) => at(FF, FF.sOf(a), b, 0.05)), nrm(FF));
    FF.win(B, mid, Y(1.35), 0.95, 2.9, { kind: 'round', trim: WHITE, glass: GLASS, sur: 0.1, d: 0.08 });
    st.windows++;
  }
  // the tower, as a shaft with the porch, the lancet panel, the cornice
  const Ft = frontFrame(U_F, vTc - tw, vTc + tw, -1);
  const FtL = sideFrame(vTc - tw, U_F, U_T, -1), FtR = sideFrame(vTc + tw, U_F, U_T, +1);
  B.wall.setColor(PINK); Ft.rect(B.wall, vTc - tw, vTc + tw, flankY, Y(T_COR)); FtL.rect(B.wall, U_F, U_T, flankY, Y(T_COR)); FtR.rect(B.wall, U_F, U_T, flankY, Y(T_COR));
  // the porch: two white posts with blue caps, the arched door, a frieze of three diamonds
  for (const s of [-1, 1]) {
    B.wall.setColor(WHITE); Ft.slab(B.wall, vTc + s * 1.7 - 0.28, vTc + s * 1.7 + 0.28, Y(0.9), Y(3.9), 0, 0.5, 'ftlr');
    B.sheet.setColor(BLUE); Ft.slab(B.sheet, vTc + s * 1.7 - 0.36, vTc + s * 1.7 + 0.36, Y(3.9), Y(4.15), -0.05, 0.62, 'ftlr');
  }
  Ft.door(B, vTc, Y(0.4), 1.9, 3.3, { kind: 'round', col: '#2b2b2c', trim: WHITE, sur: 0.3, d: 0.1 });
  B.wall.setColor(WHITE); Ft.slab(B.wall, vTc - 1.4, vTc + 1.4, Y(4.15), Y(4.75), 0, 0.12, 'ftlr');
  B.wall.setColor(PINK); for (const d of [-0.8, 0, 0.8]) { const cx = vTc + d; B.wall.face([Ft.pt(cx - 0.17, Y(4.45), 0.14), Ft.pt(cx, Y(4.62), 0.14), Ft.pt(cx + 0.17, Y(4.45), 0.14), Ft.pt(cx, Y(4.28), 0.14)], nrm(Ft)); }
  // on each face of the shaft: a white panel with a lancet window and an oculus, corner strips, the Lombard frieze, the cornice
  for (const [F2, mid, a, b] of [[Ft, vTc, vTc - tw, vTc + tw], [FtL, (U_F + U_T) / 2, U_F, U_T], [FtR, (U_F + U_T) / 2, U_F, U_T]]) {
    B.wall.setColor(WHITE);
    F2.slab(B.wall, mid - 1.15, mid + 1.15, F2 === Ft ? Y(5.0) : flankY + 0.4, Y(11.7), 0, 0.06, 'ftlr');
    F2.win(B, mid, F2 === Ft ? Y(5.8) : flankY + 1.4, 1.1, 4.2, { kind: 'round', trim: WHITE, glass: GLASS, sur: 0.1, d: 0.1 });
    F2.oculus(B, mid, Y(10.6), 0.5, { trim: WHITE, glass: GLASS, ring: 0.2, d: 0.1, n: 10 });
    B.sheet.setColor(BLUE); F2.slab(B.sheet, mid - 0.8, mid + 0.8, (F2 === Ft ? Y(5.8) : flankY + 1.4) - 0.14, (F2 === Ft ? Y(5.8) : flankY + 1.4) - 0.05, 0, 0.3, 'ft');
    B.wall.setColor(WHITE); for (const w of [a + 0.32, b - 0.32]) F2.slab(B.wall, w - 0.3, w + 0.3, F2 === Ft ? Y(0.95) : flankY, Y(T_COR) - 1.3, 0, 0.07, 'flr');
    B.wall.setColor(PINK); for (let w = a + 0.9; w + 0.45 <= b - 0.8; w += 0.85) F2.slab(B.wall, w, w + 0.45, Y(T_COR) - 1.55, Y(T_COR) - 0.9, 0.0, 0.12, 'flr');
    B.wall.setColor(WHITE); F2.slab(B.wall, a - 0.35, b + 0.35, Y(T_COR) - 0.45, Y(T_COR) + 0.1, 0, 0.5, 'ftb');
    B.sheet.setColor(BLUE); F2.slab(B.sheet, a - 0.38, b + 0.38, Y(T_COR) + 0.1, Y(T_COR) + 0.2, -0.05, 0.54, 'ftlr');
  }
  // the belfry: a pink core between four white corner pinnacles, two arched louvres and a balustrade on every face, a clock oval above
  const bx0 = U_F + 0.3, bx1 = U_T - 0.3, bz0 = vTc - tw + 0.3, bz1 = vTc + tw - 0.3, by0 = Y(T_COR + 0.2), by1 = Y(T_TOP);
  const BF = [frontFrame(bx0, bz0, bz1, -1), frontFrame(bx1, bz0, bz1, +1), sideFrame(bz0, bx0, bx1, -1), sideFrame(bz1, bx0, bx1, +1)];
  B.wall.setColor(PINK); for (const F2 of BF) F2.rect(B.wall, F2.axis === 'u' ? bz0 : bx0, F2.axis === 'u' ? bz1 : bx1, by0, by1, 0);
  for (const F2 of BF) {
    const a = F2.axis === 'u' ? bz0 : bx0, b = F2.axis === 'u' ? bz1 : bx1, m = (a + b) / 2;
    B.wall.setColor(WHITE); F2.slab(B.wall, m - 1.35, m + 1.35, by0 + 0.05, by0 + 1.15, 0, 0.1, 'ftlr');                 // the balustrade panel
    B.wall.setColor(PINK); for (const d of [-0.9, -0.3, 0.3, 0.9]) B.wall.face([F2.pt(m + d - 0.12, by0 + 0.6, 0.12), F2.pt(m + d, by0 + 0.78, 0.12), F2.pt(m + d + 0.12, by0 + 0.6, 0.12), F2.pt(m + d, by0 + 0.42, 0.12)], nrm(F2));
    for (const d of [-0.62, 0.62]) F2.win(B, m + d, by0 + 1.3, 0.85, 2.6, { kind: 'round', trim: WHITE, glass: DARK, sur: 0.1, d: 0.06 });
    F2.oval(B, m, by1 - 1.15, 0.6, 0.5, { trim: PINK, glass: '#ece5d7', ring: 0.14, d: 0.06 });
    B.wall.setColor(WHITE); F2.slab(B.wall, a - 0.15, b + 0.15, by1 - 0.1, by1 + 0.25, 0, 0.3, 'ftb');
  }
  for (const [cu, cv] of [[bx0, bz0], [bx1, bz0], [bx1, bz1], [bx0, bz1]]) {
    B.wall.setColor(WHITE); B.wall.box(cu - 0.35, by0, cv - 0.35, cu + 0.35, by1 + 1.0, cv + 0.35);
    // a little pyramid cap on the post
    const c0 = [[cu - 0.38, cv - 0.38], [cu + 0.38, cv - 0.38], [cu + 0.38, cv + 0.38], [cu - 0.38, cv + 0.38]], ap = [cu, by1 + 1.9, cv];
    B.wall.setColor('#e4dccb');
    for (let i = 0; i < 4; i++) { const p = c0[i], q = c0[(i + 1) % 4]; poly(B.wall, [[p[0], by1 + 1.0, p[1]], [q[0], by1 + 1.0, q[1]], ap], [(p[0] + q[0]) / 2 - cu, 0.4, (p[1] + q[1]) / 2 - cv]); }
  }
  // the open balustrade between the pinnacles: a rail and posts on every side
  for (const F2 of BF) {
    const a = F2.axis === 'u' ? bz0 : bx0, b = F2.axis === 'u' ? bz1 : bx1;
    B.wall.setColor(WHITE); F2.slab(B.wall, a + 0.5, b - 0.5, by1 + 0.7, by1 + 0.85, 0.0, 0.18, 'ftlr');
    for (let w = a + 0.6; w < b - 0.55; w += 0.5) F2.slab(B.wall, w, w + 0.14, by1 + 0.25, by1 + 0.7, 0.02, 0.16, 'flr');
  }
  // the spire: blue, octagonal, on a small drum behind the balustrade
  const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2;
  B.sheet.setColor(BLUE); lathe(B.sheet, PROFILES.needle, 8, cx, cz, by1 + 0.15, 2.05, 8.4, PI / 8);
  const tip = by1 + 0.15 + 8.4;
  ball(B.cap, cx, tip + 0.1, cz, 0.24); cross(B.cap, cx, tip + 0.2, cz, 2.0, GOLD, 0);
  end(B);

  // ---- colliders and the footprint
  const wr = R.map(([u, v]) => toW(u, v));
  S.prism(wr.flat(), gLo, eaveY, 0, 0, 'wall'); st.solids++;
  gableSolid(S, F, toW, { u0: U_T, u1: U_A, vt: vRt(U_A) + ov * 0, vb: vLt(U_A), eaveY, rise }); st.solids += 2;
  S.prism([[U_F, vTc - tw], [U_T, vTc - tw], [U_T, vTc + tw], [U_F, vTc + tw]].map(([u, v]) => toW(u, v)).flat(), gLo, Y(T_TOP + 1.2), 0, 0, 'tower'); st.solids++;
  S.cyl(...toW(cx, cz), Y(T_TOP + 1.2), tip, 1.1, 0.2, 'tower'); st.solids++;
  void gable; void oculus; void door; void oval;
  return { footprints: [{ poly: wr, h: tip - gLo + 1.5, kind: 'church', name: 'Biserica Seminarului «Sfântul Gheorghe»', id: SEMINAR_ID }], stats: st, top: tip + 2 };
}
