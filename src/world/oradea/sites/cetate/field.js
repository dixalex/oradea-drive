// 2D toolkit of the Oradea Fortress site: distance to a polygon, iso-contours of a sampled field (marching squares),
// loop clean-up. Not a site module: moat.js and ../cetate.js import it.
//   polyTools(P) -> { inside(x, z), dist(x, z), sd(x, z) }   P a ring [[x, z], ..] (any winding); sd < 0 inside
//   segDist(segs) -> (x, z) -> m   distance to the nearest of a list of segments [[ax, az, bx, bz], ..]
//   isoLoops(v, x0, z0, nx, nz, h, level = 0) -> [[[x, z], ..], ..]   closed loops of v = level (v <= level inside), the
//     sample v[j * nx + i] at (x0 + i h, z0 + j h); loops that touch the grid edge are dropped
//   simplify(loop, tol) -> loop   Douglas-Peucker on a closed loop
//   area2(P), orient(P, positive = true), nearestOn(P, x, z) -> { d, i, f, x, z }, inRing(P, x, z)
export const area2 = (P) => { let s = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) s += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return s; };
export const orient = (P, positive = true) => ((area2(P) > 0) === positive ? P : P.slice().reverse());
export function inRing(P, x, z) {
  let o = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [ax, az] = P[i], [bx, bz] = P[j];
    if ((az > z) !== (bz > z) && x < ax + (bx - ax) * (z - az) / (bz - az)) o = !o;
  }
  return o;
}
export function nearestOn(P, x, z) {
  let best = { d: Infinity, i: 0, f: 0, x: 0, z: 0 };
  for (let i = 0; i < P.length; i++) {
    const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const f = L2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)) : 0;
    const px = ax + dx * f, pz = az + dz * f, d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { d, i, f, x: px, z: pz };
  }
  return best;
}
export function polyTools(P) {
  const n = P.length, ax = new Float64Array(n), az = new Float64Array(n), ex = new Float64Array(n), ez = new Float64Array(n), il = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [x, z] = P[i], [x1, z1] = P[(i + 1) % n];
    ax[i] = x; az[i] = z; ex[i] = x1 - x; ez[i] = z1 - z; il[i] = 1 / ((x1 - x) ** 2 + (z1 - z) ** 2 || 1);
  }
  const dist = (x, z) => {
    let b = Infinity;
    for (let i = 0; i < n; i++) {
      let f = ((x - ax[i]) * ex[i] + (z - az[i]) * ez[i]) * il[i];
      f = f < 0 ? 0 : f > 1 ? 1 : f;
      const dx = x - ax[i] - ex[i] * f, dz = z - az[i] - ez[i] * f, d = dx * dx + dz * dz;
      if (d < b) b = d;
    }
    return Math.sqrt(b);
  };
  const inside = (x, z) => inRing(P, x, z);
  return { inside, dist, sd: (x, z) => (inside(x, z) ? -dist(x, z) : dist(x, z)) };
}
export function segDist(segs) {
  const m = segs.length;
  return (x, z) => {
    let b = Infinity;
    for (let i = 0; i < m; i++) {
      const [ax, az, bx, bz] = segs[i], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      let f = L2 > 0 ? ((x - ax) * dx + (z - az) * dz) / L2 : 0;
      f = f < 0 ? 0 : f > 1 ? 1 : f;
      const px = x - ax - dx * f, pz = z - az - dz * f, d = px * px + pz * pz;
      if (d < b) b = d;
    }
    return Math.sqrt(b);
  };
}

