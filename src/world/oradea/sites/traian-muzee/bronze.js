// OWNER: oradea. The bronzes round Parcul Traian (not a site module), low-poly but with the pose, the plinth and the plate:
//   ady     the Ady Endre statue (OSM node 4827014957): a standing figure in a long overcoat, one hand in the pocket, a hat in the other,
//           on a stepped granite plinth, turned to face the museum 30 m west of it            (a guess: pose, plinth, height)
//   holnap  «A Holnap irodalmi társaság alapítói» (node 4827012515, quest card 'holnap'): four seated poets (Ady, Juhász Gyula, Dutka
//           Ákos, Emőd Tamás) at a round café table, a fifth empty chair turned to the street, on a low stone disc  (a guess: the faces,
//           the seating order, the table)
//   viteazul the Mihai Viteazul equestrian statue (unnamed OSM node 13700585162 in Piața Emanuil Gojdu; ./equestrian.js)
//   czaran  the Czárán Gyula bust (node 4827012513, quest card 'czaran'; 2008): a bearded head and shoulders on a granite pedestal
//           (a guess: the pedestal's size)
//   buildBronzes({ g, S, roads, museum }) -> { stone: MB, bronze: SG, spots: [{ x, z, r }], verts, sizes: { ady, holnap, czaran, viteazul } (bronze vertices each) } ;
//   `stone` is an MB (vertex colours) and `bronze` an SG; the caller wraps them in meshes. g(x, z) the terrain height, S the collision
//   world (monument colliders on the plinths), roads the map.json roads (a bronze turns to the nearest street), museum [x, z].
import { MB, M4 } from '../../../../kit/mesh.js';
import { SG } from '../../../cherkasy/sculpt.js';
import { sweep, ell, put, mapper } from '../../../cherkasy/bohdan.js';
import { addEquestrian } from './equestrian.js';

const PI = Math.PI;
export const BRONZE_POINTS = { ady: [291.7, -490.5], holnap: [80.5, -329.9], czaran: [318.5, -263.7], viteazul: [787.1, -102.8] };

// a rectangular slab of the SG skin (x0..x1, z0..z1, y0..y1)
function slab(s, x0, y0, z0, x1, y1, z1) {
  const r = (y) => [[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]];
  return s.loft([r(y0), r(y1)], { cap0: true, cap1: true });
}

// ---- a standing man in a long overcoat, 1.85 m, facing +z: right hand in the pocket, a hat in the left hand
function standingMan(s) {
  sweep(s, [[0, 0.3, 0.01], [0, 0.72, 0], [0, 1.15, -0.01], [0, 1.42, 0]], [[0.2, 0.15], [0.19, 0.14], [0.2, 0.14], [0.2, 0.12]], 16);
  for (const sx of [-1, 1]) { sweep(s, [[0.09 * sx, 0.06, 0.02], [0.09 * sx, 0.36, 0.01]], [0.065, 0.075], 10); ell(s, [0.09 * sx, 0.04, 0.09], [0.07, 0.04, 0.14], [0, 0, 0], 10, 6); }
  ell(s, [0, 1.5, 0], [0.23, 0.08, 0.13], [0, 0, 0], 16, 8);                       // the shoulders
  sweep(s, [[0, 1.52, 0.01], [0, 1.64, 0.02]], [0.058, 0.055], 12);                  // the neck
  ell(s, [0, 1.74, 0.025], [0.085, 0.105, 0.1], [0, 0, 0], 16, 11);                  // the head
  ell(s, [0, 1.805, 0], [0.09, 0.05, 0.1], [0.12, 0, 0], 14, 7);                    // the hair, swept back
  ell(s, [0, 1.72, 0.12], [0.015, 0.025, 0.02], [0, 0, 0], 8, 5);                  // the nose
  sweep(s, [[-0.23, 1.47, 0], [-0.27, 1.2, 0.03], [-0.24, 0.9, 0.08]], [0.055, 0.05, 0.045], 10); // the left arm down
  ell(s, [-0.24, 0.84, 0.1], [0.04, 0.06, 0.035], [0, 0, 0], 9, 6);
  ell(s, [-0.24, 0.8, 0.14], [0.11, 0.015, 0.11], [0.1, 0, 0], 14, 4);                // the hat held at the thigh
  sweep(s, [[0.23, 1.47, 0], [0.27, 1.2, 0.03], [0.17, 1.02, 0.14]], [0.055, 0.05, 0.045], 10);   // the right arm, hand in the pocket
  sweep(s, [[-0.1, 1.5, 0.1], [0, 1.2, 0.17], [0.1, 1.5, 0.1]], [0.012, 0.012, 0.012], 4, { caps: false }); // the lapels
}

