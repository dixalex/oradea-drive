// OWNER: oradea. Biserica «Sfântul Apostol Andrei» (OSM way 420844002, Oradea, between Calea Clujului and the blocks of the Nufărul
// quarter side; built in the 2000s): a Byzantine church in banded brick, read off the Commons photos «Biserica sfantul apostol
// andrei oradea 709» and «Oradea – panoramio – paulnasca (10)»: yellow facing brick in offset blocks with red joints, red pilasters,
// cornices and arch frames; a tall square west tower over the entrance (a red arched portal, the mosaic of the saint in an arched
// frame, three-slit windows, a drum with arches and a grey dome); a broad red stair up to the door, two low side chapels with small
// domes beside it; a cross-gabled body with a central drum and dome, and a semicircular apse at the east. The plan is the OSM
// outline (a 19 m wide rectangle with a round east end, 42 m long, the stair outside it).
//   buildAndrei({ B, S, g, ring }) -> { footprints, stats, top }
import {
  PI, begin, end, edgeFrame, at, nrm, rect, slab, poly, archOutline, archWin, gable, fanRoof, PROFILES, spire, cross, ball, drum, rectFrames, GOLD,
} from './kit.js';
import { frameOf } from './church.js';

export const ANDREI_ID = 420844002;
const C = { brick: '#efe2bc', red: '#9c3b25', redDk: '#832f1d', glass: '#1f2630', roof: '#6b7278', dome: '#7d868d', domeRed: '#9a5438', step: '#a35037', gold: '#d9b55c', robe: '#5f7890', door: '#3b2a22' };

