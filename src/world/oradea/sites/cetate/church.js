// The Roman Catholic garrison church inside the Oradea Fortress (OSM way 190653989), as it stands today: a yellow nave with
// tall round-arched windows between pilasters under a red tile gable roof, its clock tower at the north-west end with a
// pyramid roof (the church was Baroque, 1775, rebuilt after the fire of 1836). Not a site module: ../cetate.js calls it.
//   buildChurch({ G, B, S, A, r }) -> { footprints, top, tower: { x, z, top } }
//     B: MeshBuilders { church, plain, tile, det, glow, stone };  A: the church atlas (textures.js churchAtlas().A)
import { face, at, quad } from '../../../cherkasy/slabkit.js';
import { band } from '../../../cherkasy/bayatlas.js';
import { CHURCH } from './data.js';

const NAVE = 11.5, TOWER = 20.5, BELFRY = 4.3, CAP = 3.2, YELLOW = '#f1d25e';
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cross3 = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];

export function buildChurch({ G, B, S, A }) {
  const [Pa, Pk, Pb, Pp, Pc, Pd, Pe] = CHURCH;      // A, kink, B, P19, C, bump, D
  const cen = CHURCH.reduce((s, p) => [s[0] + p[0] / CHURCH.length, s[1] + p[1] / CHURCH.length], [0, 0]);
  const stats = { solids: 0 };
  const facing = (a, b, ref = cen) => {
    const f = face(a, b, 0, 0);
    let nx = f.uz, nz = -f.ux;
    if (nx * ((a[0] + b[0]) / 2 - ref[0]) + nz * ((a[1] + b[1]) / 2 - ref[1]) < 0) { nx = -nx; nz = -nz; }
    return Object.assign(f, { nx, nz, N: [nx, 0, nz] });
  };
  const Ac = { ...A, base: G };
  const yN = G + NAVE;
  // the nave's walls: bay atlas where an edge is long enough for a window, plain yellow where it is a jog
  CHURCH.forEach((a, k) => {
    const b = CHURCH[(k + 1) % CHURCH.length], f = facing(a, b);
    if (k === 1) {   // the low arched passage at the foot of the tower: a dark recess in a pale stone frame
      B.plain.setColor(YELLOW);
      quad(B.plain, at(f, 0, G), at(f, f.L, G), at(f, f.L, yN), at(f, 0, yN), f.N);
      const sc = f.L / 2, rr = 1.5, ys = G + 3.2;
      B.stone.setColor('#f1e6bd');
      quad(B.stone, at(f, sc - rr - 0.35, G, 0.06), at(f, sc + rr + 0.35, G, 0.06), at(f, sc + rr + 0.35, ys + rr + 0.35, 0.06), at(f, sc - rr - 0.35, ys + rr + 0.35, 0.06), f.N, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      B.det.setColor('#2a2622');
      quad(B.det, at(f, sc - rr, G, 0.1), at(f, sc + rr, G, 0.1), at(f, sc + rr, ys, 0.1), at(f, sc - rr, ys, 0.1), f.N);
      const arc = Array.from({ length: 9 }, (_, q) => { const th = Math.PI * q / 8; return at(f, sc - rr * Math.cos(th), ys + rr * Math.sin(th), 0.1); });
      for (let q = 0; q < 8; q++) quad(B.det, at(f, sc, ys, 0.1), arc[q], arc[q + 1], arc[q + 1], f.N);
    } else if (f.L > 4.6) band(B.church, f, Ac, G, yN);
    else { B.plain.setColor(YELLOW); quad(B.plain, at(f, 0, G), at(f, f.L, G), at(f, f.L, yN), at(f, 0, yN), f.N); }
  });
  // the nave's roof: a gable from the north-west end to the front, the ridge rising with the width
  const ax = sub(Pa, Pb), al = Math.hypot(...ax), u = [ax[0] / al, ax[1] / al];          // north-west -> south-east
  const Rn = mid(Pb, Pp), Rs = mid(Pa, Pe), wN = Math.hypot(...sub(Pb, Pp)), wS = Math.hypot(...sub(Pa, Pe));
  const yRn = yN + wN * 0.5 * 0.8, yRs = yN + wS * 0.5 * 0.8;
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  gableRoof();
  function gableRoof() {
    // the two slopes as quads (normals up), the gable triangles at both ends
    const slope = (e0, e1, yE0, yE1) => {                             // an eave edge e0 -> e1 (the north-west end first), the ridge above the middle
      const pts = [[e0[0], yE0 - 0.1, e0[1]], [e1[0], yE1 - 0.1, e1[1]], [Rs[0], yRs, Rs[1]], [Rn[0], yRn, Rn[1]]];
      let n = cross3(sub3(pts[1], pts[0]), sub3(pts[3], pts[0]));
      if (n[1] < 0) n = n.map((q) => -q);
      const l = Math.hypot(...n); n = n.map((q) => q / l);
      const e = sub3(pts[1], pts[0]), el = Math.hypot(...e), ex = e.map((q) => q / el), sy = cross3(n, ex);
      const D = B.tile, first = D.v;
      for (const p of pts) { const d = sub3(p, pts[0]); D.vert(p[0], p[1], p[2], n[0], n[1], n[2], d[0] * ex[0] + d[1] * ex[1] + d[2] * ex[2], d[0] * sy[0] + d[1] * sy[1] + d[2] * sy[2]); }
      const w = (pts[1][0] - pts[0][0]) * (pts[3][2] - pts[0][2]) - (pts[1][2] - pts[0][2]) * (pts[3][0] - pts[0][0]);   // y of (e x ridge side), flipped
      if (w > 0) { D.tri(first, first + 2, first + 1); D.tri(first, first + 3, first + 2); } else { D.tri(first, first + 1, first + 2); D.tri(first, first + 2, first + 3); }
      const bx = -n[0] / n[1], bz = -n[2] / n[1], a0 = pts[0][1] - bx * pts[0][0] - bz * pts[0][2];
      const id = S.prism([e0, e1, Rs, Rn].flat(), G, a0, bx, bz, 'church');
      if (id >= 0) stats.solids++;
    };
    slope(Pb, Pa, yN, yN);          // the court side
    slope(Pp, Pe, yN, yN);          // the outer side
    B.plain.setColor(YELLOW);
    for (const [a, b, R, y] of [[Pa, Pe, Rs, yRs], [Pb, Pp, Rn, yRn]]) {
      const pts = [[a[0], yN, a[1]], [b[0], yN, b[1]], [R[0], y, R[1]]];
      let n = cross3(sub3(pts[1], pts[0]), sub3(pts[2], pts[0]));
      const out = [(pts[0][0] + pts[1][0]) / 2 - cen[0], 0, (pts[0][2] + pts[1][2]) / 2 - cen[1]];
      if (n[0] * out[0] + n[2] * out[2] < 0) n = n.map((q) => -q);
      const l = Math.hypot(...n);
      quad(B.plain, pts[0], pts[1], pts[2], pts[2], n.map((q) => q / l));
    }
  }

  // ---------------------------------------------------------------------------------------------- the tower
  const pc = [u[1], -u[0]];                                        // toward the outer side
  const hs = 2.7, back = mid(Pb, Pp), Tc = [back[0] + u[0] * hs, back[1] + u[1] * hs];
  const corner = (sa, sb) => [Tc[0] + u[0] * hs * sa + pc[0] * hs * sb, Tc[1] + u[1] * hs * sa + pc[1] * hs * sb];
  const TC = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)], yT = G + TOWER, yB = yT + BELFRY, yCap = yB + CAP;
  const tf = TC.map((a, k) => facing(a, TC[(k + 1) % 4], Tc));
  for (const f of tf) {
    // the shaft from the nave's eaves to the belfry: plain yellow with a pale band at the top and a small window
    B.plain.setColor(YELLOW);
    quad(B.plain, at(f, 0, yN), at(f, f.L, yN), at(f, f.L, yT), at(f, 0, yT), f.N);
    B.plain.setColor('#f7e8a8');
    quad(B.plain, at(f, -0.1, yT - 2.6, 0.12), at(f, f.L + 0.1, yT - 2.6, 0.12), at(f, f.L + 0.1, yT - 2.3, 0.12), at(f, -0.1, yT - 2.3, 0.12), f.N);   // the cornice under the belfry
    quad(B.plain, at(f, -0.05, yN, 0.1), at(f, 0.55, yN, 0.1), at(f, 0.55, yT - 2.6, 0.1), at(f, -0.05, yT - 2.6, 0.1), f.N);
    quad(B.plain, at(f, f.L - 0.55, yN, 0.1), at(f, f.L + 0.05, yN, 0.1), at(f, f.L + 0.05, yT - 2.6, 0.1), at(f, f.L - 0.55, yT - 2.6, 0.1), f.N);
    // the belfry: yellow wall with the clock; the tall arched opening sits in the shaft below it (as on the 2025 photographs)
    B.plain.setColor(YELLOW);
    quad(B.plain, at(f, 0, yT), at(f, f.L, yT), at(f, f.L, yB), at(f, 0, yB), f.N);
    B.det.setColor('#2c2a28');
    const sc = f.L / 2, ya = G + 18.5, ys = G + 20.8, rr = 0.85;
    quad(B.det, at(f, sc - rr, ya, 0.05), at(f, sc + rr, ya, 0.05), at(f, sc + rr, ys, 0.05), at(f, sc - rr, ys, 0.05), f.N);
    const pts = Array.from({ length: 9 }, (_, k) => { const th = Math.PI * k / 8; return at(f, sc - rr * Math.cos(th), ys + rr * Math.sin(th), 0.05); });
    for (let k = 0; k < 8; k++) quad(B.det, at(f, sc, ys, 0.05), pts[k], pts[k + 1], pts[k + 1], f.N);
    quad(B.det, at(f, sc - 0.4, yRn + 0.5, 0.05), at(f, sc + 0.4, yRn + 0.5, 0.05), at(f, sc + 0.4, yRn + 1.4, 0.05), at(f, sc - 0.4, yRn + 1.4, 0.05), f.N);   // the small window low in the shaft
    B.stone.setColor('#f7e8a8');
    quad(B.stone, at(f, -0.1, yB - 0.4, 0.15), at(f, f.L + 0.1, yB - 0.4, 0.15), at(f, f.L + 0.1, yB, 0.15), at(f, -0.1, yB, 0.15), f.N, [[0, 0], [f.L, 0], [f.L, 0.4], [0, 0.4]]);
  }
  // the clock faces: on the three free sides, a cream disc with dark rim and hands
  for (const f of [tf[1], tf[2], tf[0]]) {
    const sc = f.L / 2, yc = yT + BELFRY * 0.65, rad = 1.1, N = 24;
    for (const [col, rr, o] of [['#3a2f26', rad + 0.14, 0.13], ['#f6efd6', rad, 0.15]]) {
      B.det.setColor(col);
      const ring = Array.from({ length: N + 1 }, (_, k) => { const th = 2 * Math.PI * k / N; return at(f, sc + rr * Math.cos(th), yc + rr * Math.sin(th), o); });
      for (let k = 0; k < N; k++) quad(B.det, at(f, sc, yc, o), ring[k], ring[k + 1], ring[k + 1], f.N);
    }
    B.det.setColor('#2a2420');
    quad(B.det, at(f, sc - 0.07, yc, 0.17), at(f, sc + 0.07, yc, 0.17), at(f, sc + 0.07, yc + 1.0, 0.17), at(f, sc - 0.07, yc + 1.0, 0.17), f.N);
    quad(B.det, at(f, sc, yc - 0.06, 0.18), at(f, sc + 0.75, yc - 0.06, 0.18), at(f, sc + 0.75, yc + 0.06, 0.18), at(f, sc, yc + 0.06, 0.18), f.N);
  }
  // the pyramid roof, red tile, with a little overhang; a gilded ball and cross on top
  const apex = [Tc[0], yCap, Tc[1]], ov = 0.35;
  B.plain.setColor('#6a7480');
  const eaveC = TC.map((p) => [p[0] + (p[0] - Tc[0]) * ov / (hs * 1.414) * 1.414, yB - 0.2, p[1] + (p[1] - Tc[1]) * ov / (hs * 1.414) * 1.414]);
  for (let k = 0; k < 4; k++) {
    const a = eaveC[k], b = eaveC[(k + 1) % 4];
    let n = cross3(sub3(b, a), sub3(apex, a));
    const m = [(a[0] + b[0]) / 2 - Tc[0], 0, (a[2] + b[2]) / 2 - Tc[1]];
    if (n[0] * m[0] + n[2] * m[2] < 0) n = n.map((q) => -q);
    const l = Math.hypot(...n), D = B.plain, first = D.v, e = Math.hypot(...sub3(b, a));
    for (const [p, uv] of [[a, [0, 0]], [b, [e, 0]], [apex, [e / 2, Math.hypot(CAP, hs)]]]) D.vert(p[0], p[1], p[2], n[0] / l, n[1] / l, n[2] / l, uv[0], uv[1]);
    const w = (b[0] - a[0]) * (apex[2] - a[2]) - (b[2] - a[2]) * (apex[0] - a[0]);
    const up = n[1] / l > 0;
    if ((w > 0) === up) D.tri(first, first + 2, first + 1); else D.tri(first, first + 1, first + 2);
  }
  B.glow.setColor('#d9a93a');
  B.glow.ellipsoid([Tc[0], yCap + 0.45, Tc[1]], [0.4, 0.45, 0.4], 8, 5);
  B.det.setColor('#d9a93a');
  B.det.box(Tc[0] - 0.06, yCap + 0.8, Tc[1] - 0.06, Tc[0] + 0.06, yCap + 2.2, Tc[1] + 0.06);
  B.det.box(Tc[0] - 0.4, yCap + 1.5, Tc[1] - 0.05, Tc[0] + 0.4, yCap + 1.62, Tc[1] + 0.05);

  // the tower's collider (above the nave's slopes, to the pyramid's start)
  const idT = S.prism(TC.flat(), G, yB + 2.0, 0, 0, 'church');
  if (idT >= 0) stats.solids++;
  const top = yCap + 2.4;
  return { footprints: [{ poly: CHURCH.map((p) => [p[0], p[1]]), h: NAVE + 3, kind: 'public', name: 'Biserica Romano-Catolică', id: 190653989 }], top, tower: { x: Tc[0], z: Tc[1], top }, stats };
}
