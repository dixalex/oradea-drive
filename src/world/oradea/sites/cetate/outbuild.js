// The lower buildings inside the walls of the Oradea Fortress: the long casemate L along the north curtain, the guard blocks
// J and M at the two gates (each cut by the road through the gate), the stables and stores I, G, H, F, P, and the small
// shed O on the Roșu bastion. Not a site module: ../cetate.js calls it.
//   buildOutbuildings({ G, B, S, A, st }) -> { footprints, count }
//     B: MeshBuilders { plaster, tile, plain };  A: the palace bay atlas (the 'low' rows: two storeys, pale cream)
// Outlines: the OSM footprints where they are right (J 712395379, I 190653962, G 190653974, H 190653994), and the plan "Oradea
// Citadel map RO.svg" (CC BY-SA 3.0, ArnoldPlaton) fitted to the outline for the rest (L, M, P, F, O). Facades are guesses: no
// photographs of their walls were found; they follow the low yellow-cream range of the palace. Each is a hipped roof over the
// outline's principal axis; a building that stands against a curtain is trimmed back to the foot of the rampart.
import { face, at } from '../../../cherkasy/slabkit.js';
import { band, blockBase } from '../../../cherkasy/bayatlas.js';
import { OUTLINE, GATES } from './data.js';
import { polyTools, area2 } from './field.js';
import { KIND, FH } from './textures.js';
import { roofPoly } from './roofkit.js';

const LOT = [
  { id: 'L', name: 'Corpul L', ring: [[999.5, -242.7], [1106.3, -279.5], [1102.2, -291.6], [1003.1, -257.4]] },
  { id: 'J', name: 'Corpul J', ring: [[984, -231.1], [1000.2, -234.9], [1015.3, -170.8], [1017.6, -160.7], [1001.4, -156.9], [999.6, -167.6], [985.7, -223.9]] },
  { id: 'M', name: 'Corpul M', ring: [[1158, -285.8], [1144.1, -271.6], [1185.8, -233.2], [1198.4, -245.7]] },
  { id: 'P', name: 'Corpul P', ring: [[1112.6, -292.9], [1110.1, -280.7], [1141.2, -275], [1146.6, -288.5], [1138.8, -290.6]] },
  { id: 'I', name: 'Corpul I', ring: [[1025.8, -163], [1039.6, -166.9], [1049.8, -130.4], [1036, -126.6]] },
  { id: 'G', name: 'Corpul G', ring: [[1046.4, -109.7], [1066.4, -110.2], [1065.9, -83], [1046.9, -83.1]] },
  { id: 'H1', name: 'Corpul H', ring: [[1073.9, -83], [1128.5, -82.5], [1128.9, -97.3], [1074.7, -97.3]] },
  { id: 'H2', name: 'Corpul H', ring: [[1074.4, -110.2], [1085.1, -110], [1084.8, -97.3], [1074.7, -97.3]] },
  { id: 'H3', name: 'Corpul H', ring: [[1115, -109.5], [1130.1, -109.5], [1128.9, -97.3], [1114.2, -97.3]] },
  { id: 'F', name: 'Corpul F', ring: [[994.2, -112.7], [1000.7, -99.6], [1019.6, -105.7], [1011.5, -118.2]] },
  { id: 'O', name: 'Corpul O', ring: [[1262.1, -163.8], [1267.8, -170.1], [1257.5, -177.4], [1252.1, -171]] },
];
const IDS = { L: 190653952, J: 712395379, I: 190653962, G: 190653974, H1: 190653994 };
const STOREYS = 2, CORRIDOR = 3.2, FOOT = 6.4;     // the road's half width through a block, the rampart's width the blocks keep back from