// marching squares: segments between edge crossings, joined into loops through the shared edge ids
const CASES = [[], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], [[3, 0], [1, 2]], [[0, 2]], [[3, 2]], [[2, 3]], [[0, 2]], [[0, 1], [2, 3]], [[1, 2]], [[3, 1]], [[0, 1]], [[3, 0]], []];
export function isoLoops(v, x0, z0, nx, nz, h, level = 0) {
  const pts = new Map(), adj = new Map();
  const edgeId = (i, j, e) => (e === 0 ? (j * nx + i) * 2 : e === 2 ? ((j + 1) * nx + i) * 2 : e === 3 ? (j * nx + i) * 2 + 1 : (j * nx + i + 1) * 2 + 1); // 0 bottom, 1 right, 2 top, 3 left
  const cross = (id, i, j, e) => {
    if (pts.has(id)) return;
    const [ia, ja, ib, jb] = e === 0 ? [i, j, i + 1, j] : e === 2 ? [i, j + 1, i + 1, j + 1] : e === 3 ? [i, j, i, j + 1] : [i + 1, j, i + 1, j + 1];
    const va = v[ja * nx + ia], vb = v[jb * nx + ib], t = va === vb ? 0.5 : (level - va) / (vb - va);
    pts.set(id, [x0 + (ia + (ib - ia) * t) * h, z0 + (ja + (jb - ja) * t) * h]);
  };
  const link = (a, b) => { (adj.get(a) ?? adj.set(a, []).get(a)).push(b); (adj.get(b) ?? adj.set(b, []).get(b)).push(a); };
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = v[j * nx + i] <= level, b = v[j * nx + i + 1] <= level, c = v[(j + 1) * nx + i + 1] <= level, d = v[(j + 1) * nx + i] <= level;
      let k = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0);
      if (k === 0 || k === 15) continue;
      let segs = CASES[k];
      if (k === 5 || k === 10) { // saddle: the cell centre decides which pairs join
        const mid = (v[j * nx + i] + v[j * nx + i + 1] + v[(j + 1) * nx + i + 1] + v[(j + 1) * nx + i]) / 4 <= level;
        segs = k === 5 ? (mid ? [[3, 2], [0, 1]] : [[3, 0], [1, 2]]) : (mid ? [[3, 0], [1, 2]] : [[0, 1], [3, 2]]);
      }
      for (const [e1, e2] of segs) {
        const i1 = edgeId(i, j, e1), i2 = edgeId(i, j, e2);
        cross(i1, i, j, e1); cross(i2, i, j, e2); link(i1, i2);
      }
    }
  }
  const seen = new Set(), loops = [];
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop = [], ids = [];
    let prev = -1, cur = start, closed = false;
    for (let guard = 0; guard < 5e6; guard++) {
      seen.add(cur); ids.push(cur); loop.push(pts.get(cur));
      const nb = adj.get(cur);
      if (nb.length !== 2) break; // an open end at the grid edge
      const nxt = nb[0] === prev ? nb[1] : nb[0];
      if (nxt === start) { closed = true; break; }
      if (seen.has(nxt)) break;
      prev = cur; cur = nxt;
    }
    if (closed && loop.length > 3) loops.push(loop);
  }
  return loops;
}

export function simplify(loop, tol) {
  const n = loop.length;
  if (n < 8) return loop;
  const keep = new Uint8Array(n);
  const dp = (a, b) => { // open run a..b (indices, b may exceed n: wraps)
    if (b - a < 2) return;
    const [ax, az] = loop[a % n], [bx, bz] = loop[b % n], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1e-9;
    let far = -1, fd = tol;
    for (let k = a + 1; k < b; k++) {
      const [px, pz] = loop[k % n], d = Math.abs((px - ax) * dz - (pz - az) * dx) / L;
      if (d > fd) { fd = d; far = k; }
    }
    if (far < 0) return;
    keep[far % n] = 1; dp(a, far); dp(far, b);
  };
  // anchor: the point farthest from loop[0]
  let m = 0, md = 0;
  for (let k = 1; k < n; k++) { const d = Math.hypot(loop[k][0] - loop[0][0], loop[k][1] - loop[0][1]); if (d > md) { md = d; m = k; } }
  keep[0] = 1; keep[m] = 1;
  dp(0, m); dp(m, n);
  return loop.filter((_, k) => keep[k]);
}
