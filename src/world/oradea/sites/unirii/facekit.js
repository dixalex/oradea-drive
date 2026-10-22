// Piața Unirii: the wall kit of the three buildings (slabkit faces plus the pieces a baroque or eclectic facade needs).
//   planFace(toMap, a, b, inside) -> f   a wall over the plan points a -> b ([s, t] of the building frame, toMap -> [x, z]),
//                                        its normal pointing away from `inside` (a map point); s runs to the viewer's right
//   fan(D, pts, n, uv?)                  a convex polygon of 3D points, the front looking along n
//   strip(D, A, B, n)                    quads between two equal-length 3D polylines
//   poly2(D, f, outer, holes?, o?, uvM?) any 2D polygon [[s, y], ...] on the face f (earcut)
//   outline(w, h, rise, g?, n?)          a window outline (a across, b up from the sill line), counter-clockwise
//   windowA(B, f, q)                     a window on the face: pane (B.glass / B.lit), surround, sill, cap; q { s, y0, w, h,
//                                        rise, sur, off, lit, sill, cap, glass, surCol, capCol, cols, rows }
//   roofPoly(D, pts, uvM?)               a roof facet from 3D points, its normal made to point up
//   slopeSolid(S, ring, y0, p0, n, k)    a prism whose top plane rises k per metre from p0 along n (collision for roofs)
//   clockOn(B, f, s, y, d, atlas)        a round dial on a stone ring (B.sign gets the atlas cell 0)
//   pilaster(B, f, s0, s1, y0, y1, o?, col?)   a pilaster with a base and a composite-ish capital block
// Winding rules follow slabkit: the quads wind to their stated normal, so either corner order works.
import { triangulateRings } from '../../../../kit/mesh.js';
import { face, at, quad, rect, box } from '../../../cherkasy/slabkit.js';
import { COL } from './set.js';

export { face, at, quad, rect, box };
export const PI = Math.PI;

export function planFace(toMap, a, b, inside) {
  const P = toMap(...a), Q = toMap(...b), ex = Q[0] - P[0], ez = Q[1] - P[1], L = Math.hypot(ex, ez);
  let nx = ez / L, nz = -ex / L;
  if ((P[0] + ex / 2 - inside[0]) * nx + (P[1] + ez / 2 - inside[1]) * nz < 0) { nx = -nx; nz = -nz; }
  const [A, B] = ex * nz - ez * nx > 0 ? [P, Q] : [Q, P];
  return face(A, B, nx, nz);
}

export function fan(D, pts, n, uv = null) {
  const ids = pts.map((p, k) => D.vert(p[0], p[1], p[2], n[0], n[1], n[2], uv?.[k][0] ?? 0, uv?.[k][1] ?? 0));
  const [a, b, c] = pts, e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], g = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cr = [e[1] * g[2] - e[2] * g[1], e[2] * g[0] - e[0] * g[2], e[0] * g[1] - e[1] * g[0]];
  const flip = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0;
  for (let i = 2; i < pts.length; i++) flip ? D.tri(ids[0], ids[i], ids[i - 1]) : D.tri(ids[0], ids[i - 1], ids[i]);
  return D;
}
export function strip(D, A, B, n) { for (let i = 0; i + 1 < A.length; i++) quad(D, A[i], A[i + 1], B[i + 1], B[i], n); }

export function poly2(D, f, outer, holes = [], o = 0, uvM = 2.5) {
  const T = triangulateRings(outer, holes);
  if (!T) return D;
  const first = D.v, P = T.pts;
  for (const p of P) { const q = at(f, p[0], p[1], o); D.vert(q[0], q[1], q[2], f.N[0], 0, f.N[2], p[0] / uvM, p[1] / uvM); }
  const rightward = f.ux * f.nz - f.uz * f.nx > 0;
  for (let t = 0; t < T.idx.length; t += 3) {
    const a = T.idx[t], b = T.idx[t + 1], c = T.idx[t + 2];
    const cr = (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0]);
    (cr > 0) === rightward ? D.tri(first + a, first + b, first + c) : D.tri(first + a, first + c, first + b);
  }
  return D;
}

export function outline(w, h, rise, g = 0, n = 6) {
  const hw = w / 2 + g, out = [[-hw, -g], [hw, -g]];
  if (rise > 0) {
    out.push([hw, h]);
    for (let k = 1; k < n; k++) { const a = (k / n) * PI; out.push([Math.cos(a) * hw, h + Math.sin(a) * (rise + g)]); }
    out.push([-hw, h]);
  } else out.push([hw, h + g], [-hw, h + g]);
  return out;
}

