// OWNER: oradea. The Palace of Justice (Palatul de Justiție, now the Tribunal Bihor; Strada Roman Ciorogariu / Piața Independenței side,
// opposite Parcul Traian), Oradea: designed by István Kiss, finished in 1901 (ro.wikipedia) in an eclectic Neo-Baroque / Renaissance mix. Built after the
// Wikimedia Commons photos of the front (2012) and the Google Street View panoramas of 2024–2025 round the building:
//   a block of three wings round three courtyards (OSM relation 20421787, 12 outer points, three holes), four storeys counting the
//   rusticated ground floor: sandstone ashlar below, cream render above with white dressings, arched first-floor windows with
//   balustrades, square second-floor windows under hoods, a big cornice, red clay-tile hipped roofs with eyebrow dormers.
//   The front (south-west, on the street) has the central risalit: three arched portals with round windows in rusticated piers, over
//   them four giant half-columns between three arched windows and three square ones with pediments, a cornice and an attic with a
//   triangular pediment and a statue group, under a steep hipped roof; the two front corners are chamfered pavilions with pediments
//   and pyramid roofs. A glazed lantern sits on the ridge of the deep hall wing in the middle.
// The risalit, the portals, the columns and the pediments are modelled; the long sides, the courtyards and the north end are painted
// bays from the shared atlas (./bays.js; one quad per storey and face). Guesses: the north end, the courtyards, the rear wings'
// roofs (seen only from the aerial), the exact bay count of the sides (fitted to the outline).
//   buildJustice(ctx) -> { footprints, ring, clear(x, z), yT, stats }
//   ctx: { B (shared builders: wall stone roof det glass lit atlas bay), S (collision), g (ground height), r (rng), A (atlas uv rects), bays }
//   JUSTICE_ROWS: the atlas strips this building paints (jg ground floor, j1 first floor, j2 second floor, jc plain storey)
import { M4 } from '../../../../kit/mesh.js';
import { ringFaces } from '../../../cherkasy/slabkit.js';
import { at, quad, box, skin, hole, poly, frame, archPts, archOpening, cornice, dentils, rake, column, roofRect, cap, band, PI } from './kit.js';
import { stone, plaster, glassRect, archPath, ring as ringPath } from './bays.js';
import { dot, rectOf, between, corners, upN, inside } from './rects.js';

export const JUSTICE_ID = 20421787;
export const JUSTICE_RING = [[297.9, -518.7], [297.2, -515.2], [280.8, -518.5], [281.1, -520.7], [269.2, -522.9], [263.5, -531.5], [286.0, -611.5], [290.3, -614.5], [323.3, -607.6], [326.5, -603.6], [319.6, -520.5], [312.5, -515.0]];
export const JUSTICE_HOLES = [
  [[288.0, -578.6], [312.6, -573.9], [314.3, -594.6], [311.0, -599.6], [307.7, -600.3], [307.3, -597.3], [305.1, -595.9], [302.3, -596.5], [300.9, -598.6], [301.1, -601.6], [297.7, -602.2], [292.5, -600.2]],
  [[282.4, -558.0], [277.3, -538.2], [281.2, -532.3], [286.2, -531.6], [290.6, -556.6]],
  [[302.1, -554.4], [297.7, -529.4], [302.6, -528.5], [308.2, -532.1], [310.3, -553.0]],
];

const COL = {
  cream: '#e6d8ac', creamD: '#dccc9c', sand: '#d8c3a0', white: '#f1ebdc', col: '#eee6d2', plinth: '#a8a090', glass: '#5b6c74', door: '#4a3022',
  roof: '#c4562e', roofD: '#b44c29', iron: '#262524', gold: '#c9a24a', stat: '#e8e3d4',
};
// heights above the floor line: plinth, ground floor top, first floor from / to, second floor from / to, cornice top, the risalit's attic top
const PL = 0.9, G = 5.0, S1 = 5.4, T1 = 10.3, S2 = 10.6, T2 = 15.1, COR = 16.5, ATT = 18.9;
const RISE = 5.0;

