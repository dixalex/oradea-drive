// OWNER: oradea. Bazilica Romano-Catolică "Adormirea Maicii Domnului" (OSM way 262832955), Oradea: the largest Baroque church in
// Romania, built 1752-1780 (Ricca, then Hillebrandt and Lucchini). A cruciform church on a 73 m axis: the polygonal apse in the
// west, the chancel, a full-width transept block, the nave with two aisles, and the front of two square towers (a ground
// storey with ochre rustication, a wide cornice, a tower stage with a framed window and a panel, a louvred belfry with a black
// onion dome, a gold ball and a cross) round a middle bay of coupled cream pilasters, an oval window, three portals, a
// triangular pediment and the curved gable of the clock. Golden-yellow plaster, cream trim, a light-grey sheet-metal roof.
// Built from the Commons photos and the Esri aerial; heights read off the front photo (30 px / m).
//   buildBasilica(ctx) -> { footprints, yF, Y(h), C, ... }   ctx { B, S, heightAt }; B needs plaster, rust, det, glass, lit, metal
//   BASILICA_SKIP: the OSM way it replaces
//   LOCAL: the plan in its own frame (BAS in kit.js: local x -> the facade, local z across)
import { BAS, offsetRing, lathe2, lface, localize, wallBand, PI } from './kit.js';
import { wallFaces, fbox, facePoly, archPts, at, quad, skin, plainOpening, UP } from '../../../cherkasy/civic.js';
import { inPoly } from '../../../cherkasy/geo.js';

export const BASILICA_SKIP = [262832955];
export const LOCAL = { VC: 20.4, UF: 73.5, FRONT: 72.6 };
const { VC, UF, FRONT } = LOCAL;
export const C = { wall: '#f8d45a', rust: '#f2cb4a', cream: '#fbf2d8', stone: '#a9a699', roof: '#adb3b6', slate: '#32343a', gold: '#d9aa33', glass: '#36434d', wood: '#4a3020' };

// plan rings (local u, v)
const LOW = [[46.5, 5.3], [64.7, 5.3], [64.7, 3.0], [UF, 3.0], [UF, 37.8], [64.7, 37.8], [64.7, 35.5], [46.5, 35.5]];
const NAVE = [[46.5, 10.4], [FRONT, 10.4], [FRONT, 30.4], [46.5, 30.4]];
const TRANS = [[24.0, 0.6], [46.5, 0.6], [46.5, 40.0], [24.0, 40.0]];
const APSE = [90, 120, 150, 180, 210, 240, 270].map((a) => [8 + 8 * Math.cos((a * PI) / 180), VC + 11.5 * Math.sin((a * PI) / 180)]);
const CHANCEL = [[24.0, 8.9], [24.0, 31.9], ...APSE, [8.0, 8.9]];
const SAC1 = [[8.0, 0.0], [16.5, 0.0], [16.5, 8.9], [8.0, 8.9]];
const SAC2 = [[8.0, 31.9], [15.2, 31.9], [15.2, 40.0], [8.0, 40.0]];
const TCU = 69.1, TCV = [7.4, 33.4];
const rect = (cu, cv, h) => [[cu - h, cv - h], [cu + h, cv - h], [cu + h, cv + h], [cu - h, cv + h]];
const chamfer = (cu, cv, h, c) => [[cu - h + c, cv - h], [cu + h - c, cv - h], [cu + h, cv - h + c], [cu + h, cv + h - c], [cu + h - c, cv + h], [cu - h + c, cv + h], [cu - h, cv + h - c], [cu - h, cv - h + c]];
const TD = 1.6;   // the belfries stand a little taller than the first drawings (the reference towers rise well over the clock gable)
const H1 = 13.4, H2 = 22.8, HC = 19.0, RN = 29.6, RT = 30.4, RC = 26.5, HB = 34.5 + TD;

