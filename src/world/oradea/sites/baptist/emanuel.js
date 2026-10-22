// OWNER: oradea. Biserica Baptistă «Emanuel», Oradea (Bulevardul Decebal, OSM relation 3530253): the congregation's church of
// 1986–1993, a Baptist megachurch whose main hall seats about 2,700. Built after the church's own photographs (myoradea.ro,
// traveleuropa.ro, obiective-turistice.ro, an early-1990s view) and the Esri aerial:
//   a round pale-grey rainscreen drum, 42 m across, facing the boulevard – ribbon windows (a white-framed band under the cornice),
//   round oculi, two tall glazed entrance bays between dark piers with steps, the west half higher with a dark metal roof; behind it
//   a curved, sail-shaped stair tower with a steel lattice cross; round it on the west a three-storey office crescent on dark piers
//   (OSM ring 3) and, to the south-west, the school and office bar (ring 2) with its entrance canopy; in front a pinkish paved forecourt
//   with a round bed, a white-posted iron fence curving along the boulevard, mushroom lamps and lawns.
//   buildEmanuel({ B, S, g, r, lampsOut }) -> { footprints, clear(x, z), spots, stats, ring (the lot hull) }
//   EMANUEL_RINGS: the three OSM outlines (drum, bar, crescent); the places entry is in ../baptist.js
// B needs: wall, roof, glass, lit, det, rail, pave, lawn, glow
import { M4 } from '../../../../kit/mesh.js';
import { face, ringFaces, at, quad, rect, box, skin, hole } from '../../../cherkasy/slabkit.js';
import { area2, hull, inPoly } from '../../../cherkasy/geo.js';
import { PARK_GREENS, PARK_PINE } from '../../../trees.js';
import { PI, TAU, rad, sq, arcPts, band, fan, annulus, drape, strip, disc, ellipse, lamp, shrub, post, cross3d } from './kit.js';

export const EMANUEL_ID = 3530253;
export const C = [-894, 322.5], R = 21;
// the OSM outlines of the relation: the drum (with the stair tower's lobe), the school / office bar, the crescent wing
export const EMANUEL_RINGS = [
  [[-910.3, 341.9], [-915.6, 338.5], [-909.3, 328.9], [-911.7, 325.8], [-913.2, 322.5], [-914.9, 316], [-914.3, 312.5], [-913.2, 309.5], [-910.7, 306.3], [-908.1, 304.3], [-905.2, 302.8], [-902.1, 301.9], [-898.9, 301.3], [-894.7, 301.6], [-892, 302.1], [-887, 292.6], [-885.2, 293.1], [-883.5, 294.1], [-881.5, 295.9], [-880, 298.3], [-878.7, 301.4], [-877, 307.2], [-874.4, 306.1], [-873.4, 309.1], [-873, 315.3], [-873.6, 318.7], [-874.5, 322.4], [-876, 326], [-878.2, 329.2], [-876, 330.4], [-877.7, 333.4], [-880.8, 336.4], [-884.6, 339.3], [-889.1, 341.1], [-893.3, 341.9], [-893, 344.4], [-901.3, 345.2], [-905.4, 344]],
  [[-896.4, 349.4], [-903.4, 360.4], [-937.6, 338.2], [-935.5, 335], [-939.9, 332.4], [-936.4, 327.4], [-932, 330.4], [-923.7, 318.2], [-915.8, 323.3], [-924.4, 336.4], [-907.2, 347.1], [-905.5, 344.1]],
  [[-930.9, 313.7], [-920.2, 297.9], [-922.6, 295.6], [-921, 293.2], [-918.1, 290.1], [-915.4, 288.1], [-912.3, 286.3], [-908.2, 284.9], [-904.1, 283.9], [-898.9, 283.6], [-894.7, 284], [-896.8, 294.7], [-900, 294.3], [-902.7, 294.6], [-906.5, 295.7], [-910, 297.4], [-913.6, 301.7], [-923.6, 318.1]],
];
const LOBE = [[-892, 302.1], [-887, 292.6], [-885.2, 293.1], [-883.5, 294.1], [-881.5, 295.9], [-880, 298.3], [-878.7, 301.4], [-877, 307.2], [-880.5, 309.5], [-888, 308]];