// ---- a seated man at a table, seat surface at y 0, facing +z, hands on the table edge
function seatedMan(s, k) {
  sweep(s, [[0, 0.02, -0.06], [0, 0.3, -0.07], [0, 0.55, -0.05]], [[0.17, 0.11], [0.18, 0.115], [0.2, 0.11]], 9);
  ell(s, [0, 0.6, -0.05], [0.21, 0.07, 0.11], [0, 0, 0], 9, 5);
  sweep(s, [[0, 0.62, -0.03], [0, 0.72, -0.01]], [0.055, 0.05], 7);
  ell(s, [0, 0.82, 0.0], [0.083, 0.103, 0.095], [0.08, 0, 0], 9, 6);
  ell(s, [0, 0.89, -0.02], [0.088, 0.045, 0.095], [0.1, 0, 0], 8, 4);
  if (k % 2) ell(s, [0, 0.76, 0.085], [0.03, 0.045, 0.03], [0, 0, 0], 6, 3);       // a beard on some
  for (const sx of [-1, 1]) {
    sweep(s, [[0.09 * sx, 0.08, 0.0], [0.09 * sx, 0.1, 0.4]], [0.075, 0.07], 7);                  // thighs
    sweep(s, [[0.09 * sx, 0.1, 0.4], [0.09 * sx, -0.4, 0.44]], [0.06, 0.05], 7);                  // shins
    ell(s, [0.09 * sx, -0.44, 0.5], [0.05, 0.04, 0.11], [0, 0, 0], 7, 4);
    sweep(s, [[0.21 * sx, 0.54, -0.05], [0.25 * sx, 0.3, 0.16], [0.17 * sx, 0.27, 0.42]], [0.05, 0.045, 0.04], 7);
    ell(s, [0.17 * sx, 0.26, 0.47], [0.035, 0.025, 0.05], [0, 0, 0], 6, 3);
  }
}

function chair(s) { // seat at y 0.43, facing +z
  slab(s, -0.21, 0.42, -0.2, 0.21, 0.46, 0.2);
  slab(s, -0.21, 0.46, -0.22, 0.21, 0.93, -0.18);
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) sweep(s, [[x, 0, z], [x, 0.42, z]], [0.018, 0.018], 5, { caps: false });
}

function holnapGroup(s, emptyAngle) { // origin: the table's centre on the ground; the empty chair at emptyAngle (radians from +z, turning to +x)
  s.lathe(0, 0, [[0.58, 0.73], [0.58, 0.77]], 14, { cap0: true, cap1: true });
  sweep(s, [[0, 0.1, 0], [0, 0.73, 0]], [0.06, 0.05], 7);
  s.lathe(0, 0, [[0.3, 0.0], [0.3, 0.05]], 12, { cap0: true, cap1: true });
  const R = 1.0;
  for (let k = 0; k < 5; k++) {
    const a = emptyAngle + (k * 2 * PI) / 5, x = Math.sin(a) * R, z = Math.cos(a) * R, yaw = a + PI; // faces the table
    const T = mapper(M4(x, 0, z, yaw)), c = new SG();
    chair(c); put(s, c, T);
    if (k) { const m = new SG(); seatedMan(m, k); put(s, m, mapper(M4(x - Math.sin(yaw) * 0.0, 0.46, z, yaw))); }
  }
  // a few cups and a book on the table
  for (const a of [0.5, 2.0, 3.4, 4.9]) ell(s, [Math.sin(a) * 0.32, 0.79, Math.cos(a) * 0.32], [0.045, 0.04, 0.045], [0, 0, 0], 6, 3);
}

function bustFigure(s) { // bearded head and shoulders, 0.7 m, facing +z
  s.loft([[[-0.24, 0, -0.12], [-0.24, 0, 0.1], [0.24, 0, 0.1], [0.24, 0, -0.12]], [[-0.26, 0.12, -0.13], [-0.26, 0.12, 0.12], [0.26, 0.12, 0.12], [0.26, 0.12, -0.13]],
    [[-0.17, 0.28, -0.1], [-0.17, 0.28, 0.09], [0.17, 0.28, 0.09], [0.17, 0.28, -0.1]]], { cap0: true });
  sweep(s, [[0, 0.26, 0], [0, 0.4, 0.01]], [0.07, 0.065], 12);
  ell(s, [0, 0.5, 0.02], [0.1, 0.125, 0.115], [0, 0, 0], 18, 13);
  ell(s, [0, 0.435, 0.085], [0.075, 0.085, 0.05], [0.25, 0, 0], 14, 9);               // the full beard
  ell(s, [0, 0.49, 0.125], [0.07, 0.022, 0.03], [0, 0, 0], 12, 5);                    // the moustache
  ell(s, [0, 0.53, 0.13], [0.018, 0.035, 0.025], [0, 0, 0], 8, 5);                   // the nose
  ell(s, [0, 0.58, 0.0], [0.105, 0.05, 0.115], [0.1, 0, 0], 16, 7);                   // the hair
}

