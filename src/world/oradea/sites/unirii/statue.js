// Piața Unirii: the equestrian statue of King Ferdinand I «Întregitorul» (a replica unveiled 23 May 2019 on the pedestal of
// the 1924 monument; the Mihai Viteazul riding statue of 1994 was moved to Piața Gojdu), built after the Commons photo of
// the bronze: a crowned, bearded king in a mantle, the right arm raised with the mace, the left hand on the reins, on a
// walking horse with the left foreleg lifted, on a light-grey granite pedestal with a moulded cap and the inscription on
// the end face the horse looks at, over two low steps.
//   buildStatue({ B, S, g, M4, lift }) -> { geo (the bronze, BufferGeometry with the patina colour), lamps: [[x, y, z]], top }
//   B needs stone, det, sign; the figure is drawn in metres with +x the way the horse looks (site east), +y up, +z the horse's
//   right (site south); the origin is the centre of the pedestal, the floor y = 0.
import * as THREE from 'three';
import { M4 as m4 } from '../../../../kit/mesh.js';
import { SG } from '../../../cherkasy/sculpt.js';
import { sweep, ell, put, mapper, patina } from '../../../cherkasy/bohdan.js';
import { toMap, E } from './frame.js';
import { quad } from './facekit.js';

const PI = Math.PI;
const PH = 3.45, STEP = 0.36;                      // the pedestal's height over the floor, the steps'
const HX = 2.0, HZ = 1.5, K = 1.28;                         // half sizes of the pedestal die

