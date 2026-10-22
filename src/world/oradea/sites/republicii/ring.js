// OWNER: oradea. Footprint helpers for the Calea Republicii site (not a site module).
//   cleanRing(P, minEdge?) -> P'        drops vertices closer than minEdge to the last kept one and collinear ones
//   positive(P) -> P'                   the ring turned so that area2 > 0 (outward normal of edge a->b is (dz, -dx) / L)
//   offsetRing(P, d) -> P' | null       a positive ring moved inward by d with mitred corners; null when it folds over
//   inside(P, x, z)                     even-odd test;  BuildingIndex(buildings) -> { at(x, z), near(x, z, r) }
//   polyline helpers: nearOnLine(CL, x, z) -> { d, t, qx, qz, dx, dz }   the closest point of a polyline [x0,z0,x1,z1,...]
import { area2, inPoly } from '../../../cherkasy/geo.js';

export const ringOf = (flat) => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push([flat[i], flat[i + 1]]); return out; };
export const positive = (P) => (area2(P) < 0 ? P.slice().reverse() : P);
export const inside = inPoly;

export function cleanRing(P, minEdge = 0.6, minTurn = 0.035) {
  let out = [];
  for (const p of P) { const q = out[out.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= minEdge) out.push(p); }
  while (out.length > 3 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < minEdge) out.pop();
  let again = true;
  while (again && out.length > 3) { // collinear vertices go (a long straight wall keeps one edge)
    again = false;
    for (let i = 0; i < out.length; i++) {
      const a = out[(i + out.length - 1) % out.length], b = out[i], c = out[(i + 1) % out.length];
      const x0 = b[0] - a[0], z0 = b[1] - a[1], x1 = c[0] - b[0], z1 = c[1] - b[1], l0 = Math.hypot(x0, z0), l1 = Math.hypot(x1, z1);
      if (Math.abs(x0 * z1 - z0 * x1) / (l0 * l1) < minTurn && x0 * x1 + z0 * z1 > 0) { out.splice(i, 1); again = true; break; }
    }
  }
  return out;
}

export function offsetRing(P, d) {
  const n = P.length, out = [];
  const U = P.map((a, i) => { const b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; });
  for (let i = 0; i < n; i++) {
    const u0 = U[(i + n - 1) % n], u1 = U[i], n0 = [-u0[1], u0[0]], n1 = [-u1[1], u1[0]];
    const k = 1 + n0[0] * n1[0] + n0[1] * n1[1];
    if (k < 0.35) return null;
    out.push([P[i][0] + ((n0[0] + n1[0]) / k) * d, P[i][1] + ((n0[1] + n1[1]) / k) * d]);
  }
  // a valid offset keeps every edge's direction and shrinks the area
  for (let i = 0; i < n; i++) {
    const a = out[i], b = out[(i + 1) % n];
    if ((b[0] - a[0]) * U[i][0] + (b[1] - a[1]) * U[i][1] < 0.2) return null;
  }
  const a0 = area2(P), a1 = area2(out);
  if (!(a1 > 0 && a1 < a0)) return null;
  for (const p of out) if (!inPoly(P, p[0], p[1])) return null;
  return out;
}

// the closest point of a polyline [x0, z0, x1, z1, ...]: distance d, arc length t, the point (qx, qz), the segment direction
export function nearOnLine(CL, x, z) {
  let best = null, acc = 0;
  for (let i = 0; i + 3 < CL.length; i += 2) {
    const ax = CL[i], az = CL[i + 1], ex = CL[i + 2] - ax, ez = CL[i + 3] - az, L = Math.hypot(ex, ez);
    let f = ((x - ax) * ex + (z - az) * ez) / (L * L); f = Math.max(0, Math.min(1, f));
    const qx = ax + f * ex, qz = az + f * ez, d = Math.hypot(x - qx, z - qz);
    if (!best || d < best.d) best = { d, t: acc + f * L, qx, qz, dx: ex / L, dz: ez / L };
    acc += L;
  }
  return best;
}

// every building ring in 32 m buckets: at(x, z) -> the building id whose ring holds the point (or null)
export class BuildingIndex {
  constructor(buildings, cell = 32) {
    this.c = cell; this.cells = new Map(); this.rings = new Map();
    for (const b of buildings) {
      const R = ringOf(b.p); this.rings.set(b.id, { R, holes: (b.holes ?? []).map(ringOf) });
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (const p of R) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      for (let i = Math.floor(x0 / cell); i <= Math.floor(x1 / cell); i++) for (let j = Math.floor(z0 / cell); j <= Math.floor(z1 / cell); j++) {
        const k = i * 100003 + j; (this.cells.get(k) ?? this.cells.set(k, []).get(k)).push(b.id);
      }
    }
  }
  at(x, z, except = null) {
    for (const id of this.cells.get(Math.floor(x / this.c) * 100003 + Math.floor(z / this.c)) ?? []) {
      if (id === except) continue;
      const q = this.rings.get(id);
      if (inPoly(q.R, x, z) && !q.holes.some((h) => inPoly(h, x, z))) return id;
    }
    return null;
  }
}
