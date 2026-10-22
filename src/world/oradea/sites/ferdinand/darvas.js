// OWNER: oradea. Casa Darvas–La Roche, Strada Iosif Vulcan nr. 11 (OSM way 1534596515; Vágó László and József, 1909–1912, a
// Secession villa restored 2018–2020 and opened as Romania's first Art Nouveau museum). Built after the Wikimedia Commons
// photos of the restored street front (2022) and the OSM outline:
//   the front along the street, from the east end: a small grey gabled bay with four slim colonnettes; an ochre wall with a
//   shuttered window; the gateway block – grey cast stone studded with green-blue ceramic buttons and diamond motifs, the
//   high arch of stone voussoirs over a passage with an ochre vault and brass doors, above it a balcony with green wrought-iron
//   triangles, a swept green hood over the window, a white figure at the balcony's end; then the tall block under a bell-shaped
//   cast-stone gable, a recess with four ochre colonnettes banded in green-blue ceramic and stained glass between them; a grey
//   plinth with barred windows under all of it; a dark tiled hipped roof behind. The other walls are plain ochre render with
//   windows (a guess: no photos of the back).
//   buildDarvas(ctx) -> { footprint, clear(x, z), F (the street frame), yD }
import { M4 } from '../../../../kit/mesh.js';
import { SG } from '../../../cherkasy/sculpt.js';
import { at, quad, box, skin, hole, UP } from '../../../cherkasy/slabkit.js';
import { frame, poly, archPts, spandrels, skinRange, mansard, robed, place, neg } from './kit.js';

export const DARVAS_ID = 1534596515;
const RING = [[184.3, -215.8], [207.8, -220.5], [211.9, -205.6], [209.4, -205], [210, -200.8], [191.5, -195.1], [190, -199.4]];
const ROOF_RING = [RING[0], RING[1], RING[2], RING[4], RING[5], RING[6]];
const COL = { cast: '#ffffff', ochre: '#d3a752', ochreD: '#c2a05a', green: '#2f5d49', greenD: '#27463a', teal: '#3f8c82', stone: '#d4d2c9', gold: '#b99b48', roof: '#44474b', dark: '#2a2c2e' };