const COL = {
  panel: '#ebeded', panelD: '#d8dbdc', plinth: '#7d8185', pier: '#4b4f54', frame: '#f1f1ef', glass: '#556d80', glassL: '#8aa3b4', cream: '#d9cfb6', metal: '#58606a', wing: '#6f6960',
  cap: '#a9adb0', white: '#f4f4f1', step: '#b8b3aa', steel: '#d9dcde', fence: '#2c2e31', postW: '#eeeeea',
};
const H_LOW = 16.2, H_HIGH = 18.8, PAR = 0.7, H_LOBE = 19.4, H_WING = 11.6;
const A_LOW = [rad(-100), rad(11)], A_HIGH = [rad(11), rad(260)];   // the front (boulevard) side is the low half, stepping up at the main entrance's right pier
const norm = (a) => { a %= 360; return a > 180 ? a - 360 : a <= -180 ? a + 360 : a; };
const inR = (d, [a, b]) => (b >= a ? d >= a && d <= b : d >= a || d <= b);

// what the drum wall shows at an angle (degrees): bays, ribbons, oculi
const BAYS = [
  { a0: 11, a1: 33, k: 'main', top: 8.4, tr: [3.6, 5.8] },    // the main entrance on the boulevard side
  { a0: 96, a1: 110, k: 'south', top: 7.0, tr: [3.8, 5.4] },       // the courtyard entrance
  { a0: 150, a1: 158, k: 'slot', top: 12.6, tr: [6.4] },      // the stair slot between two piers
  { a0: -31, a1: -24, k: 'slit', top: 9.0, tr: [] },
];
const RIBBONS = [[37, 90], [-34, 8], [116, 147], [-52, -38], [162, 178], [-178, -128], [-124, -104]];
const OCULI = [22, 200];
const OVALS = [-38, 128, -57, 148];
const bayAt = (d) => BAYS.find((b) => d >= b.a0 && d < b.a1);
const ribAt = (d) => RIBBONS.some(([a, b]) => d >= a && d < b);

