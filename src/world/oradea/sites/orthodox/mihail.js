// OWNER: oradea. Biserica «Sfinții Arhangheli Mihail și Gavriil» of Velența (OSM way 286239556, Oradea-Velența): a baroque parish church
// with a west tower, after the Commons photo «Velenta Orthodox Church»: pale-yellow walls with white lisenes and cornices over a salmon
// plinth, tall round-arched windows under small hood mouldings, a grey sheet roof hipped over a five-sided apse, and a three-stage
// tower in the west front (oculus windows, a clock stage, segmental pediments) under a slender grey octagonal spire with a gold ball.
// The plan is the OSM outline: a 26 m nave 14.4 m wide with the apse to the east; the tower is a guess at 8 m wide in the middle of the front.
//   buildMihail({ B, S, g, ring }) -> { footprints, stats, top }
import {
  PI, begin, end, edgeFrame, at, nrm, rect, slab, poly, archOutline, archWin, archDoor, gable, fanRoof, cross, ball, clockFace, rectFrames, GOLD,
} from './kit.js';
import { frameOf } from './church.js';

export const MIHAIL_ID = 286239556;
const C = { wall: '#f7e5ae', white: '#f4efe3', plinth: '#d98f84', roof: '#868b92', spire: '#9ba1a7', glass: '#2a3038', dark: '#1d2026', door: '#5a3a24' };
const SPIRE = [[1.12, 0], [1.0, 0.06], [0.62, 0.4], [0.32, 0.72], [0.14, 0.9], [0.05, 0.98], [0, 1]];

