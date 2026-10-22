// OWNER: oradea. The Franciscan church of Olosig, «Coborârea Sfântului Duh» (Strada Dunărea 1, OSM way 286245391): a church of 1732–43 whose tower
// (1876, Knapp) and front were raised again in 1903–05 by Kálmán Rimanóczy Jr. into a neo-Baroque three-tower front – a tall clock tower between
// two lower belfries under dark lead domes, the portal at the foot of the middle tower, a balustrade on the terrace between them – on a cruciform
// plan with shallow transepts, a narrower chancel and a polygonal apse; ochre plaster with a brown rusticated plinth and a blue-grey metal roof.
// Sources: Wikimedia Commons photographs of the front (2015), the Hungarian Wikipedia entry, the Esri aerial of 2025 (roof colour and plan), the OSM ring.
//   buildDuh({ B, S, g }) -> { footprints, stats, top }
import {
  begin, end, edgeFrame, at, nrm, slab, poly, win, door, oval, oculus, frontFrame, sideFrame, lathe, PROFILES, cross, ball, GOLD, fanRoof, gable,
  gableSolid, shaft, column, entab, PI,
} from './kit.js';

export const DUH_ID = 286245391;
const FC = [227.85, -829.45], YAW = -1.5755;                 // the front's middle and the direction of the nave (north), from the ring
const U = [Math.cos(YAW), Math.sin(YAW)], V = [-U[1], U[0]];
const toW = (u, v) => [FC[0] + U[0] * u + V[0] * v, FC[1] + U[1] * u + V[1] * v];
const WF = 9.8, NV = 8.4, ARM = 11.5, UT0 = 30.5, UT1 = 45.3, UCH = 51.0, RC = 6.7;   // the plan
const EA = 13.0, EC = 9.4;                                   // eave heights of the nave and the chancel
const CREAM = '#d4bb90', TRIM = '#e8dec4', PLINTH = '#a9725d', LEAD = '#4a4b53', ROOF = '#7f92a0', GLASS = '#2f3b4f', DOOR = '#5e3d24';

// a dark clock face with light hands on a plane
function clock(B, F, w, y, r) {
  const n = 16, pt = (rr, i, d) => F.pt(w + Math.cos(i / n * 2 * PI) * rr, y + Math.sin(i / n * 2 * PI) * rr, d);
  B.det.setColor('#25262b'); B.det.face(Array.from({ length: n }, (_, i) => pt(r, i, 0.08)), nrm(F));
  B.wall.setColor(TRIM); for (let i = 0; i < n; i++) B.wall.face([pt(r * 1.18, i, 0.05), pt(r * 1.18, i + 1, 0.05), pt(r, i + 1, 0.05), pt(r, i, 0.05)], nrm(F));
  B.det.setColor('#ebe6d6'); F.slab(B.det, w - 0.045, w + 0.045, y, y + r * 0.78, 0.08, 0.13, 'f'); F.slab(B.det, w, w + r * 0.55, y - 0.045, y + 0.045, 0.08, 0.13, 'f');
}

