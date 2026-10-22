// OWNER: oradea. Helpers the two palaces share (not a site module): the tower's facets, shaped gables, n-gon drums, onion domes,
// round cupolas, dormers, chimneys.
//   dressTower(K, f, s0, s1, floorY, spec, rnd, cells?)   one facet of a round corner tower on the wall frame f: ground cell, one
//     cell per storey ({ g, 1, 2, 3 }), string courses, a cornice; the facets of an arc join into the oriel / tower
//   gable(K, f, sc, y0, w, h, outline, cell, seed, palId, o?)   a shaped gable: the outline [[u, y]] (0..w, 0..h) filled from an
//     atlas cell mapped over the w x h box, standing on the wall frame f at s = sc (centre), height y0
//   facets(K, cx, cz, r, n, a0, y0, y1, cell, seed, palId, k0?, k1?)   facets k0..k1 of an n-gon round a vertical axis
//   faceBetween(a, b) -> f   the wall frame over two map points, outward normal on the viewer's side (s a -> b: the viewer's right
//     when the normal points to him: n = (-sz, sx))
//   onion(D, cx, cz, y0, k?, seg?)   a zinc onion dome with its crown ring and spire;  cupola(D, cx, cz, y0, r, h, domeCol?)
//   dormer(K, f, sc, w, h, o, y0, cell, seed, palId, surf, roofCol, wallCol)   a gabled dormer in the roof slope; surf(o) = roof
//     height at the inset o;  chimney(D, x, z, y0, h, col?)
import { triangulateRings } from '../../../../kit/mesh.js';
import { face, at, quad } from '../../../cherkasy/slabkit.js';
import { DP } from '../../../materials.js';
import { aq, dbox } from './facade.js';

export const faceBetween = (a, b) => { const sx = b[0] - a[0], sz = b[1] - a[1], L = Math.hypot(sx, sz) || 1e-6; return face(a, b, -sz / L, sx / L); };

export function dressTower(K, f, s0, s1, floorY, spec, rnd, cells = {}) {
  const gh = spec.gh ?? 4.6, sh = spec.sh ?? 3.95, n = spec.n, palId = spec.pal, trim = spec.trim, He = floorY + gh + (n - 1) * sh;
  const c = { g: 'mosk.tG', 1: 'mosk.tB', 2: 'mosk.tC', 3: 'mosk.tD', ...cells };
  aq(K, f, s0, s1, floorY, floorY + gh, 0, c.g, rnd(), palId);
  for (let j = 1; j < n; j++) aq(K, f, s0, s1, floorY + gh + (j - 1) * sh, floorY + gh + j * sh, 0, c[j] ?? c[n - 1], rnd(), palId);
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', '#6a6764', DP.CONC);
  dbox(K, f, s0, s1, floorY + gh - 0.1, floorY + gh + 0.2, 0, 0.14, 'f', trim);
  for (let j = 2; j < n; j++) { const y = floorY + gh + (j - 1) * sh; dbox(K, f, s0, s1, y - 0.07, y + 0.07, 0, 0.08, 'f', trim); }
  dbox(K, f, s0 - 0.01, s1 + 0.01, He - 0.5, He - 0.1, 0, 0.2, 'f', trim);
  dbox(K, f, s0 - 0.03, s1 + 0.03, He - 0.1, He + 0.1, 0, 0.42, 'ft', trim);
}

// a shaped gable
export function gable(K, f, sc, y0, w, h, outline, cell, seed, palId, o = 0.04) {
  const T = triangulateRings(outline); if (!T) return;
  const c = K.uv(cell), D = K.fac, s00 = sc - w / 2;
  D.setPart(palId).setColor([seed, 1, 0]);
  const P = T.pts.map(([u, y]) => at(f, s00 + u, y0 + y, o));
  const ids = T.pts.map(([u, y], i) => D.vert(...P[i], ...f.N, c.u0 + (u / w) * (c.u1 - c.u0), c.v0 + (y / h) * (c.v1 - c.v0)));
  for (let t = 0; t < T.idx.length; t += 3) {
    const [i, j, k] = [T.idx[t], T.idx[t + 1], T.idx[t + 2]], a = P[i], b = P[j], cc = P[k];
    const e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], g = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
    const dot = (e[1] * g[2] - e[2] * g[1]) * f.N[0] + (e[2] * g[0] - e[0] * g[2]) * f.N[1] + (e[0] * g[1] - e[1] * g[0]) * f.N[2];
    dot >= 0 ? D.tri(ids[i], ids[j], ids[k]) : D.tri(ids[i], ids[k], ids[j]);
  }
}

