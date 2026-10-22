// OWNER: oradea. The park and the plaza of the Baroque ensemble: the big fan-cobbled square between the Basilica's front, the Palace's
// east front and the trees (traced from the Esri aerial), the round flower bed with the monument of King St Ladislaus (bronze on a
// pedestal, two lions, the hedge ring), Bishop Szaniszló's monument by the east edge, the lawn island with its spruces, black cast-iron
// lamps and slatted benches along the edges, and the Palace's courtyard garden (a round parterre with a basin, eight gravel paths
// and flower wedges, a gravel loop, lawns, the iron fence with stone piers along the open side).
//   buildPark(ctx) -> { clear(x, z), spots, lamps, benches }   ctx { B, S, heightAt, r }; B needs cobble, gravel, lawn, bed, det, glow, rail, plaster
//   PLAZA: the cobbled square's outline (map metres)
import { BAS, PAL, PI } from './kit.js';
import { M4 } from '../../../../kit/mesh.js';
import { PARK_PINE, PARK_GREENS } from '../../../trees.js';
import { inPoly } from '../../../cherkasy/geo.js';
import { quad } from '../../../cherkasy/civic.js';

export const PLAZA = [[-537.5, -1411], [-528, -1406.5], [-527, -1399], [-526, -1399], [-524, -1395], [-519.5, -1393], [-519, -1391.5], [-516, -1390], [-514, -1386.5], [-511, -1384.5], [-511, -1382], [-508.5, -1381], [-506, -1377.5], [-507, -1375.5], [-506, -1373], [-503.5, -1374], [-501, -1371.5], [-496.5, -1372], [-495, -1371], [-493, -1366.5], [-494, -1361.5], [-491, -1358], [-487, -1356], [-486.5, -1354], [-491, -1351.5], [-491.5, -1350], [-495.5, -1348.5], [-497, -1347], [-498, -1343], [-500.5, -1341.5], [-503, -1342.5], [-504, -1347.5], [-505.5, -1349], [-507.5, -1349], [-513.5, -1353], [-519.5, -1354], [-522, -1351.5], [-522, -1348.5], [-523.5, -1347], [-526.5, -1348], [-529, -1345], [-534, -1342], [-535, -1337], [-533, -1335.5], [-533.5, -1325], [-538.5, -1325], [-540.5, -1324], [-542, -1326.5], [-540, -1328.5], [-540, -1331.5], [-541.5, -1333], [-543.5, -1333], [-548.5, -1330], [-551.5, -1333], [-550, -1336], [-546, -1341], [-538, -1344], [-532, -1350.5], [-529, -1356.5], [-529, -1360.5], [-527, -1362.5], [-529, -1368], [-533.5, -1370], [-540.5, -1370.5], [-548.5, -1370], [-552.5, -1367], [-555.5, -1370], [-565.5, -1370], [-568.5, -1371], [-569.5, -1370], [-580.5, -1370], [-582, -1368], [-584, -1367.5], [-588, -1371.5], [-590, -1377.5], [-586.5, -1378], [-568.5, -1373], [-565.5, -1374], [-554.5, -1373], [-552.5, -1374], [-550.5, -1377.5], [-551, -1383.5], [-556, -1387], [-556, -1389], [-548.5, -1387], [-545, -1389.5], [-546, -1393], [-550, -1395.5], [-550, -1399.5], [-542.5, -1402], [-541, -1403.5], [-540, -1408.5]];
export const BED = [-531.4, -1384.9], BED_R = 6.2;
export const SZANISZLO = [-495.5, -1344.5];
const LAWN = { c: [-540.5, -1356.5], rx: 13, rz: 12.5 };
const COL = { bronze: '#33403a', bronzeHi: '#4a5a4e', granite: '#8d9093', lime: '#d8d2c0', cast: '#26282b', hedge: '#2c5226', wood: '#7a5a3a', gold: '#d9aa33', stone: '#b9ad98', water: '#476a74' };

