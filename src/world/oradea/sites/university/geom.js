// OWNER: oradea. Ring and polyline helpers of the university site (not a site module).
//   ringOf(flat) -> [[x, z]..];  positive(P) -> P turned so that area2 > 0 (outward normal of a -> b is (dz, -dx) / L)
//   cleanRing(P, minEdge?, minTurn?) -> P'        vertices closer than minEdge and collinear ones dropped
//   edgesOf(R) -> [{ i, A, B, L, ux, uz, nx, nz, mx, mz }]   one entry per edge of a positive ring
//   nearLine(pts, x, z) -> { d, qx, qz, dx, dz }   closest point of a flat polyline [x0, z0, x1, z1, ..]
//   rectCover(R, holes?, opts) -> [{ cx, cz, ux, uz, hl, hw }]   oriented rectangles (long axis u, half sizes hl >= hw) that
//     lie inside the ring and cover it: the footprint of an L, U or T is a few overlapping wings, each of which gets its
//     own pitched roof (where the roofs cross, the valleys come out by themselves)
//   inRect(r, x, z), rectCorners(r, grow?)
import { area2, inPoly } from '../../../cherkasy/geo.js';

export const ringOf = (flat) => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push([flat[i], flat[i + 1]]); return out; };
export const positive = (P) => (area2(P) < 0 ? P.slice().reverse() : P);

export function cleanRing(P, minEdge = 0.6, minTurn = 0.035) {
  const out = [];
  for (const p of P) { const q = out[out.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= minEdge) out.push(p); }
  while (out.length > 3 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < minEdge) out.pop();
  let again = true;
  while (again && out.length > 3) {
    again = false;
    for (let i = 0; i < out.length; i++) {
      const a = out[(i + out.length - 1) % out.length], b = out[i], c = out[(i + 1) % out.length];
      const x0 = b[0] - a[0], z0 = b[1] - a[1], x1 = c[0] - b[0], z1 = c[1] - b[1], l0 = Math.hypot(x0, z0), l1 = Math.hypot(x1, z1);
      if (Math.abs(x0 * z1 - z0 * x1) / (l0 * l1) < minTurn && x0 * x1 + z0 * z1 > 0) { out.splice(i, 1); again = true; break; }
    }
  }
  return out;
}

export function edgesOf(R) {
  const n = R.length;
  return R.map((A, i) => {
    const B = R[(i + 1) % n], L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1e-6, ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L;
    return { i, A, B, L, ux, uz, nx: uz, nz: -ux, mx: (A[0] + B[0]) / 2, mz: (A[1] + B[1]) / 2 };
  });
}

export function nearLine(pts, x, z) {
  let best = null;
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i], az = pts[i + 1], ex = pts[i + 2] - ax, ez = pts[i + 3] - az, L2 = ex * ex + ez * ez || 1e-9;
    let f = ((x - ax) * ex + (z - az) * ez) / L2; f = f < 0 ? 0 : f > 1 ? 1 : f;
    const qx = ax + f * ex, qz = az + f * ez, d = Math.hypot(x - qx, z - qz);
    if (!best || d < best.d) { const L = Math.sqrt(L2); best = { d, qx, qz, dx: ex / L, dz: ez / L }; }
  }
  return best;
}

export const inRect = (r, x, z) => {
  const dx = x - r.cx, dz = z - r.cz, u = dx * r.ux + dz * r.uz, v = -dx * r.uz + dz * r.ux;
  return Math.abs(u) <= r.hl && Math.abs(v) <= r.hw;
};
export const rectCorners = (r, g = 0) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
  const u = a * (r.hl + g), v = b * (r.hw + g);
  return [r.cx + u * r.ux - v * r.uz, r.cz + u * r.uz + v * r.ux];
});

// the dominant wall directions of a ring (angles in [0, 90) that carry most edge length), best first
export function axesOf(R, max = 3) {
  const bins = new Map();
  for (const e of edgesOf(R)) {
    if (e.L < 3) continue;
    let a = Math.atan2(e.uz, e.ux) * 180 / Math.PI; a = ((a % 90) + 90) % 90;
    const k = Math.round(a / 4);
    const b = bins.get(k) ?? { w: 0, s: 0 }; b.w += e.L; b.s += a * e.L; bins.set(k, b);
  }
  const list = [...bins.values()].map((b) => ({ w: b.w, a: b.s / b.w })).sort((p, q) => q.w - p.w);
  const out = [];
  for (const c of list) { if (out.every((o) => Math.min(Math.abs(o.a - c.a), 90 - Math.abs(o.a - c.a)) > 6)) out.push(c); if (out.length >= max) break; }
  return out.map((o) => o.a * Math.PI / 180);
}

// the largest all-ones rectangle of a boolean grid (histogram method): { i0, j0, i1, j1 } (inclusive) or null
function bestRect(G, W, H) {
  const h = new Int32Array(W);
  let best = null, area = 0;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) h[i] = G[j * W + i] ? h[i] + 1 : 0;
    const st = [];
    for (let i = 0; i <= W; i++) {
      const cur = i === W ? 0 : h[i];
      let start = i;
      while (st.length && st[st.length - 1][1] >= cur) {
        const [s, hh] = st.pop(), a = hh * (i - s);
        if (a > area) { area = a; best = { i0: s, i1: i - 1, j0: j - hh + 1, j1: j }; }
        start = s;
      }
      st.push([start, cur]);
    }
  }
  return best;
}

