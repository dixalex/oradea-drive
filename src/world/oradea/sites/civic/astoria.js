// OWNER: oradea. Hotel Astoria (the Sztarill Palace, EMKE), Strada Teatrului 1–2, on the corner of Piața Regele Ferdinand I, Oradea
// (Ferenc Sztarill, 1902, extended 1904; a Secession–Gothic mix after Lechner; the EMKE café on the ground floor, a hotel since the
// 1930s). Built after the Wikimedia Commons photos of 2012–2025 and the Google Street View panoramas of 2024–2025 of both streets:
//   an L of two wings meeting at a rounded corner (R 3.2 m) under a slender tower; ground floor of shopfront arches in white
//   mouldings (a tall window and a mezzanine arch in each), above it two storeys of pointed-arch windows with a central mullion,
//   each in a pink or a yellow lancet field outlined in white, round-fronted balconies with wrought-iron lattice on the first floor
//   and small ones on the second, white piers; a wavy cornice, narrow pointed gables with finials over every second bay, a hip
//   roof of red tile with iron cresting; the tower: a drum with the lettering band, a lantern of six slim columns and a red-tile cap
//   with a spire.
// The south wing (Strada Teatrului, 9 bays) and the east wing (on the square, 5 bays) are from the photos; the yard side and the
// west end are plain render (a guess). The wings are 17 m deep, the way the aerial shows the roofs; the rest of the OSM block
// (the old white house to the west, the cream three-storey house to the north, the rear annex) is built by civic/fill.js.
//   buildAstoria(ctx) -> { footprints, ring (the L), clear(x, z), yT, stats }
//   ctx: { B (shared builders: wall stone roof det glass lit atlas), S (collision), g (ground height), r (rng), A (atlas uv rects) }
import { M4 } from '../../../../kit/mesh.js';
import { at, quad, box, skin, hole, poly, frame, archPts, archOpening, rake, roofRect, cap, iron, shade, PI, band, lancet } from './kit.js';

export const ASTORIA_ID = 421787863;
const C = [-11.0, -231.2], US = [-0.99643, -0.08426], UE = [0.10251, -0.9947];     // the outer corner, along the south wall (west), along the east wall (north)
const RC = 3.2, L_S = 42.1, L_E = 25.4, DEPTH = 17;
const IN_S = [0.08426, -0.99643], IN_E = [-0.9947, -0.10251];
const add = (a, v, k) => [a[0] + v[0] * k, a[1] + v[1] * k];
const O = add(add(C, US, RC), UE, RC);                                               // the corner circle's centre
const PS = add(C, US, RC), PE = add(C, UE, RC), W_END = add(C, US, L_S), E_END = add(C, UE, L_E);
const ang = (p) => Math.atan2(p[1] - O[1], p[0] - O[0]);
const A0 = ang(PS), A1 = ang(PE);
const ARC = Array.from({ length: 4 }, (_, k) => { const a = A0 + (A1 - A0) * k / 3; return [O[0] + Math.cos(a) * RC, O[1] + Math.sin(a) * RC]; });
// the L as a ring: west end, west inner, inner corner, east inner, east end, then the outer corner arc back to the west end
const L_RING = [W_END, add(W_END, IN_S, DEPTH), add(add(C, IN_S, DEPTH), IN_E, DEPTH), add(E_END, IN_E, DEPTH), E_END, PE, ARC[2], ARC[1], PS];
export const ASTORIA_RING = L_RING;

// the two wings as oriented rectangles { cx, cz, ux, uz, hl, hw } from the outer wall line inward (also what the neighbours are cut by)
const wingRect = (a, b, d, inward) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  return { cx: (a[0] + b[0]) / 2 + inward[0] * d / 2, cz: (a[1] + b[1]) / 2 + inward[1] * d / 2, ux, uz, hl: L / 2, hw: d / 2 };
};
export const ASTORIA_RECTS = [wingRect(W_END, C, DEPTH, IN_S), wingRect(C, E_END, DEPTH, IN_E)];

