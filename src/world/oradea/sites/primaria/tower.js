// OWNER: oradea. Turnul Primăriei (OSM way 1207602388): the City Hall's clock tower, 50 m, on the river-street front of the
// north-west arm. A square shaft on a red granite plinth (rusticated base with the arched portal and its steps, the
// pedimented windows above), a wide cornice, a second stage with four clock faces under segmental hoods, an arcaded
// belfry with a balcony, and a balustraded crown with finials, a drum, a stepped stone cap and the flagpole.
//   buildTower(ctx) -> { footprints, collide(S), top }   ctx from hall.js (B, S, H, F, Y, wash, gOf)
import { face } from '../../../cherkasy/slabkit.js';
import { M4 } from '../../../../kit/mesh.js';
import { at, quad, rect, box, fan, strip, poly2, outline, windowA, clockOn, reveal, steps, COL, PI } from './kit.js';
import { TOWER } from './frame.js';

const STONE = '#e2d2a0', CREAM = '#ead9a8', IVORY = '#f2ecd8';

export function buildTower(ctx) {
  const { B, H, F, Y, wash } = ctx, { c: C, t1, t2 } = TOWER;
  const TC = [C[0] - t2[0] * 0.65, C[1] - t2[1] * 0.65];            // the shaft's centre: 7 m square, its front 0.35 m proud of the wall
  const NR = [[-t2[0], -t2[1]], [-t1[0], -t1[1]], [t2[0], t2[1]], [t1[0], t1[1]]];   // front (river street), then round
  const sq = (h, k) => { const n = NR[k], u = [n[1], -n[0]]; return face([TC[0] + n[0] * h - u[0] * h, TC[1] + n[1] * h - u[1] * h], [TC[0] + n[0] * h + u[0] * h, TC[1] + n[1] * h + u[1] * h], n[0], n[1]); };
  const front = sq(3.5, 0);
  let g = 1e9;
  for (let k = 0; k < 4; k++) { const f = sq(3.5, k); for (let i = 0; i <= 6; i++) { const p = at(f, f.L * i / 6, 0, 0.6); g = Math.min(g, H(p[0], p[2])); } }
  const gLo = Math.min(g, F) - 0.45;

  // ---------------------------------------------------------------- base: granite plinth, rusticated storey, the portal
  const pw = 3.0, psp = 3.6, pris = 1.5, sill = Y(0.15);
  for (let k = 0; k < 4; k++) {
    const f = sq(3.5, k), L = f.L;
    B.stone.setColor(COL.granite); box(B.stone, f, -0.08, L + 0.08, gLo, Y(1.4), 0, 0.09, 'ftlr', [2, 2]);
    B.stone.setColor(STONE);
    if (k === 0) {
      const ol = outline(pw, psp, pris, 0, 8), ol2 = outline(pw, psp, pris, 0.42, 8), c = L / 2;
      poly2(B.stone, f, [[0, Y(1.4)], [L, Y(1.4)], [L, Y(5.9)], [0, Y(5.9)]], [ol.map(([a, b]) => [c + a, sill + b])], 0, 2);
      B.stone.setColor(STONE); reveal(B.stone, f, ol, c, sill, 0, -1.2);
      B.det.setColor('#2b1f18'); fan(B.det, ol.map(([a, b]) => at(f, c + a, sill + b, -1.22)), f.N);
      windowA(B, { ...f, ax: f.ax - f.nx * 1.15, az: f.az - f.nz * 1.15 }, { s: c, y0: sill + 0.3, w: pw - 0.5, h: psp - 0.3, rise: pris - 0.3, sur: 0.1, surCol: '#3a2a20', lit: true, glass: '#3b3f3f', off: 0.03 });
      const ni = ol.length - 1, I = ol.map(([a, b]) => at(f, c + a, sill + b, 0.05)), O = ol2.map(([a, b]) => at(f, c + a, sill + b, 0.05));
      B.wall.setColor(COL.white); strip(B.wall, I.slice(1), O.slice(1), f.N); quad(B.wall, I[ni], I[0], O[0], O[ni], f.N);
      box(B.wall, f, c - 0.3, c + 0.3, sill + psp + pris + 0.05, sill + psp + pris + 0.95, 0.04, 0.22, 'ftlr');
      const gp = at(f, c, 0, 2.6);
      steps(B.stone, f, c - 2.2, c + 2.2, sill, H(gp[0], gp[2]), gLo, 0.9, 0.42, '#bdb6a6');
    } else {
      rect(B.stone, f, 0, L, Y(1.4), Y(5.9), 0, [2, 2]);
      windowA(B, f, { s: L / 2, y0: Y(2.6), w: 1.2, h: 2.0, rise: 0.0, sur: 0.14, surCol: COL.white, glass: '#2e3338', sill: true });
    }
  }

  // ---------------------------------------------------------------- the shaft: bands, pedimented windows, the narrow lights, the first cornice
  const stage = (h, y0, y1, col, o = 0) => { for (let k = 0; k < 4; k++) { const f = sq(h, k); B.wall.setColor(col); rect(B.wall, f, 0, f.L, y0, y1, o, [2.5, 2.5]); } };
  stage(3.5, Y(5.9), Y(19.0), CREAM);
  for (let k = 0; k < 4; k++) {
    const f = sq(3.5, k), L = f.L;
    B.wall.setColor(COL.white);
    box(B.wall, f, -0.12, L + 0.12, Y(5.7), Y(6.4), 0, 0.2, 'ftlr');                                   // string course
    for (const s of [0.3, L - 0.3]) box(B.wall, f, s - 0.3, s + 0.3, Y(6.4), Y(19.0), 0, 0.14, 'ftlr');   // corner strips
    windowA(B, f, { s: L / 2, y0: Y(8.2), w: 1.3, h: 3.0, rise: 0.0, sur: 0.2, surCol: COL.white, cap: 0.3, sill: true, glass: '#2e3338', lit: true });
    B.wall.setColor(COL.white); box(B.wall, f, L / 2 - 1.15, L / 2 + 1.15, Y(11.9), Y(12.5), 0, 0.3, 'ftlru');
    B.wall.setColor('#f1e6bd'); box(B.wall, f, 1.0, L - 1.0, Y(13.4), Y(17.6), 0, 0.06, 'f');
    windowA(B, f, { s: L / 2, y0: Y(14.6), w: 0.55, h: 2.0, rise: 0, sur: 0.12, surCol: COL.white, glass: '#2e3338' });
    B.wall.setColor(COL.white);
    box(B.wall, f, -0.45, L + 0.45, Y(19.0), Y(19.5), 0, 0.3, 'ftlru');
    box(B.wall, f, -0.6, L + 0.6, Y(19.5), Y(20.0), 0, 0.6, 'ftlru');
    box(B.wall, f, -0.75, L + 0.75, Y(20.0), Y(20.8), 0, 0.8, 'ftlru');
  }
  // ---------------------------------------------------------------- second stage: the arched light, the clock under its hood, the second cornice
  stage(3.1, Y(20.8), Y(29.2), CREAM);
  for (let k = 0; k < 4; k++) {
    const f = sq(3.1, k), L = f.L, c = L / 2;
    B.wall.setColor(COL.white);
    for (const s of [0.28, L - 0.28]) box(B.wall, f, s - 0.28, s + 0.28, Y(20.8), Y(29.2), 0, 0.14, 'ftlr');
    windowA(B, f, { s: c, y0: Y(21.9), w: 1.2, h: 1.1, rise: 0.6, sur: 0.16, surCol: COL.white, sill: true, glass: '#2e3338' });
    clockOn(B, f, c, Y(26.0), 3.0, 0, '#f6f1e0');
    const arc = Array.from({ length: 9 }, (_, i) => { const t = i / 8 * 2 - 1; return [c + t * 1.9, Y(27.9) + 0.75 * (1 - t * t)]; });
    B.wall.setColor(COL.white);
    strip(B.wall, arc.map(([s, y]) => at(f, s, y, 0.2)), arc.map(([s, y]) => at(f, s, y + 0.38, 0.2)), f.N);
    for (let i = 0; i + 1 < arc.length; i++) quad(B.wall, at(f, arc[i][0], arc[i][1] + 0.38, 0.2), at(f, arc[i + 1][0], arc[i + 1][1] + 0.38, 0.2), at(f, arc[i + 1][0], arc[i + 1][1] + 0.38, -0.1), at(f, arc[i][0], arc[i][1] + 0.38, -0.1), [0, 1, 0]);
    box(B.wall, f, -0.4, L + 0.4, Y(29.2), Y(29.7), 0, 0.3, 'ftlru');
    box(B.wall, f, -0.55, L + 0.55, Y(29.7), Y(30.4), 0, 0.65, 'ftlru');
  }

  // ---------------------------------------------------------------- the belfry: a balcony and an arcade of three arched openings a side
  const bh = 2.7, ys = Y(30.4), ye = Y(36.4);
  for (let k = 0; k < 4; k++) {
    const f = sq(bh, k), L = f.L, ol = outline(1.0, 3.2, 0.5, 0, 6), cs = [L / 2 - 1.55, L / 2, L / 2 + 1.55];
    B.wall.setColor(COL.white); box(B.wall, f, -0.4, L + 0.4, ys, ys + 0.4, 0, 0.7, 'ftlru');
    B.balu.setColor(COL.white);
    quad(B.balu, at(f, -0.3, ys + 0.4, 0.62), at(f, L + 0.3, ys + 0.4, 0.62), at(f, L + 0.3, ys + 1.28, 0.62), at(f, -0.3, ys + 1.28, 0.62), f.N, [[-0.3 / 1.8, 0], [(L + 0.3) / 1.8, 0], [(L + 0.3) / 1.8, 1], [-0.3 / 1.8, 1]]);
    B.wall.setColor(CREAM);
    poly2(B.wall, f, [[0, ys + 0.4], [L, ys + 0.4], [L, ye], [0, ye]], cs.map((c) => ol.map(([a, b]) => [c + a, ys + 1.5 + b])), 0, 2.5);
    for (const c of cs) {
      B.wall.setColor(CREAM); reveal(B.wall, f, ol, c, ys + 1.5, 0, -1.1);
      B.det.setColor('#1d1b19'); fan(B.det, ol.map(([a, b]) => at(f, c + a, ys + 1.5 + b, -1.12)), f.N);
      B.wall.setColor(COL.white); box(B.wall, f, c - 0.7, c + 0.7, ys + 1.5, ys + 1.62, 0, 0.18, 'ftlr');
    }
    B.wall.setColor(COL.white);
    for (const s of [0.3, L - 0.3]) box(B.wall, f, s - 0.3, s + 0.3, ys + 0.4, ye, 0, 0.15, 'ftlr');
    for (const s of [(cs[0] + cs[1]) / 2, (cs[1] + cs[2]) / 2]) box(B.wall, f, s - 0.12, s + 0.12, ys + 1.5, ys + 4.8, 0, 0.1, 'f');
    box(B.wall, f, -0.4, L + 0.4, ye, ye + 0.5, 0, 0.3, 'ftlru');
    box(B.wall, f, -0.55, L + 0.55, ye + 0.5, Y(37.6), 0, 0.6, 'ftlru');
  }

  // ---------------------------------------------------------------- the crown: a balustraded platform, finials, a drum, a stepped stone cap, the flagpole
  const ph = 3.0, yP = Y(37.6);
  for (let k = 0; k < 4; k++) {
    const f = sq(ph, k), L = f.L;
    B.wall.setColor(COL.white); box(B.wall, f, -0.1, L + 0.1, yP, yP + 0.4, 0, 0.3, 'ftlru');
    B.balu.setColor(COL.white);
    quad(B.balu, at(f, 0.3, yP + 0.4, 0.2), at(f, L - 0.3, yP + 0.4, 0.2), at(f, L - 0.3, yP + 1.3, 0.2), at(f, 0.3, yP + 1.3, 0.2), f.N, [[0.3 / 1.8, 0], [(L - 0.3) / 1.8, 0], [(L - 0.3) / 1.8, 1], [0.3 / 1.8, 1]]);
    B.wall.setColor(COL.white); box(B.wall, f, L / 2 - 0.2, L / 2 + 0.2, yP + 0.4, yP + 1.4, 0.05, 0.35, 'ftlr'); box(B.wall, f, -0.1, L + 0.1, yP + 1.3, yP + 1.4, 0.0, 0.32, 'ftlr');
  }
  for (const [i, j] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const x = TC[0] + t1[0] * i * ph + t2[0] * j * ph, z = TC[1] + t1[1] * i * ph + t2[1] * j * ph;
    B.wall.setColor(COL.white); B.wall.box(x - 0.3, yP + 0.4, z - 0.3, x + 0.3, yP + 1.5, z + 0.3, 63);
    B.wall.lathe([[0.32, yP + 1.5], [0.38, yP + 1.8], [0.3, yP + 2.2], [0.16, yP + 2.5], [0.2, yP + 2.7], [0.06, yP + 3.0]], 8, x, z);
  }
  const dh = 1.9, yD = Y(38.0);
  stage(dh, yD + 0.0, Y(41.4), CREAM);
  for (let k = 0; k < 4; k++) {
    const f = sq(dh, k), L = f.L;
    windowA(B, f, { s: L / 2, y0: Y(39.0), w: 0.9, h: 1.3, rise: 0.45, sur: 0.12, surCol: COL.white, glass: '#2e3338' });
    B.wall.setColor(COL.white);
    for (const s of [0.2, L - 0.2]) box(B.wall, f, s - 0.2, s + 0.2, yD, Y(41.4), 0, 0.1, 'ftlr');
    box(B.wall, f, -0.3, L + 0.3, Y(41.4), Y(42.0), 0, 0.4, 'ftlru');
  }
  // the crown is carved stone in the photos, not a roof: a stepped square cap in the trim colour
  B.wall.setColor(COL.ivory);
  const dg = [(t1[0] + t2[0]) / Math.SQRT2, (t1[1] + t2[1]) / Math.SQRT2];   // the cap's corners over the tower's
  B.wall.with(M4(TC[0], 0, TC[1], Math.atan2(-dg[1], dg[0])), (q) => q.lathe([[3.15, Y(42.0)], [3.0, Y(42.2)], [2.5, Y(42.5)], [2.4, Y(43.2)], [1.9, Y(43.4)], [1.7, Y(44.2)], [1.1, Y(44.5)], [0.8, Y(45.2)], [0.3, Y(45.5)]], 4, 0, 0));
  B.det.setColor(COL.gold); B.det.ellipsoid([TC[0], Y(45.7), TC[1]], [0.26, 0.26, 0.26], 6, 4);
  B.det.setColor('#cfcfca'); B.det.tube([TC[0], Y(45.9), TC[1]], [TC[0], Y(48.9), TC[1]], 0.05, 5);
  B.det.setColor('#c8362f'); B.det.tube([TC[0], Y(48.2), TC[1]], [TC[0] + t1[0] * 1.0, Y(47.9), TC[1] + t1[1] * 1.0], 0.04, 4);   // a pennant

  // ---------------------------------------------------------------- floodlights
  for (const [dy, d] of [[3.5, 6], [24, 7], [33, 7]]) wash.push([TC[0] - t2[0] * d, Y(dy), TC[1] - t2[1] * d]);
  wash.push([TC[0] + t1[0] * 7, Y(8), TC[1] + t1[1] * 7]);

  const ang = Math.atan2(t1[1], t1[0]);
  const ring = [[1, -1], [1, 1], [-1, 1], [-1, -1]].map(([i, j]) => [TC[0] + t1[0] * i * 3.6 + t2[0] * j * 3.6, TC[1] + t1[1] * i * 3.6 + t2[1] * j * 3.6]);
  return {
    top: Y(48.9),
    footprints: [{ poly: ring, h: Y(45.5) - gLo, kind: 'public', name: 'Turnul Primăriei', id: 1207602388 }],
    collide(S) {
      S.obox(TC[0], TC[1], 3.55, 3.55, ang, gLo, Y(20.8), 'tower');
      S.obox(TC[0], TC[1], 3.2, 3.2, ang, Y(20.8), Y(30.4), 'tower');
      S.obox(TC[0], TC[1], 2.8, 2.8, ang, Y(30.4), Y(37.6), 'tower');
      S.obox(TC[0], TC[1], 3.0, 3.0, ang, Y(37.6), Y(38.4), 'tower');
      S.obox(TC[0], TC[1], 1.95, 1.95, ang, Y(38.4), Y(42.0), 'tower');
      S.cyl(TC[0], TC[1], Y(42.0), Y(45.5), 2.4, 0.25, 'roof');
    },
  };
}
