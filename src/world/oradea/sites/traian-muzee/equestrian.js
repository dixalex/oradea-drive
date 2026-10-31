// OWNER: oradea. The Mihai Viteazul equestrian statue (Piața Emanuil Gojdu; the unnamed OSM statue node 13700585162, 68 m from the Gojdu
// underpass's centre, identified by that position; not a site module): a bronze prince in a fur cap and a cloak on a walking horse, the right
// arm raised with the mace (buzdugan), on a granite die over two steps. A guess: the pose, the proportions and the plinth (no photograph was
// at hand); the horse is Ferdinand's walking horse of ../unirii/statue.js drawn again (that module keeps its own private).
//   addEquestrian({ stone, bronze, S, g, point, face }) -> { x, z, r }   adds the plinth to the MB `stone`, the figure to the SG `bronze`, a
//   collider to S; face: unit [dx, dz] the horse looks along
import { M4 } from '../../../../kit/mesh.js';
import { SG } from '../../../cherkasy/sculpt.js';
import { sweep, ell, put, mapper } from '../../../cherkasy/bohdan.js';

const PI = Math.PI, PH = 2.9, HX = 1.9, HZ = 0.95;

function horse(s) { // +x the way it looks, y up, z its right; origin on the ground under the saddle
  sweep(s, [[1.22, 1.52, 0], [1.0, 1.5, 0], [0.6, 1.43, 0], [0.1, 1.39, 0], [-0.4, 1.4, 0], [-0.85, 1.46, 0], [-1.2, 1.48, 0], [-1.42, 1.42, 0]],
    [[0.22, 0.32], [0.33, 0.5], [0.41, 0.63], [0.44, 0.66], [0.45, 0.64], [0.44, 0.6], [0.36, 0.48], [0.22, 0.3]], 12);
  sweep(s, [[0.9, 1.66, 0], [1.1, 1.98, 0], [1.25, 2.28, 0], [1.34, 2.5, 0]], [[0.32, 0.34], [0.26, 0.29], [0.2, 0.24], [0.15, 0.19]], 10);
  sweep(s, [[1.34, 2.5, 0], [1.5, 2.36, 0], [1.68, 2.08, 0], [1.74, 1.92, 0]], [[0.12, 0.16], [0.12, 0.15], [0.1, 0.12], [0.085, 0.09]], 8);
  for (const z of [-0.075, 0.075]) ell(s, [1.34, 2.66, z], [0.03, 0.095, 0.035], [z > 0 ? -0.25 : 0.25, 0, -0.3], 5, 3);
  const legs = [
    [[[0.85, 1.28, 0.24], [0.95, 0.82, 0.23], [0.95, 0.45, 0.23], [0.97, 0.1, 0.23]], [[0.15, 0.17], [0.09, 0.1], [0.06, 0.07], [0.065, 0.065]]],
    [[[0.85, 1.28, -0.24], [1.12, 0.86, -0.25], [0.97, 0.64, -0.25], [0.78, 0.5, -0.25]], [[0.15, 0.17], [0.09, 0.1], [0.06, 0.07], [0.065, 0.065]]],
    [[[-0.7, 1.24, 0.27], [-0.76, 0.8, 0.25], [-1.0, 0.55, 0.25], [-0.95, 0.1, 0.25]], [[0.19, 0.2], [0.12, 0.13], [0.075, 0.08], [0.062, 0.062]]],
    [[[-0.7, 1.24, -0.27], [-0.62, 0.8, -0.26], [-0.9, 0.55, -0.26], [-0.82, 0.1, -0.26]], [[0.19, 0.2], [0.12, 0.13], [0.075, 0.08], [0.062, 0.062]]],
  ];
  for (const [p, sec] of legs) sweep(s, p, sec, 7);
  sweep(s, [[-1.38, 1.55, 0], [-1.56, 1.22, 0], [-1.62, 0.72, 0], [-1.54, 0.34, 0]], [[0.05, 0.05], [0.09, 0.07], [0.1, 0.07], [0.04, 0.04]], 6); // the tail
  // ---- the prince: seated, upright, a cloak over the horse's rump
  ell(s, [-0.2, 2.02, 0], [0.24, 0.16, 0.27], [0, 0, 0], 9, 5);
  sweep(s, [[-0.2, 2.1, 0], [-0.17, 2.42, 0], [-0.12, 2.78, 0]], [[0.23, 0.31], [0.24, 0.34], [0.2, 0.36]], 10);
  sweep(s, [[-0.12, 2.8, 0], [-0.1, 2.94, 0]], [0.075, 0.075], 7);
  ell(s, [-0.07, 3.06, 0], [0.13, 0.15, 0.12], [0, 0, 0], 9, 6);                                   // the head
  ell(s, [0.03, 3.03, 0], [0.04, 0.025, 0.1], [0, 0, 0], 6, 3);                                    // the moustache
  sweep(s, [[-0.07, 3.17, 0], [-0.07, 3.36, 0]], [[0.15, 0.15], [0.12, 0.12]], 9);                 // the fur cap
  ell(s, [-0.07, 3.38, 0], [0.12, 0.05, 0.12], [0, 0, 0], 8, 3);
  for (const z of [-1, 1]) {
    sweep(s, [[-0.15, 2.02, 0.22 * z], [0.22, 1.74, 0.3 * z], [0.2, 1.2, 0.31 * z]], [[0.13, 0.13], [0.1, 0.1], [0.07, 0.07]], 7);
    ell(s, [0.24, 1.04, 0.31 * z], [0.17, 0.065, 0.08], [0, 0, 0], 7, 4);
  }
  sweep(s, [[-0.12, 2.72, -0.3], [0.08, 2.42, -0.34], [0.56, 2.22, -0.14]], [0.065, 0.055, 0.045], 7);       // the left hand on the reins
  sweep(s, [[-0.12, 2.76, 0.36], [0.1, 2.9, 0.7], [0.1, 3.3, 0.76]], [0.08, 0.065, 0.058], 7);                // the right arm raised
  sweep(s, [[0.1, 3.2, 0.76], [0.1, 4.0, 0.76]], [0.03, 0.03], 5);                                          // the mace
  ell(s, [0.1, 4.1, 0.76], [0.09, 0.15, 0.09], [0, 0, 0], 7, 5);
  const rows = [[2.85, -0.1, 0.3, 0.36], [2.5, -0.15, 0.42, 0.46], [2.1, -0.28, 0.58, 0.62], [1.7, -0.5, 0.8, 0.8], [1.38, -0.78, 1.0, 0.95], [1.15, -0.95, 1.08, 1.0]];
  const NC = 20, cloak = rows.map(([y, cx, rx, rz], j) => Array.from({ length: NC }, (_, k) => {
    const a = (-108 + 216 * k / (NC - 1)) * PI / 180, f = 1 + 0.06 * Math.sin(a * 7 + j * 1.7) * (j / 5);
    return [cx - Math.cos(a) * rx * f, y, Math.sin(a) * rz * f];
  }));
  s.loft(cloak, { closed: false });
}

