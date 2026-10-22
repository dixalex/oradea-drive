// Piața Unirii: small geometry helpers shared by the square and the buildings (everything in map metres unless it says
// local; local = the site frame of frame.js).
//   shade(v, k)               a hex colour scaled by k (for tone variation)
//   ribbon(D, pts, o)         a draped strip along a local polyline: top face (+ both side faces), `g` the ground
//                             sampler; o { g, w, lift, h, drop, col, colSide, closed, uvm, sides (false: the top only) }
//   ringOffset(pts, d)        a closed local ring pushed outward by d (miter by vertex bisector)
//   column(D, x, z, y, r0, r1, h, seg, col)       a cylinder with the colour set
//   lerp(a, b, t), clamp(v, a, b)
// MB faces follow the same winding rules as src/kit/mesh.js.
import { toMap, E, S } from './frame.js';

export const hexOf = (c) => (typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c);
export function shade(c, k) {
  const n = hexOf(c), f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255);
}

// a strip along `pts` (local [e, s]) `w` wide, its top `lift` over the ground, `h` high, going `drop` down on the sides
export function ribbon(D, pts, { g, w = 0.3, lift = 0.24, h = 0.1, drop = 0.1, col = '#d8d4c8', colSide = null, closed = false, uvm = 1, sides = true }) {
  const n = pts.length, L = [], R = [], T = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const a0 = closed || i > 0 ? a : pts[i], b0 = closed || i < n - 1 ? b : pts[i];
    let te = b0[0] - a0[0], ts = b0[1] - a0[1]; const l = Math.hypot(te, ts) || 1; te /= l; ts /= l;
    const ne = -ts, ns = te; // left normal in (e, s)
    L.push([pts[i][0] + ne * w / 2, pts[i][1] + ns * w / 2]); R.push([pts[i][0] - ne * w / 2, pts[i][1] - ns * w / 2]); T.push([ne, ns]);
  }
  const m = closed ? n : n - 1, y = (p) => { const [x, z] = toMap(p[0], p[1]); return [x, g(x, z), z]; };
  const side = colSide ?? col;
  let u = 0;
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % n, l0 = y(L[i]), l1 = y(L[j]), r0 = y(R[i]), r1 = y(R[j]);
    const len = Math.hypot(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]), top = (q) => q[1] + lift + h, bot = (q) => q[1] + lift - drop;
    const tn = T[i], nW = [tn[0] * E[0] + tn[1] * S[0], 0, tn[0] * E[1] + tn[1] * S[1]];
    D.setColor(col);
    const a = D.vert(l0[0], top(l0), l0[2], 0, 1, 0, u / uvm, 0), b = D.vert(l1[0], top(l1), l1[2], 0, 1, 0, (u + len) / uvm, 0);
    const c = D.vert(r1[0], top(r1), r1[2], 0, 1, 0, (u + len) / uvm, w / uvm), d = D.vert(r0[0], top(r0), r0[2], 0, 1, 0, u / uvm, w / uvm);
    D.quad(a, b, c, d);
    if (!sides) { u += len; continue; }
    D.setColor(side);
    const la = D.vert(l0[0], top(l0), l0[2], nW[0], 0, nW[2], 0, 0), lb = D.vert(l1[0], top(l1), l1[2], nW[0], 0, nW[2], len / uvm, 0);
    const lc = D.vert(l1[0], bot(l1), l1[2], nW[0], 0, nW[2], len / uvm, (h + drop) / uvm), ld = D.vert(l0[0], bot(l0), l0[2], nW[0], 0, nW[2], 0, (h + drop) / uvm);
    D.quad(la, ld, lc, lb);
    const ra = D.vert(r0[0], top(r0), r0[2], -nW[0], 0, -nW[2], 0, 0), rb = D.vert(r1[0], top(r1), r1[2], -nW[0], 0, -nW[2], len / uvm, 0);
    const rc = D.vert(r1[0], bot(r1), r1[2], -nW[0], 0, -nW[2], len / uvm, (h + drop) / uvm), rd = D.vert(r0[0], bot(r0), r0[2], -nW[0], 0, -nW[2], 0, (h + drop) / uvm);
    D.quad(ra, rb, rc, rd);
    u += len;
  }
  return D;
}

// a closed ring pushed outward by d (a positive d grows it); outward by the signed area
export function ringOffset(pts, d) {
  let a = 0;
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; });
  const sg = a > 0 ? 1 : -1, n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const e1 = [p1[0] - p0[0], p1[1] - p0[1]], e2 = [p2[0] - p1[0], p2[1] - p1[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [e1[1] / l1 * sg, -e1[0] / l1 * sg], n2 = [e2[1] / l2 * sg, -e2[0] / l2 * sg];
    let bx = n1[0] + n2[0], bz = n1[1] + n2[1]; const bl = Math.hypot(bx, bz) || 1; bx /= bl; bz /= bl;
    const k = d / Math.max(0.35, bx * n1[0] + bz * n1[1]);
    out.push([p1[0] + bx * k, p1[1] + bz * k]);
  }
  return out;
}

export function column(D, x, z, y, r0, r1, h, seg = 8, col = null) {
  if (col != null) D.setColor(col);
  return D.cyl(x, y, z, r0, r1, h, seg, true);
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