// Sutherland-Hodgman against an axis-aligned cell
function clipRect(poly, x0, x1, z0, z1) {
  let out = poly;
  for (const [ax, sg, c] of [[0, 1, x0], [0, -1, x1], [1, 1, z0], [1, -1, z1]]) {
    const inp = out; out = [];
    inp.forEach((a, i) => {
      const b = inp[(i + 1) % inp.length], da = sg * (a[ax] - c), db = sg * (b[ax] - c);
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    });
    if (!out.length) break;
  }
  return out;
}

export function buildPark({ B, S, heightAt, r }) {
  const gy = (x, z) => heightAt(x, z);
  const D = B.det;
  // ---- a polygon draped on the ground in cells, `lift` over the terrain; uv in metres / rep
  function drape(M, poly, lift, cell = 8, rep = 4) {
    const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
    for (let x0 = Math.floor(Math.min(...xs) / cell) * cell; x0 < Math.max(...xs); x0 += cell) for (let z0 = Math.floor(Math.min(...zs) / cell) * cell; z0 < Math.max(...zs); z0 += cell) {
      const c = clipRect(poly, x0, x0 + cell, z0, z0 + cell);
      if (c.length < 3) continue;
      const first = M.v; M.fill(c, [], 0, true);
      for (let v = first; v < M.v; v++) { const o = v * 11, a = M.buf.a; a[o + 1] = gy(a[o], a[o + 2]) + lift; a[o + 6] = a[o] / rep; a[o + 7] = a[o + 2] / rep; }
    }
  }
  // a strip along a polyline (width w) as quads draped on the ground
  function strip(M, pts, w, lift, rep = 3) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 4)), nx = -(bz - az) / L * w / 2, nz = (bx - ax) / L * w / 2;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
        const P = [[x0 - nx, z0 - nz], [x1 - nx, z1 - nz], [x1 + nx, z1 + nz], [x0 + nx, z0 + nz]];
        const first = M.v; M.fill(P, [], 0, true);
        for (let v = first; v < M.v; v++) { const o = v * 11, a = M.buf.a; a[o + 1] = gy(a[o], a[o + 2]) + lift; a[o + 6] = a[o] / rep; a[o + 7] = a[o + 2] / rep; }
      }
    }
  }
  const disc = (cx, cz, rad, n = 28) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * PI * 2) * rad, cz + Math.sin((i / n) * PI * 2) * rad]);
  const ellipse = (cx, cz, rx, rz, n = 32, rot = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * PI * 2, x = Math.cos(a) * rx, z = Math.sin(a) * rz; return [cx + x * Math.cos(rot) - z * Math.sin(rot), cz + x * Math.sin(rot) + z * Math.cos(rot)]; });
  const withAt = (M, x, y, z, yaw, fn) => M.with(M4(x, y, z, yaw), fn);

  // ---------------------------------------------------------------- the plaza
  B.cobble.setColor('#ffffff');
  drape(B.cobble, PLAZA, 0.14, 8, 4);
  drape(B.cobble, BAS.ring([[73.0, 3.0], [80.5, 3.0], [80.5, 37.8], [73.0, 37.8]]), 0.15, 8, 4);
  // granite kerb along the lawn islands is below; the apron's step line at the Basilica
  D.setColor(COL.granite);
  const bf = BAS.ring([[73.4, 2.4], [76.2, 2.4], [76.2, 38.4], [73.4, 38.4]]);
  void bf;

  // ---------------------------------------------------------------- the round bed and the monument of King St Ladislaus
  {
    const [bx, bz] = BED, y0 = gy(bx, bz);
    B.bed.setColor('#ffffff'); drape(B.bed, disc(bx, bz, BED_R - 0.9, 28), 0.2, 6, 2.5);
    // the hedge ring: a clipped box hedge (rounded top) round the bed
    D.setColor(COL.hedge);
    D.lathe([[BED_R - 0.9, y0], [BED_R - 0.9, y0 + 0.5], [BED_R - 0.55, y0 + 0.78], [BED_R - 0.1, y0 + 0.72], [BED_R, y0 + 0.4], [BED_R, y0]], 36, bx, bz);
    // the monument: a granite platform, the stepped pedestal, the bronze king, two lions. It faces away from the church (+u).
    const yaw = BAS.yaw, yb = y0 + 0.2;
    withAt(D, bx, yb, bz, yaw, (q) => {
      q.setColor(COL.granite); q.box(-2.7, 0, -2.7, 2.7, 0.35, 2.7, 63 & ~32); q.box(-2.35, 0.35, -2.35, 2.35, 0.6, 2.35, 63 & ~32);
      q.setColor(COL.lime);
      q.box(-1.2, 0.6, -1.2, 1.2, 1.35, 1.2); q.box(-1.0, 1.35, -1.0, 1.0, 1.55, 1.0);                     // base and its cornice
      q.box(-0.72, 1.55, -0.72, 0.72, 4.3, 0.72);                                                          // the shaft
      q.box(-0.98, 4.3, -0.98, 0.98, 4.6, 0.98); q.box(-0.82, 4.6, -0.82, 0.82, 4.75, 0.82);               // the cap
      q.setColor('#4d5156'); q.box(0.71, 2.2, -0.45, 0.76, 3.5, 0.45);                                      // the inscription plate (+u side)
      q.setColor('#e9e4d4'); q.box(0.76, 2.4, -0.32, 0.77, 3.3, 0.32);
      // the bronze king, standing, a cloak and a crown, an axe in the right hand
      q.setColor(COL.bronze);
      for (const s of [-0.17, 0.17]) q.cyl(0, 4.75, s, 0.15, 0.12, 1.05, 6);                                 // the legs
      q.cyl(0, 5.75, 0, 0.4, 0.27, 1.3, 8); q.cyl(0, 5.75, 0, 0.44, 0.4, 0.14, 8);                           // the coat and its hem
      q.setColor(COL.bronzeHi); q.cyl(-0.12, 5.9, 0, 0.5, 0.2, 1.6, 8, false);                                // the cloak behind
      q.setColor(COL.bronze); q.ellipsoid([0, 7.1, 0], [0.34, 0.15, 0.3], 8, 4); q.ellipsoid([0, 7.42, 0], [0.15, 0.17, 0.15], 6, 5);
      q.setColor(COL.bronzeHi); q.cyl(0, 7.5, 0, 0.17, 0.18, 0.14, 6);                                        // the crown
      q.setColor(COL.bronze); q.tube([0.0, 7.0, 0.3], [0.2, 6.0, 0.5], 0.07, 4); q.tube([0.2, 5.7, 0.5], [0.15, 8.1, 0.56], 0.04, 4); // the arm and the axe haft
      q.box(0.1, 7.9, 0.46, 0.18, 8.2, 0.9, 63);                                                              // the axe blade
      q.tube([0.0, 7.0, -0.3], [0.1, 6.2, -0.4], 0.07, 4);
      q.box(0.24, 6.0, -0.62, 0.3, 6.9, -0.18, 63);                                                           // the shield on the left arm
      // two lions sitting at the front corners of the platform (+u side)
      for (const sz of [-1, 1]) {
        q.setColor(COL.bronze);
        q.ellipsoid([2.0, 1.25, sz * 1.75], [0.55, 0.42, 0.4], 8, 5);                                        // body
        q.ellipsoid([2.45, 1.55, sz * 1.75], [0.3, 0.3, 0.28], 8, 5);                                        // head
        q.setColor(COL.bronzeHi); q.ellipsoid([2.38, 1.5, sz * 1.75], [0.36, 0.36, 0.34], 8, 5);               // mane
        q.setColor(COL.bronze); q.box(1.85, 0.6, sz * 1.75 - 0.35, 2.4, 1.05, sz * 1.75 + 0.35); q.box(2.15, 0.6, sz * 1.75 - 0.3, 2.5, 1.05, sz * 1.75 + 0.3);
        q.setColor(COL.granite); q.box(1.7, 0.6, sz * 1.75 - 0.6, 2.8, 0.8, sz * 1.75 + 0.6);
      }
    });
    S.cyl(bx, bz, y0, y0 + 5.2, 1.9, 1.5, 'wall');
    S.cyl(bx, bz, y0, y0 + 0.9, BED_R, BED_R, 'wall');
  }

  // ---------------------------------------------------------------- Bishop Szaniszló's monument by the east edge: a bronze standing figure on a tall granite plinth, a low iron fence round it
  {
    const [mx, mz] = SZANISZLO, y0 = gy(mx, mz) + 0.15;
    const toward = Math.atan2(BED[1] - mz, BED[0] - mx);
    withAt(D, mx, y0, mz, -toward + PI, (q) => {
      q.setColor(COL.granite); q.box(-1.4, 0, -1.4, 1.4, 0.25, 1.4);
      q.setColor('#a39d92'); q.box(-0.95, 0.25, -0.95, 0.95, 1.0, 0.95); q.box(-0.7, 1.0, -0.7, 0.7, 3.4, 0.7); q.box(-0.88, 3.4, -0.88, 0.88, 3.65, 0.88);
      q.setColor(COL.bronze); q.cyl(0, 3.65, 0, 0.5, 0.3, 1.6, 10); q.cyl(0, 3.65, 0, 0.56, 0.5, 0.35, 10);
      q.ellipsoid([0, 5.38, 0], [0.34, 0.18, 0.4], 10, 5); q.ellipsoid([0, 5.65, 0], [0.15, 0.18, 0.15], 8, 6);
      q.setColor(COL.bronzeHi); q.cyl(0, 5.8, 0, 0.16, 0.06, 0.38, 8);                                        // the mitre
      q.setColor(COL.bronze); q.tube([0, 5.3, 0.34], [0.35, 4.6, 0.46], 0.07, 5); q.tube([0, 5.3, -0.34], [0.1, 4.55, -0.3], 0.07, 5);
    });
    B.rail.with(M4(mx, y0, mz, -toward + PI), (q) => {
      q.setColor('#26282b');
      for (const [x0, z0, x1, z1] of [[-1.7, -1.7, 1.7, -1.7], [1.7, -1.7, 1.7, 1.7], [1.7, 1.7, -1.7, 1.7], [-1.7, 1.7, -1.7, -1.7]]) {
        const L = Math.hypot(x1 - x0, z1 - z0), nx = (z1 - z0) / L, nz = -(x1 - x0) / L;
        q.quad(q.vert(x0, 0.1, z0, nx, 0, nz, 0, 0), q.vert(x1, 0.1, z1, nx, 0, nz, L / 0.14, 0), q.vert(x1, 0.7, z1, nx, 0, nz, L / 0.14, 1), q.vert(x0, 0.7, z0, nx, 0, nz, 0, 1));
      }
    });
    S.cyl(mx, mz, y0, y0 + 3.7, 1.0, 0.9, 'wall');
  }

  // ---------------------------------------------------------------- the lawn island with its spruces, kerbed in granite
  {
    const { c: [cx, cz], rx, rz } = LAWN, rot = 0.35;
    B.lawn.setColor('#ffffff'); drape(B.lawn, ellipse(cx, cz, rx, rz, 36, rot), 0.17, 8, 4);
    D.setColor('#a3a39f');
    const E = ellipse(cx, cz, rx + 0.1, rz + 0.1, 48, rot);
    for (let i = 0; i < E.length; i++) {
      const a = E[i], b = E[(i + 1) % E.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l;
      const ya = gy(a[0], a[1]) + 0.3, yb = gy(b[0], b[1]) + 0.3, ox = nx * 0.16, oz = nz * 0.16;
      quad(D, [a[0] + ox, ya, a[1] + oz], [b[0] + ox, yb, b[1] + oz], [b[0] - ox, yb, b[1] - oz], [a[0] - ox, ya, a[1] - oz], [0, 1, 0]);
      quad(D, [a[0] + ox, ya, a[1] + oz], [b[0] + ox, yb, b[1] + oz], [b[0] + ox, yb - 0.45, b[1] + oz], [a[0] + ox, ya - 0.45, a[1] + oz], [nx, 0, nz]);
    }
  }

  // ---------------------------------------------------------------- lamps and benches along the plaza edge
  let nLamps = 0, nBenches = 0;
  const lamp = (x, z) => {
    const y = gy(x, z) + 0.15;
    D.with(M4(x, y, z, 0), (q) => {
      q.setColor(COL.cast); q.cyl(0, 0, 0, 0.2, 0.12, 0.5, 6); q.cyl(0, 0.5, 0, 0.09, 0.065, 3.4, 6); q.cyl(0, 3.9, 0, 0.1, 0.22, 0.16, 6, false); q.cyl(0, 4.4, 0, 0.27, 0.04, 0.2, 6);
    });
    B.glow.with(M4(x, y, z, 0), (q) => { q.setColor('#fff2c8'); q.cyl(0, 4.0, 0, 0.22, 0.28, 0.4, 6, false); });
    S.cyl(x, z, y, y + 1.5, 0.14, 0.1, 'pole');
    nLamps++;
  };
  const bench = (x, z, yaw) => {
    const y = gy(x, z) + 0.15;
    D.with(M4(x, y, z, yaw), (q) => {
      q.setColor(COL.cast); for (const s of [-0.75, 0.75]) q.box(s - 0.04, 0, -0.26, s + 0.04, 0.85, 0.26, 4 | 8 | 1 | 2);
      q.setColor(COL.wood); q.box(-0.88, 0.42, -0.27, 0.88, 0.48, 0.1, 63 & ~32); q.box(-0.88, 0.55, 0.2, 0.88, 0.8, 0.25, 63 & ~32);
    });
    nBenches++;
  };
  {
    const n = PLAZA.length;
    let acc = 0, accB = 0;
    for (let i = 0; i < n; i++) {
      const a = PLAZA[i], b = PLAZA[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 0.01) continue;
      let nx = dz / L, nz = -dx / L;                   // inward: the side of the edge that lies inside the plaza
      { const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (!inPoly(PLAZA, mx + nx * 0.7, mz + nz * 0.7)) { nx = -nx; nz = -nz; } }
      for (let s = 0; s < L; s += 1) {
        acc += 1; accB += 1;
        const x = a[0] + dx * s / L + nx * 1.6, z = a[1] + dz * s / L + nz * 1.6;
        const near = (px, pz, d) => Math.hypot(x - px, z - pz) < d;
        const bad = !inPoly(PLAZA, x, z) || near(BED[0], BED[1], 9) || BAS_front(x, z) || PAL_front(x, z);
        if (acc >= 26 && !bad) { lamp(x, z); acc = 0; }
        else if (accB >= 41 && !bad) { bench(x + nx * 0.4, z + nz * 0.4, Math.atan2(-nx, -nz)); accB = 0; }
      }
    }
    // four benches round the bed, facing the monument, and two lamps by the church's steps
    for (let k = 0; k < 4; k++) { const a = (k / 4) * PI * 2 + 0.78, x = BED[0] + Math.cos(a) * (BED_R + 1.3), z = BED[1] + Math.sin(a) * (BED_R + 1.3); bench(x, z, Math.atan2(Math.cos(a), Math.sin(a))); }
    for (const v of [11.0, 29.8]) { const [x, z] = BAS.xz(78.5, v); lamp(x, z); }
  }
  function BAS_front(x, z) { const [u, v] = BAS.loc(x, z); return u < 82 && v > -2 && v < 44; }
  function PAL_front(x, z) { const [a, d] = PAL.loc(x, z); return a > -4 && a < 110 && d < 4 && d > -9; }

  // ---------------------------------------------------------------- the Palace's courtyard garden (PAL frame: a along the front, d into the courtyard)
  const CG = { a0: 17.4, a1: 87.1, d0: 22.6, d1: 63.3, ca: 52.25, cd: 43.0 };
  const cw = (a, d) => PAL.xz(a, d);
  {
    const lawn = [cw(CG.a0, CG.d0), cw(CG.a1, CG.d0), cw(CG.a1, CG.d1), cw(CG.a0, CG.d1)];
    B.lawn.setColor('#ffffff'); drape(B.lawn, lawn, 0.12, 8, 4);
    // the gravel: a loop round the garden, a ring and eight spokes at the centre, four links
    B.gravel.setColor('#ffffff');
    const loop = [cw(20.4, 25.6), cw(84.1, 25.6), cw(84.1, 60.4), cw(20.4, 60.4), cw(20.4, 25.6)];
    strip(B.gravel, loop, 2.1, 0.16, 3);
    const ring = Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * PI * 2; return cw(CG.ca + Math.cos(t) * 12.8, CG.cd + Math.sin(t) * 12.8); });
    strip(B.gravel, ring, 1.7, 0.17, 3);
    for (let k = 0; k < 8; k++) { const t = (k / 8) * PI * 2 + PI / 8; strip(B.gravel, [cw(CG.ca + Math.cos(t) * 3.4, CG.cd + Math.sin(t) * 3.4), cw(CG.ca + Math.cos(t) * 12.8, CG.cd + Math.sin(t) * 12.8)], 1.4, 0.17, 3); }
    for (const [x0, d0, x1, d1] of [[CG.ca, 25.6, CG.ca, CG.cd - 12.8], [CG.ca, CG.cd + 12.8, CG.ca, 60.4], [20.4, CG.cd, CG.ca - 12.8, CG.cd], [CG.ca + 12.8, CG.cd, 84.1, CG.cd]]) strip(B.gravel, [cw(x0, d0), cw(x1, d1)], 1.7, 0.16, 3);
    // the flower wedges between the spokes
    B.bed.setColor('#ffffff');
    for (let k = 0; k < 8; k++) {
      const t0 = (k / 8) * PI * 2 + PI / 8 + 0.12, t1 = ((k + 1) / 8) * PI * 2 + PI / 8 - 0.12, pts = [];
      for (let i = 0; i <= 5; i++) { const t = t0 + (t1 - t0) * i / 5; pts.push(cw(CG.ca + Math.cos(t) * 11.7, CG.cd + Math.sin(t) * 11.7)); }
      for (let i = 5; i >= 0; i--) { const t = t0 + (t1 - t0) * i / 5; pts.push(cw(CG.ca + Math.cos(t) * 4.6, CG.cd + Math.sin(t) * 4.6)); }
      drape(B.bed, pts, 0.2, 6, 2.5);
    }
    // the central basin: a stone rim, dark water, a pillar with a gilt ball
    const [fx, fz] = cw(CG.ca, CG.cd), fy = gy(fx, fz);
    D.setColor(COL.stone); D.lathe([[3.3, fy], [3.3, fy + 0.55], [2.95, fy + 0.6], [2.95, fy + 0.5], [2.75, fy + 0.5]], 28, fx, fz);
    D.setColor(COL.water); D.cyl(fx, fy + 0.3, fz, 2.95, 2.95, 0.02, 28);
    D.setColor(COL.stone); D.cyl(fx, fy, fz, 0.5, 0.35, 1.9, 10); D.cyl(fx, fy + 1.9, fz, 0.7, 0.2, 0.2, 10);
    D.setColor(COL.gold); D.ellipsoid([fx, fy + 2.3, fz], [0.28, 0.28, 0.28], 8, 6);
    S.cyl(fx, fz, fy, fy + 0.6, 3.3, 3.3, 'wall');
    // the iron fence along the open side (d = 64.3): bars between stone piers with ball finials, a gate in the middle
    const f0 = 16.4, f1 = 88.1, dF = 64.4, N = 12, dz = (f1 - f0) / N;
    for (let i = 0; i <= N; i++) {
      const [px, pz] = cw(f0 + i * dz, dF), py = gy(px, pz);
      D.with(M4(px, py, pz, PAL.yaw), (q) => {
        q.setColor(COL.stone); q.box(-0.4, 0, -0.4, 0.4, 0.3, 0.4, 63 & ~32); q.box(-0.3, 0.3, -0.3, 0.3, 2.0, 0.3, 4 | 8 | 1 | 2); q.box(-0.38, 2.0, -0.38, 0.38, 2.12, 0.38, 63 & ~32); q.ellipsoid([0, 2.4, 0], [0.24, 0.24, 0.24], 6, 4);
      });
    }
    for (let i = 0; i < N; i++) {
      if (i === N / 2 - 1 || i === N / 2) continue;
      const a = cw(f0 + i * dz + 0.35, dF), b = cw(f0 + (i + 1) * dz - 0.35, dF), L = Math.hypot(b[0] - a[0], b[1] - a[1]), y0 = (gy(a[0], a[1]) + gy(b[0], b[1])) / 2;
      const nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
      B.rail.setColor('#26282b');
      B.rail.quad(B.rail.vert(a[0], y0 + 0.1, a[1], nx, 0, nz, 0, 0), B.rail.vert(b[0], y0 + 0.1, b[1], nx, 0, nz, L / 0.16, 0), B.rail.vert(b[0], y0 + 1.7, b[1], nx, 0, nz, L / 0.16, 1), B.rail.vert(a[0], y0 + 1.7, a[1], nx, 0, nz, 0, 1));
      D.setColor(COL.cast); D.tube([a[0], y0 + 0.25, a[1]], [b[0], y0 + 0.25, b[1]], 0.03, 4); D.tube([a[0], y0 + 1.65, a[1]], [b[0], y0 + 1.65, b[1]], 0.03, 4);
    }
    S.prism(PAL.ring([[f0 - 0.2, dF - 0.1], [f0 + (N / 2 - 1) * dz, dF - 0.1], [f0 + (N / 2 - 1) * dz, dF + 0.1], [f0 - 0.2, dF + 0.1]]).flat(), gy(...cw(f0, dF)), gy(...cw(f0, dF)) + 1.7, 0, 0, 'wall');
    S.prism(PAL.ring([[f0 + (N / 2 + 1) * dz, dF - 0.1], [f1 + 0.2, dF - 0.1], [f1 + 0.2, dF + 0.1], [f0 + (N / 2 + 1) * dz, dF + 0.1]]).flat(), gy(...cw(f1, dF)), gy(...cw(f1, dF)) + 1.7, 0, 0, 'wall');
  }

  // ---------------------------------------------------------------- trees of the formal places (the generated ones stay elsewhere)
  const spots = [];
  const blue = [PARK_PINE[0].map(([a, b, c]) => [a * 0.8, b * 0.95, c * 1.25])];
  for (const [dx, dz, sc, pal] of [[-2.5, -9.5, 1.5, PARK_PINE], [4.5, -4.5, 1.0, PARK_PINE], [-5, 3, 0.85, blue], [3.5, 5.5, 0.7, PARK_PINE]]) { const x = LAWN.c[0] + dx, z = LAWN.c[1] + dz; spots.push({ x, z, y: gy(x, z) + 0.17, kind: 'conifer', variant: 'spruce', sc, pal }); }
  for (const [a, d, sc] of [[24, 31, 1.0], [80, 31, 1.1], [24, 56, 0.95], [80, 56, 1.05], [52, 30, 0.8], [52, 57, 0.85]]) { const [x, z] = cw(a, d); spots.push({ x, z, y: gy(x, z) + 0.12, kind: r() < 0.3 ? 'elm' : 'park', sc, pal: PARK_GREENS }); }

  const plazaGrown = PLAZA;
  const clear = (x, z) => {
    if (inPoly(plazaGrown, x, z)) return true;
    const [bx, bz] = BED; if (Math.hypot(x - bx, z - bz) < BED_R + 1.5) return true;
    const dx = (x - LAWN.c[0]), dz = (z - LAWN.c[1]); if (Math.hypot(dx / (LAWN.rx + 1), dz / (LAWN.rz + 1)) < 1) return true;
    const [a, d] = PAL.loc(x, z); if (a > CG.a0 - 1 && a < CG.a1 + 1 && d > CG.d0 - 1 && d < 66) return true;
    const [u, v] = BAS.loc(x, z); if (u > 70 && u < 84 && v > 0 && v < 41) return true;
    return false;
  };
  return { clear, spots, lamps: nLamps, benches: nBenches };
}