export function buildDuh({ B, S, g }) {
  const st = { windows: 0, towers: 3, solids: 0 };
  // ---- the plan, in the frame (u from the front to the altar, v across, the ring is positive-area)
  const P = [[0, -WF], [UT0, -NV], [UT0, -ARM], [UT1, -ARM], [UT1, -RC], [UCH, -RC]];
  for (let k = 1; k <= 4; k++) { const th = (-90 + 36 * k) * PI / 180; P.push([UCH + RC * Math.cos(th), RC * Math.sin(th)]); }
  P.push([UCH, RC], [UT1, RC], [UT1, ARM], [UT0, ARM], [UT0, NV], [0, WF]);
  let hi = -1e9, lo = 1e9;
  for (const [u, v] of P) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.15, gLo = lo - 0.5, Y = (h) => Fy + h, eaveY = Y(EA), eaveC = Y(EC);
  begin(B, FC[0], FC[1], YAW);
  const E = P.map((a, i) => edgeFrame(a, P[(i + 1) % P.length]));

  // ---- walls: nave, arms, chancel, apse
  const wall = (f, eave, o = {}) => {
    B.wall.setColor(CREAM); slab(B.wall, f, 0, f.L, gLo, eave, 0, 0, 'f');
    B.wall.setColor(PLINTH); slab(B.wall, f, -0.05, f.L + 0.05, gLo, Y(1.5), 0, 0.12, 'ft');
    B.wall.setColor(TRIM); slab(B.wall, f, -0.3, f.L + 0.3, eave - 0.6, eave + 0.06, 0, 0.38, 'ftb');
    const n = o.n ?? Math.max(1, Math.round(f.L / (o.bay ?? 4.3))), bay = f.L / n, ww = o.w ?? 1.7, wh = o.h ?? 5.4, wy = Y(o.y ?? 3.0);
    for (let k = 0; k < n; k++) {
      win(B, f, (k + 0.5) * bay, wy, ww, wh, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.18, d: 0.06 }); st.windows++;
      if (o.oval) oval(B, f, (k + 0.5) * bay, wy + wh + 1.2, 0.5, 0.7, { trim: TRIM, glass: GLASS, ring: 0.14, d: 0.05 });
    }
    if (n > 1) for (let k = 0; k <= n; k++) { B.wall.setColor(TRIM); slab(B.wall, f, k * bay - 0.3, k * bay + 0.3, Y(1.5), eave - 0.6, 0, 0.13, 'flr'); }
    else { B.wall.setColor(TRIM); for (const s of [0.2, f.L - 0.2]) slab(B.wall, f, s - 0.3, s + 0.3, Y(1.5), eave - 0.6, 0, 0.13, 'flr'); }
  };
  wall(E[0], eaveY, { n: 7, oval: true }); wall(E[14], eaveY, { n: 7, oval: true });
  for (const i of [1, 13, 3, 11]) wall(E[i], eaveY, { n: 1, w: 1.3, h: 4.4, y: 3.5 });
  for (const i of [2, 12]) wall(E[i], eaveY, { n: 1, w: 2.4, h: 6.6, y: 3.4 });
  for (const i of [4, 10]) wall(E[i], eaveC, { n: 1, w: 1.5, h: 4.2, y: 2.6 });
  for (const i of [5, 6, 7, 8, 9]) wall(E[i], eaveC, { n: 1, w: 1.4, h: 4.2, y: 2.6 });
  // a round window in the gable of each arm
  for (const i of [2, 12]) oculus(B, E[i], E[i].L / 2, eaveY + 1.9, 0.6, { trim: TRIM, glass: GLASS, ring: 0.18, d: 0.05 });

  // ---- roofs: the nave and the transept as one cross, the lower chancel, the apse cone; a cross at the crossing
  const rise = 4.4, UR = (UT0 + UT1) / 2;
  const R = (o) => gable(B.sheet, { ov: 0.5, rake: 0.3, col: ROOF, gcol: CREAM, G: B.wall, ...o });
  R({ a0: 0.2, a1: UR, b0: -9.0, b1: 9.0, yE: eaveY, yR: eaveY + rise, ridge: 'u' });
  R({ a0: -ARM, a1: ARM, b0: UT0, b1: UT1, yE: eaveY, yR: eaveY + rise, ridge: 'v' });
  R({ a0: UT1 - 0.8, a1: UCH, b0: -RC, b1: RC, yE: eaveC, yR: eaveC + 3.3, ridge: 'u' });
  const apex = [UCH - 0.1, eaveC + 2.3, 0];
  const eaveP = P.slice(5, 11).map(([u, v]) => { const dx = u - apex[0], dz = v - apex[2], d = Math.hypot(dx, dz) || 1; return [u + dx / d * 0.35, eaveC - 0.18, v + dz / d * 0.35]; });
  fanRoof(B.sheet, apex, eaveP, ROOF);
  cross(B.cap, UR, eaveY + rise + 0.05, 0, 2.4, GOLD, 0); cross(B.cap, UCH - 0.3, apex[1] + 0.02, 0, 1.5, GOLD);

  // ---- the front
  const FF = frontFrame(0, -WF, WF, -1);
  B.wall.setColor(CREAM); for (const [a, b] of [[3.1, 5.0], [-5.0, -3.1]]) FF.rect(B.wall, a, b, gLo, eaveY, 0);
  B.wall.setColor(PLINTH); for (const [a, b] of [[3.1, 5.0], [-5.0, -3.1]]) FF.slab(B.wall, a, b, gLo, Y(2.4), 0, 0.12, 'ft');
  for (const [a, b] of [[3.1, 5.0], [-5.0, -3.1]]) {
    entab(B, FF, a, b, eaveY - 1.1, 1.1, { col: TRIM, frieze: CREAM, d0: -0.1, proj: 0.4 });
    const m = (a + b) / 2;
    FF.win(B, m, Y(6.4), 1.1, 3.2, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.2, d: 0.06 });
    B.wall.setColor(TRIM); FF.slab(B.wall, m - 0.7, m + 0.7, Y(5.4), Y(6.3), 0, 0.28, 'ftlr');         // the balcony under it
    st.windows++;
    // the balustrade of the terrace over the wing
    B.wall.setColor(TRIM); FF.slab(B.wall, a, b, eaveY + 0.35, eaveY + 0.55, 0, 0.3, 'ftlr'); FF.slab(B.wall, a, b, eaveY + 1.1, eaveY + 1.3, 0, 0.3, 'ftlr');
    for (let w = a + 0.15; w < b - 0.1; w += 0.42) FF.slab(B.wall, w, w + 0.18, eaveY + 0.55, eaveY + 1.1, 0.05, 0.23, 'flr');
  }
  // the middle tower
  const cu0 = -0.4, cu1 = 6.0, cv = 3.1, Fc = frontFrame(cu0, -cv, cv, -1);
  shaft(B, { u0: cu0, u1: cu1, v0: -cv, v1: cv, y0: gLo, y1: Y(24.5), wall: CREAM, trim: TRIM, pil: 0.7, bands: [], wins: [{ y: Y(16.5), w: 0.7, h: 2.6, kind: 'flat' }], cornice: 0.8 });
  B.wall.setColor(PLINTH); Fc.slab(B.wall, -cv - 0.05, cv + 0.05, gLo, Y(2.4), 0, 0.14, 'ft');
  // the portal: two columns, an entablature, a pediment; the arched window over it with its own pediment
  Fc.door(B, 0, Y(0.2), 2.2, 4.3, { kind: 'round', col: DOOR, trim: TRIM, sur: 0.32, d: 0.1 });
  for (const s of [-1, 1]) column(B, Fc, s * 1.95, 0.3, Y(0.2), Y(5.2), 0.5, { col: TRIM, capH: 0.45 });
  entab(B, Fc, -2.5, 2.5, Y(5.2), 0.95, { col: TRIM, frieze: CREAM, d0: -0.1, proj: 0.55 });
  B.wall.setColor(TRIM); poly(B.wall, [Fc.pt(-2.6, Y(6.15), 0.5), Fc.pt(2.6, Y(6.15), 0.5), Fc.pt(0, Y(7.0), 0.4)], [-1, 0, 0]);
  Fc.win(B, 0, Y(8.0), 1.8, 3.7, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.24, d: 0.08, bars: true });
  B.wall.setColor(TRIM); poly(B.wall, [Fc.pt(-1.5, Y(12.0), 0.2), Fc.pt(1.5, Y(12.0), 0.2), Fc.pt(0, Y(12.9), 0.16)], [-1, 0, 0]);
  Fc.slab(B.wall, -1.6, 1.6, Y(11.85), Y(12.05), 0, 0.3, 'ftlr');
  st.windows += 2;
  // the second stage: louvres, the clock on every face, the balcony under it
  const i2 = 0.25, s2 = { u0: cu0 + i2, u1: cu1 - i2, v0: -cv + i2, v1: cv - i2 };
  shaft(B, { ...s2, y0: Y(24.5), y1: Y(33.0), wall: CREAM, trim: TRIM, pil: 0.55, bel: { y: Y(25.9), h: 2.5, w: 1.0 }, cornice: 0.7 });
  const faces2 = [frontFrame(s2.u0, s2.v0, s2.v1, -1), frontFrame(s2.u1, s2.v0, s2.v1, +1), sideFrame(s2.v0, s2.u0, s2.u1, -1), sideFrame(s2.v1, s2.u0, s2.u1, +1)];
  for (const F2 of faces2) clock(B, F2, F2.axis === 'u' ? (s2.v0 + s2.v1) / 2 : (s2.u0 + s2.u1) / 2, Y(30.2), 1.25);
  B.wall.setColor(TRIM);
  Fc.slab(B.wall, -2.1, 2.1, Y(24.4), Y(24.7), 0, 0.95, 'ftlr');                                          // the balcony slab
  for (const s of [-1.6, 1.6]) Fc.slab(B.wall, s - 0.22, s + 0.22, Y(23.2), Y(24.4), 0, 0.7, 'flr');   // two consoles
  Fc.slab(B.wall, -2.1, 2.1, Y(25.35), Y(25.5), 0.8, 0.95, 'ftlr');
  for (let w = -1.95; w < 2.0; w += 0.4) Fc.slab(B.wall, w, w + 0.15, Y(24.7), Y(25.35), 0.8, 0.95, 'flr');
  // the third stage under the dome
  const i3 = 0.7, s3 = { u0: cu0 + i3, u1: cu1 - i3, v0: -cv + i3, v1: cv - i3 };
  shaft(B, { ...s3, y0: Y(33.0), y1: Y(39.0), wall: CREAM, trim: TRIM, pil: 0.5, bel: { y: Y(34.3), h: 3.2, w: 1.2 }, cornice: 0.7 });
  const cx = (s3.u0 + s3.u1) / 2, cz = 0, domeY = Y(39.2);
  B.det.setColor(LEAD); B.wall.setColor(TRIM); B.wall.cyl(cx, domeY - 0.2, cz, 2.9, 2.9, 0.7, 12, true);
  lathe(B.det, PROFILES.dome, 14, cx, cz, domeY + 0.45, 3.0, 5.4); B.wall.cyl(cx, domeY + 5.7, cz, 0.55, 0.45, 1.1, 8, true);
  B.det.setColor(LEAD); lathe(B.det, PROFILES.dome, 10, cx, cz, domeY + 6.7, 0.6, 0.9);
  ball(B.cap, cx, domeY + 7.7, cz, 0.28); cross(B.cap, cx, domeY + 7.75, cz, 2.4, GOLD, 0);
  const tipC = domeY + 10;
  // the two side towers: a door, windows, a belfry with open arches and a dome
  const tips = [];
  for (const s of [-1, 1]) {
    const v0 = s < 0 ? -WF - 0.05 : 5.0, v1 = s < 0 ? -5.0 : WF + 0.05, u0 = -0.2, u1 = 4.9;
    shaft(B, { u0, u1, v0, v1, y0: gLo, y1: eaveY, wall: CREAM, trim: TRIM, pil: 0.65, cornice: 0.8, wins: [] });
    const Fs = frontFrame(u0, v0, v1, -1), m = (v0 + v1) / 2, Fo = sideFrame(s < 0 ? v0 : v1, u0, u1, s);
    B.wall.setColor(PLINTH); Fs.slab(B.wall, v0 - 0.05, v1 + 0.05, gLo, Y(2.4), 0, 0.14, 'ft'); Fo.slab(B.wall, u0 - 0.05, u1 + 0.05, gLo, Y(2.4), 0, 0.14, 'ft');
    Fs.door(B, m, Y(0.2), 1.5, 3.2, { kind: 'round', col: DOOR, trim: TRIM, sur: 0.26, d: 0.08 });
    Fs.oval(B, m, Y(6.7), 0.55, 0.8, { trim: TRIM, glass: GLASS, ring: 0.16, d: 0.05 });
    Fs.win(B, m, Y(8.6), 1.2, 2.8, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.2, d: 0.06 });
    Fo.win(B, (u0 + u1) / 2, Y(4.5), 1.2, 3.2, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.2, d: 0.06 });
    Fo.win(B, (u0 + u1) / 2, Y(9.2), 1.2, 2.6, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.2, d: 0.06 });
    st.windows += 4;
    const bi = 0.35, bu0 = u0 + bi, bu1 = u1 - bi, bv0 = v0 + bi + (s < 0 ? 0.05 : 0), bv1 = v1 - bi - (s > 0 ? 0.05 : 0);
    shaft(B, { u0: bu0, u1: bu1, v0: bv0, v1: bv1, y0: eaveY, y1: Y(20.6), wall: CREAM, trim: TRIM, pil: 0.5, bel: { y: Y(14.7), h: 3.4, w: 1.5, glass: '#1d1f24' }, cornice: 0.7 });
    const bx = (bu0 + bu1) / 2, bz = (bv0 + bv1) / 2, dY = Y(20.9);
    B.det.setColor(LEAD); lathe(B.det, PROFILES.dome, 12, bx, bz, dY, 2.35, 3.6); B.wall.setColor(TRIM); B.wall.cyl(bx, dY + 3.5, bz, 0.45, 0.38, 0.8, 8, true);
    B.det.setColor(LEAD); lathe(B.det, PROFILES.dome, 8, bx, bz, dY + 4.2, 0.5, 0.7);
    ball(B.cap, bx, dY + 5.0, bz, 0.22); cross(B.cap, bx, dY + 5.05, bz, 1.8, GOLD, 0);
    tips.push([bx, bz, dY + 7]);
    S.prism([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v)).flat(), gLo, Y(21), 0, 0, 'tower'); st.solids++;
    S.cyl(...toW(bx, bz), Y(21), dY + 6.8, 1.1, 0.2, 'tower'); st.solids++;
  }
  end(B);

  // ---- colliders and the footprint
  const wr = P.map(([u, v]) => toW(u, v));
  S.prism(wr.flat(), gLo, eaveC, 0, 0, 'wall'); st.solids++;
  S.prism([[0, -WF], [UT0, -NV], [UT0, -ARM], [UT1, -ARM], [UT1, ARM], [UT0, ARM], [UT0, NV], [0, WF]].map(([u, v]) => toW(u, v)).flat(), gLo, eaveY, 0, 0, 'wall'); st.solids++;
  const F = { cx: FC[0], cz: FC[1], U, V };
  gableSolid(S, F, toW, { u0: 0.2, u1: UT1, vt: -9, vb: 9, eaveY, rise }); gableSolid(S, F, toW, { u0: UT0, u1: UT1, vt: -ARM, vb: ARM, eaveY, rise, across: true }); st.solids += 4;
  S.prism([[cu0, -cv], [cu1, -cv], [cu1, cv], [cu0, cv]].map(([u, v]) => toW(u, v)).flat(), gLo, domeY, 0, 0, 'tower'); st.solids++;
  S.cyl(...toW(cx, cz), domeY, tipC + 1.5, 1.4, 0.2, 'tower'); st.solids++;
  void door; void tips;
  return { footprints: [{ poly: wr, h: tipC + 3 - gLo, kind: 'church', name: 'Biserica «Coborârea Sfântului Duh»', id: DUH_ID }], stats: st, top: tipC + 3 };
}
