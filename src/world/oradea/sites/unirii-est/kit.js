// OWNER: oradea. Geometry helpers of the east side (not a site module).
//   fillet(prev, corner, next, r, k) -> [[x, z]]   k + 1 points of the arc of radius r that rounds the ring corner (tangent to both edges)
//   frontQuad / mouldings: see dressRun
//   roofQuad(D, a, b, c, d, col)  a roof plane facing up, a..d corner points [x, y, z], colour col, uv in metres
//   zwerch(K, f, sc, y0, w, h, surf, depth, roofCol)  the roof of a wall gable standing on the cornice (y0) of the frame f: two slate planes from the
//     ridge back to where the main roof (height surf(o) at the inset o) meets the ridge height
import { quad, at } from '../../../cherkasy/slabkit.js';

export function fillet(prev, c, next, r, k = 8) {
  const u1 = [c[0] - prev[0], c[1] - prev[1]], u2 = [next[0] - c[0], next[1] - c[1]];
  const l1 = Math.hypot(...u1), l2 = Math.hypot(...u2); u1[0] /= l1; u1[1] /= l1; u2[0] /= l2; u2[1] /= l2;
  const turn = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))), t = r * Math.tan(turn / 2);
  const s = [c[0] - u1[0] * t, c[1] - u1[1] * t], e = [c[0] + u2[0] * t, c[1] + u2[1] * t];
  const sgn = u1[0] * u2[1] - u1[1] * u2[0] > 0 ? 1 : -1;               // which side the corner turns to
  const cen = [s[0] - sgn * u1[1] * r, s[1] + sgn * u1[0] * r];
  const a0 = Math.atan2(s[1] - cen[1], s[0] - cen[0]);
  return Array.from({ length: k + 1 }, (_, i) => { const a = a0 + sgn * turn * (i / k); return [cen[0] + Math.cos(a) * r, cen[1] + Math.sin(a) * r]; });
}

export function roofQuad(D, a, b, c, d, col) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; if (n[1] < 0) n = n.map((q) => -q);
  const l = Math.hypot(...n) || 1, lu = Math.hypot(...u), lv = Math.hypot(...v);
  D.setColor(col).setPart(0); quad(D, a, b, c, d, n.map((q) => q / l), [[0, 0], [lu, 0], [lu, lv], [0, lv]]);
}

export function zwerch(K, f, sc, y0, w, h, surf, depth, roofCol) {
  const ya = y0 + h, a = (s, y, o) => at(f, s, y, -o);
  // the depth at which the main roof reaches the ridge height
  let lo = 0, hi = depth * 1.6;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (surf(m) < ya) lo = m; else hi = m; }
  const om = Math.max(0.5, lo), s0 = sc - w / 2, s1 = sc + w / 2;
  roofQuad(K.roof, a(s0 - 0.12, y0 - 0.02, -0.1), a(sc, ya + 0.05, -0.1), a(sc, ya + 0.05, om), a(s0 - 0.12, y0 - 0.02, om), roofCol);
  roofQuad(K.roof, a(sc, ya + 0.05, -0.1), a(s1 + 0.12, y0 - 0.02, -0.1), a(s1 + 0.12, y0 - 0.02, om), a(sc, ya + 0.05, om), roofCol);
}