// ------------------------------------------------------------------------------------------------ the painted bays
const pil = (g, x, y, w, h) => { g.fillStyle = 'rgba(250,244,228,0.62)'; g.fillRect(x, y, 5, h); g.fillRect(x + w - 5, y, 5, h); };
function paintG(g, x, y, w, h, i, r) {
  stone(g, x, y, w, h, COL.sand, r);
  const ww = 46, wh = 84, wx = x + (w - ww) / 2, wy = y + 40;
  g.fillStyle = '#ece1c9'; g.fillRect(wx - 6, wy - 8, ww + 12, wh + 8 + 6);                 // the dressed frame
  g.fillRect(wx - 9, wy - 12, ww + 18, 5);                                                    // the lintel
  glassRect(g, wx, wy, ww, wh);
  g.fillStyle = COL.white; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); g.fillRect(wx, wy + wh * 0.36, ww, 3);
  g.fillRect(wx - 4, wy + wh, ww + 8, 4);                                                     // the sill
  g.fillStyle = '#efe5cf'; g.fillRect(wx + ww / 2 - 4, wy - 15, 8, 9);                       // the keystone
  return [[wx, wy, ww, wh]];
}
function paintJ1(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.cream, r);
  pil(g, x, y, w, h);
  const ww = 52, wx = x + (w - ww) / 2, wy = y + 28, wb = y + h - 40;
  g.fillStyle = COL.white; archPath(g, wx - 6, wy - 6, ww + 12, wb - wy + 10); g.fill();
  g.save(); archPath(g, wx, wy, ww, wb - wy); g.clip(); glassRect(g, wx, wy, ww, wb - wy);
  g.fillStyle = COL.white; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wb - wy); g.fillRect(wx, wy + ww * 0.55, ww, 3); g.restore();
  // the keystone and a small shell over the arch
  g.fillStyle = COL.white; g.fillRect(wx + ww / 2 - 5, wy - 14, 10, 10);
  g.beginPath(); g.ellipse(wx + ww / 2, wy - 17, 12, 6, 0, Math.PI, 0); g.fill();
  // the balustrade in front of the sill and the slab under it
  g.fillStyle = COL.white; g.fillRect(wx - 11, wb - 27, ww + 22, 4); g.fillRect(wx - 11, wb - 3, ww + 22, 4);
  for (let k = 0; k < 9; k++) g.fillRect(wx - 9 + k * ((ww + 18) / 8.2), wb - 23, 3, 20);
  g.fillRect(wx - 14, wb + 1, ww + 28, 6); g.fillStyle = 'rgba(90,76,50,0.4)'; g.fillRect(wx - 14, wb + 7, ww + 28, 2);
  return [[wx, wy, ww, wb - wy]];
}
function paintJ2(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.cream, r);
  pil(g, x, y, w, h);
  const ww = 44, wh = 76, wx = x + (w - ww) / 2, wy = y + 52;
  g.fillStyle = COL.white; g.fillRect(wx - 5, wy - 5, ww + 10, wh + 5 + 5);
  glassRect(g, wx, wy, ww, wh);
  g.fillStyle = COL.white; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); g.fillRect(wx, wy + wh * 0.3, ww, 3);
  g.fillRect(wx - 9, wy - 13, ww + 18, 6);                                                    // the hood
  g.beginPath(); g.moveTo(wx - 6, wy - 13); g.lineTo(wx + ww / 2, wy - 24); g.lineTo(wx + ww + 6, wy - 13); g.closePath(); g.fill();
  g.fillRect(wx - 8, wy + wh + 4, ww + 16, 5);                                                // the sill
  g.fillStyle = 'rgba(90,76,50,0.35)'; g.fillRect(wx - 8, wy + wh + 9, ww + 16, 2);
  return [[wx, wy, ww, wh]];
}
function paintC(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, '#e4d6aa', r);
  const ww = 42, wh = 76, wx = x + (w - ww) / 2, wy = y + h * 0.3;
  g.fillStyle = '#f0e9d6'; g.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
  glassRect(g, wx, wy, ww, wh);
  g.fillStyle = '#f0e9d6'; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); g.fillRect(wx, wy + wh * 0.32, ww, 2.5);
  return [[wx, wy, ww, wh]];
}
export const JUSTICE_ROWS = [
  { name: 'jg', h: G - PL, paint: paintG }, { name: 'j1', h: T1 - S1, paint: paintJ1 }, { name: 'j2', h: T2 - S2, paint: paintJ2 }, { name: 'jc', h: 4.6, paint: paintC },
];