// facets k0..k1-1 of an n-gon of radius r about (cx, cz), vertex 0 at angle a0, going round clockwise in the map
export function facets(K, cx, cz, r, n, a0, y0, y1, cell, seed, palId, k0 = 0, k1 = n) {
  for (let k = k0; k < k1; k++) {
    const t0 = a0 - (2 * Math.PI * k) / n, t1 = a0 - (2 * Math.PI * (k + 1)) / n;
    const f = faceBetween([cx + r * Math.cos(t0), cz + r * Math.sin(t0)], [cx + r * Math.cos(t1), cz + r * Math.sin(t1)]);
    aq(K, f, 0, f.L, y0, y1, 0, cell, seed, palId);
  }
}

export function onion(D, cx, cz, y0, k = 1, seg = 12) {
  const prof = [[1.9, 0], [2.28, 0.32], [2.5, 0.95], [2.42, 1.6], [2.02, 2.35], [1.45, 3.05], [0.9, 3.62], [0.5, 4.1], [0.26, 4.55], [0.17, 4.9]];
  D.setPart(DP.GALV).setColor('#c3c9ce').lathe(prof.map(([r, y]) => [r * k * 0.8, y0 + y * k * 1.75]), seg, cx, cz);
  D.setColor('#9ea7ae').cyl(cx, y0 + 7.6 * k, cz, 0.36 * k, 0.4 * k, 0.32 * k, 8, true); // the crown ring
  D.setColor('#aab2b8').cyl(cx, y0 + 8.4 * k, cz, 0.1 * k, 0.04 * k, 3.6 * k, 6, false);
}

export function cupola(D, cx, cz, y0, r, h, domeCol = '#8fb0a0') {
  D.setPart(DP.PAINT).setColor('#cfd6c0').cyl(cx, y0, cz, r, r, h, 10, false);
  D.setPart(DP.GALV).setColor(domeCol).lathe([[r * 1.12, y0 + h], [r * 1.14, y0 + h + 0.16], [r * 0.9, y0 + h + 0.7], [r * 0.5, y0 + h + 1.12], [r * 0.12, y0 + h + 1.32]], 10, cx, cz);
  D.setPart(DP.STEEL).setColor('#3a3d40').cyl(cx, y0 + h + 1.3, cz, 0.03, 0.03, 0.8, 4, false);
}

export function chimney(D, x, z, y0, h, col = '#f1efe8') {
  D.setPart(DP.PAINT).setColor(col);
  D.box(x - 0.35, y0, z - 0.35, x + 0.35, y0 + h, z + 0.35, 31);
  D.setColor('#dad6cb').box(x - 0.47, y0 + h, z - 0.47, x + 0.47, y0 + h + 0.2, z + 0.47, 63);
}

// a gabled dormer standing on the roof slope; o is the inset into the roof (the wall frame's offsets run outward)
export function dormer(K, f, sc, w, h, o, y0, cell, seed, palId, surf, roofCol, wallCol) {
  const s0 = sc - w / 2, s1 = sc + w / 2, yt = y0 + h, yr = yt + w * 0.34, dd = 1.6, ob = o + dd, yb = surf(ob);
  const A = (s, y, oo) => at(f, s, y, -oo);
  aq(K, f, s0, s1, y0, yt, -o, cell, seed, palId);
  K.det.setPart(DP.PAINT).setColor(wallCol);
  K.det.face([A(s0, yt, o), A(s1, yt, o), A(sc, yr, o)], f.N);
  const slope = (a, b, c, d) => {
    const e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], g = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let n = [e[1] * g[2] - e[2] * g[1], e[2] * g[0] - e[0] * g[2], e[0] * g[1] - e[1] * g[0]]; if (n[1] < 0) n = n.map((q) => -q);
    const l = Math.hypot(...n) || 1; quad(K.roof, a, b, c, d, n.map((q) => q / l));
  };
  K.roof.setColor(roofCol).setPart(0);
  const yy = Math.max(yb + 0.35, yr - 0.3); // the ridge meets the main roof
  slope(A(s0 - 0.1, yt - 0.04, o - 0.12), A(sc, yr + 0.05, o - 0.12), A(sc, yy, ob), A(s0 - 0.1, yb + 0.02, ob));
  slope(A(sc, yr + 0.05, o - 0.12), A(s1 + 0.1, yt - 0.04, o - 0.12), A(s1 + 0.1, yb + 0.02, ob), A(sc, yy, ob));
  for (const [s, nn] of [[s0, [-f.U[0], 0, -f.U[2]]], [s1, f.U]]) quad(K.det, A(s, y0 - 0.1, o), A(s, yt, o), A(s, yb + 0.2, ob), A(s, yb - 0.1, ob), nn);
}