export function buildMihail({ B, S, g, ring }) {
  const F = frameOf(ring), R = F.ring, toW = F.toMap, st = { windows: 0, solids: 0, towers: 1, domes: 0 };
  let hi = -1e9, lo = 1e9;
  for (const [u, v] of R.concat([[0, 0], [-12, 0]])) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.25, gLo = lo - 0.6, Y = (h) => Fy + h;
  const Hw = 8.4, ridge = 14.2, tw = 3.4, minU = F.minU, maxU = F.maxU, uTe = minU + 6.8, nv = Math.max(...R.map((p) => Math.abs(p[1])));
  begin(B, F.cx, F.cz, F.yaw);
  const WL = B.wall, ST = B.stone, DT = B.det;
  const arch = (M, f, s, y0, w, h, d, col, rise = w / 2, n = 5) => { M.setColor(col); M.face(archOutline(s, y0, w, h, rise, n).map(([a, b]) => at(f, a, b, d)), nrm(f)); };
  const lisene = (f, s, y0, y1, w = 0.9, d = 0.1) => { WL.setColor(C.white); slab(WL, f, s - w / 2, s + w / 2, y0, y1, 0, d, 'ftlr'); };
  const cornice = (f, y, over = 0.2, d = 0.4) => { WL.setColor(C.white); slab(WL, f, -over, f.L + over, y - 0.5, y + 0.1, 0, d, 'ftb'); slab(WL, f, -over, f.L + over, y - 0.85, y - 0.55, 0, d * 0.5, 'f'); };
  // a tall round-arched window with its hood moulding
  const win = (f, s, y0, w, h) => {
    archWin(B, f, s, y0, w, h, { sur: 0.2, tcol: C.white, gcol: C.glass, n: 4, d: 0.05 }); st.windows++;
    arch(ST, f, s, y0 + h + 0.18, w + 0.95, 0.75, 0.1, C.white, (w + 0.95) / 2 * 0.55, 5);
  };

  // ---- the walls of the whole outline: yellow with a salmon plinth, white lisenes, the window bays and the eave cornice
  const edges = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));
  edges.forEach((f) => {
    const L = f.L; if (L < 0.2) return;
    const westFace = f.n[0] < -0.7 && f.a[0] < minU + 0.5;
    WL.setColor(C.wall); rect(WL, f, 0, L, gLo, Y(Hw));
    ST.setColor(C.plinth); slab(ST, f, -0.04, L + 0.04, gLo, Y(1.25), 0, 0.1, 'ft');
    cornice(f, Y(Hw));
    if (westFace) return;
    if (L < 1.8) return;
    const n = Math.max(1, Math.round(L / 5.2));
    for (let k = 0; k <= n; k++) lisene(f, k * L / n, Y(1.25), Y(Hw) - 0.85, k === 0 || k === n ? 0.7 : 0.95);
    for (let k = 0; k < n; k++) win(f, (k + 0.5) * L / n, Y(3.0), 1.25, 3.3);
  });
  // the west front: the door of the nave's shoulders and the front's lisenes (the tower stands in the middle)
  { const fw = edges.find((f) => f.n[0] < -0.7 && f.a[0] < minU + 0.5 && f.L > 5), L = fw.L;
    for (const s of [0.5, L - 0.5]) lisene(fw, s, Y(1.25), Y(Hw) - 0.85, 0.8);
    for (const s of [(L / 2 - tw) / 2, L - (L / 2 - tw) / 2]) { archWin(B, fw, s, Y(2.2), 0.9, 2.6, { sur: 0.18, tcol: C.white, gcol: C.glass, n: 3, d: 0.05 }); st.windows++; } }

  // ---- roofs: the nave hipped over the apse, lean-to shoulders each side of the tower, the apse's half cone
  const apseStart = (() => { let u = Infinity; for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length]; if (Math.abs(b[0] - a[0]) > 0.3 && Math.abs(b[1] - a[1]) > 0.3 && (a[0] + b[0]) / 2 > 0) u = Math.min(u, a[0], b[0]); } return Number.isFinite(u) ? u : maxU - 5; })();
  gable(B.roof, { a0: uTe, a1: apseStart + 0.3, b0: -nv, b1: nv, yE: Y(Hw), yR: Y(ridge), ridge: 'u', ov: 0.5, rake: 0.5, col: C.roof, G: WL, gcol: C.wall });
  B.roof.setColor(C.roof);
  for (const sg of [-1, 1]) poly(B.roof, [[minU - 0.3, Y(Hw), sg * (nv + 0.45)], [uTe + 0.1, Y(Hw), sg * (nv + 0.45)], [uTe + 0.1, Y(Hw + 2.6), sg * tw], [minU - 0.3, Y(Hw + 2.6), sg * tw]], [0, 1, 0]);
  { const eave = []; const chain = R.filter((p) => p[0] >= apseStart - 0.05);
    const apex = [apseStart, Y(Hw + 3.6), 0];
    for (const [u, v] of chain) { const dx = u - apex[0], dz = v - apex[2], d = Math.hypot(dx, dz) || 1; eave.push([u + dx / d * 0.45, Y(Hw) - 0.2, v + dz / d * 0.45]); }
    chain.length >= 2 && fanRoof(B.roof, apex, eave.sort((p, q) => Math.atan2(p[2], p[0] - apex[0]) - Math.atan2(q[2], q[0] - apex[0])), C.roof);
    cross(B.dome, apseStart, apex[1] + 0.05, 0, 1.4, GOLD); }
  cross(B.dome, apseStart + 0.3, Y(ridge) + 0.05, 0, 1.5, GOLD);

  // ---- the tower: three stages with white lisenes, oculi, a clock, segmental pediments and the octagonal spire
  { const T = rectFrames(minU, uTe, -tw, tw), stages = [0, 11.5, 17.4, 22.0];
    for (const [key, f] of Object.entries(T)) {
      const y0 = key === 'E' ? Y(Hw) : gLo, L = f.L;
      WL.setColor(C.wall); rect(WL, f, 0, L, y0, Y(stages[3]));
      for (const s of [0.45, L - 0.45]) lisene(f, s, Math.max(y0, Y(1.25)), Y(stages[3]) - 0.5, 0.8, 0.12);
      if (key === 'W') { ST.setColor(C.plinth); slab(ST, f, -0.04, L + 0.04, gLo, Y(1.25), 0, 0.1, 'ft'); }
      // stage cornices
      WL.setColor(C.white); for (const yb of [stages[1], stages[2]]) { slab(WL, f, -0.25, L + 0.25, Y(yb) - 0.45, Y(yb) + 0.1, 0, 0.36, 'ftb'); slab(WL, f, -0.1, L + 0.1, Y(yb) - 0.8, Y(yb) - 0.5, 0, 0.18, 'f'); }
      if (key === 'E') continue;
      const s = L / 2;
      // stage 2: an oculus and a small arched window; stage 3: the clock and a louvred arch
      for (const [yy, rr] of [[Y(8.6), 0.42]]) { const ring2 = (q, d) => Array.from({ length: 12 }, (_, i) => at(f, s + Math.cos(i / 12 * PI * 2) * q, yy + Math.sin(i / 12 * PI * 2) * q, d)); ST.setColor(C.white); ST.face(ring2(rr + 0.16, 0.06), nrm(f)); B.lit.setColor(C.glass); B.lit.face(ring2(rr, 0.09), nrm(f)); st.windows++; }
      archWin(B, f, s, Y(12.4), 0.9, 3.2, { sur: 0.2, tcol: C.white, gcol: '#5a3326', n: 4, d: 0.05 }); st.windows++;
      clockFace(B, f, s, Y(19.6), 0.7, 0.1);
      // the segmental pediment over the top stage
      WL.setColor(C.white);
      { const w = L + 0.5, y0p = Y(stages[3]); const pts = [at(f, -0.25, y0p, 0.28), at(f, w - 0.25, y0p, 0.28)]; for (let i = 0; i <= 8; i++) { const a = (i / 8) * PI; pts.push(at(f, w / 2 - 0.25 + Math.cos(a) * (w / 2), y0p + Math.sin(a) * 1.0, 0.28)); }
        WL.face(pts, nrm(f)); }
    }
    // the spire: an octagonal shaft over a short drum, grey, with the gold ball and cross
    const cu = (minU + uTe) / 2, y0 = Y(stages[3]) + 0.1, R0 = tw * 0.5, H0 = 13.0;
    B.roof.setColor(C.wall);
    B.dome.setColor(C.spire);
    B.dome.lathe(SPIRE.map(([r, y]) => [r * R0, y0 + y * H0]), 8, cu, 0);
    ball(B.dome, cu, y0 + H0 + 0.15, 0, 0.32); cross(B.dome, cu, y0 + H0 + 0.4, 0, 2.2);
    var top = y0 + H0 + 2.7;
    S.obox(...toW(cu, 0), (uTe - minU) / 2, tw, F.yaw, gLo, Y(stages[3]), 'tower'); S.cyl(...toW(cu, 0), Y(stages[3]), y0 + H0, R0 * 1.2, 0.2, 'tower'); st.solids += 2;
  }
  end(B);
  // ---- colliders: the walls, the two roof slopes
  const wr = R.map(([u, v]) => toW(u, v));
  S.prism(wr.flat(), gLo, Y(Hw), 0, 0, 'wall'); st.solids++;
  const V = F.V, cV = F.cx * V[0] + F.cz * V[1], kk = (ridge - Hw) / nv, P4 = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v)).flat();
  S.prism(P4(uTe, apseStart, -nv, 0), Y(Hw), Y(ridge) - kk * cV, kk * V[0], kk * V[1], 'roof');
  S.prism(P4(uTe, apseStart, 0, nv), Y(Hw), Y(ridge) + kk * cV, -kk * V[0], -kk * V[1], 'roof'); st.solids += 2;
  return { footprints: [{ poly: wr, h: top - gLo, kind: 'church', name: 'Biserica Sfinții Arhangheli Mihail și Gavriil', id: MIHAIL_ID }], stats: st, top, F, Fy, gLo };
}
void archDoor;
