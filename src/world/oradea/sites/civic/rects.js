// OWNER: oradea. 2D helpers for roofs and colliders over oriented rectangles (the wings of the civic buildings). Not a site module.
//   rectOf(a, b, hw, inward) -> R { cx, cz, ux, uz, hl, hw }   the wing whose centre line is the segment a-b moved by hw toward `inward`
//   between(R, Q1, Q2) -> R   R cut to run between the centre lines of Q1 and Q2 (so its gable ends hide inside their roofs)
//   corners(R, grow?) -> [[x, z] x4]   the rectangle's corners (grow > 0 enlarges it)
//   inside(ring, x, z), dot(a, b), upN(a, b, c) (the upward unit normal of a triangle)
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
// the wing whose centre line is the segment a-b moved by hw toward `inward`
export function rectOf(a, b, hw, inward) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  let nx = -uz, nz = ux; if (nx * inward[0] + nz * inward[1] < 0) { nx = -nx; nz = -nz; }
  return { cx: (a[0] + b[0]) / 2 + nx * hw, cz: (a[1] + b[1]) / 2 + nz * hw, ux, uz, hl: L / 2, hw };
}
export const centreLine = (R) => ({ p: [R.cx, R.cz], u: [R.ux, R.uz] });
// where the centre line of R meets that of Q, as a distance along R's
export const hit = (R, Q) => { const A = centreLine(R), B = centreLine(Q), den = A.u[0] * B.u[1] - A.u[1] * B.u[0]; return ((B.p[0] - A.p[0]) * B.u[1] - (B.p[1] - A.p[1]) * B.u[0]) / den; };
// R cut to run between the centre lines of Q1 and Q2 (so its gable ends hide inside their roofs)
export function between(R, Q1, Q2) {
  const t0 = hit(R, Q1), t1 = hit(R, Q2), lo = Math.min(t0, t1), hi = Math.max(t0, t1);
  return { ...R, cx: R.cx + R.ux * (lo + hi) / 2, cz: R.cz + R.uz * (lo + hi) / 2, hl: (hi - lo) / 2 };
}
export const corners = (R, grow = 0) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [R.cx + R.ux * (R.hl + grow) * a - R.uz * (R.hw + grow) * b, R.cz + R.uz * (R.hl + grow) * a + R.ux * (R.hw + grow) * b]);
export const upN = (a, b, c) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(...n) || 1; return (n[1] < 0 ? n.map((v) => -v / l) : n.map((v) => v / l)); };


export function inside(Q, x, z) { let c = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const [xi, zi] = Q[i], [xj, zj] = Q[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