export function buildDarvas(ctx) {
  const { B, S, g, r, stone } = ctx;
  const F = frame(RING[1], RING[0], [-0.2, -1]), W = F.W, f = F.face();     // s runs from the east end (207.8) to the west end (184.3)
  const yD = Math.max(g(...RING[0]), g(...RING[1])) + 0.04, Y = (h) => yD + h;
  const gB = Math.min(...RING.map(([x, z]) => g(x, z))) - 0.7 - yD;
  for (const b of Object.values(B)) b.setXf(M4(0, yD, 0));
  const U1 = [1, 1], cx = (s, y, o = 0) => at(f, s, y, o), uvm = (s0, s1, y0, y1) => [[s0, y0], [s1, y0], [s1, y1], [s0, y1]];
  const SEG = { east: [0, 5.1], ochre: [5.1, 8.5], gate: [8.5, 13.9], tall: [13.9, W] };
  const REC = { s0: 15.2, s1: 22.8, y0: 3.4, y1: 10.0, dep: 0.7 };            // the tall block's recess
  const EAST = { s0: 0.9, s1: 4.2, y0: 3.0, y1: 7.3, dep: 0.5 };              // the east bay's recess
  const AS0 = 9.55, AS1 = 12.85, A_Y = 0.15, A_S = 1.7, A_R = 2.5, NA = 14;   // the gateway arch
  const arc = archPts(AS0, AS1, A_S, A_R, NA, 2);
  const OW = [[6.3, 7.5, 3.2, 5.4], [6.3, 7.5, 5.9, 7.7]];                    // the ochre wall's windows
  const UPW = { s0: 9.9, s1: 12.5, y0: 7.7, y1: 9.7 };                        // the window over the balcony
  for (const q of [REC, EAST, UPW]) f.cuts.push({ s0: q.s0, s1: q.s1, y0: q.y0, y1: q.y1 });
  f.cuts.push({ s0: AS0, s1: AS1, y0: A_Y, y1: A_S + A_R });
  for (const [s0, s1, y0, y1] of OW) f.cuts.push({ s0, s1, y0, y1 });

  // ------------------------------------------------------------------------------------------ the front wall
  skin(B.cast, f, 0, 3.0, COL.cast, U1);
  skinRange(B.cast, f, ...SEG.east, 3.0, 8.3, COL.cast, U1);
  skinRange(B.cast, f, ...SEG.gate, 3.0, 6.6, COL.cast, U1);
  skinRange(B.cast, f, ...SEG.tall, 3.0, 10.6, COL.cast, U1);
  skinRange(B.wall, f, ...SEG.ochre, 3.0, 8.2, COL.ochre, U1);
  skinRange(B.wall, f, ...SEG.gate, 6.6, 10.2, COL.ochre, U1);
  spandrels(B.cast, f, AS0, AS1, A_S, A_R, NA, 2, COL.cast);
  // the bell-shaped gable of the tall block and the little gable of the east bay: a wall 0.4 thick under a coping
  const gable = (prof, s0, yBase) => {
    for (let i = 0; i + 1 < prof.length; i++) {
      const [a, ya] = prof[i], [b, yb] = prof[i + 1], p0 = s0 + a, p1 = s0 + b;
      B.cast.setColor(COL.cast);
      quad(B.cast, cx(p0, yBase), cx(p1, yBase), cx(p1, yb), cx(p0, ya), f.N, uvm(p0, p1, yBase, Math.max(ya, yb)));
      quad(B.cast, cx(p0, yBase, -0.4), cx(p1, yBase, -0.4), cx(p1, yb, -0.4), cx(p0, ya, -0.4), neg(f.N));
      B.cast.setColor('#b9b8b0');
      quad(B.cast, cx(p0, ya, 0.04), cx(p1, yb, 0.04), cx(p1, yb, -0.44), cx(p0, ya, -0.44), [0, 1, 0]);
    }
    for (const [a, ya, sg] of [[prof[0][0], prof[0][1], -1], [prof.at(-1)[0], prof.at(-1)[1], 1]]) { B.cast.setColor(COL.cast); quad(B.cast, cx(s0 + a, yBase, 0), cx(s0 + a, yBase, -0.4), cx(s0 + a, ya, -0.4), cx(s0 + a, ya, 0), sg < 0 ? neg(f.U) : f.U); }
  };
  gable([[0, 10.6], [0.5, 10.9], [1.5, 12.0], [2.8, 13.4], [4.2, 14.3], [5.2, 14.25], [6.4, 13.5], [7.6, 12.4], [8.6, 11.6], [9.4, 11.25], [W - SEG.tall[0], 11.1]], SEG.tall[0], 10.6);
  gable([[0, 8.3], [0.7, 8.7], [2.5, 9.3], [4.2, 8.8], [5.1, 8.4]], 0, 8.3);

  // ------------------------------------------------------------------------------------------ recesses
  const recess = ({ s0, s1, y0, y1, dep }) => {
    const o = -dep;
    B.wall.setColor(COL.ochre); quad(B.wall, cx(s0, y0, o), cx(s1, y0, o), cx(s1, y1, o), cx(s0, y1, o), f.N, uvm(s0, s1, y0, y1));
    B.cast.setColor(COL.cast);
    quad(B.cast, cx(s0, y0, 0), cx(s0, y0, o), cx(s0, y1, o), cx(s0, y1, 0), f.U);
    quad(B.cast, cx(s1, y0, 0), cx(s1, y0, o), cx(s1, y1, o), cx(s1, y1, 0), neg(f.U));
    quad(B.cast, cx(s0, y1, 0), cx(s1, y1, 0), cx(s1, y1, o), cx(s0, y1, o), [0, -1, 0]);
    quad(B.cast, cx(s0, y0, 0), cx(s1, y0, 0), cx(s1, y0, o), cx(s0, y0, o), UP);
  };
  recess(REC); recess(EAST);
  {
    const o = -REC.dep, colS = [15.55, 17.85, 20.15, 22.45];
    for (const s of colS) {
      const [x, z] = F.toMap(s, o + 0.5);
      B.det.setColor('#cfa356'); B.det.cyl(x, REC.y0, z, 0.31, 0.31, REC.y1 - REC.y0, 12, true);
      B.det.setColor(COL.teal); for (const y of [REC.y0 + 0.5, 6.35, REC.y1 - 0.5]) B.det.cyl(x, y - 0.12, z, 0.34, 0.34, 0.24, 12, true);
    }
    for (let i = 0; i < 3; i++) { // shuttered windows below, stained glass above, between the colonnettes
      const a = colS[i] + 0.34, b = colS[i + 1] - 0.34, oo = o + 0.12;
      B.det.setColor(COL.greenD); quad(B.det, cx(a, 3.6, oo), cx(b, 3.6, oo), cx(b, 5.9, oo), cx(a, 5.9, oo), f.N);
      B.det.setColor('#33664f'); for (let k = 0; k < 6; k++) { const yy = 3.7 + k * 0.38; quad(B.det, cx(a, yy, oo + 0.02), cx(b, yy, oo + 0.02), cx(b, yy + 0.12, oo + 0.02), cx(a, yy + 0.12, oo + 0.02), f.N); }
      B.lit.setColor(['#7f9a8e', '#9fb0a2', '#b79f6a'][i]); quad(B.lit, cx(a, 7.2, oo), cx(b, 7.2, oo), cx(b, 9.8, oo), cx(a, 9.8, oo), f.N, [[0, 0], [1, 0], [1, 2], [0, 2]]);
      B.det.setColor(COL.green);
      for (const m of [a, b, (a + b) / 2]) quad(B.det, cx(m - 0.04, 7.2, oo + 0.03), cx(m + 0.04, 7.2, oo + 0.03), cx(m + 0.04, 9.8, oo + 0.03), cx(m - 0.04, 9.8, oo + 0.03), f.N);
      box(B.det, f, a - 0.05, b + 0.05, 7.0, 7.08, o + 0.2, o + 0.3, 'ft'); box(B.det, f, a - 0.05, b + 0.05, 7.9, 7.96, o + 0.2, o + 0.3, 'ft');
      for (let k = 0; k < 5; k++) { const s = a + 0.12 + k * ((b - a - 0.24) / 4); box(B.det, f, s - 0.015, s + 0.015, 7.08, 7.9, o + 0.22, o + 0.28, 'f'); }
    }
    B.wall.setColor(COL.ochreD); box(B.wall, f, REC.s0, REC.s1, 6.0, 7.0, o, o + 0.06, 'f');
  }
  {
    const o = -EAST.dep;
    for (let k = 0; k < 4; k++) {
      const s = 1.35 + k * 0.85, [x, z] = F.toMap(s, o + 0.3);
      B.det.setColor('#d6a94f'); B.det.cyl(x, EAST.y0, z, 0.26, 0.26, EAST.y1 - EAST.y0, 10, true);
      B.det.setColor(COL.teal); B.det.cyl(x, 5.0, z, 0.29, 0.29, 0.18, 10, true);
      if (k < 3) { B.lit.setColor('#8da79a'); quad(B.lit, cx(s + 0.3, 3.6, o + 0.08), cx(s + 0.55, 3.6, o + 0.08), cx(s + 0.55, 6.8, o + 0.08), cx(s + 0.3, 6.8, o + 0.08), f.N, [[0, 0], [1, 0], [1, 2], [0, 2]]); }
    }
  }
  // the ochre wall's windows with their green shutters, the window over the balcony
  for (const [s0, s1, y0, y1] of OW) {
    hole(B, f, { s0, s1, y0, y1, dep: 0.2, frame: COL.green, glass: '#4d5a63', lit: r() < 0.5, pitch: 0.7, rev: COL.stone, sill: COL.stone });
    B.det.setColor(COL.greenD); box(B.det, f, s0 - 0.3, s0 - 0.06, y0, y1, 0, 0.05, 'f'); box(B.det, f, s1 + 0.06, s1 + 0.3, y0, y1, 0, 0.05, 'f');
  }
  hole(B, f, { ...UPW, dep: 0.25, frame: COL.green, glass: '#8da79a', lit: true, pitch: 1.3, tr: 9.0, rev: COL.stone });
  B.det.setColor(COL.ochreD); box(B.det, f, SEG.ochre[0], SEG.ochre[1], 8.2, 8.5, -0.05, 0.4, 'ftu');

  // ------------------------------------------------------------------------------------------ the gateway
  {
    const outer = archPts(AS0 - 0.55, AS1 + 0.55, A_S, A_R + 0.55, NA, 2), DEPTH = 5.2;
    B.stone.setColor('#d1cfc6');
    for (let i = 0; i < NA; i++) quad(B.stone, cx(arc[i][0], arc[i][1], 0.08), cx(arc[i + 1][0], arc[i + 1][1], 0.08), cx(outer[i + 1][0], outer[i + 1][1], 0.08), cx(outer[i][0], outer[i][1], 0.08), f.N);
    for (const [s, sg] of [[AS0, -1], [AS1, 1]]) quad(B.stone, cx(s, A_Y, 0.08), cx(s + sg * 0.55, A_Y, 0.08), cx(s + sg * 0.55, A_S, 0.08), cx(s, A_S, 0.08), f.N);
    B.wall.setColor('#b98f45'); // the vault: ochre, in shade
    for (let i = 0; i < NA; i++) {
      const a = arc[i], b = arc[i + 1], mx = (a[0] + b[0]) / 2 - (AS0 + AS1) / 2, my = (a[1] + b[1]) / 2 - A_S, l = Math.hypot(mx, my) || 1;
      quad(B.wall, cx(a[0], a[1], 0), cx(b[0], b[1], 0), cx(b[0], b[1], -DEPTH), cx(a[0], a[1], -DEPTH), [f.U[0] * (-mx / l), -my / l, f.U[2] * (-mx / l)]);
    }
    B.wall.setColor('#a8843f');
    quad(B.wall, cx(AS0, A_Y, 0), cx(AS0, A_S, 0), cx(AS0, A_S, -DEPTH), cx(AS0, A_Y, -DEPTH), f.U);
    quad(B.wall, cx(AS1, A_Y, 0), cx(AS1, A_S, 0), cx(AS1, A_S, -DEPTH), cx(AS1, A_Y, -DEPTH), neg(f.U));
    B.det.setColor('#8c8a82'); quad(B.det, cx(AS0, A_Y, 0), cx(AS1, A_Y, 0), cx(AS1, A_Y, -DEPTH), cx(AS0, A_Y, -DEPTH), UP);
    B.wall.setColor('#8d6c34'); quad(B.wall, cx(AS0, A_Y, -DEPTH), cx(AS1, A_Y, -DEPTH), cx(AS1, A_S + A_R, -DEPTH), cx(AS0, A_S + A_R, -DEPTH), f.N);
    const door = archPts(10.2, 12.2, 1.9, 1.3, 10, 2), dA = -DEPTH + 0.05;     // the brass door at the passage's end
    B.det.setColor(COL.gold); B.det.face([[10.2, 0.2], [12.2, 0.2], ...door.slice().reverse()].map(([s, y]) => cx(s, y, dA)), f.N);
    B.lit.setColor('#c9a85a'); for (const s0 of [10.45, 11.35]) quad(B.lit, cx(s0, 1.2, dA + 0.02), cx(s0 + 0.4, 1.2, dA + 0.02), cx(s0 + 0.4, 2.4, dA + 0.02), cx(s0, 2.4, dA + 0.02), f.N);
  }
  { // the balcony over the arch: a slab, a railing of green iron triangles, a swept green hood over the window, the white figure
    B.cast.setColor(COL.cast); box(B.cast, f, 8.9, 13.5, 6.35, 6.6, 0, 1.0, 'ftu');
    B.det.setColor(COL.green);
    box(B.det, f, 8.9, 13.5, 6.6, 6.7, 0.88, 1.0, 'ft'); box(B.det, f, 8.9, 13.5, 7.55, 7.65, 0.88, 1.0, 'ft');
    for (let k = 0; k < 4; k++) { const s = 9.35 + k * 1.05, t = [[s, 6.7], [s + 0.9, 6.7], [s + 0.45, 7.5]]; poly(B.det, f, t, 0.94); poly(B.det, f, t, 0.94, neg(f.N)); }
    for (const s of [8.95, 13.45]) box(B.det, f, s - 0.05, s + 0.05, 6.6, 7.65, 0.88, 0.98, 'flr');
    B.cast.setColor(COL.cast); box(B.cast, f, 13.4, 13.9, 6.6, 7.6, -0.05, 0.9, 'ftlr');
    const [fx, fz] = F.toMap(13.65, 0.4);
    place(stone, robed(new SG(), {}), fx, Y(7.6), fz, -F.ang, 1.15);
    const hood = archPts(9.5, 12.9, 8.9, 1.0, 8, 2);
    for (let i = 0; i < 8; i++) {
      const a = hood[i], b = hood[i + 1];
      B.det.setColor(COL.green);
      quad(B.det, cx(a[0], a[1], 0.02), cx(b[0], b[1], 0.02), cx(b[0], b[1] + 0.1, 1.15), cx(a[0], a[1] + 0.1, 1.15), [0, 1, 0]);
      quad(B.det, cx(a[0], a[1], 0.02), cx(b[0], b[1], 0.02), cx(b[0], b[1] + 0.1, 1.15), cx(a[0], a[1] + 0.1, 1.15), [0, -1, 0]);
    }
  }
  for (const [s0, s1] of [[15.4, 16.6], [19.0, 20.2], [21.6, 22.8], [2.4, 3.6], [6.2, 7.4]]) { // barred plinth windows
    B.det.setColor('#243228'); box(B.det, f, s0, s1, 0.9, 2.1, -0.02, 0.05, 'f');
    B.det.setColor(COL.green); for (let k = 0; k < 4; k++) { const s = s0 + 0.1 + (k * (s1 - s0 - 0.2)) / 3; box(B.det, f, s - 0.02, s + 0.02, 0.9, 2.1, 0.04, 0.07, 'f'); }
  }
  B.cast.setColor('#bfbdb4'); box(B.cast, f, -0.05, W + 0.05, gB, 0, -0.12, 0.0, 'f');
  B.det.setColor('#aaa79c'); box(B.det, f, -0.05, W + 0.05, 2.95, 3.1, 0, 0.12, 'ftu');
  mansard(B.roof, ROOF_RING, [[0.0, 8.5], [3.2, 11.2], [5.4, 12.5]], COL.roof);

  // ------------------------------------------------------------------------------------------ the other walls
  const cen = RING.reduce((a, p) => [a[0] + p[0] / RING.length, a[1] + p[1] / RING.length], [0, 0]);
  for (let i = 1; i < RING.length; i++) {
    const p = RING[i], q = RING[(i + 1) % RING.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (L < 1) continue;
    const fr = frame(p, q, [(p[0] + q[0]) / 2 - cen[0], (p[1] + q[1]) / 2 - cen[1]]), ff = fr.face();
    if (L > 6) {
      const n = Math.max(1, Math.floor((L - 1.5) / 3.4)), pad = (L - n * 3.4) / 2;
      for (let k = 0; k < n; k++) {
        const c = pad + 1.7 + k * 3.4;
        for (const [y0, y1] of [[1.0, 3.0], [4.2, 6.8]]) { ff.cuts.push({ s0: c - 0.65, s1: c + 0.65, y0, y1 }); hole(B, ff, { s0: c - 0.65, s1: c + 0.65, y0, y1, dep: 0.22, frame: COL.green, glass: '#4d5a63', lit: r() < 0.35, pitch: 0.65, rev: COL.stone, sill: COL.stone }); }
      }
    }
    skin(B.wall, ff, 0, 8.2, COL.ochre, U1);
    B.cast.setColor(COL.cast); box(B.cast, ff, -0.05, ff.L + 0.05, gB, 1.2, -0.05, 0.05, 'f');
    B.det.setColor(COL.ochreD); box(B.det, ff, -0.1, ff.L + 0.1, 8.2, 8.5, -0.05, 0.4, 'ftu');
  }
  for (const b of Object.values(B)) b.setXf(null);

  S.prism(RING.flat(), yD + gB, Y(8.5), 0, 0, 'wall', 0);
  S.prism(ROOF_RING.flat(), Y(8.5) - 0.01, Y(12.5), 0, 0, 'roof', 0);
  return {
    footprint: { poly: RING.map(([x, z]) => [x, z]), h: 14.3, kind: 'public', name: 'Casa Darvas–La Roche', id: DARVAS_ID },
    clear: (x, z) => { const [s, o] = F.toLocal(x, z); return s > -3 && s < W + 3 && o > -22 && o < 3; },
    F, yD,
  };
}