const COL = {
  pink: '#e8a48e', pinkD: '#d98f79', yellow: '#e4cf78', white: '#f2eee5', cream: '#e9dfc4', iron: '#262524', brown: '#5a3a24', glass: '#66757f',
  roof: '#b5532f', roofD: '#a24a2a', cap: '#b9472b', plinth: '#c9a28d', gold: '#c9a24a', col: '#efe6cf',
};
const PL = 0.9, G = 4.9, F1 = 5.25, F2 = 9.2, F3 = 12.9, COR = 14.3, GABLE = 18.0, TOWER_Y = 14.3;

export function buildAstoria(ctx) {
  const { B, S, g, r, A } = ctx;
  const F_S = frame(PS, W_END, [-0.08, 1]), F_E = frame(PE, E_END, [1, 0.1]);
  const f_s = F_S.face(), f_e = F_E.face();
  // floor line: the highest ground along both fronts (the plinth reaches down to the lowest)
  const gs = []; for (let i = 0; i <= 12; i++) { gs.push(g(...F_S.toMap(F_S.W * i / 12, 0.4))); gs.push(g(...F_E.toMap(F_E.W * i / 12, 0.4))); }
  const yT = Math.max(...gs) + 0.12, gLow = Math.min(...gs, ...L_RING.map(([x, z]) => g(x, z))) - 0.6 - yT;
  for (const b of Object.values(B)) b.setXf(M4(0, yT, 0));
  const stats = { windows: 0, balconies: 0, gables: 0 };

  // a bay of a wing: c the centre on the face, w the width, j the bay's number counted from the corner, door the entrance bay
  function bay(f, c, w, j, { door = false, balc = true } = {}) {
    const B_ = j % 2 === 1;                                            // yellow-field bays
    const wood = COL.brown;
    // ---------------------------------------------------------------------------------- ground floor
    const lit = () => r() < 0.45;
    if (door) {
      f.cuts.push({ s0: c - 1.0, s1: c + 1.0, y0: 0, y1: 3.2 });
      hole(B, f, { s0: c - 1.0, s1: c + 1.0, y0: 0, y1: 3.2, dep: 0.4, frame: wood, glass: '#3a2e26', door: true, pitch: 1.0, tr: 2.5, lit: true, rev: COL.white });
      B.det.setColor(COL.iron); box(B.det, f, c - 1.45, c + 1.45, 3.3, 3.4, 0, 1.5, 'ftulr');
      B.glass.setColor('#7c8d96'); quad(B.glass, at(f, c - 1.42, 3.4, 0.03), at(f, c + 1.42, 3.4, 0.03), at(f, c + 1.42, 3.4, 1.47), at(f, c - 1.42, 3.4, 1.47), [0, 1, 0]);
      for (const sg of [-1, 1]) { B.det.setColor(COL.iron); box(B.det, f, c + sg * 1.35 - 0.03, c + sg * 1.35 + 0.03, 2.4, 3.3, 0.9, 0.95, 'ftlr'); }
    } else {
      f.cuts.push({ s0: c - 0.95, s1: c + 0.95, y0: 1.0, y1: 3.3 });
      hole(B, f, { s0: c - 0.95, s1: c + 0.95, y0: 1.0, y1: 3.3, dep: 0.32, frame: wood, glass: COL.glass, lit: lit(), pitch: 0.95, tr: 2.7, rev: COL.white, sill: COL.cream });
    }
    archOpening(B, f, { s0: c - 0.72, s1: c + 0.72, y0: 3.75, yS: 4.1, rise: 0.62, dep: 0.3, W: B.wall, wcol: COL.pink, frame: wood, glass: COL.glass, lit: lit(), mull: [c], tr: null, rev: COL.white, n: 6 });
    stats.windows += 2;
    // the white arch of the bay: the legs and the crown, 0.3 m wide, 0.07 m proud
    const outer = lancet(c - 1.95, c + 1.95, PL, 3.45, 1.4, 8, 2), inner = lancet(c - 1.65, c + 1.65, PL, 3.45, 1.22, 8, 2);
    band(B.det, f, outer, inner, 0.07, COL.white, false);
    // a console under the string course on the pier between two bays
    B.det.setColor(COL.white); box(B.det, f, c + w / 2 - 0.2, c + w / 2 + 0.2, 4.0, 4.9, 0, 0.3, 'ftlr');
    // ---------------------------------------------------------------------------------- the two storeys
    for (const [k, y0, H] of [[1, F1, F2 - F1], [2, F2, F3 - F2]]) {
      const sill = k === 1 ? (B_ ? 0.75 : 0.12) : 0.8, yS = y0 + H - 1.5, rise = 0.95, p = 1.3;
      archOpening(B, f, { s0: c - 0.72, s1: c + 0.72, y0: y0 + sill, yS, rise, dep: 0.3, W: B.wall, wcol: B_ ? COL.yellow : COL.pink, frame: wood, glass: COL.glass, lit: lit(), mull: [c], tr: yS - 0.25, rev: COL.white, n: 6, p });
      stats.windows++;
      // the lancet field round the window: yellow on the odd bays, a white-ringed pink one on the even bays
      const win = lancet(c - 0.72, c + 0.72, y0 + sill, yS, rise, 6, p);
      if (B_) {
        const fieldO = lancet(c - 1.7, c + 1.7, y0 + 0.2, yS - 0.4, 1.55, 6, 1.15);
        // the annulus between the field's outline and the window: the first part rides up the legs, so map the window's points onto it
        band(B.wall, f, fieldO, win.map(([s, y], i) => (i === 0 || i === win.length - 1 ? [s, y0 + 0.2] : [s, y])), 0.035, COL.yellow, false);
        B.wall.setColor(COL.yellow); quad(B.wall, at(f, c - 0.72, y0 + 0.2, 0.035), at(f, c + 0.72, y0 + 0.2, 0.035), at(f, c + 0.72, y0 + sill, 0.035), at(f, c - 0.72, y0 + sill, 0.035), f.N);
        band(B.det, f, lancet(c - 1.92, c + 1.92, y0 + 0.2, yS - 0.4, 1.7, 6, 1.15), fieldO, 0.06, COL.white, false);
      } else {
        band(B.det, f, lancet(c - 1.0, c + 1.0, y0 + sill - 0.1, yS - 0.05, rise + 0.2, 6, p), win, 0.05, COL.white, false);
        band(B.wall, f, lancet(c - 1.7, c + 1.7, y0 + 0.25, yS - 0.5, 1.5, 6, 1.5), lancet(c - 1.0, c + 1.0, y0 + sill - 0.1, yS - 0.05, rise + 0.2, 6, p).map(([s, y], i, a) => (i === 0 || i === a.length - 1 ? [s, y0 + 0.25] : [s, y])), 0.03, COL.pinkD, false);
      }
      // the sill plate under the windows of the yellow bays
      if (k === 2 || B_) { B.det.setColor(COL.white); box(B.det, f, c - 0.95, c + 0.95, y0 + sill - 0.14, y0 + sill, 0, 0.24, 'ftlr'); B.det.setColor(COL.gold); box(B.det, f, c - 0.7, c + 0.7, y0 + sill - 0.12, y0 + sill - 0.04, 0.24, 0.27, 'f'); }
    }
    void balc;
  }

  // balconies on one wing: first floor continuous over bay pairs, second floor one small balcony on every even bay
  function balconies(f, list) {
    const slab = (s0, s1, y, d, th) => {
      B.wall.setColor(COL.pink); box(B.wall, f, s0, s1, y - th, y, 0, d, 'ftulr');
      B.det.setColor(COL.white); box(B.det, f, s0 - 0.04, s1 + 0.04, y - 0.06, y + 0.06, d - 0.02, d + 0.06, 'ftu');
      for (const s of [s0 + 0.35, s1 - 0.35]) { B.det.setColor(COL.white); box(B.det, f, s - 0.12, s + 0.12, y - 1.0, y - th, 0, d * 0.7, 'flrt'); }
      // railing: the front and the two returns, 0.95 m of lattice on a rail
      iron(B.atlas, f, s0 + 0.05, s1 - 0.05, y + 0.06, y + 1.0, d - 0.04, A.ironA);
      for (const [s, sg] of [[s0 + 0.04, -1], [s1 - 0.04, 1]]) {
        const a = at(f, s, y + 0.06, 0), b = at(f, s, y + 0.06, d - 0.04), c2 = at(f, s, y + 1.0, d - 0.04), d2 = at(f, s, y + 1.0, 0);
        const [u0, v0, u1, v1] = A.ironB, first = B.atlas.v;
        for (const [p, uu, vv] of [[a, u0, v1], [b, u0 + (u1 - u0) * 0.4, v1], [c2, u0 + (u1 - u0) * 0.4, v0], [d2, u0, v0]]) B.atlas.vert(p[0], p[1], p[2], sg * f.U[0], 0, sg * f.U[2], uu, 1 - vv);
        B.atlas.quad(first, first + 1, first + 2, first + 3);
      }
      B.det.setColor(COL.iron); box(B.det, f, s0, s1, y + 1.0, y + 1.06, d - 0.08, d, 'ftu');
      stats.balconies++;
    };
    for (const [a, b] of list.first) slab(a, b, F1, 1.05, 0.34);
    for (const [a, b] of list.second) slab(a, b, F2, 0.8, 0.28);
  }

  // the wing's string courses, cornice, gables
  function crown(f, s0, s1, gables) {
    B.det.setColor(COL.white);
    box(B.det, f, s0 - 0.1, s1 + 0.1, G, G + 0.34, 0, 0.32, 'ftu');                 // above the ground floor
    box(B.det, f, s0 - 0.1, s1 + 0.1, F2 - 0.1, F2 + 0.08, 0, 0.12, 'ftu');         // between the storeys
    B.det.setColor(COL.white);
    box(B.det, f, s0 - 0.12, s1 + 0.12, COR - 0.7, COR - 0.4, 0, 0.45, 'ftu');
    box(B.det, f, s0 - 0.18, s1 + 0.18, COR - 0.4, COR, 0, 0.8, 'ftu');
    // iron cresting along the top of the cornice
    B.det.setColor(COL.iron); box(B.det, f, s0 - 0.1, s1 + 0.1, COR, COR + 0.42, 0.38, 0.46, 'ft');
    for (let s = s0; s < s1; s += 0.45) box(B.det, f, s, s + 0.06, COR, COR + 0.65, 0.4, 0.44, 'f');
    for (const c of gables) {
      // a narrow pointed gable standing on the cornice: a flat face with a small arched window, white raking mouldings, a finial
      const hw = 1.3, pts = [[c - hw, COR], [c + hw, COR], [c + hw - 0.15, COR + 1.2], [c + 0.45, GABLE - 0.9], [c, GABLE], [c - 0.45, GABLE - 0.9], [c - hw + 0.15, COR + 1.2]];
      B.wall.setColor(COL.yellow); poly(B.wall, f, pts, 0.1);
      for (const i of [2, 3, 4, 5]) rake(B.det, f, pts[i], pts[i + 1], 0.14, -0.3, 0.2, COL.white);
      const win = [[c - 0.32, COR + 0.75], ...archPts(c - 0.32, c + 0.32, COR + 1.6, 0.4, 6, 1.4), [c + 0.32, COR + 0.75]];
      B.lit.setColor('#f2d9a0'); poly(B.lit, f, win, 0.14);
      band(B.det, f, [[c - 0.5, COR + 0.75], ...archPts(c - 0.5, c + 0.5, COR + 1.6, 0.55, 6, 1.4), [c + 0.5, COR + 0.75]], win, 0.15, COL.white, false);
      const [fx, , fz] = at(f, c, 0, 0.05);
      cap(B.roof, fx, fz, [[0.18, GABLE], [0.15, GABLE + 0.2], [0.06, GABLE + 1.0], [0.02, GABLE + 1.5]], 6, COL.cap);
      stats.gables++;
    }
  }

  // ------------------------------------------------------------------------------------------ the south wing (Strada Teatrului)
  {
    const W = F_S.W, n = 9, w = W / n;
    const toS = (j) => W - (j + 0.5) * w;                      // bay j counted from the corner: the corner is at s = W
    const doorJ = 3;
    for (let j = 0; j < n; j++) bay(f_s, toS(j), w, j, { door: j === doorJ });
    const first = [], second = [];
    for (let j = 0; j < n; j += 2) {
      if (j + 1 < n) first.push([toS(j + 1) - w / 2 + 0.2, toS(j) + w / 2 - 0.2]); else first.push([toS(j) - w / 2 + 0.3, toS(j) + w / 2 - 0.3]);
      second.push([toS(j) - 1.0, toS(j) + 1.0]);
    }
    skin(B.wall, f_s, PL, COR - 0.7, COL.pink, [1, 1]);
    B.stone.setColor(COL.plinth); box(B.stone, f_s, -0.05, W + 0.05, gLow, PL, -0.5, 0.18, 'ftlr');
    balconies(f_s, { first, second });
    crown(f_s, 0, W, Array.from({ length: Math.floor(n / 2) }, (_, i) => toS(2 * i + 1)));
  }
  // ------------------------------------------------------------------------------------------ the east wing (the square)
  {
    const W = F_E.W, n = 5, w = W / n;
    const toS = (j) => (j + 0.5) * w;                          // the corner is at s = 0
    for (let j = 0; j < n; j++) bay(f_e, toS(j), w, j + 1);
    const first = [], second = [];
    for (let j = 0; j < n; j += 2) {
      if (j + 1 < n) first.push([toS(j) - w / 2 + 0.2, toS(j + 1) + w / 2 - 0.2]); else first.push([toS(j) - w / 2 + 0.3, toS(j) + w / 2 - 0.3]);
      second.push([toS(j) - 1.0, toS(j) + 1.0]);
    }
    skin(B.wall, f_e, PL, COR - 0.7, COL.pink, [1, 1]);
    B.stone.setColor(COL.plinth); box(B.stone, f_e, -0.05, W + 0.05, gLow, PL, -0.5, 0.18, 'ftlr');
    balconies(f_e, { first, second });
    crown(f_e, 0, W, Array.from({ length: Math.floor(n / 2) }, (_, i) => toS(2 * i + 1)));
  }
  // ------------------------------------------------------------------------------------------ the rounded corner: three facets
  {
    const hint = (k) => { const a = (ang(ARC[k]) + ang(ARC[k + 1])) / 2; return [Math.cos(a), Math.sin(a)]; };
    for (let k = 0; k < 3; k++) {
      const F = frame(ARC[k], ARC[k + 1], hint(k)), f = F.face(), c = F.W / 2;
      const mid = k === 1;
      // ground floor
      if (mid) {
        f.cuts.push({ s0: c - 0.55, s1: c + 0.55, y0: 0, y1: 2.9 });
        hole(B, f, { s0: c - 0.55, s1: c + 0.55, y0: 0, y1: 2.9, dep: 0.35, frame: COL.brown, glass: '#3a2e26', door: true, pitch: 1.1, tr: 2.4, lit: true, rev: COL.white });
        // the round window over the door, in a white ring
        const ring = [], hole2 = [];
        for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; ring.push([c + Math.cos(a) * 0.95, 3.8 + Math.sin(a) * 0.95]); hole2.push([c + Math.cos(a) * 0.62, 3.8 + Math.sin(a) * 0.62]); }
        band(B.det, f, ring, hole2, 0.06, COL.white, true);
        B.lit.setColor('#3a4a52'); poly(B.lit, f, hole2, 0.04);
      } else {
        f.cuts.push({ s0: c - 0.6, s1: c + 0.6, y0: 1.0, y1: 3.3 });
        hole(B, f, { s0: c - 0.6, s1: c + 0.6, y0: 1.0, y1: 3.3, dep: 0.3, frame: COL.brown, glass: COL.glass, lit: r() < 0.5, pitch: 0.6, tr: 2.7, rev: COL.white });
        archOpening(B, f, { s0: c - 0.5, s1: c + 0.5, y0: 3.75, yS: 4.05, rise: 0.5, dep: 0.25, W: B.wall, wcol: COL.pink, frame: COL.brown, glass: COL.glass, lit: true, mull: [], tr: null, rev: COL.white, n: 5 });
      }
      for (const [y0, H, sill] of [[F1, F2 - F1, 0.12], [F2, F3 - F2, 0.8]]) {
        const yS = y0 + H - 1.5;
        archOpening(B, f, { s0: c - 0.5, s1: c + 0.5, y0: y0 + sill, yS, rise: 0.8, dep: 0.25, W: B.wall, wcol: COL.pink, frame: COL.brown, glass: COL.glass, lit: r() < 0.5, mull: [c], tr: yS - 0.2, rev: COL.white, n: 5, p: 1.3 });
        band(B.det, f, lancet(c - 0.78, c + 0.78, y0 + sill - 0.1, yS - 0.05, 1.0, 5, 1.3), lancet(c - 0.5, c + 0.5, y0 + sill, yS, 0.8, 5, 1.3), 0.05, COL.white, false);
        stats.windows++;
      }
      skin(B.wall, f, PL, COR - 0.7, COL.pink, [1, 1]);
      B.stone.setColor(COL.plinth); box(B.stone, f, -0.05, F.W + 0.05, gLow, PL, -0.5, 0.18, 'ftlr');
      B.det.setColor(COL.white);
      box(B.det, f, -0.05, F.W + 0.05, G, G + 0.34, 0, 0.32, 'ftu');
      box(B.det, f, -0.05, F.W + 0.05, F2 - 0.1, F2 + 0.08, 0, 0.12, 'ftu');
      box(B.det, f, -0.05, F.W + 0.05, COR - 0.7, COR - 0.4, 0, 0.45, 'ftu');
      box(B.det, f, -0.1, F.W + 0.1, COR - 0.4, COR, 0, 0.8, 'ftu');
    }
    // the first-floor balcony runs round the corner: a quarter-arc slab with the lattice
    for (const [y, d, th, h] of [[F1, 1.0, 0.34, 1.0], [F2, 0.7, 0.28, 0.95]]) {
      B.wall.setColor(COL.pink);
      for (let k = 0; k < 3; k++) {
        const F = frame(ARC[k], ARC[k + 1], hint2(k)), f = F.face();
        box(B.wall, f, -0.05, F.W + 0.05, y - th, y, 0, d, 'ftu');
        B.det.setColor(COL.white); box(B.det, f, -0.05, F.W + 0.05, y - 0.06, y + 0.06, d - 0.02, d + 0.05, 'ftu');
        iron(B.atlas, f, 0.0, F.W, y + 0.06, y + h, d - 0.03, A.ironA);
        B.det.setColor(COL.iron); box(B.det, f, 0, F.W, y + h, y + h + 0.06, d - 0.06, d, 'ftu');
        B.wall.setColor(COL.pink);
      }
      stats.balconies++;
    }
    function hint2(k) { const a = (ang(ARC[k]) + ang(ARC[k + 1])) / 2; return [Math.cos(a), Math.sin(a)]; }
  }
  // ------------------------------------------------------------------------------------------ the tower
  {
    const [tx, tz] = add(O, [0, 0], 0), R1 = 2.45, y0 = COR - 0.3;
    const rings = (y, rr, col, h) => { B.det.setColor(col); B.det.cyl(tx, y, tz, rr, rr, h, 16, true); };
    B.wall.setColor(COL.yellow); B.wall.cyl(tx, y0, tz, R1, R1, 3.3, 18, true);                  // the drum
    rings(y0, R1 + 0.15, COL.white, 0.3); rings(y0 + 3.3, R1 + 0.22, COL.white, 0.35);              // base and collar
    // the lettering band on the street faces of the drum
    {
      const col = [A.grandhotel, A.astoria];
      for (let i = 0; i < 2; i++) {
        const [u0, v0, u1, v1] = col[i];
        for (let k = -2; k <= 2; k++) {
          const a0 = (A0 + A1) / 2 + (k - 0.5) * 0.3, a1 = a0 + 0.3, R = R1 + 0.03, yy0 = y0 + 0.7 + (1 - i) * 1.0, yy1 = yy0 + (i ? 0.75 : 0.55);
          const t0 = (3 - k) / 5, t1 = (2 - k) / 5, first = B.atlas.v;
          for (const [a, yy, uu, vv] of [[a0, yy0, u0 + (u1 - u0) * t0, v1], [a1, yy0, u0 + (u1 - u0) * t1, v1], [a1, yy1, u0 + (u1 - u0) * t1, v0], [a0, yy1, u0 + (u1 - u0) * t0, v0]]) {
            B.atlas.vert(tx + Math.cos(a) * R, yy, tz + Math.sin(a) * R, Math.cos(a), 0, Math.sin(a), uu, 1 - vv);
          }
          B.atlas.quad(first, first + 1, first + 2, first + 3);
        }
      }
    }
    // the lantern: six slim columns, a low balustrade, a ring entablature, then the red cap with its spire
    const yL = y0 + 3.65;
    B.det.setColor(COL.iron); B.det.cyl(tx, yL, tz, 1.95, 1.95, 0.08, 16, true);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.3; B.det.setColor(COL.col); B.det.cyl(tx + Math.cos(a) * 1.65, yL + 0.02, tz + Math.sin(a) * 1.65, 0.17, 0.15, 2.1, 8, true); B.det.setColor(COL.white); B.det.cyl(tx + Math.cos(a) * 1.65, yL + 2.0, tz + Math.sin(a) * 1.65, 0.26, 0.26, 0.2, 8, true); }
    B.wall.setColor(COL.yellow); B.wall.cyl(tx, yL, tz, 1.35, 1.35, 2.1, 12, false);                // the dark core seen between the columns
    B.glass.setColor('#2c2a28'); B.glass.cyl(tx, yL, tz, 1.4, 1.4, 1.8, 12, false);
    B.det.setColor(COL.white); B.det.cyl(tx, yL + 2.2, tz, 2.1, 2.05, 0.4, 16, true);
    cap(B.roof, tx, tz, [[2.15, yL + 2.55], [2.0, yL + 2.8], [1.55, yL + 3.5], [0.95, yL + 4.4], [0.45, yL + 5.2], [0.22, yL + 5.9], [0.16, yL + 6.4], [0.04, yL + 7.2]], 16, COL.cap);
    B.det.setColor(COL.gold); B.det.ellipsoid([tx, yL + 6.3, tz], [0.22, 0.22, 0.22], 6, 4);
    stats.towerTop = yL + 7.2;
  }
  // ------------------------------------------------------------------------------------------ the roof
  {
    const [sr, er] = ASTORIA_RECTS;
    roofRect(B.roof, { ...sr, yE: COR + 0.1, rise: 3.6, col: COL.roof, col2: COL.roofD, ov: 0.3, hl: sr.hl + 0.0 });
    roofRect(B.roof, { ...er, yE: COR + 0.1, rise: 3.6, col: COL.roof, col2: COL.roofD, ov: 0.3 });
  }
  // ------------------------------------------------------------------------------------------ yard walls, collision
  const ring = L_RING;
  S.prism(ring.flat(), yT + gLow, yT + COR + 1.0, 0, 0, 'wall', 0);
  S.cyl(O[0], O[1], yT + COR, yT + COR + 11, 2.0, 1.0, 'tower', 0);
  for (const b of Object.values(B)) b.setXf(null);
  return {
    footprints: [{ poly: ring, h: COR + 4, kind: 'hotel', name: 'Hotel Astoria', id: ASTORIA_ID }],
    ring, yT, stats,
    clear: (x, z) => insideRing(ring, x, z),
  };
}
function insideRing(P, x, z) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
void shade;