function horse() {
  const s = new SG();
  // body: stations along x (centre height, half height, half width), the withers a separate hump
  sweep(s, [[1.22, 1.52, 0], [1.0, 1.5, 0], [0.6, 1.43, 0], [0.1, 1.39, 0], [-0.4, 1.4, 0], [-0.85, 1.46, 0], [-1.2, 1.48, 0], [-1.42, 1.42, 0]],
    [[0.22, 0.32], [0.33, 0.5], [0.41, 0.63], [0.44, 0.66], [0.45, 0.64], [0.44, 0.6], [0.36, 0.48], [0.22, 0.3]], 14);
  ell(s, [0.55, 1.88, 0], [0.42, 0.2, 0.2], [0, 0, 0.12], 10, 6);
  // neck and head (nose tucked), ears, the bit
  sweep(s, [[0.9, 1.66, 0], [1.1, 1.98, 0], [1.25, 2.28, 0], [1.34, 2.5, 0]], [[0.32, 0.34], [0.26, 0.29], [0.2, 0.24], [0.15, 0.19]], 12);
  sweep(s, [[1.34, 2.5, 0], [1.5, 2.36, 0], [1.68, 2.08, 0], [1.74, 1.92, 0]], [[0.12, 0.16], [0.12, 0.15], [0.1, 0.12], [0.085, 0.09]], 10);
  ell(s, [1.76, 1.9, 0], [0.095, 0.08, 0.095], [0, 0, 0], 8, 5);
  for (const z of [-0.075, 0.075]) ell(s, [1.34, 2.66, z], [0.03, 0.095, 0.035], [z > 0 ? -0.25 : 0.25, 0, -0.3], 6, 4);
  // legs: [path, sections]; the left foreleg is lifted and folded, the others stand
  const legs = [
    [[[0.85, 1.28, 0.24], [0.95, 0.82, 0.23], [0.95, 0.45, 0.23], [0.97, 0.1, 0.23]], [[0.15, 0.17], [0.09, 0.1], [0.06, 0.07], [0.065, 0.065]]],
    [[[0.85, 1.28, -0.24], [1.12, 0.86, -0.25], [0.97, 0.64, -0.25], [0.78, 0.5, -0.25]], [[0.15, 0.17], [0.09, 0.1], [0.06, 0.07], [0.065, 0.065]]],
    [[[-0.7, 1.24, 0.27], [-0.76, 0.8, 0.25], [-1.0, 0.55, 0.25], [-0.95, 0.1, 0.25]], [[0.19, 0.2], [0.12, 0.13], [0.075, 0.08], [0.062, 0.062]]],
    [[[-0.7, 1.24, -0.27], [-0.62, 0.8, -0.26], [-0.9, 0.55, -0.26], [-0.82, 0.1, -0.26]], [[0.19, 0.2], [0.12, 0.13], [0.075, 0.08], [0.062, 0.062]]],
  ];
  for (const [p, sec] of legs) { sweep(s, p, sec, 8); }
  for (const [x, z] of [[0.99, 0.23], [-0.93, 0.25], [-0.8, -0.26]]) ell(s, [x, 0.06, z], [0.12, 0.07, 0.1], [0, 0, 0], 8, 5);
  ell(s, [0.74, 0.43, -0.25], [0.12, 0.07, 0.1], [0, 0, 0.5], 8, 5);
  sweep(s, [[-1.38, 1.55, 0], [-1.56, 1.22, 0], [-1.62, 0.72, 0], [-1.54, 0.34, 0]], [[0.05, 0.05], [0.09, 0.07], [0.1, 0.07], [0.04, 0.04]], 8);
  // reins from the left hand to the bit, the girth strap
  sweep(s, [[0.55, 2.2, -0.14], [1.15, 2.0, -0.13], [1.74, 1.92, -0.09]], [0.009, 0.009, 0.009], 4, { caps: false });
  // ---- the king
  ell(s, [-0.2, 2.02, 0], [0.24, 0.16, 0.27], [0, 0, 0], 10, 6);
  sweep(s, [[-0.2, 2.1, 0], [-0.17, 2.42, 0], [-0.12, 2.78, 0]], [[0.23, 0.31], [0.24, 0.34], [0.2, 0.36]], 12);
  sweep(s, [[-0.12, 2.8, 0], [-0.1, 2.94, 0]], [0.075, 0.075], 8);
  ell(s, [-0.07, 3.08, 0], [0.14, 0.17, 0.13], [0, 0, 0], 10, 7);
  ell(s, [0.03, 2.97, 0], [0.08, 0.12, 0.09], [0.1, 0, 0], 6, 4);          // the beard
  sweep(s, [[-0.07, 3.22, 0], [-0.07, 3.34, 0]], [0.16, 0.16], 10);       // the crown band
  for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2; ell(s, [-0.07 + Math.cos(a) * 0.15, 3.41, Math.sin(a) * 0.15], [0.03, 0.09, 0.03], [0, 0, 0], 4, 3); }
  for (const z of [-1, 1]) {                                               // the legs: thigh, shin, boot, stirrup
    sweep(s, [[-0.15, 2.02, 0.22 * z], [0.22, 1.74, 0.3 * z], [0.2, 1.2, 0.31 * z]], [[0.13, 0.13], [0.1, 0.1], [0.07, 0.07]], 8);
    ell(s, [0.24, 1.04, 0.31 * z], [0.17, 0.065, 0.08], [0, 0, 0], 8, 5);
    sweep(s, [[0.2, 0.97, 0.31 * z], [0.2, 0.94, 0.41 * z]], [0.012, 0.012], 4);
  }
  sweep(s, [[-0.12, 2.72, -0.3], [0.08, 2.42, -0.34], [0.56, 2.22, -0.14]], [0.065, 0.055, 0.045], 8);       // the left arm on the reins
  ell(s, [0.58, 2.22, -0.13], [0.06, 0.05, 0.05], [0, 0, 0], 6, 4);
  sweep(s, [[-0.12, 2.76, 0.36], [0.12, 2.82, 0.72], [0.14, 3.16, 0.78]], [0.08, 0.065, 0.058], 8);             // the right arm raised
  sweep(s, [[0.14, 2.9, 0.78], [0.14, 3.96, 0.78]], [0.032, 0.032], 6);                                       // the mace
  ell(s, [0.14, 4.08, 0.78], [0.09, 0.17, 0.09], [0, 0, 0], 8, 6);
  ell(s, [0.14, 3.62, 0.78], [0.055, 0.06, 0.055], [0, 0, 0], 6, 4);
  // the mantle: arcs behind him, widening to the horse's rump
  const rows = [[2.85, -0.1, 0.3, 0.36], [2.5, -0.15, 0.42, 0.46], [2.1, -0.28, 0.58, 0.62], [1.7, -0.5, 0.8, 0.8], [1.38, -0.78, 1.0, 0.95], [1.15, -0.95, 1.08, 1.0]];
  const NC = 26, cloak = rows.map(([y, cx, rx, rz], j) => Array.from({ length: NC }, (_, k) => {
    const a = (-108 + 216 * k / (NC - 1)) * PI / 180, f = 1 + 0.06 * Math.sin(a * 7 + j * 1.7) * (j / 5);
    return [cx - Math.cos(a) * rx * f, y, Math.sin(a) * rz * f];
  }));
  s.loft(cloak, { closed: false });
  for (const k of [0, NC - 1]) sweep(s, cloak.map((r) => r[k]), cloak.map((_, j) => (j ? 0.02 : 0.03)), 6);   // the hem
  return s;
}