export function buildBasilica({ B, S, heightAt }) {
  const D = B.plaster, R = B.rust, DET = B.det;
  const mapRing = (r) => BAS.ring(r);
  // ---- the floor: the highest ground under the plan plus a step
  let hi = -1e9, lo = 1e9;
  for (const r of [LOW, NAVE, TRANS, CHANCEL, SAC1, SAC2]) { const ring = mapRing(r); for (let u = 0; u <= 74; u += 3) for (let v = 0; v <= 40; v += 3) { const [x, z] = BAS.xz(u, v); if (!inPoly(ring, x, z)) continue; const h = heightAt(x, z); hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  const yF = hi + 0.25, yB = lo - 0.9;
  const Y = (h) => yF + h;
  let windows = 0;

  // ---------------------------------------------------------------- openings and trim
  // a rectangular window: hole, reveal, glass, a cream surround with a sill and an optional triangular hood
  function rectWin(f, opens, t, w, h0, h1, { hood = 0, lit = false, sill = true, dep = 0.3, fr = 0.2, mull = true } = {}) {
    const s = f.sOf(t), s0 = s - w / 2, s1 = s + w / 2, y0 = Y(h0), y1 = Y(h1);
    opens.push({ s0, s1, y0, y1 });
    plainOpening(B, f, { s0, s1, y0, y1, dep, rev: '#e6dcbc', glass: C.glass, lit, mull: mull ? C.cream : null });
    D.setColor(C.cream);
    fbox(D, f, s0 - fr, s0, y0 - 0.05, y1 + fr, 0, 0.1, 1 | 16); fbox(D, f, s1, s1 + fr, y0 - 0.05, y1 + fr, 0, 0.1, 1 | 16); fbox(D, f, s0, s1, y1, y1 + fr, 0, 0.1, 1 | 16);
    if (sill) fbox(D, f, s0 - fr * 1.1, s1 + fr * 1.1, y0 - 0.17, y0, 0, 0.24, 1 | 16 | 4 | 8);
    if (hood) {
      const bw = w / 2 + fr + 0.2;
      facePoly(D, f, [[s - bw, y1 + fr], [s + bw, y1 + fr], [s, y1 + fr + hood]], 0.12);
      fbox(D, f, s - bw - 0.08, s + bw + 0.08, y1 + fr - 0.02, y1 + fr + 0.1, 0, 0.2, 1 | 16 | 4 | 8);
    }
    windows++;
  }
  // an arched window, wall colour `col` filling the spandrels; louvred (belfry) or glazed
  function archWin(f, opens, t, w, h0, h1, { col = C.wall, lit = false, dep = 0.35, louver = false, fr = 0.22 } = {}) {
    const s = f.sOf(t), s0 = s - w / 2, s1 = s + w / 2, y0 = Y(h0), y1 = Y(h1), ys = y1 - w / 2, n = 6;
    opens.push({ s0, s1, y0, y1 });
    const arc = archPts(s0, s1, ys, 'round', 0, n), out = archPts(s0 - fr, s1 + fr, ys, 'round', 0, n);
    D.setColor(col);
    facePoly(D, f, [[s0, y1], ...arc.slice(0, n + 1)], 0); facePoly(D, f, [[s1, y1], ...arc.slice(n)], 0);
    DET.setColor('#e6dcbc');
    quad(DET, at(f, s0, y0), at(f, s0, y0, -dep), at(f, s0, ys, -dep), at(f, s0, ys), f.R); quad(DET, at(f, s1, y0), at(f, s1, y0, -dep), at(f, s1, ys, -dep), at(f, s1, ys), f.L);
    quad(DET, at(f, s0, y0), at(f, s1, y0), at(f, s1, y0, -dep), at(f, s0, y0, -dep), UP);
    for (let i = 0; i < arc.length - 1; i++) {
      const p = arc[i], q = arc[i + 1], mx = (p[0] + q[0]) / 2 - s, my = (p[1] + q[1]) / 2 - ys, l = Math.hypot(mx, my) || 1, ns = -mx / l, ny = -my / l;
      quad(DET, at(f, p[0], p[1]), at(f, q[0], q[1]), at(f, q[0], q[1], -dep), at(f, p[0], p[1], -dep), [f.rx * ns, ny, f.rz * ns]);
    }
    const G = lit ? B.lit : B.glass;
    G.setColor(louver ? '#3a2a1e' : C.glass);
    facePoly(G, f, [[s0, y0], ...arc, [s1, y0]], -dep);
    DET.setColor(louver ? '#241810' : C.cream);
    if (louver) for (let y = y0 + 0.3; y < ys + w / 2 - 0.3; y += 0.34) fbox(DET, f, s0 + 0.04, s1 - 0.04, y, y + 0.07, -dep, -dep + 0.1, 1 | 16);
    else { fbox(DET, f, s - 0.03, s + 0.03, y0, y1 - 0.2, -dep, -dep + 0.06, 1 | 4 | 8); fbox(DET, f, s0, s1, ys - 0.5, ys - 0.45, -dep, -dep + 0.06, 1 | 16); }
    D.setColor(C.cream);
    for (let i = 0; i < arc.length - 1; i++) quad(D, at(f, arc[i][0], arc[i][1], 0.06), at(f, arc[i + 1][0], arc[i + 1][1], 0.06), at(f, out[i + 1][0], out[i + 1][1], 0.06), at(f, out[i][0], out[i][1], 0.06), f.N);
    facePoly(D, f, [[s0 - fr, y0 - 0.05], [s0, y0 - 0.05], [s0, ys], [s0 - fr, ys]], 0.06); facePoly(D, f, [[s1, y0 - 0.05], [s1 + fr, y0 - 0.05], [s1 + fr, ys], [s1, ys]], 0.06);
    fbox(D, f, s - 0.2, s + 0.2, y1 + 0.02, y1 + fr + 0.28, 0, 0.16, 1 | 16 | 4 | 8);
    fbox(D, f, s0 - fr * 1.1, s1 + fr * 1.1, y0 - 0.17, y0, 0, 0.24, 1 | 16 | 4 | 8);
    windows++;
  }
  // a door in a cream frame, leaves in dark wood set back; a stone threshold
  function door(f, opens, t, w, h1, { hood = 0.7, step = 1.0 } = {}) {
    const s = f.sOf(t), s0 = s - w / 2, s1 = s + w / 2, y0 = yF, y1 = Y(h1), fr = 0.3;
    opens.push({ s0, s1, y0, y1 });
    plainOpening(B, f, { s0, s1, y0, y1, dep: 0.5, rev: '#d9ceae', glass: C.wood, mull: '#2e1d12' });
    D.setColor(C.cream);
    fbox(D, f, s0 - fr, s0, y0, y1 + fr, 0, 0.14, 1 | 16); fbox(D, f, s1, s1 + fr, y0, y1 + fr, 0, 0.14, 1 | 16); fbox(D, f, s0, s1, y1, y1 + fr, 0, 0.14, 1 | 16);
    if (hood) { const bw = w / 2 + fr + 0.25; facePoly(D, f, [[s - bw, y1 + fr], [s + bw, y1 + fr], [s, y1 + fr + hood]], 0.16); fbox(D, f, s - bw - 0.08, s + bw + 0.08, y1 + fr - 0.02, y1 + fr + 0.1, 0, 0.26, 1 | 16 | 4 | 8); }
    DET.setColor(C.stone); fbox(DET, f, s0 - 0.5, s1 + 0.5, yF - 0.4, yF + 0.08, 0, step, 1 | 16 | 4 | 8);
    windows++;
  }
  // a pilaster: shaft, base, a capital
  function pilaster(f, s, w, y0, y1, o = 0.2) {
    D.setColor(C.cream);
    fbox(D, f, s - w / 2, s + w / 2, y0, y1, 0, o, 1 | 4 | 8);
    fbox(D, f, s - w * 0.62, s + w * 0.62, y0, y0 + 0.3, 0, o + 0.08, 1 | 4 | 8 | 16);
    fbox(D, f, s - w * 0.68, s + w * 0.68, y1, y1 + 0.36, 0, o + 0.12, 1 | 4 | 8 | 16);
  }
  // a framed panel: cream border, the wall colour inside
  function panel(f, s0, s1, y0, y1, col = C.wall, b = 0.16) {
    D.setColor(C.cream); facePoly(D, f, [[s0, y0], [s1, y0], [s1, y1], [s0, y1]], 0.05);
    D.setColor(col); facePoly(D, f, [[s0 + b, y0 + b], [s1 - b, y0 + b], [s1 - b, y1 - b], [s0 + b, y1 - b]], 0.08);
  }
  // an oval with a cream rim (a painted oval window; the wall behind is not cut)
  function oval(f, s, y, rw, rh, o = 0.05) {
    const n = 20, ring = (k) => Array.from({ length: n }, (_, i) => [s + Math.cos((i / n) * PI * 2) * rw * k, y + Math.sin((i / n) * PI * 2) * rh * k]);
    D.setColor(C.cream); facePoly(D, f, ring(1.3), o);
    B.glass.setColor(C.glass); facePoly(B.glass, f, ring(1), o + 0.04);
    DET.setColor(C.cream); fbox(DET, f, s - rw * 0.03, s + rw * 0.03, y - rh, y + rh, o + 0.04, o + 0.07, 1);
    windows++;
  }
  // a stepped cornice round an outline: rows [offset, y0, y1] (heights over the floor)
  const ringCornice = (ring, rows, col = C.cream) => { const base = mapRing(ring); D.setColor(col); for (const [k, y0, y1] of rows) D.extrude(offsetRing(base, k), [base], Y(y0), Y(y1), { top: true, bottom: false, sides: true }); };

  // ---------------------------------------------------------------- walls, per block
  // the stone plinth, cut round the doors
  function plinth(f, opens) {
    DET.setColor(C.stone);
    const gaps = opens.filter((q) => q.y0 <= yF + 0.05).sort((a, b) => a.s0 - b.s0);
    let from = 0;
    const seg = (a, b) => { if (b - a > 0.02) fbox(DET, f, a - 0.05, b + 0.05, yB, yF + 0.9, 0, 0.14, 1 | 16); };
    for (const q of gaps) { seg(from, q.s0); from = Math.max(from, q.s1); }
    seg(from, f.w);
  }
  // wallFaces of `ring`, each from y0 to Y(yTop); feat(f, opens) puts its openings in and returns true if it drew the wall
  function block(ring, yTop, skinB, col, feat, { y0 = null, uvm = [2.5, 2.5] } = {}) {
    const faces = wallFaces(mapRing(ring)).map((f) => localize(BAS, f)), bot = y0 ?? yB;
    for (const f of faces) {
      const opens = [];
      skinB.setColor(col);
      const done = feat ? feat(f, opens) : false;
      skinB.setColor(col);
      if (!done) { wallBand(skinB, f, skin, 0, f.w, bot, Y(yTop), opens, { uvm }); if (y0 == null) plinth(f, opens); }
    }
    return faces;
  }
  const evenly = (t0, t1, n) => Array.from({ length: n }, (_, i) => t0 + ((i + 0.5) * (t1 - t0)) / n);

  // ---- the front (the low block's +u face): the ground storey of the middle bay and the two tower bases
  function facade(f, opens) {
    const sC = f.sOf(VC), top = Y(H1);
    door(f, opens, VC, 2.6, 4.8, { hood: 0.9, step: 2.2 });
    for (const sg of [-1, 1]) {
      door(f, opens, VC + sg * 5.0, 1.5, 3.7, { hood: 0.6, step: 1.2 });
      rectWin(f, opens, VC + sg * 5.0, 1.6, 6.3, 9.8, { hood: 0.5 });
      rectWin(f, opens, VC + sg * 12.3, 1.5, 6.3, 9.8, { hood: 0.5 });
    }
    R.setColor(C.rust);
    wallBand(R, f, skin, 0, sC - 8.6, yB, top, opens, { uvm: [2.2, 2.2] }); wallBand(R, f, skin, sC + 8.6, f.w, yB, top, opens, { uvm: [2.2, 2.2] });
    D.setColor(C.wall);
    wallBand(D, f, skin, sC - 8.6, sC + 8.6, yB, top, opens);
    plinth(f, opens);
    // the middle bay: coupled pilasters, single ones, the corner strips, the oval window over the portal
    const y0 = yF + 0.9, y1 = Y(H1 - 2.5);
    for (const sg of [-1, 1]) for (const dx of [2.0, 3.65]) pilaster(f, sC + sg * dx, 0.75, y0, y1);
    for (const sg of [-1, 1]) { pilaster(f, sC + sg * 6.9, 0.7, y0, y1); pilaster(f, sC + sg * 8.45, 0.55, y0, y1, 0.16); }
    oval(f, sC, Y(8.0), 0.8, 1.75, 0.06);
    panel(f, sC - 2.0, sC + 2.0, Y(1.0), Y(1.4), C.wall, 0.04);
    // light rustication lines on the tower bases are in the rust texture; a cream corner strip each end
    for (const s of [0.4, f.w - 0.4]) pilaster(f, s, 0.6, y0, y1, 0.16);
    return true;
  }
  const lowFaces = block(LOW, H1, D, C.wall, (f, opens) => {
    if (f.nu === 1) return facade(f, opens);
    if (f.nu === -1) return false;
    if (f.w > 15) { for (const u of evenly(46.5, 64.7, 3)) { rectWin(f, opens, u, 1.5, 4.6, 8.4, { hood: 0.45 }); } return false; } // the aisles
    // the tower bases' sides: rustication, one framed window
    R.setColor(C.rust); rectWin(f, opens, TCU - 0.3, 1.5, 6.3, 9.8, { hood: 0.5 }); wallBand(R, f, skin, 0, f.w, yB, Y(H1), opens, { uvm: [2.2, 2.2] }); plinth(f, opens);
    return true;
  });

  // ---- the nave, the transept, the chancel with its apse, the sacristies
  const naveFaces = block(NAVE, H2, D, C.wall, (f, opens) => {
    if (f.nu === 1) return true;   // the front is the middle bay below (F2), with its three tall windows
    if (f.nu === 0 && f.w > 20) for (const u of evenly(46.5, 64.7, 3)) archWin(f, opens, u, 1.6, 17.2, 21.0);
    return false;
  });
  block(TRANS, H2, D, C.wall, (f, opens) => {
    if (f.nu === 0) for (const u of evenly(24.0, 46.5, 3)) { rectWin(f, opens, u, 1.6, 4.2, 8.2, { hood: 0.5 }); archWin(f, opens, u, 1.7, 14.6, 19.0); }
    return false;
  });
  block(CHANCEL, HC, D, C.wall, (f, opens) => {
    if (f.w > 3 && f.w < 12) archWin(f, opens, f.tOf(f.w / 2), 1.5, 5.6, 12.0);
    else if (f.w >= 12 && f.nu === 0) for (const u of evenly(8.0, 24.0, 2)) archWin(f, opens, u, 1.5, 5.6, 12.0);
    return false;
  });
  for (const ring of [SAC1, SAC2]) block(ring, 8.6, D, C.wall, (f, opens) => { if (f.w > 5 && f.nu === 0) rectWin(f, opens, f.tOf(f.w / 2), 1.3, 3.3, 6.2); return false; });

  // belts: the first cornice round the low block, the eave cornices
  ringCornice(LOW, [[0.2, H1 - 1.9, H1 - 1.5], [0.5, H1 - 1.5, H1 - 1.0], [0.85, H1 - 1.0, H1 - 0.35]]);
  ringCornice(LOW, [[0.6, H1 - 0.35, H1]], '#cdc3a6');
  ringCornice(NAVE, [[0.15, H2 - 1.5, H2 - 1.0], [0.5, H2 - 1.0, H2 - 0.4], [0.8, H2 - 0.4, H2]]);
  ringCornice(TRANS, [[0.15, H2 - 1.5, H2 - 1.0], [0.5, H2 - 1.0, H2 - 0.4], [0.8, H2 - 0.4, H2], [0.2, 13.0, 13.4]]);
  ringCornice(CHANCEL, [[0.15, HC - 1.2, HC - 0.8], [0.5, HC - 0.8, HC - 0.3], [0.8, HC - 0.3, HC]]);

  // ---------------------------------------------------------------- the middle bay, second stage, and the clock gable
  const F2 = lface(BAS, [FRONT, 10.4], [FRONT, 30.4], 1, 0), sC2 = F2.sOf(VC);
  {
    const opens = [];
    rectWin(F2, opens, VC, 1.9, 15.5, 19.4, { hood: 0.75, fr: 0.25 });
    for (const sg of [-1, 1]) rectWin(F2, opens, VC + sg * 5.0, 1.5, 16.6, 19.1, { hood: 0.45 });
    D.setColor(C.wall); wallBand(D, F2, skin, 0, F2.w, Y(H1 - 0.5), Y(H2), opens);
    const y0 = Y(H1 + 0.6), y1 = Y(H2 - 1.9);
    for (const sg of [-1, 1]) { for (const dx of [2.0, 3.65]) pilaster(F2, sC2 + sg * dx, 0.75, y0, y1); pilaster(F2, sC2 + sg * 6.9, 0.7, y0, y1); pilaster(F2, sC2 + sg * 8.4, 0.55, y0, y1, 0.16); }
    panel(F2, sC2 - 1.5, sC2 + 1.5, Y(14.0), Y(15.1)); for (const sg of [-1, 1]) panel(F2, sC2 + sg * 5.0 - 1.0, sC2 + sg * 5.0 + 1.0, Y(15.2), Y(16.1), C.wall, 0.12);
    // the triangular pediment over the middle three bays, the medallion in its tympanum
    const hw = 4.3, base = Y(H2), rise = 1.75;
    D.setColor(C.cream); facePoly(D, F2, [[sC2 - hw, base], [sC2 + hw, base], [sC2, base + rise]], 0.9);
    D.setColor(C.wall); facePoly(D, F2, [[sC2 - hw + 0.55, base + 0.25], [sC2 + hw - 0.55, base + 0.25], [sC2, base + rise - 0.55]], 0.95);
    // the shaped gable: ogee shoulders up to a narrow top, the clock, a cross
    const half = [[8.3, H2], [8.3, 24.2], [7.7, 24.45], [6.8, 24.75], [5.8, 25.25], [5.0, 25.95], [4.4, 26.85], [4.0, 27.85], [3.85, 28.7], [3.85, 29.9], [3.4, 30.15], [2.4, 30.55], [1.2, 30.95], [0, 31.15]];
    const poly = (k, dy = 0) => [[0, H2], ...half.map(([x, y]) => [x * k, y + dy * (y > H2 ? 1 : 0)]), ...half.slice(0, -1).reverse().map(([x, y]) => [-x * k, y + dy * (y > H2 ? 1 : 0)])];
    const grow = (pts, c, k) => pts.map(([x, y]) => { const dx = x - c[0], dy = y - c[1], l = Math.hypot(dx, dy) || 1; return [x + (dx / l) * k, y + (dy / l) * k]; });
    const place = (pts) => pts.map(([x, y]) => [sC2 + x, Y(y)]);
    D.setColor(C.cream); facePoly(D, F2, place(grow(poly(1), [0, 26], 0.34)), -0.3);
    D.setColor(C.wall); facePoly(D, F2, place(poly(1)), -0.25);
    // pilaster strips on the gable
    for (const sg of [-1, 1]) { D.setColor(C.cream); fbox(D, F2, sC2 + sg * 3.65 - 0.2, sC2 + sg * 3.65 + 0.2, Y(H2 + 0.3), Y(29.7), -0.25, -0.05, 1 | 4 | 8); }
    // the clock
    const cy = Y(27.3);
    const ring = (r, n = 28) => Array.from({ length: n }, (_, i) => [sC2 + Math.cos((i / n) * PI * 2) * r, cy + Math.sin((i / n) * PI * 2) * r]);
    D.setColor(C.cream); facePoly(D, F2, ring(1.75), -0.1);
    B.lit.setColor('#1d252b'); facePoly(B.lit, F2, ring(1.45), -0.05);
    DET.setColor('#e9e0c4');
    fbox(DET, F2, sC2 - 0.06, sC2 + 0.06, cy, cy + 1.15, -0.05, -0.02, 1); fbox(DET, F2, sC2, sC2 + 0.8, cy - 0.06, cy + 0.06, -0.05, -0.02, 1);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * PI * 2, x = sC2 + Math.sin(a) * 1.25, y = cy + Math.cos(a) * 1.25; fbox(DET, F2, x - 0.06, x + 0.06, y - 0.06, y + 0.06, -0.05, -0.02, 1); }
    DET.setColor('#2c2c30'); fbox(DET, F2, sC2 - 0.08, sC2 + 0.08, Y(31.1), Y(33.3), -0.45, -0.2, 1 | 4 | 8 | 16); fbox(DET, F2, sC2 - 0.7, sC2 + 0.7, Y(32.3), Y(32.55), -0.45, -0.2, 1 | 4 | 8 | 16);
  }

  // ---------------------------------------------------------------- the towers
  const towerCaps = [];
  for (const cv of TCV) {
    const sh = Math.sign(VC - cv) * 0.4;
    // second stage + the plain step under the belfry: to 24.6
    block(rect(TCU, cv, 4.0), 24.6 + TD, D, C.wall, (f, opens) => {
      if (f.nu === -1) return false;
      if (f.nu === 1) { rectWin(f, opens, cv + sh, 1.5, 15.4, 18.6, { hood: 0.5 }); D.setColor(C.wall); wallBand(D, f, skin, 0, f.w, Y(H1 - 0.5), Y(24.6 + TD), opens); panel(f, f.sOf(cv + sh) - 1.3, f.sOf(cv + sh) + 1.3, Y(19.5), Y(21.3)); }
      else { rectWin(f, opens, TCU - 0.2, 1.4, 15.4, 18.6, { hood: 0.45 }); D.setColor(C.wall); wallBand(D, f, skin, 0, f.w, Y(H1 - 0.5), Y(24.6 + TD), opens); panel(f, f.sOf(TCU) - 1.3, f.sOf(TCU) + 1.3, Y(19.5), Y(21.3)); }
      for (const s of [0.4, f.w - 0.4]) pilaster(f, s, 0.6, Y(H1 + 0.6), Y(H2 - 1.9), 0.16);
      return true;
    }, { y0: Y(H1 - 0.5) });
    ringCornice(rect(TCU, cv, 4.0), [[0.2, H2 - 1.4, H2 - 1.0], [0.55, H2 - 1.0, H2 - 0.4], [0.9, H2 - 0.4, H2], [0.25, 24.0 + TD, 24.6 + TD]]);
    // the belfry: chamfered corners, a louvred arch in a cream frame on each face, a narrow one on each chamfer
    const bel = chamfer(TCU, cv, 3.6, 0.95);
    block(bel, 33.2 + TD, D, C.wall, (f, opens) => {
      if (f.w > 3) { panel(f, f.w / 2 - 1.5, f.w / 2 + 1.5, Y(24.9 + TD), Y(26.2 + TD)); archWin(f, opens, f.tOf(f.w / 2), 1.8, 26.6 + TD, 31.6 + TD, { louver: true }); for (const s of [0.4, f.w - 0.4]) pilaster(f, s, 0.5, Y(26.4 + TD), Y(32.0 + TD), 0.15); }
      else archWin(f, opens, f.tOf(f.w / 2), 0.7, 27.4 + TD, 30.9 + TD, { louver: true, fr: 0.12, dep: 0.25 });
      D.setColor(C.wall); wallBand(D, f, skin, 0, f.w, Y(24.6 + TD), Y(33.2 + TD), opens);
      return true;
    }, { y0: Y(24.6 + TD) });
    ringCornice(bel, [[0.15, 32.2 + TD, 32.7 + TD], [0.4, 32.7 + TD, 33.3 + TD], [0.65, 33.3 + TD, 34.1 + TD], [0.4, 34.1 + TD, HB]]);
    // the onion dome: a bulb, a neck, a lantern bulb, a gold ball and a cross
    const prof = [[2.45, 0], [2.35, 0.25], [2.25, 0.75], [2.65, 1.5], [3.05, 2.4], [3.15, 3.35], [2.9, 4.2], [2.2, 4.9], [1.4, 5.5], [0.9, 6.0], [0.8, 6.5], [1.0, 7.0], [1.25, 7.6], [1.25, 8.2], [0.95, 8.7], [0.55, 9.2], [0.38, 9.8], [0.33, 10.1]].map(([r, h]) => [r, HB + h]);
    DET.with(BAS.m(0), (q) => {
      lathe2(q, prof.map(([r, h]) => [r, Y(h)]), 24, TCU, cv, 1, 1, 2, C.slate);
      q.setColor(C.gold); q.ellipsoid([TCU, Y(HB + 10.5), cv], [0.6, 0.6, 0.6], 10, 6);
      q.box(TCU - 0.12, Y(HB + 11.0), cv - 0.12, TCU + 0.12, Y(HB + 14.0), cv + 0.12); q.box(TCU - 0.12, Y(HB + 12.7), cv - 0.9, TCU + 0.12, Y(HB + 13.02), cv + 0.9);
    });
    towerCaps.push(BAS.xz(TCU, cv));
  }

  // ---------------------------------------------------------------- gables on the transept and the nave's back
  {
    const f = lface(BAS, [24.0, 10.4], [24.0, 30.4], -1, 0);
    D.setColor(C.wall); facePoly(D, f, [[0, Y(H2)], [f.w, Y(H2)], [f.w / 2, Y(RN)]], 0);
    for (const v of [0.6, 40.0]) {
      const g = lface(BAS, v === 0.6 ? [24.0, v] : [46.5, v], v === 0.6 ? [46.5, v] : [24.0, v], 0, v === 0.6 ? -1 : 1);
      D.setColor(C.wall); facePoly(D, g, [[0, Y(H2)], [g.w, Y(H2)], [g.w / 2, Y(RT)]], 0);
      oval(g, g.w / 2, Y(26.0), 0.85, 1.05, 0.06);
      D.setColor(C.cream); for (const sg of [-1, 1]) { const x0 = g.w / 2 + sg * (g.w / 2 + 0.3); quad(D, at(g, g.w / 2, Y(RT) + 0.3, 0.3), at(g, x0, Y(H2), 0.3), at(g, x0, Y(H2), -0.05), at(g, g.w / 2, Y(RT) + 0.3, -0.05), [0, 1, 0]); }
    }
  }

  // ---------------------------------------------------------------- roofs: light-grey sheet metal
  const M = B.metal;
  const rq = (q, a, b, c, d) => {
    const e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], g = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let n = [e[1] * g[2] - e[2] * g[1], e[2] * g[0] - e[0] * g[2], e[0] * g[1] - e[1] * g[0]]; const l = Math.hypot(...n) || 1; n = n.map((v) => v / l); if (n[1] < 0) n = n.map((v) => -v);
    quad(q, a, b, c, d, n, [[0, 0], [Math.hypot(...e) / 2.4, 0], [Math.hypot(...e) / 2.4, Math.hypot(...g) / 2.4], [0, Math.hypot(...g) / 2.4]]);
  };
  // a gable roof; ridge along u ('u') or along v ('v')
  const gable = (q, a0, a1, b0, b1, yE, yR, ax, ov = 0.5) => {
    const bm = (b0 + b1) / 2, k = ((yR - yE) / (bm - b0)) * ov, P = (a, b, y) => (ax === 'u' ? [a, y, b] : [b, y, a]);
    rq(q, P(a0, b0 - ov, yE - k), P(a1, b0 - ov, yE - k), P(a1, bm, yR), P(a0, bm, yR)); rq(q, P(a1, b1 + ov, yE - k), P(a0, b1 + ov, yE - k), P(a0, bm, yR), P(a1, bm, yR));
  };
  M.with(BAS.m(0), (q) => {
    q.setColor(C.roof);
    gable(q, 24.0, FRONT - 0.3, 10.4, 30.4, Y(H2), Y(RN), 'u');
    gable(q, 0.4, 40.2, 24.0, 46.5, Y(H2), Y(RT), 'v', 0.45);
    gable(q, 8.0, 24.0, 8.9, 31.9, Y(HC), Y(RC), 'u', 0.45);
    // the apse: a fan from the eave ring to the ridge's end
    const apex = [8.0, Y(RC), VC], ring = APSE.map(([u, v]) => { const dx = u - 8, dz = v - VC, l = Math.hypot(dx, dz) || 1; return [u + (dx / l) * 0.45, v + (dz / l) * 0.45]; });
    for (let i = 0; i < ring.length - 1; i++) {
      const a = [ring[i][0], Y(HC) - 0.3, ring[i][1]], b = [ring[i + 1][0], Y(HC) - 0.3, ring[i + 1][1]];
      rq(q, a, b, apex, apex);
    }
    // the aisles: lean-to roofs from the first cornice up to the clerestory wall
    for (const [vo, vi] of [[4.9, 10.4], [35.9, 30.4]]) rq(q, [46.5, Y(H1 + 0.1), vo], [65.4, Y(H1 + 0.1), vo], [65.4, Y(16.6), vi], [46.5, Y(16.6), vi]);
    // the sacristies: low hips
    for (const [u0, v0, u1, v1] of [[8.0, 0.0, 16.5, 8.9], [8.0, 31.9, 15.2, 40.0]]) {
      const e = Y(8.6) - 0.1, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, c = [[u0 - 0.4, v0 - 0.4], [u1 + 0.4, v0 - 0.4], [u1 + 0.4, v1 + 0.4], [u0 - 0.4, v1 + 0.4]];
      for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; rq(q, [a[0], e, a[1]], [b[0], e, b[1]], [cu, e + 2.6, cv], [cu, e + 2.6, cv]); }
    }
  });

  // ---------------------------------------------------------------- collision and footprints
  const fl = (r) => mapRing(r).flat();
  S.prism(fl(LOW), yB, Y(H1), 0, 0, 'wall');
  S.prism(fl(NAVE), Y(H1 - 1), Y(RN - 1.5), 0, 0, 'wall');
  S.prism(fl(TRANS), yB, Y(RT - 1.5), 0, 0, 'wall');
  S.prism(fl(CHANCEL), yB, Y(RC - 1.5), 0, 0, 'wall');
  for (const r of [SAC1, SAC2]) S.prism(fl(r), yB, Y(9.5), 0, 0, 'wall');
  for (const cv of TCV) { S.prism(fl(rect(TCU, cv, 4.0)), Y(H1 - 0.5), Y(HB), 0, 0, 'wall'); S.cyl(...BAS.xz(TCU, cv), Y(HB), Y(HB + 9.9), 2.8, 0.6, 'wall'); }
  const fp = (r, h, name) => ({ poly: mapRing(r), h, kind: 'public', name, id: BASILICA_SKIP[0] });
  return {
    yF, yB, Y, C, windows,
    footprints: [fp(LOW, 14, 'Bazilica Romano-Catolică'), fp(NAVE, 30, 'Bazilica Romano-Catolică'), fp(TRANS, 30, 'Bazilica Romano-Catolică'), fp(CHANCEL, 26, 'Bazilica Romano-Catolică'), fp(SAC1, 11, 'Bazilica Romano-Catolică'), fp(SAC2, 11, 'Bazilica Romano-Catolică'), ...TCV.map((cv) => fp(rect(TCU, cv, 4.4), 36, 'Bazilica Romano-Catolică'))],
    frontU: UF,
  };
}
