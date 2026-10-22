// One roof slope for the fortress buildings: a polygon of [x, y, z] points, drawn with its normal up and uv in metres (u along
// its first edge, v up the slope), and a collider that follows it. Not a site module: palace.js and outbuild.js call it.
//   roofPoly(D, S, G, pts, { from = G, kind = 'roof' }) -> bool    D: MeshBuilder with the tile material;  S: the collision
//     world;  from: the collider's bottom (G, or higher over a passage)
const cross3 = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];

export function roofPoly(D, S, G, pts, { from = G, kind = 'roof' } = {}) {
  const q = [];
  for (const p of pts) if (!q.length || Math.hypot(p[0] - q[q.length - 1][0], p[2] - q[q.length - 1][2]) > 0.3 || Math.abs(p[1] - q[q.length - 1][1]) > 0.3) q.push(p);
  if (q.length > 1 && Math.hypot(q[0][0] - q[q.length - 1][0], q[0][2] - q[q.length - 1][2]) < 0.3 && Math.abs(q[0][1] - q[q.length - 1][1]) < 0.3) q.pop();
  if (q.length < 3) return false;
  let n = [0, 0, 0];
  q.forEach((p, k) => { const o = q[(k + 1) % q.length]; n[0] += (p[1] - o[1]) * (p[2] + o[2]); n[1] += (p[2] - o[2]) * (p[0] + o[0]); n[2] += (p[0] - o[0]) * (p[1] + o[1]); });
  if (n[1] < 0) n = n.map((v) => -v);
  const l = Math.hypot(...n) || 1;
  if (l < 0.5) return false;
  n = n.map((v) => v / l);
  const e = [q[1][0] - q[0][0], q[1][1] - q[0][1], q[1][2] - q[0][2]], el = Math.hypot(...e) || 1, ex = e.map((v) => v / el), sy = cross3(n, ex);
  const first = D.v;
  for (const p of q) { const d = [p[0] - q[0][0], p[1] - q[0][1], p[2] - q[0][2]]; D.vert(p[0], p[1], p[2], n[0], n[1], n[2], d[0] * ex[0] + d[1] * ex[1] + d[2] * ex[2], d[0] * sy[0] + d[1] * sy[1] + d[2] * sy[2]); }
  const w = (q[1][0] - q[0][0]) * (q[2][2] - q[0][2]) - (q[1][2] - q[0][2]) * (q[2][0] - q[0][0]);
  for (let k = 2; k < q.length; k++) { if (w < 0) D.tri(first, first + k - 1, first + k); else D.tri(first, first + k, first + k - 1); }
  // the collider: the polygon in plan, its top the plane through the slope
  const a = q[0], bx = -n[0] / n[1], bz = -n[2] / n[1], a0 = a[1] - bx * a[0] - bz * a[2];
  return S.prism(q.map((p) => [p[0], p[2]]).flat(), from, a0, bx, bz, kind) >= 0;
}
