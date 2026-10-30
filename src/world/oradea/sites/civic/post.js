// OWNER: oradea. The Postal Palace (Palatul Poștei, Oficiul Poștal Oradea 1), Strada Roman Ciorogariu 12, Oradea (OSM relation 21028932;
// Virgil Nagy, 1894–95, extended 1909–11): a block of three storeys round a big yard, the street front along the north-east side.
// Built after the Wikimedia Commons photos of the front (the corner view and the portal), and the Street View panoramas of 2024 (under
// renovation nets, so the colours follow the Commons photos: olive-grey render with ochre dressings; no signage drawn):
//   a pale stone plinth with small grated windows, a rusticated ground floor with tall arched windows in ochre frames, a first floor of
//   windows under segmental hoods on brackets, a lower second floor under a heavy cornice; the gate arch to the yard 29 m from the west
//   corner; the portal risalit toward the east end (two dark columns, the red door, a window with a hood and cartouche, pilaster pairs
//   up the three storeys, an attic with a balustrade and a pyramid roof with an oculus); the west corner a bow with an open loggia on
//   the first floor between columns and an eight-sided glazed cupola; dark maroon (north-east wing) and grey (the rest) hipped roofs.
//   The rest of the complex – the west, south and east wings and the yard – is plain bays (the aerial and one street view): a guess.
//   buildPost(ctx) -> { footprints, ring, clear(x, z), yT, stats }      POST_ROWS: the atlas strips (pg, p1, p2, pc)
import { M4 } from '../../../../kit/mesh.js';
import { ringFaces } from '../../../cherkasy/slabkit.js';
import { box, skin, poly, frame, archPts, archOpening, cornice, column, roofRect, cap, band, PI } from './kit.js';
import { stone, plaster, glassRect, archPath, sashWin } from './bays.js';
import { bayWall } from './walls.js';
import { rectOf, inside } from './rects.js';

export const POST_ID = 21028932;
export const POST_RING = [[-22.6, -489.1], [-30.4, -459.8], [-87.3, -474.5], [-99.7, -477.5], [-79.1, -556.3], [-11.9, -523.8]];
export const POST_HOLES = [
  [[-41.3, -520.7], [-39.3, -525.5], [-45.1, -528.0], [-47.4, -523.7]],
  [[-27.8, -514.5], [-26.0, -519.2], [-32.0, -521.5], [-33.9, -517.1]],
  [[-54.8, -532.5], [-58.0, -534.3], [-60.4, -529.8], [-66.2, -532.8], [-64.8, -536.0], [-70.9, -538.9], [-72.8, -533.5], [-69.1, -532.3], [-70.8, -527.3], [-76.9, -528.8], [-78.4, -523.4], [-69.2, -521.0], [-73.6, -506.8], [-79.2, -508.1], [-83.1, -493.2], [-58.9, -487.0], [-58.4, -488.4], [-52.1, -486.6], [-52.3, -485.2], [-39.4, -482.0], [-34.9, -498.1], [-29.2, -497.0], [-27.2, -502.8], [-53.4, -514.9], [-52.3, -517.4], [-60.3, -521.3]],
];
const COL = { wall: '#a39f7e', ochre: '#d9b987', stone: '#c0b9a4', roof: '#7c332c', roofD: '#6d2b26', slate: '#5f6469', slateD: '#53575c', col: '#8a857a', door: '#6a2a24', cream: '#c9c3a3' };
const PL = 1.4, G = 6.0, S1 = 6.35, T1 = 10.4, S2 = 10.65, T2 = 14.0, COR = 15.2;