const hull = (pts) => {                              // monotone chain, counter-clockwise on (x, z)
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of P.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const clip = (poly, nx, nz, d) => {                  // the part of a convex polygon with n . p >= d
  const out = [], f = (p) => nx * p[0] + nz * p[1] - d;
  poly.forEach((p, k) => {
    const q = poly[(k + 1) % poly.length], a = f(p), b = f(q);
    if (a >= 0) out.push(p);
    if ((a >= 0) !== (b >= 0)) { const t = a / (a - b); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  });
  return out;
};

export function buildOutbuildings({ G, B, S }) {
  const star = polyTools(OUTLINE), yE = G + STOREYS * FH, footprints = [];
  const Alow = ({ rows: 11, cols: 1, fh: FH, bay: 4.4 });
  const Ak = { ...Alow, base: blockBase(Alow, KIND.low.r0, KIND.low.nk, G) };
  const stats = { buildings: 0 };
  // trim: a vertex nearer the curtain than the rampart's foot moves in along the distance gradient
  const trim = (p) => {
    let [x, z] = p;
    for (let k = 0; k < 3; k++) {
      const s = star.sd(x, z);
      if (s <= -FOOT) break;
      const e = 0.3, gx = star.sd(x + e, z) - star.sd(x - e, z), gz = star.sd(x, z + e) - star.sd(x, z - e), gl = Math.hypot(gx, gz) || 1;
      x -= gx / gl * (s + FOOT); z -= gz / gl * (s + FOOT);
    }
    return [x, z];
  };
  const pieces = [];
  for (const b of LOT) {
    let polys = [hull(b.ring)];
    for (const g of Object.values(GATES)) {                // the gate's road cuts a block that stands on it
      const next = [];
      for (const P of polys) {
        const t = [-g.inward[1], g.inward[0]], d0 = t[0] * g.at[0] + t[1] * g.at[1];
        const c = P.reduce((q, p) => [q[0] + p[0] / P.length, q[1] + p[1] / P.length], [0, 0]);
        const mid = clip(clip(P, t[0], t[1], d0 - CORRIDOR), -t[0], -t[1], -d0 - CORRIDOR);
        if (Math.hypot(c[0] - g.at[0], c[1] - g.at[1]) > 60 || mid.length < 3) { next.push(P); continue; }
        for (const part of [clip(P, -t[0], -t[1], -d0 + CORRIDOR), clip(P, t[0], t[1], d0 + CORRIDOR)]) if (part.length >= 3) next.push(part);
      }
      polys = next;
    }
    for (const P of polys) {
      const T = hull(P.map(trim));
      if (T.length >= 3 && Math.abs(area2(T)) / 2 > 40) pieces.push({ b, T });
    }
  }
  for (const { b, T } of pieces) {
    // outward-facing walls on every edge
    const c = T.reduce((s, p) => [s[0] + p[0] / T.length, s[1] + p[1] / T.length], [0, 0]);
    T.forEach((a, k) => {
      const e = T[(k + 1) % T.length], f = face(a, e, 0, 0);
      let nx = f.uz, nz = -f.ux;
      if (nx * ((a[0] + e[0]) / 2 - c[0]) + nz * ((a[1] + e[1]) / 2 - c[1]) < 0) { nx = -nx; nz = -nz; }
      Object.assign(f, { nx, nz, N: [nx, 0, nz] });
      if (f.L > 0.8) band(B.plaster, f, Ak, G, yE);
    });
    // the hipped roof over the principal axis
    let best = null;
    for (let k = 0; k < T.length; k++) {
      const a = T[k], e = T[(k + 1) % T.length], L = Math.hypot(e[0] - a[0], e[1] - a[1]) || 1, ux = (e[0] - a[0]) / L, uz = (e[1] - a[1]) / L;
      let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
      for (const p of T) { const u = (p[0] - a[0]) * ux + (p[1] - a[1]) * uz, v = (p[0] - a[0]) * -uz + (p[1] - a[1]) * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const area = (u1 - u0) * (v1 - v0);
      if (!best || area < best.area) best = { area, a, ux, uz, u0, u1, v0, v1 };
    }
    let { a, ux, uz, u0, u1, v0, v1 } = best;
    if (u1 - u0 < v1 - v0) { [ux, uz] = [-uz, ux]; [u0, u1, v0, v1] = [best.v0, best.v1, -best.u1, -best.u0]; }
    // the axis frame: origin a, u along the long side
    const U = [ux, uz], Vv = [-uz, ux];
    const len = u1 - u0, wid = v1 - v0, half = wid / 2, rise = Math.max(1.4, Math.min(4.2, half * 0.55)), hl = Math.max(0, len / 2 - half);
    const proj = (p) => (p[0] - a[0]) * U[0] + (p[1] - a[1]) * U[1];
    const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, ctr = [a[0] + U[0] * cu + Vv[0] * cv, a[1] + U[1] * cu + Vv[1] * cv];
    const ridge = (t) => { const tt = Math.max(-hl, Math.min(hl, t - cu)); return [ctr[0] + U[0] * tt, yE + rise, ctr[1] + U[1] * tt]; };
    T.forEach((p, k) => {
      const q = T[(k + 1) % T.length], rp = ridge(proj(p)), rq = ridge(proj(q));
      roofPoly(B.tile, S, G, [[p[0], yE, p[1]], [q[0], yE, q[1]], rq, rp], { kind: 'outbuilding' });
    });
    footprints.push({ poly: T, h: STOREYS * FH + rise, kind: 'public', name: b.name, id: IDS[b.id] ?? 0 });
    stats.buildings++;
  }
  return { footprints, count: stats.buildings };
}