// the nearest street direction (unit) from (x, z), or the fallback
function toStreet(roads, x, z, fallback) {
  let best = Infinity, dir = fallback;
  for (const r of roads ?? []) {
    const p = r.p;
    for (let i = 0; i + 3 < p.length; i += 2) {
      const ax = p[i], az = p[i + 1], bx = p[i + 2], bz = p[i + 3], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      const qx = ax + t * dx, qz = az + t * dz, d = Math.hypot(qx - x, qz - z);
      if (d < best && d > 0.5) { best = d; dir = [(qx - x) / d, (qz - z) / d]; }
    }
  }
  return dir;
}
const yawTo = (d) => Math.atan2(d[0], d[1]);

export function buildBronzes({ g, S, roads, museum = [262, -489] }) {
  const stone = new MB(), bronze = new SG(), spots = [], sizes = {};
  const gy = (x, z, r = 1.2) => { let lo = Infinity, hi = -Infinity; for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) { const h = g(x + dx, z + dz); if (Number.isFinite(h)) { lo = Math.min(lo, h); hi = Math.max(hi, h); } } return Number.isFinite(lo) ? [lo, hi] : [2, 2]; };

  // ---- Ady: a stepped granite plinth, the figure facing the museum
  { const [x, z] = BRONZE_POINTS.ady, [lo, hi] = gy(x, z, 1.3), y0 = hi + 0.12, yaw = yawTo([museum[0] - x, museum[1] - z]);
    stone.with(M4(x, y0, z, yaw), (q) => {
      q.setColor('#8e8a82').box(-1.15, lo - y0 - 0.4, -1.15, 1.15, 0.16, 1.15);
      q.setColor('#a29d93').box(-0.9, 0.16, -0.9, 0.9, 0.34, 0.9);
      q.setColor('#b3aea3').box(-0.7, 0.34, -0.7, 0.7, 1.2, 0.7);
      q.setColor('#c4bfb3').box(-0.8, 1.2, -0.8, 0.8, 1.32, 0.8);
      q.setColor('#2a2622').box(-0.4, 0.65, 0.7, 0.4, 0.95, 0.715);               // the inscription plate
    });
    S.obox(x, z, 1.2, 1.2, -yaw, lo - 0.5, y0 + 1.32, 'monument');
    const f = new SG(); standingMan(f); put(bronze, f, mapper(M4(x, y0 + 1.32, z, yaw, 1.0)));
    spots.push({ x, z, r: 3.2 }); sizes.ady = bronze.v;
  }
  // ---- Holnap: a stone disc, the table and five chairs; the empty chair faces the street
  { const [x, z] = BRONZE_POINTS.holnap, [lo, hi] = gy(x, z, 2.2), y0 = hi + 0.08, d = toStreet(roads, x, z, [0, 1]), ea = Math.atan2(d[0], d[1]);
    stone.with(M4(x, y0, z, 0), (q) => { q.setColor('#8a857b').cyl(0, lo - y0 - 0.3, 0, 2.2, 2.2, 0.3 + (y0 - lo) + 0.1, 16, true).setColor('#999488').cyl(0, 0.1, 0, 1.95, 1.95, 0.04, 16, true); });
    S.cyl(x, z, lo - 0.5, y0 + 0.14, 2.2, 2.2, 'monument');
    const f = new SG(); holnapGroup(f, ea); put(bronze, f, mapper(M4(x, y0 + 0.14, z, 0, 1.0)));
    spots.push({ x, z, r: 3.4 }); sizes.holnap = bronze.v - sizes.ady;
  }
  // ---- Czárán: the bust on a granite pedestal facing the street
  { const [x, z] = BRONZE_POINTS.czaran, [lo, hi] = gy(x, z, 0.9), y0 = hi + 0.1, d = toStreet(roads, x, z, [0, 1]), yaw = yawTo(d);
    stone.with(M4(x, y0, z, yaw), (q) => {
      q.setColor('#8c8880').box(-0.72, lo - y0 - 0.4, -0.72, 0.72, 0.14, 0.72);
      q.setColor('#a8a398').box(-0.5, 0.14, -0.5, 0.5, 1.25, 0.5);
      q.setColor('#bab5aa').box(-0.58, 1.25, -0.58, 0.58, 1.36, 0.58);
      q.setColor('#2a2622').box(-0.3, 0.55, 0.5, 0.3, 0.85, 0.515);
    });
    S.obox(x, z, 0.75, 0.75, -yaw, lo - 0.5, y0 + 1.36, 'monument');
    const f = new SG(); bustFigure(f); put(bronze, f, mapper(M4(x, y0 + 1.36, z, yaw, 1.0)));
    spots.push({ x, z, r: 2.4 }); sizes.czaran = bronze.v - sizes.ady - sizes.holnap;
  }
  // ---- Mihai Viteazul on horseback in Piața Gojdu, facing the nearest street
  { const [x, z] = BRONZE_POINTS.viteazul, d = toStreet(roads, x, z, [1, 0]);
    const v0 = bronze.v; spots.push(addEquestrian({ stone, bronze, S, g, point: [x, z], face: [-d[1], d[0]] })); sizes.viteazul = bronze.v - v0; } // the horse looks along the street (turned a quarter from the way to it)
  return { stone, bronze, spots, verts: bronze.v, sizes };
}