export function windowA(B, f, q) {
  const { s, y0, w, h, rise = 0, sur = 0.16, off = 0.03, lit = false, sill = false, cap = 0, cols = 1, rows = 1 } = q, top = h + rise;
  const G = lit ? B.lit : B.glass, ol = outline(w, h, rise, 0);
  G.setColor(q.glass ?? COL.glassTint);
  fan(G, ol.map(([a, b]) => at(f, s + a, y0 + b, off)), f.N, ol.map(([a, b]) => [(a + w / 2) / w * cols, b / top * rows]));
  if (sur > 0) {
    const o2 = outline(w, h, rise, sur), ni = ol.length - 1;
    const inner = ol.map(([a, b]) => at(f, s + a, y0 + b, off + 0.01)), outer = o2.map(([a, b]) => at(f, s + a, y0 + b, off + 0.01));
    B.plaster.setColor(q.surCol ?? COL.white);
    strip(B.plaster, inner.slice(1, ni + 1), outer.slice(1, ni + 1), f.N);
    quad(B.plaster, inner[ni], inner[0], outer[0], outer[ni], f.N);
  }
  if (sill) { B.plaster.setColor(q.surCol ?? COL.white); box(B.plaster, f, s - w / 2 - sur - 0.1, s + w / 2 + sur + 0.1, y0 - sur - 0.12, y0 - sur, 0, 0.16, 'ftlru'); }
  if (cap) { B.plaster.setColor(q.capCol ?? q.surCol ?? COL.white); box(B.plaster, f, s - w / 2 - sur - 0.12, s + w / 2 + sur + 0.12, y0 + top + sur, y0 + top + sur + cap, 0, 0.22, 'ftlru'); }
}

export function roofPoly(D, pts, uvM = 2) {
  const [a, b, c] = pts, e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], g = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let n = [e[1] * g[2] - e[2] * g[1], e[2] * g[0] - e[0] * g[2], e[0] * g[1] - e[1] * g[0]];
  if (n[1] < 0) n = n.map((v) => -v);
  const l = Math.hypot(...n) || 1; n = n.map((v) => v / l);
  const hz = Math.hypot(n[0], n[2]), fall = hz > 1e-6 ? [n[0] / hz, n[2] / hz] : [1, 0], side = [-fall[1], fall[0]];
  return fan(D, pts, n, pts.map((p) => [(p[0] * side[0] + p[2] * side[1]) / uvM, (p[0] * fall[0] + p[2] * fall[1]) / uvM / Math.max(0.2, hz)]));
}

export function slopeSolid(S, ring, y0, p0, n, k, kind = 'roof', flags = 0) {
  const bx = k * n[0], bz = k * n[1], a = p0[1] - bx * p0[0] - bz * p0[2];
  return S.prism(ring.flat(), y0, a, bx, bz, kind, flags);
}

export function clockOn(B, f, s, y, d, atlas, ring = COL.white) {
  const ph = (i, rr) => { const a = (i / 16) * PI * 2; return at(f, s + Math.cos(a) * rr, y + Math.sin(a) * rr, 0.07); };
  B.plaster.setColor(ring); fan(B.plaster, Array.from({ length: 16 }, (_, i) => ph(i, d * 0.62)), f.N);
  const [u0, v0, u1, v1] = atlas.dial, h = d / 2, o = 0.12, rightward = f.ux * f.nz - f.uz * f.nx > 0;
  const [uL, uR] = rightward ? [u0, u1] : [u1, u0];
  B.sign.setColor('#ffffff');
  quad(B.sign, at(f, s - h, y - h, o), at(f, s + h, y - h, o), at(f, s + h, y + h, o), at(f, s - h, y + h, o), f.N, [[uL, v0], [uR, v0], [uR, v1], [uL, v1]]);
}

// a pilaster: plinth block, shaft, and a capital (a block with a wider abacus); the face's own plaster colour via `col`
export function pilaster(B, f, s0, s1, y0, y1, o = 0.18, col = COL.cream, capH = 0.5) {
  const D = B.plaster; D.setColor(col);
  box(D, f, s0 - 0.06, s1 + 0.06, y0, y0 + 0.5, 0, o + 0.07, 'ftlr');
  box(D, f, s0, s1, y0 + 0.5, y1 - capH, 0, o, 'ftlr');
  box(D, f, s0 - 0.1, s1 + 0.1, y1 - capH, y1 - capH * 0.25, 0, o + 0.1, 'ftlr');
  box(D, f, s0 - 0.16, s1 + 0.16, y1 - capH * 0.25, y1, 0, o + 0.14, 'ftlru');
}

// an arched panel filled in one colour (a recess behind a window), and a ring of width `sur` round an arch outline
export function archFill(D, f, s, y0, w, h, rise, o = 0.04, col = COL.cream) {
  const ol = outline(w, h, rise, 0);
  D.setColor(col); fan(D, ol.map(([a, b]) => at(f, s + a, y0 + b, o)), f.N);
}
export function archRing(D, f, s, y0, w, h, rise, sur, o = 0.06, col = COL.white) {
  const a = outline(w, h, rise, 0), b = outline(w, h, rise, sur), n = a.length - 1;
  const P = (ol) => ol.map(([u, v]) => at(f, s + u, y0 + v, o));
  D.setColor(col);
  strip(D, P(a).slice(1, n + 1), P(b).slice(1, n + 1), f.N);
  quad(D, P(a)[n], P(a)[0], P(b)[0], P(b)[n], f.N);
}