export function buildStatue({ B, S, g, M4 = m4, lift = 0.24 }) {
  const [ox, oz] = toMap(0, 0), yaw = Math.atan2(-E[1], E[0]);          // local +x runs to the site's east
  const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => { const [x, z] = toMap(u * (HX + 1.1), v * (HZ + 1)); return g(x, z); });
  const y0 = Math.max(...c) + lift, yLow = Math.min(...c) - 0.35, P = M4(ox, y0, oz, yaw);
  const gran = 0xd9d1c1;
  // ---- steps, the die, the moulded cap
  B.stone.with(P, (q) => {
    q.setColor(0xc4bcad).box(-HX - 0.8, yLow - y0, -HZ - 0.65, HX + 0.8, 0.18, HZ + 0.65);
    q.setColor(0xcdc5b6).box(-HX - 0.4, 0.18, -HZ - 0.3, HX + 0.4, STEP, HZ + 0.3);
    q.setColor(gran).box(-HX - 0.12, STEP, -HZ - 0.12, HX + 0.12, STEP + 0.4, HZ + 0.12);                  // the base moulding
    q.setColor(gran).box(-HX, STEP + 0.4, -HZ, HX, PH - 0.4, HZ);
    q.setColor(0xd9d9d3).box(-HX - 0.1, PH - 0.4, -HZ - 0.1, HX + 0.1, PH - 0.26, HZ + 0.1);               // the cornice, stepped out
    q.setColor(0xe0e0da).box(-HX - 0.22, PH - 0.26, -HZ - 0.22, HX + 0.22, PH - 0.05, HZ + 0.22);
    q.setColor(0xe8e8e2).box(-HX - 0.26, PH - 0.05, -HZ - 0.26, HX + 0.26, PH, HZ + 0.26);
  });
  // the bronze base plate under the hooves, its edge bevelled
  B.det.with(P, (q) => {
    q.setColor(0x24211e).box(-1.95, PH, -1.1, 1.95, PH + 0.1, 1.1);
    q.setColor(0x2a2723).box(-1.8, PH + 0.1, -0.98, 1.8, PH + 0.2, 0.98);
    // the corner lamps' bases: three ground projectors in front of the end face
    q.setColor(0x3a3d40);
    for (const z of [-1.4, 0, 1.4]) q.box(HX + 1.15, -0.1, z - 0.1, HX + 1.37, 0.1, z + 0.1);
  });
  // ---- the inscription on the end face
  B.sign.with(P, (q) => {
    q.setColor(0xffffff);
    const h = 1.15, ym = 1.85, z = 1.15;
    quad(q, [HX + 0.01, ym - h, z], [HX + 0.01, ym - h, -z], [HX + 0.01, ym + h, -z], [HX + 0.01, ym + h, z], [1, 0, 0], [[0.5, 0], [1, 0], [1, 1], [0.5, 1]]);
  });
  // ---- colliders: the steps and the die, as one block
  S.obox(ox, oz, HX + 0.85, HZ + 0.7, -yaw, yLow - 0.2, y0 + PH, 'monument');
  // ---- the bronze
  const bronze = new SG();
  put(bronze, horse(), mapper(M4(0, PH + 0.2, 0, 0, K).premultiply(P)));
  const geo = patina(bronze.build());
  const lamps = [-1.4, 0, 1.4].map((z) => { const w = new THREE.Vector3(HX + 1.25, 0.3, z).applyMatrix4(P); return [w.x, w.y, w.z]; });
  return { geo, lamps, top: y0 + PH + 5.8, floor: y0 };
}