export function buildAndrei({ B, S, g, ring }) {
  const F = frameOf(ring), toW = F.toMap, st = { windows: 0, solids: 0, domes: 0, towers: 1 };
  const uW = F.minU + 0.1, uE = F.maxU, hw = 9.5, uA = uE - hw, uT = uW + 7.4, tw = 3.7, uB = uT;
  const Hw = 13.2, Hs = 9.0, Hc = 11.2, Hl = 5.8, Ht = 27.0, ridge = 16.8, uc = -7.0, nv = 5.0, tHalf = 3.6;
  let hi = -1e9, lo = 1e9;
  const probe = [[uW - 3, 0], [uW - 5, 6], [uW - 5, -6], [0, 0], [uA, 0], [uE, 0]];
  for (const [u, v] of F.ring.concat(probe)) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.2, gLo = lo - 0.6, Y = (h) => Fy + h;
  const gS = (() => { const [x, z] = toW(uW - 6, 0), h = g(x, z); return Number.isFinite(h) ? h : lo; })();
  begin(B, F.cx, F.cz, F.yaw);
  const BR = B.brick, ST = B.stone, WL = B.wall, DT = B.det;
  const face = (M, a, b, y0, y1) => { const f = edgeFrame(a, b); rect(M, f, 0, f.L, y0, y1); return f; };
  const arch = (M, f, s, y0, w, h, d, col, rise = w / 2, n = 6) => { M.setColor(col); M.face(archOutline(s, y0, w, h, rise, n).map(([a, b]) => at(f, a, b, d)), nrm(f)); };
  // a red arched frame with a field inside: frame first, field on top
  const framed = (f, s, y0, w, h, fw, field, fieldM = DT) => {
    arch(ST, f, s, y0 - fw, w + 2 * fw, h + 2 * fw, 0.07, C.red, (w + 2 * fw) / 2);
    arch(fieldM, f, s, y0, w, h, 0.1, field, w / 2);
  };
  // three narrow arched slits inside an arched recess
  const triple = (f, s, y0, w, h) => {
    arch(ST, f, s, y0 - 0.25, w + 0.5, h + 0.25, 0.06, C.red, (w + 0.5) / 2);
    arch(BR, f, s, y0, w, h, 0.09, C.brick, w / 2);
    const sw = w / 5;
    for (const dx of [-1.6, 0, 1.6]) { B.lit.setColor(C.glass); B.lit.face(archOutline(s + dx * sw, y0 + 0.35, sw, h - 0.45, sw / 2, 3).map(([a, b]) => at(f, a, b, 0.12)), nrm(f)); }
    st.windows += 3;
  };
  const pilaster = (f, s, y0, y1, w = 0.6, d = 0.16) => { ST.setColor(C.red); slab(ST, f, s - w / 2, s + w / 2, y0, y1, 0, d, 'ftlr'); };
  const band = (f, y0, y1, d = 0.14, over = 0.0) => { ST.setColor(C.red); slab(ST, f, -over, f.L + over, y0, y1, 0, d, 'ftb'); };

  // ================================================================== the body: walls round the nave, the transept and the apse
  const apse = [[uA, -hw]]; for (let i = 1; i < 8; i++) { const a = -PI / 2 + (i * PI) / 8; apse.push([uA + hw * Math.cos(a), hw * Math.sin(a)]); } apse.push([uA, hw]);
  const BP = [[uB, -hw], ...apse, [uB, hw]];
  const cuts = [uc - tHalf, uc + tHalf];
  const wallRow = (f, s0, s1, H) => {
    BR.setColor(C.brick); rect(BR, f, s0, s1, gLo, Y(H));
    ST.setColor(C.redDk); slab(ST, f, s0 - 0.05, s1 + 0.05, gLo, Y(1.1), 0, 0.1, 'ft');
    ST.setColor(C.red); slab(ST, f, s0 - 0.18, s1 + 0.18, Y(H) - 0.7, Y(H) + 0.12, 0, 0.32, 'ftb'); slab(ST, f, s0, s1, Y(5.6), Y(5.95), 0, 0.12, 'ftb');
    const n = Math.max(1, Math.round((s1 - s0) / 3.7)), w = (s1 - s0) / n;
    for (let k = 0; k <= n; k++) pilaster(f, s0 + k * w, Y(1.1), Y(H) - 0.7);
    for (let k = 0; k < n; k++) {
      const s = s0 + (k + 0.5) * w;
      if (H > Hs + 1) { archWin(B, f, s, Y(6.6), 1.05, 5.4, { sur: 0.26, tcol: C.red, gcol: C.glass, n: 4, d: 0.05 }); archWin(B, f, s, Y(1.7), 0.9, 2.4, { sur: 0.22, tcol: C.red, gcol: C.glass, n: 3, d: 0.05 }); st.windows += 2; }
      else { archWin(B, f, s, Y(1.9), 1.0, 5.3, { sur: 0.24, tcol: C.red, gcol: C.glass, n: 4, d: 0.05 }); st.windows++; }
    }
  };
  BP.forEach((a, i) => {
    if (i === BP.length - 1) return;
    const b = BP[i + 1], f = edgeFrame(a, b), L = f.L, longWall = Math.abs(f.t[0]) > 0.99;
    if (!longWall) { wallRow(f, 0, L, Hs); return; }
    const du = f.t[0], us = [a[0], ...cuts.filter((c) => c > Math.min(a[0], b[0]) && c < Math.max(a[0], b[0])), b[0]].sort((p, q) => (du > 0 ? p - q : q - p));
    for (let k = 0; k + 1 < us.length; k++) { const mid = (us[k] + us[k + 1]) / 2; wallRow(f, (us[k] - a[0]) / du, (us[k + 1] - a[0]) / du, mid > cuts[0] && mid < cuts[1] ? Hw : Hs); }
  });
  // the clerestory of the nave over the low aisles, and the aisle roofs leaning on it
  for (const sg of [-1, 1]) for (const [u0, u1] of [[uB, cuts[0]], [cuts[1], uA]]) {
    const f = edgeFrame(sg < 0 ? [u0, -nv] : [u1, nv], sg < 0 ? [u1, -nv] : [u0, nv]), L = f.L;
    BR.setColor(C.brick); rect(BR, f, 0, L, Y(Hc) - 0.3, Y(Hw));
    ST.setColor(C.red); slab(ST, f, -0.15, L + 0.15, Y(Hw) - 0.6, Y(Hw) + 0.1, 0, 0.3, 'ftb');
    const n = Math.max(1, Math.round(L / 3.7)), w = L / n;
    for (let k = 0; k <= n; k++) pilaster(f, k * w, Y(Hc), Y(Hw) - 0.6, 0.5, 0.12);
    for (let k = 0; k < n; k++) { archWin(B, f, (k + 0.5) * w, Y(Hc) + 0.3, 0.8, 1.7, { sur: 0.2, tcol: C.red, gcol: C.glass, n: 3, d: 0.05 }); st.windows++; }
    B.roof.setColor(C.roof); poly(B.roof, [[u0, Y(Hs) - 0.1, sg * (hw + 0.3)], [u1, Y(Hs) - 0.1, sg * (hw + 0.3)], [u1, Y(Hc), sg * nv], [u0, Y(Hc), sg * nv]], [0, 1, 0]);
  }
  // the west face of the body above the chapels, either side of the tower: the nave part to the full height, the aisle part to the aisle roof
  for (const sg of [-1, 1]) {
    const fN = edgeFrame(sg > 0 ? [uB, nv] : [uB, -tw], sg > 0 ? [uB, tw] : [uB, -nv]);
    BR.setColor(C.brick); rect(BR, fN, 0, fN.L, Y(Hl), Y(Hw));
    ST.setColor(C.red); slab(ST, fN, -0.1, fN.L + 0.1, Y(Hw) - 0.6, Y(Hw) + 0.1, 0, 0.3, 'ftb');
    archWin(B, fN, fN.L / 2, Y(7.4), 0.8, 4.4, { sur: 0.22, tcol: C.red, gcol: C.glass, n: 4, d: 0.05 }); st.windows++;
    const fA = edgeFrame(sg > 0 ? [uB, hw] : [uB, -nv], sg > 0 ? [uB, nv] : [uB, -hw]);
    BR.setColor(C.brick); poly(BR, sg > 0 ? [[uB, Y(Hl), hw], [uB, Y(Hl), nv], [uB, Y(Hc), nv], [uB, Y(Hs), hw]] : [[uB, Y(Hl), -nv], [uB, Y(Hl), -hw], [uB, Y(Hs), -hw], [uB, Y(Hc), -nv]], [-1, 0, 0]);
    void fA;
  }

  // ================================================================== roofs: the nave, the transept, the notches between, the apse
  const rk = (ridge - Hw) / nv;
  gable(B.roof, { a0: uB, a1: uA, b0: -nv, b1: nv, yE: Y(Hw + 0.2), yR: Y(ridge), ridge: 'u', ov: 0.3, rake: 0.2, col: C.roof, G: BR, gcol: C.brick });
  gable(B.roof, { a0: -hw, a1: hw, b0: uc - tHalf, b1: uc + tHalf, yE: Y(Hw + 0.2), yR: Y(ridge), ridge: 'v', ov: 0.3, rake: 0.3, col: C.roof, G: BR, gcol: C.brick });
  { const apexY = Y(Hs + 3.8), eave = []; for (let i = 0; i <= 8; i++) { const a = -PI / 2 + (i * PI) / 8, r = hw + 0.35; eave.push([uA + r * Math.cos(a), Y(Hs) - 0.1, r * Math.sin(a)]); }
    fanRoof(B.roof, [uA, apexY, 0], eave, C.roof); cross(B.dome, uA, apexY, 0, 1.7, GOLD); }

  // ================================================================== the central drum and dome, four small drums on the notches
  { const R = 4.1, yB = Y(ridge) - 1.4, yD = drum(B, uc, 0, yB, R, 5.2, { n: 12, col: C.brick, trim: C.red, gcol: C.glass, wallKey: 'brick', ww: 0.9 });
    B.dome.setColor(C.dome); B.dome.cyl(uc, yD - 0.02, 0, R * 1.1, R, 0.3, 12, true); spire(B.dome, PROFILES.byz, 16, uc, 0, yD + 0.28, R, 3.2);
    ball(B.dome, uc, yD + 3.6, 0, 0.24); cross(B.dome, uc, yD + 3.7, 0, 2.6);
    S.cyl(...toW(uc, 0), yB, yD, R, R, 'drum'); S.cyl(...toW(uc, 0), yD, yD + 3.5, R, 0.3, 'dome'); st.domes++;
    var top = yD + 6.3; }
  for (const [u, v, r] of [[-1.6, -7.3, 1.5], [-1.6, 7.3, 1.5], [-12.1, -7.3, 1.0], [-12.1, 7.3, 1.0]]) {
    const yD = drum(B, u, v, Y(10.0), r, 2.6, { n: 8, col: C.brick, trim: C.red, gcol: C.glass, wallKey: 'brick', ww: 0.5, win: r > 1.2 });
    B.dome.setColor(C.domeRed); spire(B.dome, PROFILES.byz, 10, u, v, yD + 0.05, r * 1.05, r * 0.9); cross(B.dome, u, yD + r * 0.9, v, 1.4); st.domes++;
  }

  // ================================================================== the side chapels flanking the stair: flat roofs, small domes
  for (const sg of [-1, 1]) {
    const v0 = sg > 0 ? tw : -hw, v1 = sg > 0 ? hw : -tw, R = rectFrames(uW, uB, v0, v1);
    for (const [key, f] of Object.entries(R)) {
      if (key === 'E' || (sg > 0 && key === 'N') || (sg < 0 && key === 'S')) continue;
      BR.setColor(C.brick); rect(BR, f, 0, f.L, gLo, Y(Hl));
      ST.setColor(C.redDk); slab(ST, f, -0.05, f.L + 0.05, gLo, Y(1.0), 0, 0.1, 'ft');
      band(f, Y(Hl) - 0.55, Y(Hl) + 0.12, 0.28, 0.14); pilaster(f, 0.25, Y(1.0), Y(Hl) - 0.55); pilaster(f, f.L - 0.25, Y(1.0), Y(Hl) - 0.55);
      const n = key === 'W' ? 1 : 2;
      for (let k = 0; k < n; k++) { archWin(B, f, (k + 0.5) * f.L / n, Y(1.5), 0.85, 3.0, { sur: 0.24, tcol: C.red, gcol: C.glass, n: 3, d: 0.05 }); st.windows++; }
    }
    B.roof.setColor(C.roof); poly(B.roof, [[uW, Y(Hl) + 0.05, v0], [uB, Y(Hl) + 0.05, v0], [uB, Y(Hl) + 0.05, v1], [uW, Y(Hl) + 0.05, v1]], [0, 1, 0]);
    const cu = (uW + uB) / 2, cv = (v0 + v1) / 2, yD = drum(B, cu, cv, Y(Hl), 1.35, 1.5, { n: 8, col: C.brick, trim: C.red, gcol: C.glass, wallKey: 'brick', ww: 0.45, win: false });
    B.dome.setColor(C.domeRed); spire(B.dome, PROFILES.byz, 10, cu, cv, yD + 0.05, 1.4, 1.3); cross(B.dome, cu, yD + 1.3, cv, 1.5); st.domes++;
    S.obox(...toW((uW + uB) / 2, cv), (uB - uW) / 2, Math.abs(v1 - v0) / 2, F.yaw, gLo, Y(Hl + 0.3), 'wall'); st.solids++;
  }

  // ================================================================== the tower
  { const T = rectFrames(uW, uT, -tw, tw);
    for (const [key, f] of Object.entries(T)) {
      const y0 = key === 'W' ? gLo : key === 'E' ? Y(Hw) : Y(Hl) - 0.01;
      BR.setColor(C.brick); rect(BR, f, 0, f.L, y0, Y(Ht));
      if (key === 'E') {
        band(f, Y(Hw) + 0.4, Y(Hw) + 0.7, 0.14, 0.0);
      }
      // the red corner strips, the stage bands and the cornice
      pilaster(f, 0.35, key === 'W' ? Y(1.0) : Math.max(y0, Y(Hl)), Y(Ht) - 0.6, 0.7, 0.14); pilaster(f, f.L - 0.35, key === 'W' ? Y(1.0) : Math.max(y0, Y(Hl)), Y(Ht) - 0.6, 0.7, 0.14);
      for (const yb of [6.1, 14.0, 19.1]) if (key === 'W' || key === 'N' || key === 'S') band(f, Y(yb), Y(yb) + 0.4, 0.15, 0);
      band(f, Y(Ht) - 0.7, Y(Ht) + 0.15, 0.34, 0.2);
      if (key === 'W') ST.setColor(C.redDk), slab(ST, f, -0.05, f.L + 0.05, gLo, Y(1.0), 0, 0.12, 'ft');
      const s = f.L / 2;
      if (key !== 'E') { triple(f, s, Y(20.0), 3.0, 4.2); }
      if (key !== 'E') { triple(f, s, Y(15.0), 2.4, 3.2); }
    }
    // the west face: the portal and the mosaic
    const f = T.W, s = f.L / 2;
    arch(ST, f, s, Y(0), 4.7, 6.2, 0.08, C.red, 2.35);                                   // the outer arch of the portal
    arch(ST, f, s, Y(0), 3.8, 5.3, 0.12, C.redDk, 1.9);
    arch(DT, f, s, Y(0), 3.0, 4.6, 0.16, C.door, 1.5);
    for (const dx of [-1.3, 1.3]) { ST.setColor(C.red); ST.cyl(...(() => { const p = at(f, s + dx * 1.45, 0, 0.4); return [p[0], Y(0), p[2]]; })(), 0.28, 0.26, 3.6, 8, true); }
    DT.setColor('#2b1f19'); slab(DT, f, s - 0.04, s + 0.04, Y(0), Y(3.1), 0.16, 0.2, 'f');
    // the mosaic of St Andrew
    { const mw = 2.7, mh = 5.0, my = 8.0;
      framed(f, s, Y(my), mw, mh, 0.38, '#c9a352');
      DT.setColor(C.robe); slab(DT, f, s - 0.6, s + 0.6, Y(my + 0.5), Y(my + 3.6), 0.1, 0.13, 'f');
      DT.setColor('#e1c071'); const hy = Y(my + 4.1), ring2 = Array.from({ length: 10 }, (_, i) => at(f, s + Math.cos(i / 10 * PI * 2) * 0.42, hy + Math.sin(i / 10 * PI * 2) * 0.42, 0.14)); DT.face(ring2, nrm(f));
      DT.setColor('#b58a4a'); // the saltire cross he holds
      poly(DT, [at(f, s - 1.1, Y(my + 0.9), 0.14), at(f, s - 0.95, Y(my + 0.75), 0.14), at(f, s + 1.1, Y(my + 3.3), 0.14), at(f, s + 0.95, Y(my + 3.45), 0.14)], nrm(f));
      poly(DT, [at(f, s + 1.1, Y(my + 0.9), 0.14), at(f, s + 0.95, Y(my + 0.75), 0.14), at(f, s - 1.1, Y(my + 3.3), 0.14), at(f, s - 0.95, Y(my + 3.45), 0.14)], nrm(f));
    }
    // the drum of the belfry and its dome
    const cu = (uW + uT) / 2, yB = Y(Ht), R = 3.0;
    const yD = drum(B, cu, 0, yB, R, 4.4, { n: 12, col: C.brick, trim: C.red, gcol: C.glass, wallKey: 'brick', ww: 0.85, rot: PI / 12 });
    B.dome.setColor(C.dome); B.dome.cyl(cu, yD - 0.02, 0, R * 1.1, R, 0.3, 12, true); spire(B.dome, PROFILES.byz, 14, cu, 0, yD + 0.28, R, 3.0);
    ball(B.dome, cu, yD + 3.4, 0, 0.26); cross(B.dome, cu, yD + 3.5, 0, 2.8);
    top = Math.max(top, yD + 6.4);
    S.obox(...toW(cu, 0), (uT - uW) / 2, tw, F.yaw, gLo, yB, 'tower'); S.cyl(...toW(cu, 0), yB, yD + 3.3, R, 0.3, 'tower'); st.solids += 2; st.domes++;
  }

  // ================================================================== the stair
  const RISE = Math.max(0.6, Fy - gS), nSt = Math.max(4, Math.round(RISE / 0.19)), tread = 0.55, run = nSt * tread, dy = RISE / nSt;
  { const f = edgeFrame([uW, hw], [uW, -hw]);
    for (let k = 0; k < nSt; k++) { ST.setColor(k % 2 ? '#9a4a33' : C.step); slab(ST, f, 0.1 - k * 0.12, f.L - 0.1 + k * 0.12, gLo, Fy - dy * k - 0.03, tread * k, tread * (k + 1), 'ftlr'); }
    ST.setColor(C.redDk); slab(ST, f, -0.5, 0.1, gLo, Y(0.6), 0, run + 0.2, 'ftr'); slab(ST, f, f.L - 0.1, f.L + 0.5, gLo, Y(0.6), 0, run + 0.2, 'ftl');
    // a diagonal of yellow tiles across the treads, as the photo shows
    ST.setColor('#d9b05a'); for (let k = 0; k < nSt; k++) { const s0 = 0.5 + k * 0.5; slab(ST, f, s0, s0 + 0.5, Fy - dy * k - 0.02, Fy - dy * k + 0.0, tread * k, tread * (k + 1), 't'); }
  }
  end(B);
  // ---- colliders and the footprint
  const wr = BP.map(([u, v]) => toW(u, v));
  S.prism(wr.flat(), gLo, Y(Hs), 0, 0, 'wall'); st.solids++;
  const V = F.V, U = F.U, cV = F.cx * V[0] + F.cz * V[1], cU = F.cx * U[0] + F.cz * U[1], R4 = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v)).flat();
  S.prism(R4(uB, uA, -nv, 0), Y(Hs), Y(ridge) - rk * cV, rk * V[0], rk * V[1], 'roof');
  S.prism(R4(uB, uA, 0, nv), Y(Hs), Y(ridge) + rk * cV, -rk * V[0], -rk * V[1], 'roof'); st.solids += 2;
  const kt = (ridge - Hw) / tHalf;
  S.prism(R4(uc - tHalf, uc, -hw, hw), Y(Hw), Y(Hw) - kt * (uc - tHalf + cU), kt * U[0], kt * U[1], 'roof');
  S.prism(R4(uc, uc + tHalf, -hw, hw), Y(Hw), Y(Hw) + kt * (uc + tHalf + cU), -kt * U[0], -kt * U[1], 'roof'); st.solids += 2;
  { const slopeU = RISE / run, pts = R4(uW - run, uW, -hw, hw);
    S.prism(pts, gLo, Fy - slopeU * (uW + cU), slopeU * U[0], slopeU * U[1], 'stair'); st.solids++; }
  const fp = F.ring.map(([u, v]) => toW(u, v));
  return { footprints: [{ poly: fp, h: top - gLo, kind: 'church', name: 'Biserica Sfântul Apostol Andrei', id: ANDREI_ID }], stats: st, top, F, Fy, gLo };
}
void ball;