function paintG(g, x, y, w, h, i, r) {
  stone(g, x, y, w, h, '#9f9b7d', r, { joint: 'rgba(54,52,38,0.55)' });
  const ww = 50, wx = x + (w - ww) / 2, wy = y + 24, wb = y + h - 16;
  g.fillStyle = COL.ochre; archPath(g, wx - 7, wy - 7, ww + 14, wb - wy + 7 + 4); g.fill();
  g.save(); archPath(g, wx, wy, ww, wb - wy); g.clip(); glassRect(g, wx, wy, ww, wb - wy, '#8fa1a9', '#39444a');
  g.fillStyle = '#6b4a2e'; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wb - wy); g.fillRect(wx, wy + ww * 0.55, ww, 3); g.restore();
  g.fillStyle = COL.ochre; g.fillRect(wx - 9, wb - 1, ww + 18, 5);
  return [[wx, wy, ww, wb - wy]];
}
function paintU(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.wall, r);
  const ww = 46, wh = 84, wx = x + (w - ww) / 2, wy = y + 40;
  sashWin(g, wx, wy, ww, wh, { frame: COL.ochre, fw: 7, transom: 0.28, sash: '#6b4a2e' });
  g.fillStyle = COL.ochre; g.beginPath(); g.moveTo(wx - 11, wy - 8); g.quadraticCurveTo(wx + ww / 2, wy - 26, wx + ww + 11, wy - 8); g.lineTo(wx + ww + 11, wy - 2); g.lineTo(wx - 11, wy - 2); g.closePath(); g.fill();
  g.fillRect(wx - 10, wy + wh, ww + 20, 6); g.fillRect(wx - 3, wy + wh + 6, 5, 8); g.fillRect(wx + ww - 2, wy + wh + 6, 5, 8);
  return [[wx, wy, ww, wh]];
}
function paintU2(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.wall, r);
  const ww = 42, wh = 72, wx = x + (w - ww) / 2, wy = y + 30;
  sashWin(g, wx, wy, ww, wh, { frame: COL.ochre, fw: 6, transom: 0.28, sash: '#6b4a2e' });
  g.fillStyle = COL.ochre; g.fillRect(wx - 9, wy - 11, ww + 18, 6); g.fillRect(wx - 8, wy + wh, ww + 16, 5);
  return [[wx, wy, ww, wh]];
}
function paintC(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.wall, r);
  const ww = 42, wh = 74, wx = x + (w - ww) / 2, wy = y + h * 0.28;
  sashWin(g, wx, wy, ww, wh, { frame: '#cdc7a8', fw: 5, transom: 0.28, sash: '#6b4a2e' });
  return [[wx, wy, ww, wh]];
}
export const POST_ROWS = [{ name: 'pg', h: G - PL, paint: paintG }, { name: 'p1', h: T1 - S1, paint: paintU }, { name: 'p2', h: T2 - S2, paint: paintU2 }, { name: 'pc', h: 4.4, paint: paintC }];