export function buildJustice(ctx) {
  const { B, S, g, r, bays } = ctx;
  const faces = ringFaces(JUSTICE_RING), hfaces = JUSTICE_HOLES.map((h) => ringFaces(h));
  const P = JUSTICE_RING;
  // the floor line: the highest ground round the outer wall (the plinth reaches down to the lowest)
  const gs = []; for (const [x, z] of P) gs.push(g(x, z));
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; for (let k = 1; k < 6; k++) gs.push(g(a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6)); }
  const yT = Math.max(...gs) + 0.12, gLow = Math.min(...gs) - 0.6 - yT;
  for (const b of Object.values(B)) b.setXf(M4(0, yT, 0));
  const stats = { portals: 3, columns: 4, dormers: 0, bays: 0 };

  // ------------------------------------------------------------------------------------------ a wall face of painted bays
  function wall(F, kind, rich = true) {
    const f = F.face(), L = F.W;
    if (kind === 'main') { stats.bays += bays.band(B.bay, f, 'jg', PL, G); bays.band(B.bay, f, 'j1', S1, T1); bays.band(B.bay, f, 'j2', S2, T2); }
    else { stats.bays += bays.band(B.bay, f, 'jc', PL, G); bays.band(B.bay, f, 'jc', S1, T1); bays.band(B.bay, f, 'jc', S2, T2); }
    skin(B.wall, f, G, S1, COL.cream, [1, 1]); skin(B.wall, f, T1, S2, COL.cream, [1, 1]); skin(B.wall, f, T2, COR, COL.cream, [1, 1]);
    B.stone.setColor(COL.plinth); box(B.stone, f, -0.05, L + 0.05, gLow, PL, -0.1, 0.16, 'ftlr');
    B.det.setColor(COL.white);
    if (rich) {
      box(B.det, f, -0.04, L + 0.04, G - 0.08, S1 + 0.12, 0, 0.16, 'ftu');
      box(B.det, f, -0.04, L + 0.04, T1 - 0.06, S2 + 0.06, 0, 0.12, 'ftu');
      cornice(B.det, f, -0.1, L + 0.1, T2 - 0.1, COR - T2 + 0.1, 0, 0.95, COL.white, 0.7);
    } else {
      box(B.det, f, -0.04, L + 0.04, G - 0.05, S1 + 0.08, 0, 0.1, 'ftu');
      box(B.det, f, -0.1, L + 0.1, T2 + 0.1, COR, 0, 0.5, 'ftu');
    }
    return f;
  }

  // ------------------------------------------------------------------------------------------ the front risalit
  const fR = faces[1], FR = frame(P[1], P[2], [fR.nx, fR.nz]);
  function risalit(F) {
    const f = F.face(), W = F.W, cs = [W / 2 - 4.6, W / 2, W / 2 + 4.6];
    // ---- ground floor: the three portals
    for (const c of cs) {
      archOpening(B, f, { s0: c - 1.35, s1: c + 1.35, y0: 0, yS: 3.3, rise: 1.35, dep: 0.5, W: B.stone, wcol: COL.sand, frame: COL.door, glass: '#2a221d', lit: true, mull: [c], tr: 3.2, door: true, rev: '#e6dcc4', n: 8 });
      const outer = [[c - 1.62, 0], ...archPts(c - 1.62, c + 1.62, 3.3, 1.55, 8, 2), [c + 1.62, 0]];
      const inner = [[c - 1.35, 0], ...archPts(c - 1.35, c + 1.35, 3.3, 1.35, 8, 2), [c + 1.35, 0]];
      band(B.det, f, outer, inner, 0.07, COL.white, false);
      // the round window in the lunette, in a laurel ring
      const ro = [], ri = [];
      for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; ro.push([c + Math.cos(a) * 0.74, 4.0 + Math.sin(a) * 0.74]); ri.push([c + Math.cos(a) * 0.52, 4.0 + Math.sin(a) * 0.52]); }
      B.lit.setColor('#33434d'); poly(B.lit, f, ri, 0.03);
      band(B.det, f, ro, ri, 0.06, COL.white, true);
      B.det.setColor(COL.white); box(B.det, f, c - 1.55, c + 1.55, 3.3, 3.42, 0, 0.1, 'ft');    // the impost
    }
    skin(B.stone, f, 0, G, COL.sand, [1, 1]);
    B.stone.setColor(COL.plinth); box(B.stone, f, -0.05, W + 0.05, gLow, 0.0, -0.1, 0.16, 'fl');
    B.det.setColor(COL.white); box(B.det, f, -0.1, W + 0.1, G - 0.1, S1 + 0.15, 0, 0.3, 'ftu');
    // ---- the upper floors
    for (const c of cs) {
      archOpening(B, f, { s0: c - 0.95, s1: c + 0.95, y0: 6.55, yS: 8.9, rise: 1.0, dep: 0.4, W: B.wall, wcol: COL.cream, frame: COL.white, glass: COL.glass, lit: r() < 0.5, mull: [c], tr: 8.65, rev: COL.white, n: 8 });
      band(B.det, f, [[c - 1.2, 6.5], ...archPts(c - 1.2, c + 1.2, 8.9, 1.25, 8, 2), [c + 1.2, 6.5]], [[c - 0.95, 6.55], ...archPts(c - 0.95, c + 0.95, 8.9, 1.0, 8, 2), [c + 0.95, 6.55]], 0.06, COL.white, false);
      B.det.setColor(COL.white); box(B.det, f, c - 0.2, c + 0.2, 9.95, 10.4, 0, 0.14, 'f');          // the keystone
      // the balcony under the window: slab, rail, balusters
      box(B.det, f, c - 1.4, c + 1.4, 6.1, 6.55, 0, 0.8, 'ftlru'); box(B.det, f, c - 1.4, c + 1.4, 7.45, 7.57, 0.66, 0.8, 'ftlr');
      for (let k = 0; k < 9; k++) { const s = c - 1.3 + k * 0.325; box(B.det, f, s - 0.04, s + 0.04, 6.55, 7.45, 0.7, 0.76, 'f'); }
      // the second floor: a square window with a pediment
      f.cuts.push({ s0: c - 0.78, s1: c + 0.78, y0: 11.2, y1: 13.8 });
      hole(B, f, { s0: c - 0.78, s1: c + 0.78, y0: 11.2, y1: 13.8, dep: 0.4, frame: COL.white, glass: COL.glass, lit: r() < 0.5, pitch: 0.78, tr: 12.9, rev: COL.white, sill: COL.cream });
      const py = 14.0, pts = [[c - 1.15, py], [c + 1.15, py], [c, py + 0.72]];
      B.wall.setColor(COL.creamD); poly(B.wall, f, pts, 0.1);
      rake(B.det, f, pts[0], pts[2], 0.14, 0, 0.22, COL.white); rake(B.det, f, pts[2], pts[1], 0.14, 0, 0.22, COL.white);
      B.det.setColor(COL.white); box(B.det, f, c - 1.2, c + 1.2, 13.84, 14.02, 0, 0.2, 'ftu');
    }
    skin(B.wall, f, G, T2 - 0.3, COL.cream, [1, 1]);
    // the giant order: four half-columns between and beside the window bays
    for (const s of [W / 2 - 6.9, W / 2 - 2.3, W / 2 + 2.3, W / 2 + 6.9]) {
      const [x, z] = F.toMap(s, 0.62);
      column(B.det, x, z, S1 + 0.05, 9.2, 0.5, COL.col);
      B.det.setColor(COL.white); box(B.det, f, s - 0.62, s + 0.62, S1 + 0.05, S1 + 0.3, 0, 1.2, 'ftlr');            // the plinth block
    }
    // entablature over the columns, then the attic with its pediment and the group in it
    cornice(B.det, f, -0.25, W + 0.25, T2 - 0.4, COR - (T2 - 0.4), 0, 1.4, COL.white, 0.95);
    skin(B.wall, f, COR + 0.2, ATT, COL.cream, [1, 1]);
    B.det.setColor(COL.white); box(B.det, f, -0.1, W + 0.1, ATT - 0.25, ATT, 0, 0.5, 'ftu');
    const mid = W / 2, pp = [[mid - 5.4, ATT], [mid + 5.4, ATT], [mid, ATT + 3.1]];
    B.wall.setColor(COL.creamD); poly(B.wall, f, pp, 0.12);
    rake(B.det, f, pp[0], pp[2], 0.3, 0, 0.4, COL.white); rake(B.det, f, pp[2], pp[1], 0.3, 0, 0.4, COL.white);
    // the group in the tympanum: a tall central figure, flanked by smaller ones that kneel and lie toward the corners
    for (const [k, h] of [[0, 1.9], [-1, 1.5], [1, 1.5], [-2, 1.0], [2, 1.0], [-3, 0.7], [3, 0.7]]) {
      const [x, y, z] = at(f, mid + k * 1.15, ATT + 0.2, 0.4);
      B.det.setColor(COL.stat); B.det.ellipsoid([x, y + h * 0.4, z], [0.3, h * 0.4, 0.22], 6, 4); B.det.ellipsoid([x, y + h * 0.86, z], [0.15, 0.17, 0.15], 6, 4);
    }
    // acroteria: urns over the ends of the attic
    for (const s of [0.4, W - 0.4]) { const [x, , z] = at(f, s, 0, 0.2); B.det.setColor(COL.stat); B.det.lathe([[0.3, ATT], [0.28, ATT + 0.35], [0.18, ATT + 0.7], [0.32, ATT + 1.0], [0.1, ATT + 1.2]], 8, x, z); }
  }

  // ------------------------------------------------------------------------------------------ the outer faces
  P.forEach((a, i) => {
    const b = P[(i + 1) % P.length], fc = faces[i];
    if (i === 1) { risalit(FR); return; }
    const F = frame(a, b, [fc.nx, fc.nz]);
    const plain = i === 7 || i === 6 || i === 8;
    wall(F, plain ? 'plain' : 'main');
    // pediments on the front chamfers: the corner pavilions
    if (i === 4 || i === 10) pavilionGable(F);
  });
  function pavilionGable(F) {
    const f = F.face(), c = F.W / 2, w = Math.min(2.7, F.W / 2 - 0.4), h = 2.9;
    const pts = [[c - w, COR], [c + w, COR], [c, COR + h]];
    B.wall.setColor(COL.creamD); poly(B.wall, f, pts, 0.1);
    rake(B.det, f, pts[0], pts[2], 0.24, 0, 0.32, COL.white); rake(B.det, f, pts[2], pts[1], 0.24, 0, 0.32, COL.white);
    const ro = [], ri = [];
    for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2; ro.push([c + Math.cos(a) * 0.62, COR + 1.05 + Math.sin(a) * 0.62]); ri.push([c + Math.cos(a) * 0.42, COR + 1.05 + Math.sin(a) * 0.42]); }
    B.lit.setColor('#33434d'); poly(B.lit, f, ri, 0.13); band(B.det, f, ro, ri, 0.16, COL.white, true);
    B.det.setColor(COL.white); box(B.det, f, c - w - 0.2, c + w + 0.2, COR - 0.02, COR + 0.2, 0, 0.5, 'ftu');
    const [fx, , fz] = at(f, c, 0, 0.1);
    cap(B.roof, fx, fz, [[0.16, COR + h], [0.1, COR + h + 0.35], [0.03, COR + h + 1.5]], 6, COL.gold);
  }
  // the courtyards: plain storeys, a light cornice
  hfaces.forEach((hf, k) => {
    const H = JUSTICE_HOLES[k], cx = H.reduce((s, p) => s + p[0], 0) / H.length, cz = H.reduce((s, p) => s + p[1], 0) / H.length;
    H.forEach((a, i) => {
      const b = H[(i + 1) % H.length];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.9) return;
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      wall(frame(a, b, [cx - mx, cz - mz]), 'plain', false);
    });
  });

  // ------------------------------------------------------------------------------------------ the roofs
  const Rw = rectOf(P[5], P[6], 5.9, [1, 0]), Re = rectOf(P[10], P[9], 6.0, [-1, 0]);
  const Rs = between(rectOf(P[4], P[11], 6.4, [0, -1]), Rw, Re), Rn = between(rectOf(P[7], P[8], 5.6, [0, 1]), Rw, Re);
  const Rc = between({ cx: 296.0, cz: -566.3, ux: 0.9835, uz: 0.1794, hl: 20, hw: 10.5 }, Rw, Re);
  const Rp = between({ cx: 294.2, cz: -545.0, ux: 0.1794, uz: -0.9835, hl: 20, hw: 5.8 }, Rs, Rc);
  const yE = COR - 0.15, ridgeY = yE + RISE;
  const rf = (R, o = {}) => roofRect(B.roof, { ...R, yE, rise: RISE, col: COL.roof, col2: COL.roofD, ov: 0.55, ...o });
  rf(Rw); rf(Re); rf(Rs, { gable: true, gcol: COL.creamD }); rf(Rn, { gable: true, gcol: COL.creamD }); rf(Rc, { gable: true, gcol: COL.creamD }); rf(Rp, { gable: true, gcol: COL.creamD });
  // the risalit: a steep hipped roof over the front bays, finials on the ridge ends
  const Rr = (() => { const m = FR.toMap(FR.W / 2, -6.6); return { cx: m[0], cz: m[1], ux: FR.U[0], uz: FR.U[1], hl: FR.W / 2 + 0.1, hw: 6.6 }; })();
  {
    roofRect(B.roof, { ...Rr, yE: ATT - 0.2, rise: 7.2, col: COL.roof, col2: COL.roofD, ov: 0.5 });
    for (const sgn of [-1, 1]) { const x = Rr.cx + Rr.ux * sgn * (Rr.hl - Rr.hw), z = Rr.cz + Rr.uz * sgn * (Rr.hl - Rr.hw); cap(B.roof, x, z, [[0.2, ATT + 7.0], [0.14, ATT + 7.4], [0.05, ATT + 8.6], [0.02, ATT + 9.2]], 6, COL.gold); }
  }
  // the corner pavilions: pyramid roofs on squares standing on the chamfers
  const pav = [];
  for (const i of [4, 10]) {
    const a = P[i], b = P[(i + 1) % P.length], fc = faces[i], hw = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2 + 0.4;
    const R = { cx: (a[0] + b[0]) / 2 - fc.nx * hw, cz: (a[1] + b[1]) / 2 - fc.nz * hw, ux: fc.ux, uz: fc.uz, hl: hw, hw };
    roofRect(B.roof, { ...R, yE, rise: 8.0, col: COL.roof, col2: COL.roofD, ov: 0.5 });
    cap(B.roof, R.cx, R.cz, [[0.22, yE + 7.8], [0.15, yE + 8.3], [0.04, yE + 10.0], [0.02, yE + 10.6]], 6, COL.gold);
    pav.push(R);
  }
  // the lantern on the hall's ridge: a glass hip with a pale iron frame
  roofRect(B.glass, { ...Rc, hl: Rc.hl - 6, hw: 3.3, yE: ridgeY - 0.3, rise: 2.4, col: '#93a6b1', col2: '#8497a2', ov: 0.1 });
  // eyebrow dormers on the outer slopes of the long wings and the front and rear wings
  const dormer = (px, pz, nx, nz, slope) => {
    const d0 = 1.6, hw = 0.62, hgt = 1.5, tx = -nz, tz = nx, bx = px - nx * d0, bz = pz - nz * d0, y0 = yE + d0 * slope;
    const Q = (t, d, y) => [bx + tx * t - nx * d, y, bz + tz * t - nz * d], N = [nx, 0, nz], ry = y0 + hgt + 0.5;
    B.wall.setColor(COL.cream); quad(B.wall, Q(-hw, 0, y0), Q(hw, 0, y0), Q(hw, 0, y0 + hgt), Q(-hw, 0, y0 + hgt), N);
    B.wall.face([Q(-hw - 0.1, 0, y0 + hgt), Q(hw + 0.1, 0, y0 + hgt), Q(0, 0, ry)], N);
    B.det.setColor(COL.white); quad(B.det, Q(-0.47, -0.012, y0 + 0.2), Q(0.47, -0.012, y0 + 0.2), Q(0.47, -0.012, y0 + hgt - 0.1), Q(-0.47, -0.012, y0 + hgt - 0.1), N);
    B.glass.setColor(COL.glass); quad(B.glass, Q(-0.37, -0.02, y0 + 0.3), Q(0.37, -0.02, y0 + 0.3), Q(0.37, -0.02, y0 + hgt - 0.2), Q(-0.37, -0.02, y0 + hgt - 0.2), N);
    const e1 = hgt / slope, e2 = (hgt + 0.5) / slope;
    B.wall.setColor(COL.creamD);
    for (const sg of [-1, 1]) B.wall.face([Q(sg * hw, 0, y0), Q(sg * hw, 0, y0 + hgt), Q(sg * hw, e1, y0 + hgt)], [tx * sg, 0, tz * sg]);
    B.roof.setColor(COL.roofD);
    for (const sg of [-1, 1]) { const pts = [Q(sg * (hw + 0.1), -0.12, y0 + hgt), Q(sg * (hw + 0.1), e1, y0 + hgt), Q(0, e2, ry), Q(0, -0.12, ry + 0.05)]; B.roof.face(pts, upN(pts[0], pts[1], pts[2])); }
    stats.dormers++;
  };
  const centre = [295, -566];
  const outSign = (R) => (dot([-R.uz, R.ux], [R.cx - centre[0], R.cz - centre[1]]) > 0 ? 1 : -1);
  const blocked = (x, z) => inside(corners(Rr, 1.5), x, z) || pav.some((R) => inside(corners(R, 1.5), x, z));
  const row = (R, margin, step) => {
    const sgn = outSign(R), nx = -R.uz * sgn, nz = R.ux * sgn, slope = RISE / R.hw;
    for (let s = -R.hl + margin; s <= R.hl - margin + 0.01; s += step) {
      const x = R.cx + R.ux * s + nx * R.hw, z = R.cz + R.uz * s + nz * R.hw;
      if (!blocked(x, z)) dormer(x, z, nx, nz, slope);
    }
  };
  row(Rw, 12, 7.2); row(Re, 12, 7.2); row(Rn, 4.5, 6.8); row(Rs, 3.0, 6.8);

  // ------------------------------------------------------------------------------------------ collision
  const top = yT + COR + RISE;
  S.prism(P.flat(), yT + gLow, top, 0, 0, 'wall', 0, JUSTICE_HOLES);
  const ar = corners({ ...Rr, hl: FR.W / 2 });
  S.prism(ar.flat(), yT + COR, yT + ATT + 6.5, 0, 0, 'roof', 0);
  for (const R of pav) S.prism(corners(R, -0.8).flat(), yT + COR, yT + COR + 6.5, 0, 0, 'roof', 0);
  for (const b of Object.values(B)) b.setXf(null);
  stats.yT = yT;
  return {
    footprints: [{ poly: P, h: COR + RISE, kind: 'court', name: 'Palatul de Justiție', id: JUSTICE_ID }],
    ring: P, yT, stats,
    clear: (x, z) => inside(P, x, z),
  };
}
void ringPath; void M4;