export function buildEmanuel({ B, S, g, r, lampsOut = [] }) {
  const cx = C[0], cz = C[1], yF = Math.max(g(cx, cz), g(cx + 21, cz), g(cx - 21, cz), g(cx, cz + 21), g(cx, cz - 21)) + 0.14;
  const Y = (h) => yF + h;
  const ring = (rr) => [...rr];
  const xfd = ['wall', 'roof', 'glass', 'lit', 'det', 'glow', 'rail'];
  for (const k of xfd) B[k].setXf(M4(0, yF, 0));
  const D = B.wall, T = B.det, G = B.glass, L = B.lit, Rf = B.roof;
  const stats = { windows: 0, lamps: 0, posts: 0 };
  const P = (rr, a) => [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr];
  const heightAt = (deg) => (inR(deg, [-100, 11]) ? H_LOW : H_HIGH);

  // ------------------------------------------------------------------------------------------ the drum
  const STEPS = 120, dA = TAU / STEPS;
  for (let i = 0; i < STEPS; i++) {
    const a0 = -PI + i * dA, a1 = a0 + dA, am = (a0 + a1) / 2, dm = norm(am * 180 / PI);
    const top = heightAt(dm), bay = bayAt(dm), rib = ribAt(dm), hi = top > H_LOW + 1;
    const [x0, z0] = P(R, a0), [x1, z1] = P(R, a1), n0 = [Math.cos(a0), 0, Math.sin(a0)], n1 = [Math.cos(a1), 0, Math.sin(a1)];
    const arc = R * dA, s0 = (a0 + PI) * R, s1 = s0 + arc;
    const wall = (y0, y1, col = COL.panel, rr = R) => {
      D.setColor(col);
      const [ax, az] = P(rr, a0), [bx, bz] = P(rr, a1);
      sq(D, [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], [n0, n1, n1, n0], [[s0 / 2.5, y0 / 2.5], [s1 / 2.5, y0 / 2.5], [s1 / 2.5, y1 / 2.5], [s0 / 2.5, y1 / 2.5]]);
    };
    const inset = (y0, y1, d, M, col) => { // a pane set back d from the wall
      M.setColor(col);
      const [ax, az] = P(R - d, a0), [bx, bz] = P(R - d, a1);
      sq(M, [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], [n0, n1, n1, n0]);
    };
    if (bay) {
      // the opening: glass behind the wall plane, a lintel above
      const rec = bay.k === 'main' ? 0.6 : 0.45;
      inset(0.5, bay.top, rec, bay.k === 'slit' ? G : L, COL.glass);
      wall(bay.top, top);
      // transoms and mullions
      T.setColor(COL.frame);
      for (const ty of bay.tr) { const [ax, az] = P(R - rec + 0.02, a0), [bx, bz] = P(R - rec + 0.02, a1); sq(T, [[ax, ty - 0.05, az], [bx, ty - 0.05, bz], [bx, ty + 0.05, bz], [ax, ty + 0.05, az]], [n0, n1, n1, n0]); }
      if (i % 2 === 0) { const [ax, az] = P(R - rec + 0.03, a0); sq(T, [[ax - Math.sin(a0) * 0.04, 0.5, az + Math.cos(a0) * 0.04], [ax + Math.sin(a0) * 0.04, 0.5, az - Math.cos(a0) * 0.04], [ax + Math.sin(a0) * 0.04, bay.top, az - Math.cos(a0) * 0.04], [ax - Math.sin(a0) * 0.04, bay.top, az + Math.cos(a0) * 0.04]], n0); }
      wall(-0.7, 0.5, COL.plinth);
      stats.windows++;
    } else {
      const yr0 = hi ? 12.6 : 9.4, yr1 = hi ? 14.4 : 11.2;
      if (rib) {
        wall(-0.7, 0.4, COL.plinth); wall(0.4, yr0, COL.panel); wall(yr1, top, COL.panel);
        inset(yr0, yr1, 0.18, (i + (hi ? 1 : 0)) % 3 === 0 ? L : G, COL.glassL);
        // frame: sill, lintel, a mullion on every step
        T.setColor(COL.frame);
        const [ax, az] = P(R + 0.02, a0), [bx, bz] = P(R + 0.02, a1);
        sq(T, [[ax, yr0 - 0.06, az], [bx, yr0 - 0.06, bz], [bx, yr0 + 0.06, bz], [ax, yr0 + 0.06, az]], [n0, n1, n1, n0]);
        sq(T, [[ax, yr1 - 0.06, az], [bx, yr1 - 0.06, bz], [bx, yr1 + 0.06, bz], [ax, yr1 + 0.06, az]], [n0, n1, n1, n0]);
        const w = 0.04, tx = -Math.sin(a0), tz = Math.cos(a0);
        sq(T, [[ax - tx * w, yr0, az - tz * w], [ax + tx * w, yr0, az + tz * w], [ax + tx * w, yr1, az + tz * w], [ax - tx * w, yr1, az - tz * w]], n0);
        stats.windows++;
      } else {
        wall(-0.7, 0.4, COL.plinth); wall(0.4, top);
      }
    }
    // the cornice: a darker coping band and the parapet's top
    wall(top, top + PAR, COL.panelD, R + 0.04);
    T.setColor(COL.cap);
    const [ox, oz] = P(R + 0.16, a0), [px, pz] = P(R + 0.16, a1), [ix, iz] = P(R - 0.2, a0), [jx, jz] = P(R - 0.2, a1);
    sq(T, [[ox, top + PAR, oz], [px, top + PAR, pz], [jx, top + PAR, jz], [ix, top + PAR, iz]], [0, 1, 0]);
    // inner face of the parapet
    D.setColor(COL.panelD);
    const [qx, qz] = P(R - 0.2, a0), [wx, wz] = P(R - 0.2, a1);
    sq(D, [[qx, top, qz], [wx, top, wz], [wx, top + PAR, wz], [qx, top + PAR, qz]], [[-n0[0], 0, -n0[2]], [-n1[0], 0, -n1[2]], [-n1[0], 0, -n1[2]], [-n0[0], 0, -n0[2]]]);
  }
  // the two roofs: the cream membrane over the low east half, dark standing-seam metal over the high west half
  Rf.setColor(COL.cream); fan(Rf, [C, ...arcPts(C, R - 0.2, A_LOW[0], A_LOW[1], 30)], H_LOW, true, [2.5, 2.5]);
  Rf.setColor(COL.metal); fan(Rf, [C, ...arcPts(C, R - 0.2, A_HIGH[0], A_HIGH[1], 36)], H_HIGH, true, [2.5, 2.5]);
  // the step between the low east and the high west half: the wall of the high half, seen over the low roof, closes at the ends
  for (const a of [rad(11), rad(260)]) {
    const [x, z] = P(R, a);
    D.setColor(COL.panelD);
    sq(D, [[cx, H_LOW, cz], [x, H_LOW, z], [x, H_HIGH, z], [cx, H_HIGH, cz]], [Math.sin(a), 0, -Math.cos(a)]);
    sq(D, [[cx, H_LOW, cz], [x, H_LOW, z], [x, H_HIGH, z], [cx, H_HIGH, cz]], [-Math.sin(a), 0, Math.cos(a)]);
  }
  // oculi and ovals: a white frame ring with a glass disc
  const oculus = (deg, y, rx, ry) => {
    const a = rad(deg), [px, pz] = P(R + 0.07, a), nx = Math.cos(a), nz = Math.sin(a), tx = -nz, tz = nx, N = 28;
    const pt = (k, q) => { const t = k / N * TAU; return [px + tx * Math.cos(t) * rx * q, y + Math.sin(t) * ry * q, pz + tz * Math.cos(t) * rx * q]; };
    G.setColor(COL.glassL);
    for (let k = 0; k < N; k++) { const A = pt(k, 0.82), Bq = pt(k + 1, 0.82); G.face([[px + nx * 0.02 - 0, y, pz + nz * 0.02], [A[0] + nx * 0.02, A[1], A[2] + nz * 0.02], [Bq[0] + nx * 0.02, Bq[1], Bq[2] + nz * 0.02]], [nx, 0, nz]); }
    T.setColor(COL.frame);
    for (let k = 0; k < N; k++) { const A = pt(k, 1), Bq = pt(k + 1, 1), A2 = pt(k, 0.82), B2 = pt(k + 1, 0.82); T.face([A, Bq, B2, A2], [nx, 0, nz]); }
    for (const dd of [-1, 0, 1]) T.face([[px + tx * dd * 0.04 - 0, y - ry * 0.82, pz + tz * dd * 0.04], [px + tx * (dd * 0.04 + 0.05), y - ry * 0.82, pz + tz * (dd * 0.04 + 0.05)], [px + tx * (dd * 0.04 + 0.05), y + ry * 0.82, pz + tz * (dd * 0.04 + 0.05)], [px + tx * dd * 0.04, y + ry * 0.82, pz + tz * dd * 0.04]], [nx, 0, nz]);
    T.face([[px - tx * rx * 0.82, y - 0.03, pz - tz * rx * 0.82], [px + tx * rx * 0.82, y - 0.03, pz + tz * rx * 0.82], [px + tx * rx * 0.82, y + 0.03, pz + tz * rx * 0.82], [px - tx * rx * 0.82, y + 0.03, pz - tz * rx * 0.82]], [nx, 0, nz]);
  };
  for (const d of OCULI) oculus(d, inR(norm(d), [-100, 11]) ? 10.6 : 13.8, 1.75, 1.75);
  for (const d of OVALS) oculus(d, inR(norm(d), [-100, 11]) ? 10.4 : 13.6, 0.5, 1.25);

  // piers either side of each bay (dark grey, a little proud), and the steps in front of the two entrances
  for (const b of BAYS) {
    const w = b.k === 'slit' ? 0.7 : b.k === 'slot' ? 1.0 : 1.1, top = b.top + 0.9;
    for (const [from, to] of [[b.a0 - w / R * 180 / PI, b.a0], [b.a1, b.a1 + w / R * 180 / PI]]) {
      const pts = arcPts(C, R + 0.35, rad(from), rad(to), 3);
      band(D, pts, -0.7, top, { out: 1, uvM: [2.5, 2.5], col: COL.pier, smooth: false });
      const [ix, iz] = P(R, rad(from)), [jx, jz] = P(R, rad(to)), [ox0, oz0] = pts[0], [ox1, oz1] = pts[pts.length - 1];
      D.setColor(COL.pier);
      sq(D, [[ix, -0.7, iz], [ox0, -0.7, oz0], [ox0, top, oz0], [ix, top, iz]], [Math.sin(rad(from)), 0, -Math.cos(rad(from))]);
      sq(D, [[jx, -0.7, jz], [ox1, -0.7, oz1], [ox1, top, oz1], [jx, top, jz]], [-Math.sin(rad(to)), 0, Math.cos(rad(to))]);
      annulus(D, C, R, R + 0.35, rad(from), rad(to), top, 3, true);
    }
    // the reveals at the bay's two ends and its soffit
    {
      const rec = b.k === 'main' ? 0.6 : 0.45;
      D.setColor(COL.panelD);
      for (const [deg, sg] of [[b.a0, 1], [b.a1, -1]]) {
        const a = rad(deg), [ox, oz] = P(R, a), [ix, iz] = P(R - rec, a);
        sq(D, [[ix, 0.5, iz], [ox, 0.5, oz], [ox, b.top, oz], [ix, b.top, iz]], [sg * Math.sin(a), 0, -sg * Math.cos(a)]);
      }
      annulus(D, C, R - rec, R, rad(b.a0), rad(b.a1), b.top, 4, false);
    }
    if (b.k === 'main' || b.k === 'south') {
      const m = (b.a0 + b.a1) / 2, half = (b.a1 - b.a0) / 2 + 4.5;
      for (let k = 0; k < 3; k++) {
        const r0 = R + 0.35 + 0.4 * k, r1 = r0 + 0.4, top = 0.51 - 0.17 * k;
        annulus(D, C, r0, r1, rad(m - half), rad(m + half), top, 6, true);
        band(D, arcPts(C, r1, rad(m - half), rad(m + half), 6), -0.7, top, { out: 1, col: COL.step, smooth: true });
      }
    }
  }

  // ------------------------------------------------------------------------------------------ the stair tower (the lobe) and its cross
  {
    const pts = LOBE.map((p) => [p[0], p[1]]), sg = Math.sign(area2(pts)) || 1;
    // a sail: the roof rises toward the west corner
    const topAt = (x) => H_LOBE + 2.2 * Math.max(0, Math.min(1, (-879 - x) / 11));
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], Lq = Math.hypot(dx, dz) || 1, n = [sg * dz / Lq, 0, -sg * dx / Lq];
      D.setColor(COL.panel);
      sq(D, [[a[0], -0.7, a[1]], [b[0], -0.7, b[1]], [b[0], topAt(b[0]), b[1]], [a[0], topAt(a[0]), a[1]]], n, [[0, -0.28], [Lq / 2.5, -0.28], [Lq / 2.5, topAt(b[0]) / 2.5], [0, topAt(a[0]) / 2.5]]);
      D.setColor(COL.panelD);
      sq(D, [[a[0], topAt(a[0]), a[1]], [b[0], topAt(b[0]), b[1]], [b[0], topAt(b[0]) + 0.7, b[1]], [a[0], topAt(a[0]) + 0.7, a[1]]], n);
    });
    Rf.setColor(COL.metal);
    { const f0 = Rf.v; fan(Rf, pts, 0, true); const aa = Rf.buf.a; for (let v = f0; v < Rf.v; v++) { const o = v * 11; aa[o + 1] = yF + topAt(aa[o]) + 0.7; } }
    // narrow dark vertical windows on the tower's face toward the boulevard, and on the west
    G.setColor('#2d3b46');
    for (const [i0, ts] of [[0, [0.3, 0.5, 0.7]], [4, [0.35, 0.65]]]) {
      const a = LOBE[i0], b = LOBE[(i0 + 1) % LOBE.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len, nx = sg * uz, nz = -sg * ux;
      for (const t of ts) { const x = a[0] + ux * len * t + nx * 0.03, z = a[1] + uz * len * t + nz * 0.03; sq(G, [[x - ux * 0.4, 15.5, z - uz * 0.4], [x + ux * 0.4, 15.5, z + uz * 0.4], [x + ux * 0.4, topAt(x) - 1.2, z + uz * 0.4], [x - ux * 0.4, topAt(x) - 1.2, z - uz * 0.4]], [nx, 0, nz]); }
    }
    // the cross, on the tower's west corner
    const kx = LOBE[0][0] * 0.62 + LOBE[1][0] * 0.38 + 0.2, kz = LOBE[0][1] * 0.62 + LOBE[1][1] * 0.38 + 2.0, ky = topAt(kx) + 0.7;
    T.setColor(COL.cap); T.box(kx - 0.9, ky, kz - 0.9, kx + 0.9, ky + 0.5, kz + 0.9, 63 & ~8);
    cross3d(T, kx, ky + 0.5, kz, PI / 2, 6.0, 3.6, COL.steel);
  }

  // ------------------------------------------------------------------------------------------ the bar and the crescent
  const wings = [{ ring: EMANUEL_RINGS[1], kind: 'bar' }, { ring: EMANUEL_RINGS[2], kind: 'cres' }];
  const wingSolids = [];
  for (const { ring: wr, kind } of wings) {
    const faces = ringFaces(wr);
    const sgn = Math.sign(area2(wr)) || 1;
    for (const f of faces) {
      const mid = at(f, f.L / 2, 0), outward = ((mid[0] - cx) * f.nx + (mid[2] - cz) * f.nz) > 0;
      const Lf = f.L;
      if (Lf < 1.4) { skin(D, f, 0, H_WING, COL.panel, [2.5, 2.5]); continue; }
      // window modules: pairs of two-light windows
      const win = (y0, y1, mod, lit = 0.45, mar = 1.2, noGround = false) => {
        const n = Math.floor((Lf - 2 * mar) / mod);
        if (n < 1) return;
        const s0 = (Lf - n * mod) / 2 + (mod - 3.05) / 2;
        for (let k = 0; k < n; k++) for (let j = 0; j < 2; j++) {
          const a = s0 + k * mod + j * 1.65, b = a + 1.4;
          if (noGround && kind === 'bar' && f.k === 1 && b > 2.4 && a < 12.1) continue; // the entrance canopy
          f.cuts.push({ s0: a, s1: b, y0, y1 });
          hole(B, f, { s0: a, s1: b, y0, y1, dep: 0.2, frame: COL.frame, glass: '#3f525f', rev: '#e4e5e5', lit: r() < lit, pitch: 0.75, tr: null, sill: '#d6d8d9' });
          stats.windows++;
        }
      };
      if (kind === 'cres' && outward && Lf > 3) {
        // pilotis: the ground storey set back behind dark piers, glazing between them
        const nP = Math.max(1, Math.round(Lf / 4.4)), step = Lf / nP;
        D.setColor('#4d5258'); rect(D, f, 0, Lf, 0, 4.4, -1.1, [2.5, 2.5]);
        B.det.setColor(COL.glass);
        for (let k = 0; k < nP; k++) {
          const s0 = k * step + 0.7, s1 = (k + 1) * step - 0.7;
          G.setColor(COL.glass); rect(G, f, s0, s1, 0.7, 3.3, -1.04);
          T.setColor(COL.frame);
          rect(T, f, s0 - 0.07, s0 + 0.05, 0.62, 3.4, -1.0); rect(T, f, s1 - 0.05, s1 + 0.07, 0.62, 3.4, -1.0);
          rect(T, f, s0 - 0.07, s1 + 0.07, 0.62, 0.74, -1.0); rect(T, f, s0 - 0.07, s1 + 0.07, 3.28, 3.4, -1.0);
          rect(T, f, (s0 + s1) / 2 - 0.04, (s0 + s1) / 2 + 0.04, 0.7, 3.3, -1.0);
          stats.windows++;
        }
        for (let k = 0; k <= nP; k++) { const s = Math.min(Lf - 0.35, Math.max(0.35, k * step)); T.setColor(COL.pier); box(T, f, s - 0.35, s + 0.35, 0, 4.4, -0.35, 0.35, 'ftlr'); }
        T.setColor('#3c4044'); box(T, f, 0, Lf, 4.4, 4.7, -1.2, 0.05, 'fbu');
        win(5.6, 7.1, 3.9); win(8.7, 10.2, 3.9);
        skin(D, f, 4.7, H_WING, COL.panel, [2.5, 2.5]);
        D.setColor(COL.panelD); rect(D, f, 0, Lf, 4.4, 4.7, 0, [2.5, 2.5]);
      } else {
        const gf = kind === 'bar' ? 0.9 : 0.8;
        if (Lf > 4) { win(gf, gf + 2.5, 3.9, 0.35, 1.2, true); win(5.0, 6.7, 3.9); win(8.5, 10.2, 3.9); }
        D.setColor(COL.plinth); rect(D, f, 0, Lf, -0.7, 0.45, 0.02, [2.5, 2.5]);
        skin(D, f, 0.45, H_WING, COL.panel, [2.5, 2.5]);
        T.setColor(COL.panelD); box(T, f, 0, Lf, 4.0, 4.2, 0, 0.04, 'f'); box(T, f, 0, Lf, 7.7, 7.9, 0, 0.04, 'f');
      }
      // the cornice
      T.setColor(COL.cap); box(T, f, -0.1, Lf + 0.1, H_WING - 0.05, H_WING + 0.35, -0.02, 0.22, 'ftlru');
    }
    // flat roof
    Rf.setColor(kind === 'bar' ? COL.wing : '#77726a'); Rf.fill(wr, [], H_WING, true);
    wingSolids.push(S.prism(wr.flat(), yF - 0.7, Y(H_WING + 0.4), 0, 0, 'wall', 0));
  }
  // the bar's entrance canopy (face 1 of ring 2, near its east end) with two posts and glass doors
  {
    const f = ringFaces(EMANUEL_RINGS[1])[1], s0 = 3.0, s1 = 11.5;
    T.setColor('#e5e6e6'); box(T, f, s0, s1, 3.55, 3.95, 0.0, 2.6, 'ftulr');
    T.setColor(COL.pier); for (const s of [s0 + 0.5, s1 - 0.5]) box(T, f, s - 0.14, s + 0.14, 0, 3.55, 2.2, 2.5, 'ftlr');
    G.setColor(COL.glass); rect(G, f, s0 + 0.9, s1 - 0.9, 0.5, 3.4, 0.07);
    T.setColor(COL.frame); for (let s = s0 + 0.9; s <= s1 - 0.89; s += 1.3) rect(T, f, s - 0.04, s + 0.04, 0.5, 3.4, 0.09);
    // three steps
    T.setColor(COL.step);
    for (let q = 0; q < 3; q++) box(T, f, s0 - 0.2, s1 + 0.2, -0.5, 0.34 - 0.17 * q, 0.0, 0.5 + 0.45 * q, 'ft');
  }

  // ------------------------------------------------------------------------------------------ the forecourt
  const PLAZA = [[-897, 273], [-881, 277], [-871, 292], [-865, 312], [-862, 336], [-864, 360], [-874, 374], [-894, 376], [-904, 368], [-912, 357], [-906, 350], [-884, 347], [-872, 340], [-870, 320], [-876, 304], [-884, 300], [-890, 288]];
  B.pave.setColor('#ffffff'); drape(B.pave, g, PLAZA, 0.1, 8, 4);
  const LAWNS = [[[-898, 266], [-880, 275], [-878, 284], [-897, 282]], [[-904, 372], [-884, 372], [-874, 392], [-896, 396], [-906, 388]], [[-868, 326], [-863, 326], [-863, 346], [-868, 346]]];
  B.lawn.setColor('#ffffff'); for (const poly of LAWNS) drape(B.lawn, g, poly, 0.14, 8, 4);
  // a round bed in the paving (the planter of the early photographs), with shrubs
  const BEDC = [-876, 354], bedY = g(BEDC[0], BEDC[1]);
  T.setColor('#d9d4c8'); T.lathe([[4.2, bedY - yF], [4.2, bedY - yF + 0.45], [3.95, bedY - yF + 0.45]], 20, BEDC[0], BEDC[1]);
  B.lawn.setColor('#ffffff'); drape(B.lawn, g, disc(BEDC[0], BEDC[1], 4.0, 20), 0.4, 6, 4);
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, q = i % 2 ? 1.7 : 0.6; shrub(T, BEDC[0] + Math.cos(a) * q, bedY - yF + 0.4, BEDC[1] + Math.sin(a) * q, 0.9 + (i % 3) * 0.15, i % 3 === 0 ? '#3f6a30' : i % 3 === 1 ? '#5b8a3a' : '#2f5a30'); }

  // the fence: white posts, dark iron panels, curving along the boulevard side of the drum
  const FR = 24.3, gaps = [[rad(22 - 12), rad(22 + 12)], [rad(103 - 10), rad(103 + 10)]];
  const fa0 = rad(-60), fa1 = rad(112), nF = Math.round((fa1 - fa0) * FR / 2.6), railPts = [];
  for (let k = 0; k <= nF; k++) {
    const a = fa0 + (fa1 - fa0) * k / nF, [x, z] = P(FR, a), yy = g(x, z) - yF;
    const open = gaps.some(([s, e]) => a > s && a < e);
    if (!open) { post(T, x, yy, z, 0.34, 1.35, COL.postW, '#d7d7d1'); stats.posts++; }
    railPts.push({ a, x, z, yy, open });
  }
  for (let k = 0; k < railPts.length - 1; k++) {
    const p = railPts[k], q = railPts[k + 1];
    if (p.open || q.open) continue;
    const dx = q.x - p.x, dz = q.z - p.z, Lq = Math.hypot(dx, dz), nx = dz / Lq, nz = -dx / Lq;
    B.rail.setColor(COL.fence);
    const y0 = Math.min(p.yy, q.yy) + 0.12, y1 = y0 + 1.0;
    sq(B.rail, [[p.x, y0, p.z], [q.x, y0, q.z], [q.x, y1, q.z], [p.x, y1, p.z]], [nx, 0, nz], [[0, 0], [Lq / 0.14, 0], [Lq / 0.14, 1], [0, 1]]);
  }
  // mushroom lamps (the boulevard's black dome heads)
  const LAMPS = [[27.5, -40], [27.5, -4], [27.5, 38], [27.5, 76], [26, 112], [20, 132]].map(([rr, d]) => P(rr, rad(d)));
  LAMPS.push([-894, 281], [-905, 280], [-922, 366], [-905, 372], [-883, 368], [-944, 343]);
  for (const [x, z] of LAMPS) { lamp(T, x, g(x, z) - yF, z, { glow: B.glow }); lampsOut.push([x, g(x, z) + 4.6, z]); S.cyl(x, z, yF - 0.3, Y(4.6), 0.14, 0.12, 'pole'); stats.lamps++; }

  // ------------------------------------------------------------------------------------------ bushes round the foot of the drum
  for (let i = 0; i < 9; i++) { const d = -50 + i * 9; if (BAYS.some((b) => d > b.a0 - 12 && d < b.a1 + 12)) continue; const [x, z] = P(R + 2.0, rad(d)); if (!inPoly(PLAZA, x, z)) continue; shrub(T, x, g(x, z) - yF, z, 0.8, '#3d6a33'); }
  const spots = [];
  for (const [x, z, sc, pine] of [[-889, 382, 1.1, 0], [-880, 386, 0.9, 0], [-898, 388, 1.0, 1], [-872, 380, 0.8, 1], [-890, 270, 0.9, 0], [-884, 272, 0.8, 1]]) spots.push({ x, z, y: g(x, z) + 0.17, kind: pine ? 'conifer' : 'park', variant: pine ? 'spruce' : undefined, sc, pal: pine ? PARK_PINE : PARK_GREENS });

  // ------------------------------------------------------------------------------------------ collision
  S.cyl(cx, cz, yF - 0.7, Y(H_LOW + PAR), R, R, 'wall');
  S.prism(ring(LOBE).flat(), yF - 0.7, Y(H_LOBE + 3.7), 0, 0, 'wall', 0);
  // the high west half
  S.prism([C, ...arcPts(C, R - 0.3, A_HIGH[0], A_HIGH[1], 16)].flat(), Y(H_LOW), Y(H_HIGH + PAR), 0, 0, 'wall', 0);
  for (const k of xfd) B[k].setXf(null);

  const hullPts = hull([...EMANUEL_RINGS.flat(), ...PLAZA]);
  const footprints = EMANUEL_RINGS.map((rr, i) => ({ poly: rr.map((p) => [p[0], p[1]]), h: i === 0 ? H_HIGH : H_WING, kind: 'church', name: 'Biserica Baptistă Emanuel', id: EMANUEL_ID }));
  return {
    footprints, spots, stats, lamps: stats.lamps, hull: hullPts, yF,
    clear: (x, z) => inPoly(hullPts, x, z) || inPoly(PLAZA, x, z) || LAWNS.some((p) => inPoly(p, x, z)) || Math.hypot(x - cx, z - cz) < 30,
  };
}
void quad;