export function buildPost(ctx) {
  const { B, S, g, r, bays } = ctx, P = POST_RING, n = P.length, faces = ringFaces(P);
  const gs = []; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; for (let k = 0; k < 6; k++) gs.push(g(a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6)); }
  const yT = Math.max(...gs) + 0.1, gLow = Math.min(...gs) - 0.5 - yT;
  for (const b of Object.values(B)) b.setXf(M4(0, yT, 0));
  const stats = { bays: 0 };
  const fancy = { rows: [['pg', PL, G], ['p1', S1, T1], ['p2', S2, T2]], gaps: [[G, S1], [T1, S2], [T2, COR]], wall: COL.wall, plinth: [PL, COL.stone], trim: COL.ochre, strings: [[G - 0.1, S1 + 0.12, 0.2], [T1 - 0.05, S2 + 0.07, 0.12]], cornice: [T2 - 0.05, COR - T2 + 0.05, 1.0, 0.7] };
  const plain = { rows: [['pc', PL, G], ['pc', S1, T1], ['pc', S2, T2]], gaps: [[G, S1], [T1, S2], [T2, COR]], wall: COL.wall, plinth: [PL, COL.stone], trim: COL.cream, strings: [[G - 0.06, S1 + 0.08, 0.14]], cornice: [T2, COR - T2, 0.7, 0.5] };
  const hint = (i) => [faces[i].nx, faces[i].nz];
  // the west corner is a bow of radius R: the west and north-east faces stop R short of the corner point P4
  const P3 = P[3], P4 = P[4], P5 = P[5], R = 4.6;
  const ew = [(P4[0] - P3[0]) / Math.hypot(P4[0] - P3[0], P4[1] - P3[1]), (P4[1] - P3[1]) / Math.hypot(P4[0] - P3[0], P4[1] - P3[1])];
  const en = [(P5[0] - P4[0]) / Math.hypot(P5[0] - P4[0], P5[1] - P4[1]), (P5[1] - P4[1]) / Math.hypot(P5[0] - P4[0], P5[1] - P4[1])];
  const A = [P4[0] - ew[0] * R, P4[1] - ew[1] * R], Bp = [P4[0] + en[0] * R, P4[1] + en[1] * R];
  const O = [P4[0] - ew[0] * R + en[0] * R, P4[1] - ew[1] * R + en[1] * R];       // the bow's centre: R inside both walls
  const edges = [[P[0], P[1], 0, plain], [P[1], P[2], 1, plain], [P[2], P3, 2, plain], [P3, A, 3, fancy], [Bp, P5, 4, fancy], [P5, P[0], 5, plain]];
  const FN = {};
  edges.forEach(([a, b, i, sp]) => { const F = frame(a, b, hint(i)); FN[i] = F; if (i !== 4) stats.bays += bayWall({ B, bays, gLow }, F, sp, true); });
  // courtyard walls
  for (const H of POST_HOLES) {
    const cx = H.reduce((s, p) => s + p[0], 0) / H.length, cz = H.reduce((s, p) => s + p[1], 0) / H.length;
    H.forEach((a, i) => { const b = H[(i + 1) % H.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.9) return; bayWall({ B, bays, gLow }, frame(a, b, [cx - (a[0] + b[0]) / 2, cz - (a[1] + b[1]) / 2]), plain, false); });
  }
  // ---- the north-east front, in pieces: east bays, the portal risalit, middle bays, the gate arch, west bays. (frame s runs from the
  // east end P5; the gate stands 29 m from the west corner P4, the portal 14.5 m from the east end)
  {
    const F = FN[4], L = F.W, h4 = hint(4), sub = (s0, s1, d = 0) => frame(F.toMap(s0, d), F.toMap(s1, d), h4);
    const pc = 14.5, pw = 4.2, PRJ = 0.45, gc = L - (29 - R), gh = 2.2;
    for (const [s0, s1] of [[0, pc - pw], [pc + pw, gc - gh], [gc + gh, L]]) stats.bays += bayWall({ B, bays, gLow }, sub(s0, s1), fancy, true);
    // -- the gate arch: a stone pier either side, a dark passage, the three storeys of bays above it
    {
      const Fg = sub(gc - gh, gc + gh), fg = Fg.face(), c = gh, W = Fg.W;
      archOpening(B, fg, { s0: c - 1.6, s1: c + 1.6, y0: -0.05, yS: 3.6, rise: 1.6, dep: 0.9, W: B.stone, wcol: COL.stone, frame: '#2a1713', glass: '#1b100e', lit: false, mull: [], tr: null, door: true, rev: '#a69f86', n: 8 });
      band(B.det, fg, [[c - 1.95, 0], ...archPts(c - 1.95, c + 1.95, 3.6, 1.8, 8, 2), [c + 1.95, 0]], [[c - 1.6, 0], ...archPts(c - 1.6, c + 1.6, 3.6, 1.6, 8, 2), [c + 1.6, 0]], 0.07, COL.ochre, false);
      skin(B.stone, fg, gLow, G, COL.stone, [1, 1]);
      bays.band(B.bay, fg, 'p1', S1, T1); bays.band(B.bay, fg, 'p2', S2, T2);
      for (const [y0, y1] of [[G, S1], [T1, S2], [T2, COR]]) skin(B.wall, fg, y0, y1, COL.wall, [1, 1]);
      B.det.setColor(COL.ochre);
      for (const [y0, y1, o] of fancy.strings) box(B.det, fg, -0.04, W + 0.04, y0, y1, 0, o, 'ftu');
      cornice(B.det, fg, -0.1, W + 0.1, T2 - 0.05, COR - T2 + 0.05, 0, 1.0, COL.ochre, 0.7);
    }
    // -- the portal risalit, on its own frame PRJ out from the front
    {
      const F2 = sub(pc - pw, pc + pw, PRJ), f2 = F2.face(), c = pw, W = F2.W;
      B.wall.setColor(COL.wall); box(B.wall, f2, 0, W, gLow, COR, -PRJ, 0, 'lr');
      // the door under a stone arch, the first-floor window with its hood
      archOpening(B, f2, { s0: c - 1.15, s1: c + 1.15, y0: 0.3, yS: 3.6, rise: 1.0, dep: 0.5, W: B.stone, wcol: COL.stone, frame: '#2c1613', glass: COL.door, lit: false, mull: [c], tr: 3.0, door: true, rev: '#a69f86', n: 8 });
      band(B.det, f2, [[c - 1.5, 0.3], ...archPts(c - 1.5, c + 1.5, 3.6, 1.35, 8, 2), [c + 1.5, 0.3]], [[c - 1.15, 0.3], ...archPts(c - 1.15, c + 1.15, 3.6, 1.0, 8, 2), [c + 1.15, 0.3]], 0.08, COL.ochre, false);
      archOpening(B, f2, { s0: c - 1.1, s1: c + 1.1, y0: 7.2, yS: 8.9, rise: 0.8, dep: 0.4, W: B.wall, wcol: COL.wall, frame: '#6b4a2e', glass: '#46555d', lit: r() < 0.4, mull: [c], tr: 8.7, rev: COL.ochre, n: 8 });
      band(B.det, f2, [[c - 1.55, 7.1], ...archPts(c - 1.55, c + 1.55, 8.9, 1.2, 8, 2), [c + 1.55, 7.1]], [[c - 1.1, 7.2], ...archPts(c - 1.1, c + 1.1, 8.9, 0.8, 8, 2), [c + 1.1, 7.2]], 0.1, COL.ochre, false);
      skin(B.stone, f2, gLow, G, COL.stone, [1, 1]);
      skin(B.wall, f2, G, T2, COL.wall, [1, 1]);
      // pilaster pairs, string courses, the cartouche over the window, the cornice
      B.det.setColor(COL.ochre);
      for (const [s0, s1] of [[0.15, 0.75], [W - 0.75, W - 0.15]]) box(B.det, f2, s0, s1, PL, T2, 0, 0.16, 'ftlr');
      for (const [y0, y1, o] of fancy.strings) box(B.det, f2, -0.04, W + 0.04, y0, y1, 0, o, 'ftu');
      box(B.det, f2, c - 0.6, c + 0.6, 10.3, 11.3, 0, 0.12, 'f');
      cornice(B.det, f2, -0.1, W + 0.1, T2 - 0.05, COR - T2 + 0.05, -PRJ, 1.2, COL.ochre, 0.7);
      // the columned porch: a landing, two columns, the slab over them
      B.stone.setColor(COL.stone); box(B.stone, f2, c - 2.9, c + 2.9, gLow, 0.3, 0, 1.7, 'ftlr');
      for (const sg of [-1, 1]) { const [x, z] = F2.toMap(c + sg * 2.0, 1.0); column(B.det, x, z, 0.3, 4.4, 0.36, COL.col); }
      B.det.setColor(COL.stone); box(B.det, f2, c - 2.7, c + 2.7, 4.7, 5.2, 0, 1.4, 'ftlru');
      // the attic: balustrade over the cornice, a little gable with an oculus, the pyramid roof
      B.det.setColor(COL.cream); box(B.det, f2, -0.1, W + 0.1, COR, COR + 0.18, 0.2, 1.0, 'ftu');
      for (let s = 0.2; s <= W - 0.2; s += 0.55) box(B.det, f2, s - 0.07, s + 0.07, COR + 0.18, COR + 1.1, 0.62, 0.78, 'f');
      box(B.det, f2, -0.1, W + 0.1, COR + 1.1, COR + 1.25, 0.5, 0.95, 'ftu');
      B.wall.setColor(COL.wall); poly(B.wall, f2, [[c - 1.5, COR + 0.18], [c + 1.5, COR + 0.18], [c + 1.5, COR + 2.5], [c, COR + 3.4], [c - 1.5, COR + 2.5]], 0.1);
      const ring = [], ri = []; for (let j = 0; j < 14; j++) { const t = j / 14 * PI * 2; ring.push([c + Math.cos(t) * 0.62, COR + 1.7 + Math.sin(t) * 0.62]); ri.push([c + Math.cos(t) * 0.42, COR + 1.7 + Math.sin(t) * 0.42]); }
      B.glass.setColor('#2c3a41'); poly(B.glass, f2, ri, 0.13); band(B.det, f2, ring, ri, 0.16, COL.ochre, true);
      const [rx, rz] = F2.toMap(c, -4.4);
      roofRect(B.roof, { cx: rx, cz: rz, ux: F2.U[0], uz: F2.U[1], hl: pw + 0.2, hw: 4.4, yE: COR - 0.1, rise: 6.0, col: COL.roof, col2: COL.roofD, ov: 0.4 });
    }
  }
  // ---- the west corner: a bow with a first-floor loggia and a cupola
  {
    const a0 = Math.atan2(A[1] - O[1], A[0] - O[0]);
    let a1 = Math.atan2(Bp[1] - O[1], Bp[0] - O[0]); while (a1 < a0 - PI) a1 += 2 * PI; while (a1 > a0 + PI) a1 -= 2 * PI;
    const arc = Array.from({ length: 5 }, (_, k) => { const a = a0 + (a1 - a0) * k / 4; return [O[0] + Math.cos(a) * R, O[1] + Math.sin(a) * R]; });
    for (let k = 0; k < 4; k++) {
      const mid = (a0 + (a1 - a0) * (k + 0.5) / 4), F = frame(arc[k], arc[k + 1], [Math.cos(mid), Math.sin(mid)]), f = F.face(), c = F.W / 2;
      bays.band(B.bay, f, 'pg', PL, G); skin(B.wall, f, G, S1, COL.wall, [1, 1]);
      B.stone.setColor(COL.stone); box(B.stone, f, -0.05, F.W + 0.05, gLow, PL, -0.1, 0.14, 'ftlr');
      B.det.setColor(COL.ochre); box(B.det, f, -0.05, F.W + 0.05, G - 0.1, S1 + 0.15, 0, 0.3, 'ftu');
      // the loggia: the wall set back, dark, between the columns
      B.wall.setColor('#5d5a4a'); box(B.wall, f, 0, F.W, S1, T1, -0.9, -0.85, 'f');
      B.det.setColor(COL.cream); box(B.det, f, -0.05, F.W + 0.05, S1, S1 + 0.9, 0.0, 0.2, 'ftu');
      B.det.setColor(COL.cream); box(B.det, f, -0.05, F.W + 0.05, T1 - 0.4, T1 + 0.3, -0.1, 0.3, 'ftu');
      bays.band(B.bay, f, 'p2', S2, T2); skin(B.wall, f, T1, S2, COL.wall, [1, 1]);
      B.det.setColor(COL.ochre); box(B.det, f, -0.05, F.W + 0.05, T2 - 0.05, T2 + 0.1, 0, 0.7, 'ftu');
      // two slim columns per facet front the loggia
      for (const s of [0.4, F.W - 0.4]) { const [x, z] = F.toMap(s, 0.1); column(B.det, x, z, S1 + 0.9, T1 - S1 - 1.3, 0.2, COL.col); }
    }
    B.det.setColor(COL.cream); B.det.cyl(O[0], T2, O[1], R + 0.5, R + 0.5, 1.1, 20, true);
    B.roof.setColor(COL.roof); cap(B.roof, O[0], O[1], [[R + 0.7, T2 + 1.1], [R * 0.8, T2 + 2.0], [R * 0.45, T2 + 3.6]], 20, COL.roof);
    // the cupola: an octagonal glazed drum with a dark cap
    B.det.setColor(COL.cream); B.det.cyl(O[0], T2 + 3.4, O[1], 2.1, 2.1, 0.4, 8, true);
    B.glass.setColor('#34444c'); B.glass.cyl(O[0], T2 + 3.8, O[1], 1.9, 1.9, 1.3, 8, false);
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * PI * 2; B.det.setColor(COL.cream); B.det.cyl(O[0] + Math.cos(a) * 1.95, T2 + 3.8, O[1] + Math.sin(a) * 1.95, 0.1, 0.1, 1.4, 4, false); }
    B.det.setColor(COL.cream); B.det.cyl(O[0], T2 + 5.1, O[1], 2.25, 2.25, 0.3, 8, true);
    cap(B.roof, O[0], O[1], [[2.3, T2 + 5.4], [1.7, T2 + 5.9], [0.5, T2 + 6.8], [0.1, T2 + 7.4]], 8, COL.roofD);
  }
  // ---- roofs
  const yE = COR - 0.15, hint0 = [0, 0];
  void hint0;
  const Rne = rectOf(P[4], P[5], 12.5, [-1, 1]), Rw = rectOf(P[3], P[4], 7.2, [1, 0]), Rs = rectOf(P[1], P[2], 8.2, [0, -1]), Re = rectOf(P[5], P[0], 6.4, [-1, 0]), Re2 = rectOf(P[0], P[1], 6.4, [-1, 0]);
  roofRect(B.roof, { ...Rne, yE, rise: 5.2, col: COL.roof, col2: COL.roofD, ov: 0.6 });
  for (const [R_, rise] of [[Rw, 3.4], [Rs, 3.8], [Re, 3.0], [Re2, 3.0]]) roofRect(B.roof, { ...R_, yE, rise, col: COL.slate, col2: COL.slateD, ov: 0.5 });
  S.prism(P.flat(), yT + gLow, yT + COR + 4.0, 0, 0, 'wall', 0, POST_HOLES);
  for (const b of Object.values(B)) b.setXf(null);
  stats.yT = yT;
  return { footprints: [{ poly: P, h: COR + 4, kind: 'office', name: 'Palatul Poștei', id: POST_ID }], ring: P, yT, stats, clear: (x, z) => inside(P, x, z) };
}