export function rectCover(R, holes = [], { cell = 0.5, minW = 2.4, maxN = 8, stop = 0.035, axes = null, minArea = 0.04 } = {}) {
  const total = Math.abs(area2(R)) / 2 - holes.reduce((s, h) => s + Math.abs(area2(h)) / 2, 0);
  const out = [];
  const inside = (x, z) => inPoly(R, x, z) && !holes.some((h) => inPoly(h, x, z));
  const covered = (x, z) => out.some((r) => inRect(r, x, z));
  let left = total;
  for (const a of axes ?? axesOf(R)) {
    const c = Math.cos(a), s = Math.sin(a);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [x, z] of R) { const u = x * c + z * s, v = -x * s + z * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const W = Math.ceil((u1 - u0) / cell), H = Math.ceil((v1 - v0) / cell);
    if (W * H > 400000) continue;
    const ins = new Uint8Array(W * H), free = new Uint8Array(W * H);
    const wx = (i, j) => { const u = u0 + (i + 0.5) * cell, v = v0 + (j + 0.5) * cell; return [u * c - v * s, u * s + v * c]; };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const [x, z] = wx(i, j);
      if (inside(x, z)) { ins[j * W + i] = 1; if (!covered(x, z)) free[j * W + i] = 1; }
    }
    while (out.length < maxN && left > total * stop) {
      const r = bestRect(free, W, H);
      if (!r) break;
      let { i0, i1, j0, j1 } = r;
      if (Math.min(i1 - i0 + 1, j1 - j0 + 1) * cell < minW || (i1 - i0 + 1) * (j1 - j0 + 1) * cell * cell < total * minArea) break;
      // grow into already covered / inside cells so a wing reaches under its neighbour
      const rowOk = (j, a, b) => { for (let i = a; i <= b; i++) if (!ins[j * W + i]) return false; return true; };
      const colOk = (i, a, b) => { for (let j = a; j <= b; j++) if (!ins[j * W + i]) return false; return true; };
      for (let g = 0; g < 400; g++) {
        let moved = false;
        if (i0 > 0 && colOk(i0 - 1, j0, j1)) { i0--; moved = true; }
        if (i1 < W - 1 && colOk(i1 + 1, j0, j1)) { i1++; moved = true; }
        if (j0 > 0 && rowOk(j0 - 1, i0, i1)) { j0--; moved = true; }
        if (j1 < H - 1 && rowOk(j1 + 1, i0, i1)) { j1++; moved = true; }
        if (!moved) break;
      }
      let gained = 0;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { if (free[j * W + i]) gained++; free[j * W + i] = 0; }
      const lu = (i1 - i0 + 1) * cell / 2, lv = (j1 - j0 + 1) * cell / 2, cu = u0 + (i0 + i1 + 1) * cell / 2, cv = v0 + (j0 + j1 + 1) * cell / 2;
      const cx = cu * c - cv * s, cz = cu * s + cv * c;
      // long axis first
      out.push(lu >= lv ? { cx, cz, ux: c, uz: s, hl: lu, hw: lv } : { cx, cz, ux: -s, uz: c, hl: lv, hw: lu });
      left -= gained * cell * cell;
    }
    if (left <= total * stop) break;
  }
  return out;
}

// the biggest rectangle with the given axis (radians) that contains the seed point and stays inside the ring, grown a
// cell at a time (the longer side first): the wing a hand-placed seed sits in -> { cx, cz, ux, uz, hl, hw } | null
export function growRect(R, holes, [sx, sz], ang, { cell = 0.25, max = 160 } = {}) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const ok = (u0, u1, v0, v1) => {
    // sample the rectangle's border and its middle lines every cell
    const n = Math.max(2, Math.ceil(Math.max(u1 - u0, v1 - v0) / cell));
    for (let i = 0; i <= n; i++) {
      const u = u0 + (u1 - u0) * i / n, v = v0 + (v1 - v0) * i / n;
      for (const [a, b] of [[u, v0], [u, v1], [u0, v], [u1, v]]) {
        const x = a * c - b * s, z = a * s + b * c;
        if (!inPoly(R, x, z) || holes.some((h) => inPoly(h, x, z))) return false;
      }
    }
    return true;
  };
  const su = sx * c + sz * s, sv = -sx * s + sz * c;
  let u0 = su - cell, u1 = su + cell, v0 = sv - cell, v1 = sv + cell;
  if (!ok(u0, u1, v0, v1)) return null;
  const grow = [[0, -1], [0, 1], [1, -1], [1, 1]];
  for (let k = 0; k < max; k++) {
    let moved = false;
    for (const [axis, sg] of grow) {
      const t = [u0, u1, v0, v1];
      if (axis === 0) { if (sg < 0) t[0] -= cell; else t[1] += cell; } else if (sg < 0) t[2] -= cell; else t[3] += cell;
      if (ok(...t)) { [u0, u1, v0, v1] = t; moved = true; }
    }
    if (!moved) break;
  }
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, lu = (u1 - u0) / 2, lv = (v1 - v0) / 2, cx = cu * c - cv * s, cz = cu * s + cv * c;
  return lu >= lv ? { cx, cz, ux: c, uz: s, hl: lu, hw: lv } : { cx, cz, ux: -s, uz: c, hl: lv, hw: lu };
}