export function addEquestrian({ stone, bronze, S, g, point, face }) {
  const [x, z] = point, hs = [[0, 0], [2.6, 0], [-2.6, 0], [0, 1.6], [0, -1.6]].map(([dx, dz]) => g(x + dx, z + dz)).filter(Number.isFinite);
  const lo = Math.min(...hs, 2), hi = Math.max(...hs, 2), y0 = hi + 0.14, yaw = Math.atan2(-face[1], face[0]);  // local +x runs along `face`
  stone.with(M4(x, y0, z, yaw), (q) => {
    q.setColor('#8e8a82').box(-HX - 0.9, lo - y0 - 0.4, -HZ - 0.7, HX + 0.9, 0.18, HZ + 0.7);
    q.setColor('#a29d93').box(-HX - 0.45, 0.18, -HZ - 0.35, HX + 0.45, 0.4, HZ + 0.35);
    q.setColor('#b3aea3').box(-HX, 0.4, -HZ, HX, PH - 0.3, HZ);
    q.setColor('#c4bfb3').box(-HX - 0.15, PH - 0.3, -HZ - 0.15, HX + 0.15, PH, HZ + 0.15);
    q.setColor('#2a2622').box(HX, 1.0, -0.8, HX + 0.02, 1.9, 0.8);                    // the inscription plate on the end the horse looks at
  });
  S.obox(x, z, HX + 1.0, HZ + 0.8, -yaw, lo - 0.5, y0 + PH, 'monument');
  const f = new SG(); horse(f); put(bronze, f, mapper(M4(0, PH, 0, 0, 1.0).premultiply(M4(x, y0, z, yaw))));
  return { x, z, r: 4.2 };
}
